'use client';

import { useMemo } from 'react';
import { Task } from '@/types';
import { format, addDays, isToday, isTomorrow, startOfDay, compareAsc, parseISO, isSameMonth, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface CalendarDaysProps {
  tasks: Task[];
  daysAhead: number;
}

interface TasksByDay {
  [key: string]: Task[];
}

export function CalendarDays({ tasks, daysAhead }: CalendarDaysProps) {
  // Organizar tarefas por dia
  const tasksByDay = useMemo(() => {
    const taskMap: TasksByDay = {};
    const today = startOfDay(new Date());
    
    // Inicializar dias vazios para garantir que todos os dias apareçam, mesmo sem tarefas
    for (let i = 0; i < daysAhead; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      taskMap[dateStr] = [];
    }
    
    // Adicionar tarefas aos dias correspondentes
    tasks.forEach(task => {
      if (task.dueDate) {
        // Garantir que a data está no formato correto
        const dueDate = task.dueDate instanceof Date 
          ? task.dueDate 
          : new Date(task.dueDate as any);
        
        const dateStr = format(startOfDay(dueDate), 'yyyy-MM-dd');
        if (taskMap[dateStr]) {
          taskMap[dateStr].push(task);
        }
      }
    });
    
    return taskMap;
  }, [tasks, daysAhead]);

  // Obter array de datas ordenadas
  const sortedDates = useMemo(() => {
    return Object.keys(tasksByDay).sort();
  }, [tasksByDay]);

  // Agrupar datas por mês para uma visualização estilo calendário
  const datesByMonth = useMemo(() => {
    const months: { [key: string]: string[] } = {};
    
    sortedDates.forEach(dateStr => {
      const date = parseISO(dateStr);
      const monthKey = format(date, 'yyyy-MM');
      
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      
      months[monthKey].push(dateStr);
    });
    
    return months;
  }, [sortedDates]);

  // Função para formatar o título do dia
  const formatDayTitle = (dateStr: string) => {
    const date = parseISO(dateStr);
    
    if (isToday(date)) {
      return 'Hoje';
    } else if (isTomorrow(date)) {
      return 'Amanhã';
    } else {
      return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
    }
  };

  // Função para formatar o título do mês
  const formatMonthTitle = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  // Função para obter o dia do mês para exibição
  const getDayOfMonth = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, 'd');
  };

  // Função para ordenar tarefas por hora
  const sortTasksByTime = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate as any);
      const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate as any);
      return compareAsc(dateA, dateB);
    });
  };

  // Função para formatar a hora da tarefa
  const formatTaskTime = (task: Task) => {
    if (!task.dueDate) return '';
    const dueDate = task.dueDate instanceof Date 
      ? task.dueDate 
      : new Date(task.dueDate as any);
    
    return format(dueDate, 'HH:mm');
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      const updatedTask = { ...task, completed: !task.completed };
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      // Normalmente você atualizaria o estado aqui
      // O ideal seria ter uma função de callback passada como prop
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Verificar se uma data tem tarefas
  const hasTasksOnDate = (dateStr: string) => {
    return tasksByDay[dateStr] && tasksByDay[dateStr].length > 0;
  };

  // Obter a classe CSS para o dia baseado em seu estado
  const getDayClass = (dateStr: string) => {
    const date = parseISO(dateStr);
    let className = "calendar-day flex flex-col py-2 px-3 border border-gray-700 rounded-md ";
    
    if (isToday(date)) {
      className += "bg-blue-900 border-blue-700 ";
    } else if (hasTasksOnDate(dateStr)) {
      className += "bg-gray-800 ";
    } else {
      className += "bg-gray-900 text-gray-500 ";
    }
    
    return className;
  };

  return (
    <div className="calendar-view text-gray-300">
      {Object.keys(datesByMonth).map(monthKey => (
        <div key={monthKey} className="month-container mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4 capitalize">
            {formatMonthTitle(monthKey)}
          </h2>
          
          {/* Grade de dias do calendário */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {datesByMonth[monthKey].map(dateStr => (
              <div key={dateStr} className={getDayClass(dateStr)}>
                <div className="day-header flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-300">
                    {isToday(parseISO(dateStr)) ? 'Hoje' : 
                     isTomorrow(parseISO(dateStr)) ? 'Amanhã' : 
                     format(parseISO(dateStr), 'EEEE', { locale: ptBR })}
                  </span>
                  <span className="text-lg font-bold text-gray-200">
                    {getDayOfMonth(dateStr)}
                  </span>
                </div>
                
                {hasTasksOnDate(dateStr) ? (
                  <div className="tasks-list">
                    {sortTasksByTime(tasksByDay[dateStr]).map(task => (
                      <div 
                        key={`${task.id}${task.isRecurrenceOccurrence ? `-${task.dueDate instanceof Date ? task.dueDate.getTime() : ''}` : ''}`}
                        className={`task-item mb-2 p-2 rounded-md ${task.completed ? 'bg-gray-700' : 'bg-gray-800 border border-gray-700'}`}
                      >
                        <div className="flex items-start">
                          <button 
                            onClick={() => toggleTaskComplete(task)} 
                            className="flex-shrink-0 mr-2"
                          >
                            {task.completed ? (
                              <CheckCircleSolidIcon className="h-5 w-5 text-green-400" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5 text-gray-500" />
                            )}
                          </button>
                          <div className="flex-grow">
                            <div className="flex items-center">
                              {formatTaskTime(task) && (
                                <span className="text-xs font-semibold bg-blue-900 text-blue-300 rounded-md px-1.5 py-0.5 mr-1.5">
                                  {formatTaskTime(task)}
                                </span>
                              )}
                              <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                                {task.title}
                              </span>
                            </div>
                            {task.projectId && (
                              <div className="mt-1">
                                <span className="inline-block px-2 py-0.5 text-xs bg-blue-900 text-blue-300 rounded-sm">
                                  Projeto
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-tasks text-sm text-gray-500 italic">
                    Sem tarefas
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Detalhes das tarefas por dia - visão expandida */}
          {datesByMonth[monthKey].map(dateStr => {
            const dayTasks = sortTasksByTime(tasksByDay[dateStr]);
            if (dayTasks.length === 0) return null;
            
            return (
              <div key={`details-${dateStr}`} className="day-detail mb-6">
                <h3 className="text-lg font-semibold mb-2 capitalize border-l-4 border-blue-600 pl-3 text-gray-200">
                  {formatDayTitle(dateStr)}
                </h3>
                <div className="tasks-container bg-gray-800 border border-gray-700 rounded-lg divide-y divide-gray-700 shadow-md">
                  {dayTasks.map(task => (
                    <div 
                      key={`detail-${task.id}${task.isRecurrenceOccurrence ? `-${task.dueDate instanceof Date ? task.dueDate.getTime() : ''}` : ''}`}
                      className={`task-item p-3 flex items-start ${task.completed ? 'bg-gray-700' : 'bg-gray-800'}`}
                    >
                      <button 
                        onClick={() => toggleTaskComplete(task)} 
                        className="flex-shrink-0 mr-3 mt-1"
                      >
                        {task.completed ? (
                          <CheckCircleSolidIcon className="h-5 w-5 text-green-400" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      <div className="flex-grow">
                        <div className="flex items-center mb-1">
                          <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                            {task.title}
                          </span>
                        </div>
                        {task.description && (
                          <p className={`text-sm ${task.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                            {task.description}
                          </p>
                        )}
                        {task.projectId && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 text-xs bg-blue-900 text-blue-300 rounded">
                              Projeto
                            </span>
                          </div>
                        )}
                        {task.isRecurrenceOccurrence && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 text-xs bg-purple-900 text-purple-300 rounded flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Recorrente
                            </span>
                          </div>
                        )}
                      </div>
                      {formatTaskTime(task) && (
                        <span className="flex-shrink-0 text-sm text-gray-400">
                          {formatTaskTime(task)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
} 