'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { SettingsPanel } from '@/components/SettingsPanel';

export default function SettingsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  useEffect(() => {
    // Recuperar projeto selecionado anteriormente da sessionStorage
    const savedProjectId = sessionStorage.getItem('selectedProjectId');
    if (savedProjectId) {
      setSelectedProjectId(savedProjectId);
    }
  }, []);
  
  const handleSelectProject = (projectId: string, sectionId?: string) => {
    setSelectedProjectId(projectId);
    // Salvar na sessionStorage para persistir entre páginas
    sessionStorage.setItem('selectedProjectId', projectId);
  };
  
  return (
    <AppLayout 
      selectedProjectId={selectedProjectId}
      onSelectProject={handleSelectProject}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
      </div>
      
      <SettingsPanel />
    </AppLayout>
  );
} 