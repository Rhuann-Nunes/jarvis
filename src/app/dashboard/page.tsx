'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, startOfYear, 
  subMonths, isToday, isSameDay, addDays, getDay, getWeek, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/AppLayout';
import { TaskService, ProjectService } from '@/lib/db';
import { Task, Project } from '@/types';
// Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend
);

// Tipos para os dados do dashboard
interface DashboardData {
  completionRate: number;
  tasksByStatus: {
    completed: number;
    pending: number;
    overdue: number;
    [key: string]: number;
  };
  tasksByDay: Array<{
    name: string;
    Completas: number;
    Pendentes: number;
  }>;
  taskActivityTrend: Array<{
    name: string;
    value: number;
  }>;
  tasksByProject: Array<{
    name: string;
    count: number;
    color: string;
  }>;
  overdueCount: number;
  completedThisWeek: number;
  completedThisMonth: number;
  averageCompletionTime: {
    value: number;
    unit: string;
  };
}

// Adicionar detecção de tema para ajustar cores automaticamente
const useThemeDetection = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    // Verificar tema inicial
    if (typeof window !== 'undefined') {
      // Verificar se o tema está armazenado ou usar preferência do sistema
      const storedTheme = localStorage.getItem('jarvis-theme');
      const isDark = storedTheme 
        ? storedTheme === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      setIsDarkTheme(isDark);

      // Observar mudanças no tema
      const observer = new MutationObserver(() => {
        setIsDarkTheme(document.documentElement.classList.contains('dark'));
      });
      
      observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });

      return () => observer.disconnect();
    }
  }, []);

  return isDarkTheme;
};

// Adicionar tipos para os status das tarefas
type TaskStatus = 'Concluída' | 'Em Andamento' | 'Não Iniciada' | 'Atrasada' | 'Cancelada' | 'Pendente' | 'Pausa';

// Função para buscar estatísticas do dashboard com dados reais
const getDashboardStatistics = async (projectId?: string): Promise<DashboardData> => {
  // Obter todas as tarefas, incluindo as concluídas
  const allTasks = await TaskService.getAllTasksIncludingCompleted();
  
  // Filtrar tarefas por projeto se um projectId for especificado
  const filteredTasks = projectId 
    ? allTasks.filter((task: Task) => task.projectId === projectId)
    : allTasks;
  
  // Tarefas concluídas e pendentes
  const completedTasks = filteredTasks.filter((task: Task) => task.completed);
  const pendingTasks = filteredTasks.filter((task: Task) => !task.completed);
  
  // Calcular tarefas vencidas (tarefas não concluídas com data de vencimento no passado)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = pendingTasks.filter((task: Task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });
  
  // Taxa de conclusão (concluídas / total)
  const completionRate = filteredTasks.length > 0 
    ? Math.round((completedTasks.length / filteredTasks.length) * 100) 
    : 0;
  
  // Tarefas concluídas esta semana
  const startWeek = startOfWeek(today, { weekStartsOn: 1 });
  const endWeek = endOfWeek(today, { weekStartsOn: 1 });
  const completedThisWeek = completedTasks.filter((task: Task) => {
    if (!task.completedAt) return false;
    const completedDate = new Date(task.completedAt);
    return completedDate >= startWeek && completedDate <= endWeek;
  }).length;
  
  // Tarefas concluídas este mês
  const startMonth = startOfMonth(today);
  const endMonth = endOfMonth(today);
  const completedThisMonth = completedTasks.filter((task: Task) => {
    if (!task.completedAt) return false;
    const completedDate = new Date(task.completedAt);
    return completedDate >= startMonth && completedDate <= endMonth;
  }).length;
  
  // Obter projetos
  const projects = await ProjectService.getAllProjects();
  
  // Calcular tarefas por projeto
  const tasksByProject = projects.map((project: Project) => {
    const projectTasks = allTasks.filter((task: Task) => task.projectId === project.id);
    return {
      name: project.name,
      count: projectTasks.length,
      color: project.color || 'rgba(156, 163, 175, 0.8)' // Cor padrão se não tiver
    };
  });
  
  // Adicionar tarefas sem projeto
  const tasksWithoutProject = allTasks.filter((task: Task) => !task.projectId).length;
  if (tasksWithoutProject > 0) {
    tasksByProject.push({
      name: 'Sem projeto',
      count: tasksWithoutProject,
      color: 'rgba(156, 163, 175, 0.8)'
    });
  }
  
  // Tarefas por dia da semana (segunda a domingo)
  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const weekdayMap = [0, 0, 0, 0, 0, 0, 0]; // Domingo a Sábado
  const pendingWeekdayMap = [0, 0, 0, 0, 0, 0, 0];
  
  completedTasks.forEach((task: Task) => {
    if (task.completedAt) {
      const dayIndex = getDay(new Date(task.completedAt));
      weekdayMap[dayIndex]++;
    }
  });
  
  pendingTasks.forEach((task: Task) => {
    if (task.dueDate) {
      const dayIndex = getDay(new Date(task.dueDate));
      pendingWeekdayMap[dayIndex]++;
    }
  });
  
  const tasksByDay = weekdays.map((name, index) => ({
    name,
    Completas: weekdayMap[index],
    Pendentes: pendingWeekdayMap[index]
  }));
  
  // Tendência de atividade (últimas 4 semanas)
  const fourWeeksAgo = subMonths(today, 1);
  const daysInRange = eachDayOfInterval({ start: fourWeeksAgo, end: today });
  
  const activityByDay: Record<string, number> = {};
  daysInRange.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    activityByDay[dateStr] = 0;
  });
  
  completedTasks.forEach((task: Task) => {
    if (task.completedAt) {
      const completedDate = new Date(task.completedAt);
      if (completedDate >= fourWeeksAgo && completedDate <= today) {
        const dateStr = format(completedDate, 'yyyy-MM-dd');
        if (activityByDay[dateStr] !== undefined) {
          activityByDay[dateStr]++;
        }
      }
    }
  });
  
  // Make sure we're sorting dates chronologically and limiting to prevent overloading the chart
  const taskActivityTrend = Object.keys(activityByDay)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-30) // Limit to 30 days to prevent overcrowding
    .map(date => ({
      name: format(new Date(date), 'dd/MM'),
      value: activityByDay[date]
    }));
  
  // Calcular tempo médio de conclusão
  let totalCompletionTimeInDays = 0;
  let tasksWithCompletionTime = 0;
  
  completedTasks.forEach((task: Task) => {
    if (task.completedAt && task.createdAt) {
      const created = new Date(task.createdAt);
      const completed = new Date(task.completedAt);
      const daysToComplete = Math.max(1, Math.round(
        (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      ));
      totalCompletionTimeInDays += daysToComplete;
      tasksWithCompletionTime++;
    }
  });
  
  const averageCompletionTime = {
    value: tasksWithCompletionTime > 0 
      ? parseFloat((totalCompletionTimeInDays / tasksWithCompletionTime).toFixed(1)) 
      : 0,
    unit: 'dias'
  };
  
  // Criar objeto com todas as estatísticas calculadas
  return {
    completionRate,
    tasksByStatus: {
      completed: completedTasks.length,
      pending: pendingTasks.length,
      overdue: overdueTasks.length,
      'Concluída': completedTasks.length,
      'Pendente': pendingTasks.length,
      'Atrasada': overdueTasks.length
    },
    tasksByDay,
    taskActivityTrend,
    tasksByProject,
    overdueCount: overdueTasks.length,
    completedThisWeek,
    completedThisMonth,
    averageCompletionTime
  };
};

export default function DashboardPage() {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const isDarkTheme = useThemeDetection();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    completionRate: 0,
    tasksByStatus: {
      completed: 0,
      pending: 0,
      overdue: 0
    },
    tasksByDay: [],
    taskActivityTrend: [],
    tasksByProject: [],
    overdueCount: 0,
    completedThisWeek: 0,
    completedThisMonth: 0,
    averageCompletionTime: {
      value: 0,
      unit: 'dias'
    }
  });

  // Obter os projetos logo no carregamento do componente
  const [projects, setProjects] = useState<Project[]>([]);

  // Carregar os projetos disponíveis
  useEffect(() => {
    const loadProjects = async () => {
      const allProjects = await ProjectService.getAllProjects();
      setProjects(allProjects);
    };
    
    loadProjects();
  }, []);

  // Calcular total de tarefas
  const totalTasks = 
    dashboardData.tasksByStatus.completed + 
    dashboardData.tasksByStatus.pending + 
    dashboardData.tasksByStatus.overdue;
  
  // Carregar dados do dashboard quando mudar o projeto selecionado
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simular o tempo de carregamento para uma transição visual mais suave
        const response = await Promise.all([
          getDashboardStatistics(selectedProjectId),
          // Pequeno atraso para garantir uma transição mais suave
          new Promise(resolve => setTimeout(resolve, 500))
        ]);
        
        // Pegar apenas os dados reais (primeiro item do array retornado)
        setDashboardData(response[0]);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        // Mostrar mensagem de erro ao usuário
        console.error('Não foi possível carregar os dados do dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedProjectId]);

  // Função para salvar a seleção de projeto em sessionStorage
  const handleSelectProject = (projectId: string, sectionId?: string) => {
    sessionStorage.setItem('selectedProjectId', projectId);
    if (sectionId) {
      sessionStorage.setItem('selectedSectionId', sectionId);
    } else {
      sessionStorage.removeItem('selectedSectionId');
    }
    setSelectedProjectId(projectId);
  };

  // Defina o tipo correto para statusColors
  const statusColors: Record<TaskStatus, string> = {
    'Concluída': '#22c55e',       // Verde vibrante
    'Em Andamento': '#3b82f6',    // Azul
    'Não Iniciada': '#f59e0b',    // Âmbar
    'Atrasada': '#ef4444',        // Vermelho
    'Cancelada': '#9ca3af',       // Cinza
    'Pendente': '#8b5cf6',        // Roxo
    'Pausa': '#ec4899'            // Rosa
  };

  // Ajustar os dados para garantir tipagem correta
  const pieChartData = {
    // Usar apenas categorias em português e eliminar duplicação
    labels: ['Concluída', 'Pendente', 'Atrasada'].filter((status, index) => {
      const values = [
        dashboardData.tasksByStatus['Concluída'] || dashboardData.tasksByStatus.completed, 
        dashboardData.tasksByStatus['Pendente'] || dashboardData.tasksByStatus.pending, 
        dashboardData.tasksByStatus['Atrasada'] || dashboardData.tasksByStatus.overdue
      ];
      return values[index] > 0;
    }),
    datasets: [
      {
        data: [
          dashboardData.tasksByStatus['Concluída'] || dashboardData.tasksByStatus.completed, 
          dashboardData.tasksByStatus['Pendente'] || dashboardData.tasksByStatus.pending, 
          dashboardData.tasksByStatus['Atrasada'] || dashboardData.tasksByStatus.overdue
        ].filter(value => value > 0),
        backgroundColor: [
          statusColors['Concluída'],
          statusColors['Pendente'],
          statusColors['Atrasada'] || statusColors['Não Iniciada'] // Fallback se 'Atrasada' não existir
        ].filter((_, index) => {
          const values = [
            dashboardData.tasksByStatus['Concluída'] || dashboardData.tasksByStatus.completed, 
            dashboardData.tasksByStatus['Pendente'] || dashboardData.tasksByStatus.pending, 
            dashboardData.tasksByStatus['Atrasada'] || dashboardData.tasksByStatus.overdue
          ];
          return values[index] > 0;
        }),
        borderColor: isDarkTheme ? 'rgba(15, 23, 42, 1)' : 'white',
        borderWidth: 2,
        hoverBackgroundColor: [
          statusColors['Concluída'] + '99',
          statusColors['Pendente'] + '99',
          (statusColors['Atrasada'] || statusColors['Não Iniciada']) + '99'
        ].filter((_, index) => {
          const values = [
            dashboardData.tasksByStatus['Concluída'] || dashboardData.tasksByStatus.completed, 
            dashboardData.tasksByStatus['Pendente'] || dashboardData.tasksByStatus.pending, 
            dashboardData.tasksByStatus['Atrasada'] || dashboardData.tasksByStatus.overdue
          ];
          return values[index] > 0;
        }),
        hoverBorderWidth: 3,
        hoverBorderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
      }
    ]
  };

  // If pie chart has no data, provide a placeholder
  if (pieChartData.labels.length === 0) {
    pieChartData.labels = ['Sem tarefas'];
    pieChartData.datasets[0].data = [1];
    pieChartData.datasets[0].backgroundColor = ['rgba(156, 163, 175, 0.5)'];
  }

  // Dados do gráfico de barras com cores mais vibrantes
  const barChartData = {
    labels: dashboardData.tasksByDay.map(day => day.name),
    datasets: [
      {
        label: 'Concluídas',
        data: dashboardData.tasksByDay.map(day => day.Completas),
        backgroundColor: statusColors['Concluída'] + (isDarkTheme ? 'cc' : '99'),
        borderColor: statusColors['Concluída'],
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: statusColors['Concluída'],
      },
      {
        label: 'Pendentes',
        data: dashboardData.tasksByDay.map(day => day.Pendentes),
        backgroundColor: statusColors['Pendente'] + (isDarkTheme ? 'cc' : '99'),
        borderColor: statusColors['Pendente'],
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: statusColors['Pendente'],
      }
    ]
  };

  // Dados do gráfico de linha com cores mais vibrantes
  const lineChartData = {
    labels: dashboardData.taskActivityTrend.map(item => item.name),
    datasets: [
      {
        label: 'Tarefas Concluídas',
        data: dashboardData.taskActivityTrend.map(item => item.value),
        fill: isDarkTheme ? 'origin' as const : false,
        backgroundColor: isDarkTheme 
          ? 'rgba(250, 204, 21, 0.2)' // Amarelo com transparência
          : 'rgba(250, 204, 21, 0.7)',
        borderColor: '#facc15', // Amarelo
        borderWidth: 2,
        tension: 0.2,
        pointBackgroundColor: '#facc15',
        pointBorderColor: isDarkTheme ? '#0f172a' : 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#facc15',
        pointHoverBorderColor: isDarkTheme ? 'white' : '#0f172a',
        pointHoverBorderWidth: 2
      }
    ]
  };

  // Dados do gráfico de barras horizontais para distribuição de projetos
  const horizontalBarChartData = {
    labels: dashboardData.tasksByProject?.map(project => project.name || 'Sem Projeto') || [],
    datasets: [
      {
        label: 'Tarefas',
        data: dashboardData.tasksByProject?.map(project => project.count) || [],
        backgroundColor: dashboardData.tasksByProject?.map((project, index) => {
          if (project.color) return project.color;
          // Gerar cores distintas para cada projeto se não tiver cor definida
          const hue = (index * 137.5) % 360; 
          return `hsla(${hue}, 85%, ${isDarkTheme ? '65%' : '50%'}, ${isDarkTheme ? 0.8 : 0.7})`;
        }) || [],
        borderColor: dashboardData.tasksByProject?.map((project, index) => {
          if (project.color) return project.color.replace('0.8', '1');
          const hue = (index * 137.5) % 360;
          return `hsl(${hue}, 90%, ${isDarkTheme ? '70%' : '45%'})`;
        }) || [],
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: dashboardData.tasksByProject?.map((project, index) => {
          if (project.color) return project.color.replace('0.8', '0.9');
          const hue = (index * 137.5) % 360;
          return `hsl(${hue}, 90%, ${isDarkTheme ? '75%' : '55%'})`;
        }) || [],
      }
    ]
  };

  // Atualize as cores baseadas no tema
  const chartTextColor = isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
  const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const chartBackground = isDarkTheme ? '#1e293b' : 'white';
  
  // Ajustar opções dos gráficos para adicionar animações e melhorar a aparência
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: chartTextColor,
          font: {
            size: 12
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        },
        backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        bodyColor: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
      }
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: chartTextColor,
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            return items[0].label;
          }
        },
        backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        bodyColor: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor
        },
        ticks: {
          color: chartTextColor,
          padding: 8,
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          color: gridColor
        },
        ticks: {
          color: chartTextColor,
          padding: 8,
          font: {
            size: 11
          }
        }
      }
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000
    },
    elements: {
      line: {
        tension: 0.2
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: chartTextColor,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 15,
        }
      },
      tooltip: {
        backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        bodyColor: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor
        },
        ticks: {
          color: chartTextColor,
          precision: 0,
          padding: 8,
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          color: gridColor
        },
        ticks: {
          color: chartTextColor,
          padding: 8,
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 10
          }
        }
      }
    }
  };

  // Ajustar horizontalBarChartOptions para melhor visualização
  const horizontalBarChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: chartTextColor,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
        }
      },
      tooltip: {
        backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        bodyColor: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        grid: {
          color: gridColor
        },
        ticks: {
          color: chartTextColor,
          padding: 10,
          font: {
            size: 11
          }
        }
      },
      x: {
        beginAtZero: true,
        grid: {
          color: gridColor
        },
        ticks: {
          color: chartTextColor,
          precision: 0,
          padding: 8,
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Alterar a div principal para incluir um efeito de fade na transição
  return (
    <AppLayout selectedProjectId={selectedProjectId} onSelectProject={handleSelectProject}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Visão geral do seu desempenho e estatísticas de tarefas
          </p>
        </div>
        <div className="w-64">
          <select
            value={selectedProjectId}
            onChange={(e) => handleSelectProject(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          ))}
          {[...Array(3)].map((_, i) => (
            <div key={i + 4} className="h-80 col-span-1 md:col-span-2 lg:col-span-2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div
          className="transition-opacity duration-500 ease-in-out"
          style={{ opacity: isLoading ? 0 : 1 }}
        >
          {dashboardData.tasksByStatus.completed === 0 && 
           dashboardData.tasksByStatus.pending === 0 && 
           dashboardData.tasksByStatus.overdue === 0 && (
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center mb-6">
              <p className="text-blue-800 dark:text-blue-200">
                Nenhuma tarefa encontrada para gerar os gráficos. Adicione algumas tarefas para visualizar as estatísticas.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="pb-2">
                <h3 className="text-sm font-medium">Taxa de Conclusão</h3>
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData.completionRate}%</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {dashboardData.tasksByStatus.completed} de {totalTasks} tarefas concluídas
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="pb-2">
                <h3 className="text-sm font-medium">Tarefas em Atraso</h3>
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData.tasksByStatus.overdue}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {dashboardData.tasksByStatus.overdue > 0
                    ? `${Math.round((dashboardData.tasksByStatus.overdue / totalTasks) * 100)}% das suas tarefas`
                    : 'Todas as tarefas estão em dia'
                  }
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="pb-2">
                <h3 className="text-sm font-medium">Tarefas Pendentes</h3>
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData.tasksByStatus.pending}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {dashboardData.tasksByStatus.pending > 0
                    ? `${Math.round((dashboardData.tasksByStatus.pending / totalTasks) * 100)}% das suas tarefas`
                    : 'Sem tarefas pendentes'
                  }
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="pb-2">
                <h3 className="text-sm font-medium">Concluídas Recentemente</h3>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{dashboardData.completedThisMonth}</div>
                <div className="flex flex-col">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Este mês: {dashboardData.completedThisMonth} tarefas
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Esta semana: {dashboardData.completedThisWeek} tarefas
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div>
                <h3 className="text-base font-medium mb-4">Status das Tarefas</h3>
              </div>
              <div className="h-80 flex items-center justify-center">
                {totalTasks === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    Nenhuma tarefa encontrada
                  </p>
                ) : (
                  <Pie data={pieChartData} options={pieChartOptions} />
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div>
                <h3 className="text-base font-medium mb-4">Tarefas por Dia da Semana</h3>
              </div>
              <div className="h-80">
                {dashboardData.tasksByDay.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      Nenhuma tarefa encontrada
                    </p>
                  </div>
                ) : (
                  <Bar data={barChartData} options={barChartOptions} />
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div>
                <h3 className="text-base font-medium mb-4">Tendência de Atividade</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Últimos 30 dias</p>
              </div>
              <div className="h-80">
                {dashboardData.taskActivityTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      Sem dados de atividade recente
                    </p>
                  </div>
                ) : (
                  <Line data={lineChartData} options={lineChartOptions} />
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div>
                <h3 className="text-base font-medium mb-4">Distribuição por Projeto</h3>
              </div>
              <div className="h-80">
                {!dashboardData.tasksByProject || dashboardData.tasksByProject.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      Nenhum projeto com tarefas encontrado
                    </p>
                  </div>
                ) : (
                  <Bar data={horizontalBarChartData} options={horizontalBarChartOptions} />
                )}
              </div>
            </div>
          </div>

          {/* Dica para o usuário */}
          {!isLoading && dashboardData.tasksByStatus.completed === 0 && 
           dashboardData.tasksByStatus.pending === 0 && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Dica: Adicione algumas tarefas para ver estatísticas mais detalhadas aqui
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                As visualizações são atualizadas automaticamente à medida que você gerencia suas tarefas
              </p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
} 