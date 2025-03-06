'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import ProjectList from '@/components/ProjectList';
import { ProjectService } from '@/lib/db';
import { useRouter, usePathname } from 'next/navigation';
import ChatWidget from '@/components/ChatWidget';

interface AppLayoutProps {
  children: React.ReactNode;
  selectedProjectId: string;
  selectedSectionId?: string;
  onSelectProject: (projectId: string, sectionId?: string) => void;
}

export default function AppLayout({ 
  children, 
  selectedProjectId, 
  selectedSectionId,
  onSelectProject 
}: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Monitor route changes for loading state
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    // Add event listeners
    window.addEventListener('beforeunload', handleStart);
    document.addEventListener('routeChangeStart', handleStart);
    document.addEventListener('routeChangeComplete', handleComplete);
    document.addEventListener('routeChangeError', handleComplete);

    return () => {
      // Clean up event listeners
      window.removeEventListener('beforeunload', handleStart);
      document.removeEventListener('routeChangeStart', handleStart);
      document.removeEventListener('routeChangeComplete', handleComplete);
      document.removeEventListener('routeChangeError', handleComplete);
    };
  }, []);
  
  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      <Toaster position="bottom-right" />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse z-50"></div>
      )}
      
      {/* Header - fixed at top */}
      <div className="w-full z-40 flex-shrink-0">
        <Header />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - fixed */}
        <div 
          className={`${
            isSidebarOpen ? 'w-64' : 'w-0'
          } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-md dark:shadow-lg transition-all duration-300 overflow-hidden flex-shrink-0 h-full`}
        >
          <div className="h-full overflow-y-auto">
            <ProjectList 
              selectedProjectId={selectedProjectId}
              onSelectProject={onSelectProject}
            />
          </div>
        </div>
        
        {/* Main content area - only this should scroll */}
        <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-slate-900">
          {/* Sidebar toggle button */}
          <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white dark:bg-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
            aria-label={isSidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-600 dark:text-gray-200" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
          
          {/* Scrollable content container */}
          <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-3xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
      
      {/* ChatWidget - assistente do JARVIS */}
      <ChatWidget />
    </div>
  );
} 