'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import TaskList from '@/components/TaskList';
import { requestNotificationPermission } from '@/lib/notifications';
import { ProjectService } from '@/lib/db';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Request notification permission when the app loads
    requestNotificationPermission();
  }, []);
  
  useEffect(() => {
    // Tenta recuperar um projeto previamente selecionado da sessionStorage
    const savedProjectId = sessionStorage.getItem('selectedProjectId');
    const savedSectionId = sessionStorage.getItem('selectedSectionId');
    
    if (savedProjectId) {
      setSelectedProjectId(savedProjectId);
      if (savedSectionId) {
        setSelectedSectionId(savedSectionId);
      }
    } else if (!selectedProjectId) {
      // Se não há projeto salvo ou selecionado, selecione o primeiro
      const fetchInitialProject = async () => {
        try {
          const projects = await ProjectService.getAllProjects();
          if (projects && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
          }
        } catch (error) {
          console.error('Failed to load projects:', error);
        }
      };
      fetchInitialProject();
    }
  }, [selectedProjectId]);
  
  const handleSelectProject = (projectId: string, sectionId?: string) => {
    // Salva a seleção em sessionStorage para persistir entre navegações
    sessionStorage.setItem('selectedProjectId', projectId);
    if (sectionId) {
      sessionStorage.setItem('selectedSectionId', sectionId);
    } else {
      sessionStorage.removeItem('selectedSectionId');
    }
    
    setSelectedProjectId(projectId);
    setSelectedSectionId(sectionId);
  };
  
  return (
    <AppLayout
      selectedProjectId={selectedProjectId}
      selectedSectionId={selectedSectionId}
      onSelectProject={handleSelectProject}
    >
      {selectedProjectId && (
        <TaskList 
          projectId={selectedProjectId} 
          sectionId={selectedSectionId} 
        />
      )}
    </AppLayout>
  );
}
