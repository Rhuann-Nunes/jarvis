'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { TaskService } from '@/lib/db';
import TaskItem from '@/components/TaskItem';
import TaskInput from '@/components/TaskInput';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function EntradasPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Carregar tarefas
    const loadTasks = async () => {
      try {
        setLoading(true);
        const inboxTasks = await TaskService.getTasksWithoutProject();
        setTasks(inboxTasks);
      } catch (error) {
        console.error('Erro ao carregar tarefas sem projeto:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTasks();
    
    // Recuperar projeto selecionado anteriormente da sessionStorage
    const savedProjectId = sessionStorage.getItem('selectedProjectId');
    if (savedProjectId) {
      setSelectedProjectId(savedProjectId);
    }
  }, []);
  
  const handleTaskAdded = async () => {
    const updatedTasks = await TaskService.getTasksWithoutProject();
    setTasks(updatedTasks);
  };
  
  const handleTaskUpdated = async () => {
    const updatedTasks = await TaskService.getTasksWithoutProject();
    setTasks(updatedTasks);
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
        <h1 className="text-2xl font-bold">Entradas</h1>
      </div>
      
      <div className="mb-8">
        <TaskInput onTaskAdded={handleTaskAdded} />
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">Carregando tarefas...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa na caixa de entrada</p>
            </div>
          ) : (
            tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={handleTaskUpdated}
              />
            ))
          )}
        </div>
      )}
    </AppLayout>
  );
} 