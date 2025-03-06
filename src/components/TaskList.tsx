'use client';

import { useState, useEffect } from 'react';
import { TaskService, ProjectService } from '@/lib/db';
import { Task, Project, Section } from '@/types';
import TaskItem from './TaskItem';
import TaskInput from './TaskInput';
import { scheduleTaskNotification } from '@/lib/notifications';

interface TaskListProps {
  projectId: string;
  sectionId?: string;
}

export default function TaskList({ projectId, sectionId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | undefined>();
  const [section, setSection] = useState<Section | undefined>();
  const [loading, setLoading] = useState(false);
  
  const loadTasks = async () => {
    try {
      setLoading(true);
      let filteredTasks: Task[];
      
      // Sempre usar getTasksByProject, não importa se há um sectionId ou não
      filteredTasks = await TaskService.getTasksByProject(projectId);
      
      // Ordena tarefas: incompletas primeiro, depois por data de vencimento
      filteredTasks.sort((a, b) => {
        // Primeiro ordena por status de conclusão
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        
        // Depois ordena por data de vencimento (se disponível)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        
        // Tarefas com data de vencimento vêm antes de tarefas sem data
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        
        // Finalmente, ordena por data de criação (mais recentes primeiro)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setTasks(filteredTasks);
      
      // Se temos tarefas e a primeira tarefa tem informações de projeto, use-as
      if (filteredTasks.length > 0 && filteredTasks[0].project) {
        const projectInfo = filteredTasks[0].project;
        setProject({
          id: projectInfo.id,
          name: projectInfo.name,
          color: projectInfo.color,
          sections: [],
          createdAt: new Date(),
          updatedAt: new Date()
        } as Project);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadProjectAndSection = async () => {
    try {
      // Só buscar o projeto se não tivermos informações dele das tarefas
      if (!project) {
        const projectData = await ProjectService.getProjectById(projectId);
        setProject(projectData);
      }
      
      // Não há mais necessidade de buscar seções, pois elas foram removidas
      // Definir section como undefined
      setSection(undefined);
    } catch (error) {
      console.error('Failed to load project details:', error);
    }
  };
  
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        loadTasks(),
        loadProjectAndSection()
      ]);
      
      // Schedule notifications for tasks with due dates
      tasks.forEach(task => {
        if (task.dueDate && !task.completed) {
          scheduleTaskNotification(task);
        }
      });
    };
    
    initialize();
  }, [projectId, sectionId]);
  
  const handleTaskAdded = async () => {
    await loadTasks();
  };
  
  const handleTaskUpdated = async () => {
    await loadTasks();
  };
  
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {section ? section.name : project?.name || 'Tarefas'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {tasks.filter(t => !t.completed).length} tarefas restantes
        </p>
      </div>
      
      <TaskInput 
        projectId={projectId} 
        sectionId={sectionId} 
        onTaskAdded={handleTaskAdded} 
      />
      
      <div className="mt-6 space-y-1">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onUpdate={handleTaskUpdated} 
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa ainda. Adicione uma acima!</p>
          </div>
        )}
      </div>
    </div>
  );
} 