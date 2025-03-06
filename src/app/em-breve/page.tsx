'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { TaskService } from '@/lib/db';
import TaskItem from '@/components/TaskItem';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, startOfDay, parseISO, addDays, getDay, isSameDay, isWithinInterval, addWeeks, addMonths, differenceInDays, differenceInWeeks, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '@/types';

export default function EmBrevePage() {
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  useEffect(() => {
    loadTasksForMonth(currentMonth);
    
    // Recuperar projeto selecionado anteriormente da sessionStorage
    const savedProjectId = sessionStorage.getItem('selectedProjectId');
    if (savedProjectId) {
      setSelectedProjectId(savedProjectId);
    }
  }, [currentMonth]);
  
  // Função para gerar ocorrências de tarefas recorrentes para o mês selecionado
  const generateRecurrenceOccurrences = (tasks: Task[], startDate: Date, endDate: Date): Task[] => {
    const occurrences: Task[] = [];
    // Usar um Set para rastrear IDs já utilizados e evitar duplicações
    const usedIds = new Set<string>();
    
    // Função auxiliar para adicionar tarefa apenas se o ID for único
    const addTaskIfUnique = (task: Task) => {
      if (!usedIds.has(task.id)) {
        usedIds.add(task.id);
        occurrences.push(task);
      } else {
        console.warn(`Ignorando tarefa duplicada com ID: ${task.id}`);
      }
    };
    
    tasks.forEach(task => {
      try {
        // Processar apenas tarefas com recorrência ou incluir tarefas não recorrentes que estejam no intervalo
        if (task.recurrence) {
          // Garantir que taskDueDate seja um objeto Date válido
          let taskDueDate: Date;
          try {
            taskDueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate || new Date());
            // Verificar se a data é válida
            if (isNaN(taskDueDate.getTime())) {
              console.error('Data inválida para tarefa:', task.id, task.dueDate);
              // Se a data for inválida, usar a data atual
              taskDueDate = new Date();
            }
          } catch (error) {
            console.error('Erro ao processar data da tarefa:', task.id, error);
            // Se houver erro, usar a data atual
            taskDueDate = new Date();
          }
          
          const taskStartDate = startOfDay(taskDueDate);
          
          // Verificar se a recorrência é um objeto ou uma string
          let recurrence;
          try {
            recurrence = typeof task.recurrence === 'string' 
              ? JSON.parse(task.recurrence)
              : task.recurrence;
              
            if (!recurrence || !recurrence.type) {
              console.error('Formato de recorrência inválido para tarefa:', task.id);
              return;
            }
          } catch (error) {
            console.error('Erro ao processar recorrência da tarefa:', task.id, error);
            return;
          }
          
          const recurrenceType = recurrence.type;
          const interval = recurrence.interval || 1;
          const daysOfWeek = recurrence.daysOfWeek || [];
          
          // Não processar tarefas que já estão completadas
          if (task.completed) return;
          
          // Incluir a tarefa original se estiver dentro do intervalo
          if (isWithinInterval(taskStartDate, { start: startDate, end: endDate })) {
            addTaskIfUnique(task);
          }
          
          // Para tarefas cuja data original é anterior ao período, calculamos a próxima ocorrência
          // que cairia dentro do período visualizado
          
          // Encontrar uma data inicial válida:
          // - se a data inicial da recorrência for posterior ao período, usamos ela
          // - se a data inicial for anterior ao período, calculamos a próxima ocorrência dentro do período
          let calculationStartDate = taskStartDate;
          
          // Se a data da tarefa é anterior ao início do mês, precisamos calcular a primeira ocorrência no mês
          if (taskStartDate < startDate) {
            switch (recurrenceType) {
              case 'daily':
                // Calcular quantos dias se passaram desde a data inicial
                const daysSinceStart = differenceInDays(startDate, taskStartDate);
                // Calcular quantos intervalos completos se passaram
                const completedDailyIntervals = Math.floor(daysSinceStart / interval);
                // A próxima data será a data inicial mais os intervalos completos + um intervalo adicional se necessário
                const nextDailyMultiple = completedDailyIntervals * interval;
                calculationStartDate = addDays(taskStartDate, nextDailyMultiple);
                
                // Se ainda estiver antes do início do período, adicionar mais um intervalo
                if (calculationStartDate < startDate) {
                  calculationStartDate = addDays(calculationStartDate, interval);
                }
                break;
                
              case 'weekly':
                if (daysOfWeek && daysOfWeek.length > 0) {
                  // Para recorrência em dias específicos da semana, começamos da data de início do período
                  // e checamos os dias da semana especificados
                  calculationStartDate = startDate;
                } else {
                  // Calcular quantas semanas se passaram desde a data inicial
                  const weeksSinceStart = differenceInWeeks(startDate, taskStartDate);
                  // Calcular quantos intervalos completos se passaram
                  const completedWeeklyIntervals = Math.floor(weeksSinceStart / interval);
                  // A próxima data será a data inicial mais os intervalos completos
                  const nextWeeklyMultiple = completedWeeklyIntervals * interval;
                  calculationStartDate = addWeeks(taskStartDate, nextWeeklyMultiple);
                  
                  // Se ainda estiver antes do início do período, adicionar mais um intervalo
                  if (calculationStartDate < startDate) {
                    calculationStartDate = addWeeks(calculationStartDate, interval);
                  }
                }
                break;
                
              case 'monthly':
                // Calcular quantos meses se passaram desde a data inicial
                const monthsSinceStart = differenceInMonths(startDate, taskStartDate);
                // Calcular quantos intervalos completos se passaram
                const completedMonthlyIntervals = Math.floor(monthsSinceStart / interval);
                // A próxima data será a data inicial mais os intervalos completos
                const nextMonthlyMultiple = completedMonthlyIntervals * interval;
                calculationStartDate = addMonths(taskStartDate, nextMonthlyMultiple);
                
                // Se ainda estiver antes do início do período, adicionar mais um intervalo
                if (calculationStartDate < startDate) {
                  calculationStartDate = addMonths(calculationStartDate, interval);
                }
                break;
            }
          }
          
          // Gerar ocorrências a partir da data de cálculo ajustada
          switch (recurrenceType) {
            case 'daily':
              let nextDailyDate = calculationStartDate;
              let dailyIndex = 0;
              // Se a data inicial já estiver dentro do intervalo, começamos a partir dela
              // Caso contrário, já foi ajustada para a primeira ocorrência dentro do intervalo
              
              while (isWithinInterval(nextDailyDate, { start: startDate, end: endDate })) {
                // Não adicionar a data original novamente se for igual à data calculada
                if (!isSameDay(nextDailyDate, taskStartDate) || calculationStartDate > taskStartDate) {
                  const uniqueId = `${task.id}-daily-${format(nextDailyDate, 'yyyy-MM-dd')}-${dailyIndex}`;
                  
                  const occurrenceTask: Task = {
                    ...task,
                    id: uniqueId,
                    dueDate: nextDailyDate,
                    isRecurrenceOccurrence: true,
                    originalTaskId: task.id
                  };
                  
                  addTaskIfUnique(occurrenceTask);
                  dailyIndex++;
                }
                nextDailyDate = addDays(nextDailyDate, interval);
              }
              break;
              
            case 'weekly':
              if (daysOfWeek && daysOfWeek.length > 0) {
                // Recorrência em dias específicos da semana
                let weekCounter = 0;
                let keepGenerating = true;
                
                while (keepGenerating) {
                  const baseDate = addWeeks(calculationStartDate, weekCounter * interval);
                  weekCounter++;
                  let hasOccurrenceInRange = false;
                  
                  // Para cada dia da semana selecionado
                  daysOfWeek.forEach((dayNumber: string | number, dayIndex: number) => {
                    const dayIndexNumber = typeof dayNumber === 'string' ? parseInt(dayNumber) : dayNumber;
                    // Calcular o próximo dia da semana a partir da data base
                    let daysToAdd = (dayIndexNumber - getDay(baseDate) + 7) % 7;
                    const occurrenceDate = addDays(baseDate, daysToAdd);
                    
                    // Verificar se a data está dentro do intervalo do mês
                    if (isWithinInterval(occurrenceDate, { start: startDate, end: endDate })) {
                      hasOccurrenceInRange = true;
                      
                      // Não adicionar duplicata da tarefa original
                      if (!isSameDay(occurrenceDate, taskStartDate) || calculationStartDate > taskStartDate) {
                        const uniqueId = `${task.id}-weekly-${weekCounter}-${dayIndexNumber}-${format(occurrenceDate, 'yyyy-MM-dd')}`;
                        
                        const occurrenceTask: Task = {
                          ...task,
                          id: uniqueId,
                          dueDate: occurrenceDate,
                          isRecurrenceOccurrence: true,
                          originalTaskId: task.id
                        };
                        
                        addTaskIfUnique(occurrenceTask);
                      }
                    }
                  });
                  
                  // Se não há mais ocorrências neste intervalo, parar de gerar
                  if (!hasOccurrenceInRange || baseDate > endDate) {
                    keepGenerating = false;
                  }
                }
              } else {
                // Recorrência semanal simples
                let nextWeeklyDate = calculationStartDate;
                let weeklyIndex = 0;
                while (isWithinInterval(nextWeeklyDate, { start: startDate, end: endDate })) {
                  // Não adicionar a data original novamente
                  if (!isSameDay(nextWeeklyDate, taskStartDate) || calculationStartDate > taskStartDate) {
                    const uniqueId = `${task.id}-weekly-simple-${weeklyIndex}-${format(nextWeeklyDate, 'yyyy-MM-dd')}`;
                    
                    const occurrenceTask: Task = {
                      ...task,
                      id: uniqueId,
                      dueDate: nextWeeklyDate,
                      isRecurrenceOccurrence: true,
                      originalTaskId: task.id
                    };
                    
                    addTaskIfUnique(occurrenceTask);
                    weeklyIndex++;
                  }
                  nextWeeklyDate = addWeeks(nextWeeklyDate, interval);
                }
              }
              break;
              
            case 'monthly':
              let nextMonthlyDate = calculationStartDate;
              let monthlyIndex = 0;
              while (isWithinInterval(nextMonthlyDate, { start: startDate, end: endDate })) {
                // Não adicionar a data original novamente
                if (!isSameDay(nextMonthlyDate, taskStartDate) || calculationStartDate > taskStartDate) {
                  const uniqueId = `${task.id}-monthly-${monthlyIndex}-${format(nextMonthlyDate, 'yyyy-MM-dd')}`;
                  
                  const occurrenceTask: Task = {
                    ...task,
                    id: uniqueId,
                    dueDate: nextMonthlyDate,
                    isRecurrenceOccurrence: true,
                    originalTaskId: task.id
                  };
                  
                  addTaskIfUnique(occurrenceTask);
                  monthlyIndex++;
                }
                nextMonthlyDate = addMonths(nextMonthlyDate, interval);
              }
              break;
          }
        } else {
          // Para tarefas não recorrentes, apenas incluí-las se estiverem dentro do intervalo
          if (task.dueDate) {
            try {
              const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
              
              // Verificar se a data é válida
              if (isNaN(taskDate.getTime())) {
                console.error('Data inválida para tarefa não recorrente:', task.id, task.dueDate);
                return;
              }
              
              if (isWithinInterval(taskDate, { start: startDate, end: endDate })) {
                addTaskIfUnique(task);
              }
            } catch (error) {
              console.error('Erro ao processar data da tarefa não recorrente:', task.id, error);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao processar tarefa:', task.id, error);
      }
    });
    
    console.log(`Total de tarefas geradas: ${occurrences.length} (IDs únicos: ${usedIds.size})`);
    
    // Verificar se há IDs duplicados nas tarefas geradas
    const foundIds = new Set<string>();
    const duplicateIds = new Set<string>();
    
    occurrences.forEach(task => {
      if (foundIds.has(task.id)) {
        duplicateIds.add(task.id);
      } else {
        foundIds.add(task.id);
      }
    });
    
    if (duplicateIds.size > 0) {
      console.error(`ALERTA: Encontradas ${duplicateIds.size} IDs duplicados após geração:`, Array.from(duplicateIds));
    }
    
    return occurrences;
  };
  
  const loadTasksForMonth = async (month: Date) => {
    setIsLoading(true);
    try {
      // Obter primeiro e último dia do mês
      const firstDayOfMonth = startOfMonth(month);
      const lastDayOfMonth = endOfMonth(month);
      
      // Obter dias no mês atual
      const daysInMonth = eachDayOfInterval({
        start: firstDayOfMonth,
        end: lastDayOfMonth
      });
      
      // 1. Obter tarefas não recorrentes específicas para o mês selecionado
      const regularTasksPromise = TaskService.getUpcomingTasks(
        0, // não usado quando fornecemos datas start/end
        firstDayOfMonth,
        lastDayOfMonth
      );
      
      // 2. Obter tarefas recorrentes independente do mês
      // Vamos buscar todas as tarefas recorrentes criadas até o final do mês selecionado
      const recurrentTasksPromise = TaskService.getRecurringTasks();
      
      // Aguardar todas as consultas terminarem
      const [regularTasks, recurrentTasks] = await Promise.all([
        regularTasksPromise,
        recurrentTasksPromise
      ]);
      
      console.log(`Carregadas ${regularTasks.length} tarefas regulares e ${recurrentTasks.length} tarefas recorrentes para ${format(month, 'MMMM yyyy')}`);
      
      // Verificar se há tarefas duplicadas no conjunto base
      const taskIds = new Set<string>();
      const duplicatedTasks = new Set<string>();
      const baseTasks: Task[] = [];
      
      // Adicionar tarefas regulares sem duplicação
      regularTasks.forEach(task => {
        if (!taskIds.has(task.id)) {
          taskIds.add(task.id);
          baseTasks.push(task);
        } else {
          duplicatedTasks.add(task.id);
        }
      });
      
      // Adicionar tarefas recorrentes sem duplicação
      recurrentTasks.forEach(task => {
        if (!taskIds.has(task.id)) {
          taskIds.add(task.id);
          baseTasks.push(task);
        } else {
          duplicatedTasks.add(task.id);
        }
      });
      
      if (duplicatedTasks.size > 0) {
        console.warn(`Encontradas ${duplicatedTasks.size} tarefas duplicadas nas listas base:`, Array.from(duplicatedTasks));
      }
      
      // Gerar todas as ocorrências de tarefas recorrentes para o mês
      const allTasks = generateRecurrenceOccurrences(
        baseTasks,
        firstDayOfMonth,
        lastDayOfMonth
      );
      
      console.log(`Geradas ${allTasks.length} ocorrências de tarefas para o mês ${format(month, 'MMMM yyyy')}`);
      
      // Agrupar tarefas por data
      const grouped: Record<string, Task[]> = {};
      const usedTaskIdsByDate: Record<string, Set<string>> = {};
      
      // Inicializar todos os dias do mês com arrays vazios
      daysInMonth.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        grouped[dateStr] = [];
        usedTaskIdsByDate[dateStr] = new Set<string>();
      });
      
      // Adicionar tarefas aos seus respectivos dias
      allTasks.forEach((task: Task) => {
        try {
          if (task.dueDate) {
            // Garantir que a data seja válida antes de processá-la
            let dueDate: Date;
            try {
              dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
              
              // Verificar se a data é válida
              if (isNaN(dueDate.getTime())) {
                console.error('Data inválida ao agrupar tarefa:', task.id, task.dueDate);
                return;
              }
              
              // Normalizar a data para ignorar o horário e considerar apenas a parte da data
              const normalizedDate = startOfDay(dueDate);
              const dateStr = format(normalizedDate, 'yyyy-MM-dd');
              
              if (grouped[dateStr]) {
                // Verificar se a tarefa já foi adicionada para esta data
                if (!usedTaskIdsByDate[dateStr].has(task.id)) {
                  usedTaskIdsByDate[dateStr].add(task.id);
                  grouped[dateStr].push(task);
                } else {
                  console.warn(`Tarefa ${task.id} já adicionada para a data ${dateStr}`);
                }
              }
            } catch (error) {
              console.error('Erro ao processar data para agrupamento:', task.id, error);
            }
          }
        } catch (error) {
          console.error('Erro ao agrupar tarefa:', task.id, error);
        }
      });
      
      // Verificação final: certificar que não existem tarefas com o mesmo ID na mesma data
      Object.keys(grouped).forEach(dateStr => {
        const idSet = new Set<string>();
        const duplicates = grouped[dateStr].filter(task => {
          if (idSet.has(task.id)) {
            console.error(`ALERTA CRÍTICO: Tarefa duplicada no agrupamento final - Data: ${dateStr}, ID: ${task.id}`);
            return true;
          }
          idSet.add(task.id);
          return false;
        });
        
        if (duplicates.length > 0) {
          console.error(`ALERTA CRÍTICO: Encontradas ${duplicates.length} tarefas duplicadas na data ${dateStr}`);
          // Remover duplicatas
          grouped[dateStr] = grouped[dateStr].filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          );
        }
      });
      
      setTasksByDate(grouped);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTaskUpdated = () => {
    loadTasksForMonth(currentMonth);
  };
  
  const handlePreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };
  
  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
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
        <h1 className="text-2xl font-bold">Em Breve</h1>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-lg font-medium">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 dark:text-gray-400">
            Carregando tarefas para {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(tasksByDate)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) // Ordenar cronologicamente
            .map(dateStr => {
              try {
                // Tentar converter a string da data em um objeto Date
                let date: Date;
                try {
                  date = parseISO(dateStr);
                  // Verificar se a data é válida
                  if (isNaN(date.getTime())) {
                    console.error('Data inválida para exibição:', dateStr);
                    return null;
                  }
                } catch (error) {
                  console.error('Erro ao processar data para exibição:', dateStr, error);
                  return null;
                }
                
                const dayTasks = tasksByDate[dateStr];
                const hasTasksForDay = dayTasks.length > 0;
                
                // Só mostrar dias com tarefas
                if (!hasTasksForDay) return null;
                
                // Ordenar tarefas para garantir consistência na renderização
                const sortedTasks = [...dayTasks].sort((a, b) => {
                  // Ordenar por ID para garantir ordem consistente
                  return a.id.localeCompare(b.id);
                });
                
                return (
                  <div key={`date-${dateStr}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                    <div className={`mb-4 pb-2 border-b ${
                      isToday(date) 
                        ? 'text-blue-600 border-blue-500 dark:text-blue-400 dark:border-blue-400' 
                        : 'text-gray-700 border-gray-200 dark:text-gray-200 dark:border-gray-700'
                    }`}>
                      <h2 className="text-lg font-semibold">
                        {isToday(date) 
                          ? 'Hoje' 
                          : format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </h2>
                    </div>
                    
                    <div className="space-y-3" data-date={dateStr}>
                      {sortedTasks.map((task: Task, taskIndex: number) => {
                        try {
                          // Criar chave composta garantidamente única
                          const uniqueKey = `task-${dateStr}-${task.id}-${taskIndex}`;
                          
                          return (
                            <div 
                              key={uniqueKey}
                              className={`${task.isRecurrenceOccurrence ? 'border-l-4 border-blue-400 pl-2' : ''}`}
                              data-task-id={task.id}
                            >
                              {task.isRecurrenceOccurrence && (
                                <div className="flex items-center text-xs text-blue-500 mb-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span>Recorrente</span>
                                </div>
                              )}
                              <TaskItem 
                                key={`taskitem-${task.id}`}
                                task={task} 
                                onUpdate={handleTaskUpdated}
                              />
                            </div>
                          );
                        } catch (error) {
                          console.error('Erro ao renderizar tarefa:', task.id, error);
                          return null;
                        }
                      })}
                    </div>
                  </div>
                );
              } catch (error) {
                console.error('Erro ao renderizar dia:', dateStr, error);
                return null;
              }
            })}
          
          {Object.values(tasksByDate).every(tasks => tasks.length === 0) && (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa agendada para este mês</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
} 