'use client';

import { useState, useEffect } from 'react';
import { format, isToday, isYesterday, startOfWeek, endOfWeek, isWithinInterval, formatDistanceStrict, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/AppLayout';
import { TaskService } from '@/lib/db';
import { Task } from '@/types';
import TaskItem from '@/components/TaskItem';
import { ClockIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import ProjectSelector from '@/components/ProjectSelector';

// Componente para mostrar a diferença entre a data de conclusão prevista e a data real
const CompletionTimeDifference = ({ task }: { task: Task }) => {
  if (!task.dueDate || !task.completedAt) return null;
  
  const dueDate = new Date(task.dueDate);
  const completedAt = new Date(task.completedAt);
  
  // Cálculo da diferença em horas
  const diffInHours = differenceInHours(completedAt, dueDate);
  
  // Formatação da diferença para exibição
  let formattedDiff;
  if (diffInHours === 0) {
    formattedDiff = "Concluída no prazo";
  } else if (diffInHours > 0) {
    formattedDiff = `${Math.abs(diffInHours)}h após o prazo`;
  } else {
    formattedDiff = `${Math.abs(diffInHours)}h antes do prazo`;
  }
  
  // Determinação da cor com base na diferença
  const textColor = diffInHours <= 0 ? "text-green-500" : "text-red-500";
  
  return (
    <div className="flex items-center gap-1">
      <ClockIcon className={`h-3.5 w-3.5 ${textColor}`} />
      <span className={`text-xs ${textColor}`}>{formattedDiff}</span>
    </div>
  );
};

// Componente personalizado para tarefas concluídas que mostra a data de conclusão no lugar da data prevista
const CompletedTaskItem = ({ task, onUpdate }: { task: Task, onUpdate: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  
  // Função que lida com a alternância de uma tarefa entre concluída e não concluída
  const handleToggleComplete = async () => {
    if (task.completed) {
      // Desmarcar tarefa como concluída
      await TaskService.updateTask(task.id, {
        completed: false
      });
      onUpdate();
    } else {
      // Marcar como concluída
      await TaskService.updateTask(task.id, {
        completed: true
      });
      onUpdate();
    }
  };
  
  // Formatação da data de conclusão
  const formatCompletionDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Verificar se é hoje
    const today = new Date();
    if (dateObj.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    
    // Verificar se é ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    
    // Se for amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateObj.toDateString() === tomorrow.toDateString()) {
      return 'Amanhã';
    }
    
    // Abreviações para os meses
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
  };
  
  // Formatação da hora de conclusão
  const formatCompletionTime = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    
    // Formatar como 12h com AM/PM
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 deve ser exibido como 12
    
    return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 ${task.completed ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggleComplete}
          className="mt-0.5 text-gray-400 hover:text-green-500 dark:text-gray-500 dark:hover:text-green-400 focus:outline-none transition-colors"
          aria-label={task.completed ? "Marcar como não concluída" : "Marcar como concluída"}
        >
          {task.completed ? (
            <CheckCircleSolidIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
          ) : (
            <CheckCircleIcon className="h-5 w-5" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              autoFocus
            />
          ) : (
            <div className="text-sm font-medium">
              <div className={task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}>
                {task.title}
              </div>
              
              {/* Informações adicionais */}
              <div className="flex flex-wrap gap-2 mt-2 items-center text-xs text-gray-500 dark:text-gray-400">
                {/* Seletor de projeto */}
                <ProjectSelector task={task} onTaskUpdated={onUpdate} />
                
                {/* Data de conclusão - Substituindo a data prevista */}
                {task.completedAt && (
                  <div className="flex items-center text-blue-500 dark:text-blue-400">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    <span>Concluída: {formatCompletionDate(task.completedAt)}</span>
                    {formatCompletionTime(task.completedAt) && (
                      <span className="ml-1">{formatCompletionTime(task.completedAt)}</span>
                    )}
                  </div>
                )}
                
                {/* Diferença de tempo */}
                {task.dueDate && task.completedAt && (
                  <CompletionTimeDifference task={task} />
                )}
                
                {/* Informação de recorrência */}
                {task.recurrence && (
                  <div className="flex items-center text-blue-500 dark:text-blue-400">
                    <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                    <span>{typeof task.recurrence === 'string' ? task.recurrence : task.recurrence.type}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ConcluidoPage() {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tasksByPeriod, setTasksByPeriod] = useState<Record<string, Task[]>>({
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: []
  });

  useEffect(() => {
    // Função assíncrona dentro do useEffect
    const init = async () => {
      await loadCompletedTasks();
      
      // Recuperar projeto selecionado anteriormente da sessionStorage
      const savedProjectId = sessionStorage.getItem('selectedProjectId');
      if (savedProjectId) {
        setSelectedProjectId(savedProjectId);
      }
    };
    
    init();
  }, []);
  
  // Também carregar tarefas quando a página receber foco
  useEffect(() => {
    // Função para carregar tarefas quando a página receber foco
    const handleFocus = async () => {
      await loadCompletedTasks();
    };
    
    // Adicionar event listener
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadCompletedTasks = async () => {
    setIsLoading(true);
    try {
      const tasks = await TaskService.getCompletedTasks();
      setCompletedTasks(tasks);
      
      // Agrupar tarefas por período
      const groupedTasks: Record<string, Task[]> = {
        today: [],
        yesterday: [],
        thisWeek: [],
        earlier: []
      };
      
      const now = new Date();
      const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 }); // Segunda-feira
      const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 }); // Domingo
      
      tasks.forEach(task => {
        const completedDate = task.completedAt ? new Date(task.completedAt) : null;
        
        if (!completedDate) {
          // Se não tiver data de conclusão (não deveria acontecer), coloca em 'earlier'
          groupedTasks.earlier.push(task);
        } else if (isToday(completedDate)) {
          groupedTasks.today.push(task);
        } else if (isYesterday(completedDate)) {
          groupedTasks.yesterday.push(task);
        } else if (isWithinInterval(completedDate, { 
          start: startOfCurrentWeek, 
          end: endOfCurrentWeek 
        })) {
          groupedTasks.thisWeek.push(task);
        } else {
          groupedTasks.earlier.push(task);
        }
      });
      
      setTasksByPeriod(groupedTasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas concluídas:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTaskUpdated = async () => {
    // Recarregar as tarefas após uma atualização
    await loadCompletedTasks();
  };
  
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

  return (
    <AppLayout selectedProjectId={selectedProjectId} onSelectProject={handleSelectProject}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tarefas Concluídas</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hoje */}
          {tasksByPeriod.today.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">Hoje</h2>
              <div className="space-y-4">
                {tasksByPeriod.today.map(task => (
                  <CompletedTaskItem
                    key={task.id}
                    task={task}
                    onUpdate={handleTaskUpdated}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Ontem */}
          {tasksByPeriod.yesterday.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">Ontem</h2>
              <div className="space-y-4">
                {tasksByPeriod.yesterday.map(task => (
                  <CompletedTaskItem
                    key={task.id}
                    task={task}
                    onUpdate={handleTaskUpdated}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Esta semana */}
          {tasksByPeriod.thisWeek.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">Esta semana</h2>
              <div className="space-y-4">
                {tasksByPeriod.thisWeek.map(task => (
                  <CompletedTaskItem
                    key={task.id}
                    task={task}
                    onUpdate={handleTaskUpdated}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Anteriores */}
          {tasksByPeriod.earlier.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-600 dark:text-gray-400">Anteriores</h2>
              <div className="space-y-4">
                {tasksByPeriod.earlier.map(task => (
                  <CompletedTaskItem
                    key={task.id}
                    task={task}
                    onUpdate={handleTaskUpdated}
                  />
                ))}
              </div>
            </div>
          )}
          
          {completedTasks.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa concluída</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
} 