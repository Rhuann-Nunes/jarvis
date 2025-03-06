'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { TaskService } from '@/lib/db';
import TaskItem from '@/components/TaskItem';
import TaskInput from '@/components/TaskInput';

export default function HojePage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  useEffect(() => {
    // Carregar tarefas
    const initialize = async () => {
      await loadTasks();
      
      // Recuperar projeto selecionado anteriormente da sessionStorage
      const savedProjectId = sessionStorage.getItem('selectedProjectId');
      if (savedProjectId) {
        setSelectedProjectId(savedProjectId);
      }
    };
    
    initialize();
  }, []);
  
  const loadTasks = async () => {
    try {
      const todayTasks = await TaskService.getTasksDueToday();
      setTasks(todayTasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas de hoje:', error);
    }
  };
  
  const handleTaskAdded = async () => {
    await loadTasks();
  };
  
  const handleTaskUpdated = async () => {
    await loadTasks();
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
        <h1 className="text-2xl font-bold">Hoje</h1>
      </div>
      
      <div className="mb-8">
        <TaskInput 
          onTaskAdded={handleTaskAdded} 
        />
      </div>
      
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa para hoje</p>
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
    </AppLayout>
  );
} 