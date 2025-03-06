'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, TrashIcon, PencilIcon, CalendarIcon, ArrowPathIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon, FlagIcon } from '@heroicons/react/24/solid';
import { Task, Project, Section } from '@/types';
import { TaskService, ProjectService } from '@/lib/db';
import { formatDate, formatTime } from '@/lib/notifications';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ProjectSelector from './ProjectSelector';

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
}

export default function TaskItem({ task, onUpdate }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  
  // Debug log for task object
  console.log('TaskItem rendering task:', JSON.stringify(task, null, 2));
  console.log('Task recurrence:', task.recurrence);
  
  // Usar o projeto já carregado com a tarefa, se disponível
  // Caso contrário, usar o método antigo como fallback
  const [project, setProject] = useState<any>(task.project);
  
  useEffect(() => {
    // Se o projeto não estiver carregado e houver um projectId, buscar o projeto
    const loadProject = async () => {
      if (!project && task.projectId) {
        try {
          const projectData = await ProjectService.getProjectById(task.projectId);
          setProject(projectData);
        } catch (error) {
          console.error("Erro ao carregar projeto:", error);
        }
      }
    };
    
    loadProject();
  }, [task.projectId, project]);

  const handleToggleComplete = async () => {
    if (task.completed) {
      // Desmarcar tarefa como concluída
      await TaskService.updateTask(task.id, {
        completed: false
      });
      onUpdate();
    } else {
      // Se for uma tarefa recorrente ou uma ocorrência de recorrência
      if (task.recurrence || task.isRecurrenceOccurrence) {
        await TaskService.completeRecurringTask(task.id);
        
        // Mostrar notificação apenas para a tarefa recorrente original (não para ocorrência)
        if (!task.isRecurrenceOccurrence) {
          // Buscar a tarefa original atualizada para obter a nova data
          const updatedOriginalTask = await TaskService.getTaskById(task.id);
          
          if (updatedOriginalTask?.dueDate) {
            // Formatar a nova data
            const nextDateStr = format(new Date(updatedOriginalTask.dueDate), 'dd/MM/yyyy');
            toast.success(`Tarefa marcada como concluída. Próxima ocorrência: ${nextDateStr}`);
          } else {
            toast.success('Tarefa recorrente marcada como concluída.');
          }
        } else {
          toast.success('Tarefa marcada como concluída.');
        }
        
        onUpdate();
      } else {
        // Para tarefas não recorrentes
        TaskService.updateTask(task.id, {
          completed: true
        });
        onUpdate();
      }
    }
  };

  const handleDelete = async () => {
    try {
      await TaskService.deleteTask(task.id);
      toast.success('Tarefa excluída');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao excluir tarefa');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditTitle(task.title);
  };

  const handleSaveEdit = async () => {
    if (editTitle.trim()) {
      try {
        await TaskService.updateTask(task.id, {
          title: editTitle.trim()
        });
        
        setIsEditing(false);
        onUpdate();
      } catch (error) {
        toast.error('Erro ao atualizar tarefa');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(task.title);
    }
  };

  // Função para determinar a cor da data (vermelho = hoje, verde = futuro, cinza = passado)
  const getDateColor = (): string => {
    if (!task.dueDate) return 'text-gray-500';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate.getTime() < today.getTime()) {
      return 'text-gray-500';
    } else if (dueDate.getTime() === today.getTime()) {
      return 'text-red-500';
    } else {
      return 'text-green-500';
    }
  };

  // Extrair a data e hora separadamente
  const formatDateDisplay = (date: Date | string): string => {
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

  // Extrair apenas a hora
  const formatTimeDisplay = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    
    // Formatar como 12h com AM/PM
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 deve ser exibido como 12
    
    return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Verificar se a tarefa é importante
  const isImportant = task.title.toLowerCase().includes('importante') || 
                      task.title.toLowerCase().includes('urgente') ||
                      task.title.toLowerCase().includes('priority');

  // Formatar recorrência para exibição
  const formatRecurrenceDisplay = (recurrence: any): string => {
    if (typeof recurrence === 'string') {
      return recurrence;
    } else if (recurrence && typeof recurrence === 'object') {
      if (recurrence.type === 'daily') {
        return `Diariamente (a cada ${recurrence.interval} ${recurrence.interval === 1 ? 'dia' : 'dias'})`;
      } else if (recurrence.type === 'weekly') {
        return `Semanalmente (a cada ${recurrence.interval} ${recurrence.interval === 1 ? 'semana' : 'semanas'})`;
      } else if (recurrence.type === 'monthly') {
        return `Mensalmente (a cada ${recurrence.interval} ${recurrence.interval === 1 ? 'mês' : 'meses'})`;
      } else if (recurrence.type === 'yearly') {
        return `Anualmente (a cada ${recurrence.interval} ${recurrence.interval === 1 ? 'ano' : 'anos'})`;
      }
    }
    return '';
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
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              autoFocus
            />
          ) : (
            <div className="text-sm font-medium">
              <div className={task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}>
                {task.title}
              </div>
              
              {/* Informações adicionais em linha com a métrica de tarefas */}
              <div className="flex flex-wrap gap-2 mt-2 items-center text-xs text-gray-500 dark:text-gray-400">
                {/* Seletor de projeto */}
                <ProjectSelector task={task} onTaskUpdated={onUpdate} />
                
                {/* Data de vencimento */}
                {task.dueDate && (
                  <div className={`flex items-center ${getDateColor()}`}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    <span>{formatDateDisplay(task.dueDate)}</span>
                    {formatTimeDisplay(task.dueDate) && (
                      <span className="ml-1">{formatTimeDisplay(task.dueDate)}</span>
                    )}
                  </div>
                )}
                
                {/* Informação de recorrência */}
                {task.recurrence && (
                  <div className="flex items-center text-blue-500 dark:text-blue-400">
                    <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                    <span>{typeof task.recurrence === 'string' ? task.recurrence : formatRecurrenceDisplay(task.recurrence)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={handleEdit}
            className="p-1 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
            aria-label="Editar tarefa"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
            aria-label="Excluir tarefa"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 