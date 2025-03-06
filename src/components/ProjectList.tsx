'use client';

import { useState, useEffect, useRef } from 'react';
import { FolderIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon, TrashIcon, InboxIcon, CalendarIcon, ClockIcon, CheckCircleIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { ProjectService, SectionService } from '@/lib/db';
import { Project } from '@/types';
import toast from 'react-hot-toast';
import { usePathname, useRouter } from 'next/navigation';

interface ProjectListProps {
  selectedProjectId: string;
  onSelectProject: (projectId: string, sectionId?: string) => void;
}

export default function ProjectList({ selectedProjectId, onSelectProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSectionToProject, setAddingSectionToProject] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  
  const isDashboardPage = pathname === '/dashboard';
  const isEntradasPage = pathname === '/entradas';
  const isHojePage = pathname === '/hoje';
  const isEmBrevePage = pathname === '/em-breve';
  const isConcluidoPage = pathname === '/concluido';
  const isSettingsPage = pathname === '/settings';
  
  // Determinar se deve mostrar a seleção visual de projetos
  // Em páginas como Configurações, não devemos mostrar projetos como selecionados
  const shouldShowProjectSelection = !isSettingsPage && !isEntradasPage && !isHojePage && !isEmBrevePage && !isConcluidoPage && !isDashboardPage;
  
  // Em páginas específicas (como settings), não devemos considerar o selectedProjectId
  const effectiveSelectedProjectId = isSettingsPage ? '' : selectedProjectId;
  
  // Ref para controlar se os projetos já foram carregados
  const projectsLoadedRef = useRef(false);
  
  // Função para gerar uma cor aleatória para novos projetos
  const getRandomColor = () => {
    // Lista de cores pré-definidas mais agradáveis visualmente
    const colors = [
      '#4285F4', // Google Blue
      '#34A853', // Google Green
      '#FBBC05', // Google Yellow
      '#EA4335', // Google Red
      '#5E97F6', // Light Blue
      '#A142F4', // Purple
      '#F6BF26', // Yellow
      '#E6412C', // Red
      '#0F9D58', // Green
      '#AB47BC', // Purple
      '#00ACC1', // Cyan
      '#FF7043', // Deep Orange
      '#9E9E9E', // Grey
      '#3949AB', // Indigo
      '#00897B', // Teal
    ];
    
    // Selecionar uma cor aleatória da lista
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  const loadProjects = async () => {
    // Se já carregou projetos e não está explicitamente recarregando, retornar
    if (projectsLoadedRef.current && !loading) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('Iniciando carregamento de projetos...');
      
      // Obter projetos do banco de dados
      const fetchedProjects = await ProjectService.getAllProjects();
      console.log(`Projetos carregados: ${fetchedProjects?.length || 0}`);
      
      if (!fetchedProjects || !Array.isArray(fetchedProjects)) {
        console.error('Dados de projetos inválidos:', fetchedProjects);
        setProjects([]);
        return;
      }
      
      // Inicializar o estado expandido para cada projeto
      const newExpandedProjects = { ...expandedProjects };
      fetchedProjects.forEach(project => {
        if (newExpandedProjects[project.id] === undefined) {
          newExpandedProjects[project.id] = false;
        }
      });
      
      setProjects(fetchedProjects);
      setExpandedProjects(newExpandedProjects);
      
      // Marcar que os projetos foram carregados
      projectsLoadedRef.current = true;
      
      // Log resumido para não poluir o console
      console.log(`Carregamento de ${fetchedProjects.length} projetos concluído com sucesso.`);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast.error('Erro ao carregar projetos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar a lista de projetos
  const refreshProjects = async () => {
    try {
      setLoading(true);
      console.log('Iniciando atualização da lista de projetos...');
      
      // Obter projetos usando o serviço
      const refreshedProjects = await ProjectService.getAllProjects();
      console.log(`refreshProjects: Recebidos ${refreshedProjects?.length || 0} projetos`);
      
      // Verificar se os dados recebidos são válidos
      if (!refreshedProjects || !Array.isArray(refreshedProjects)) {
        console.error('Dados recebidos inválidos:', refreshedProjects);
        toast.error('Erro ao atualizar projetos. Os dados recebidos são inválidos.');
        return;
      }
      
      // Garantir que cada projeto tenha uma propriedade sections válida
      const projectsWithSections = refreshedProjects.map(project => ({
        ...project,
        sections: Array.isArray(project.sections) ? project.sections : []
      }));
      
      // Atualizar o estado
      setProjects(projectsWithSections);
      
      // Atualizar o estado expandido para incluir novos projetos
      const newExpandedProjects = { ...expandedProjects };
      projectsWithSections.forEach(project => {
        if (newExpandedProjects[project.id] === undefined) {
          newExpandedProjects[project.id] = false;
        }
      });
      setExpandedProjects(newExpandedProjects);
      
      console.log('Lista de projetos atualizada com sucesso.');
      return projectsWithSections;
    } catch (error) {
      console.error('Erro ao atualizar lista de projetos:', error);
      toast.error('Falha ao atualizar a lista de projetos.');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };
  
  useEffect(() => {
    loadProjects();
    
    // Adicionar listener para atualizar projetos quando a página se tornar visível novamente
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Força um refresh apenas se a página estava oculta e agora está visível novamente
        refreshProjects();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('O nome do projeto não pode estar vazio');
      return;
    }
    
    try {
      setIsAddingProject(true);
      
      console.log(`Criando novo projeto: "${newProjectName}"`);
      const projectData = {
        name: newProjectName,
        color: getRandomColor(),
      };
      
      let newProject;
      try {
        newProject = await ProjectService.createProject(projectData);
        console.log('Projeto criado com sucesso:', newProject);
      } catch (createError) {
        console.error('Erro ao criar projeto:', createError);
        
        // Verificar se o projeto foi criado apesar do erro
        console.log('Verificando se o projeto foi criado mesmo com erro...');
        try {
          // Espere um breve momento para garantir que o projeto tenha tempo de ser criado
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Atualizar projetos para verificar se o novo projeto aparece
          await refreshProjects();
          
          // Verificar se o projeto foi criado pelo nome
          const createdProject = projects.find(p => p.name === newProjectName);
          if (createdProject) {
            console.log('Projeto encontrado após erro!', createdProject);
            newProject = createdProject;
            // Não propagar o erro, pois o projeto foi criado com sucesso
          } else {
            // Se não encontramos o projeto, lançar o erro original
            throw createError;
          }
        } catch (verifyError) {
          console.error('Erro ao verificar projeto após falha:', verifyError);
          throw createError; // Repassar o erro original
        }
      }
      
      if (newProject && newProject.id) {
        // Adicionar o novo projeto diretamente ao estado para atualização imediata
        const projectWithSections = {
          ...newProject,
          sections: []
        };
        
        // Atualizar o estado com o novo projeto
        setProjects(prevProjects => {
          // Verificar se o projeto já existe na lista para evitar duplicatas
          const exists = prevProjects.some(p => p.id === newProject.id);
          if (exists) {
            console.log('Projeto já existe na lista. Não adicionando duplicata.');
            return prevProjects;
          }
          
          console.log('Adicionando novo projeto à lista de projetos:', projectWithSections);
          return [...prevProjects, projectWithSections];
        });
        
        // Inicializar o estado expandido para o novo projeto
        setExpandedProjects(prev => ({
          ...prev,
          [newProject.id]: true // Expandir automaticamente o novo projeto
        }));
        
        setNewProjectName('');
        toast.success('Projeto criado com sucesso!');
        
        // Atualizar a lista completa para garantir que tudo está sincronizado
        refreshProjects();
      } else {
        console.error('Falha ao criar projeto - resposta inválida:', newProject);
        toast.error('Erro ao criar projeto. Tente novamente.');
      }
    } catch (error) {
      // Se o erro for um objeto vazio e projetos foram adicionados recentemente, considere como sucesso
      if (typeof error === 'object' && 
          error !== null && 
          Object.keys(error).length === 0 && 
          projects.length > 0 &&
          projects.some(p => p.name === newProjectName)) {
        
        console.log('Erro detectado, mas o projeto parece ter sido criado com sucesso');
        setNewProjectName('');
        toast.success('Projeto criado com sucesso!');
        
        // Apenas atualizar a lista
        refreshProjects();
      } else {
        console.error('Erro ao criar projeto:', error);
        toast.error(`Erro ao criar projeto: ${error instanceof Error ? error.message : 'Tente novamente'}`);
      }
    } finally {
      setIsAddingProject(false);
    }
  };
  
  const handleAddSection = async (projectId: string) => {
    if (!newSectionName.trim()) return;
    
    try {
      console.log('Tentando criar seção:', {
        nome: newSectionName,
        projectId
      });
      
      await SectionService.createSection({
        name: newSectionName,
        projectId
      });
      
      setNewSectionName('');
      setAddingSectionToProject(null);
      await refreshProjects();
      toast.success('Seção criada com sucesso');
    } catch (error) {
      console.error('Failed to create section:', error);
      
      // Exibir mensagem de erro mais específica
      if (error instanceof Error) {
        if (error.message.includes('permissão') || 
            error.message.includes('autenticação')) {
          toast.error('Erro de autenticação. Por favor, faça login novamente.');
        }
        else if (error.message.includes('schema') || 
                error.message.includes('column')) {
          toast.error('Erro na estrutura do banco de dados: ' + error.message);
        }
        else if (error.message.includes('formato') || 
                error.message.includes('UUID')) {
          toast.error('Erro de formato: ID inválido');
        }
        else {
          toast.error(`Erro ao criar seção: ${error.message}`);
        }
      } else {
        toast.error('Erro desconhecido ao criar seção. Verifique o console.');
      }
    }
  };
  
  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm(`Tem certeza que deseja excluir este projeto e todas as suas tarefas?`)) {
      try {
        // Excluir o projeto
        await ProjectService.deleteProject(projectId);
        
        // Atualizar a lista de projetos
        await refreshProjects();
        
        // Se o projeto excluído era o selecionado, mudar para o primeiro projeto disponível
        if (projectId === selectedProjectId) {
          const remainingProjects = await ProjectService.getAllProjects();
          if (remainingProjects.length > 0) {
            onSelectProject(remainingProjects[0].id);
          }
        }
        
        toast.success('Projeto excluído com sucesso');
      } catch (error) {
        console.error('Failed to delete project:', error);
        toast.error('Erro ao excluir projeto');
      }
    }
  };
  
  const handleDeleteSection = async (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Tem certeza que deseja excluir esta seção?')) {
      try {
        await SectionService.deleteSection(sectionId);
        await refreshProjects();
        toast.success('Seção excluída');
      } catch (error) {
        console.error('Failed to delete section:', error);
        toast.error('Erro ao excluir seção');
      }
    }
  };

  // Navegar para a página principal mantendo o projeto/seção selecionados
  const navigateToHome = () => {
    router.push('/');
  };
  
  // Navegar para páginas específicas
  const handleEntradasClick = () => {
    if (!isEntradasPage) {
      router.push('/entradas');
    }
  };
  
  const handleHojeClick = () => {
    if (!isHojePage) {
      router.push('/hoje');
    }
  };
  
  const handleEmBreveClick = () => {
    if (!isEmBrevePage) {
      router.push('/em-breve');
    }
  };
  
  const handleConcluidoClick = () => {
    if (!isConcluidoPage) {
      router.push('/concluido');
    }
  };
  
  const handleDashboardClick = () => {
    if (!isDashboardPage) {
      router.push('/dashboard');
    }
  };
  
  // Handle Settings click
  const handleSettingsClick = () => {
    router.push('/settings');
  };
  
  // Lidar com clique em projeto, navegando para página principal se necessário
  const handleProjectClick = (projectId: string, sectionId?: string) => {
    // Atualizar os IDs selecionados via callback
    onSelectProject(projectId, sectionId);
    
    // Se não estiver na página principal, navegar para ela
    if (pathname !== '/') {
      router.push('/');
    }
  };
  
  // Adicionar componente de esqueleto para indicador de carregamento
  if (loading && projects.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center mb-4">
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full bg-white dark:bg-gray-900">
      {/* Botão Dashboard */}
      <div
        onClick={handleDashboardClick}
        className={`flex items-center px-3 py-2 mb-2 rounded-md cursor-pointer ${
          isDashboardPage 
            ? 'bg-blue-100 dark:bg-blue-900' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
        <span className="text-sm font-medium">Dashboard</span>
      </div>

      {/* Botão Entradas */}
      <div
        onClick={handleEntradasClick}
        className={`flex items-center px-3 py-2 mb-2 rounded-md cursor-pointer ${
          isEntradasPage 
            ? 'bg-blue-100 dark:bg-blue-900' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <InboxIcon className="h-5 w-5 text-gray-500 mr-2" />
        <span className="text-sm font-medium">Entradas</span>
      </div>

      {/* Botão Hoje */}
      <div
        onClick={handleHojeClick}
        className={`flex items-center px-3 py-2 mb-2 rounded-md cursor-pointer ${
          isHojePage 
            ? 'bg-blue-100 dark:bg-blue-900' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
        <span className="text-sm font-medium">Hoje</span>
      </div>

      {/* Botão Em breve */}
      <div
        onClick={handleEmBreveClick}
        className={`flex items-center px-3 py-2 mb-2 rounded-md cursor-pointer ${
          isEmBrevePage 
            ? 'bg-blue-100 dark:bg-blue-900' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
        <span className="text-sm font-medium">Em breve</span>
      </div>

      {/* Botão Concluído */}
      <div
        onClick={handleConcluidoClick}
        className={`flex items-center px-3 py-2 mb-2 rounded-md cursor-pointer ${
          isConcluidoPage 
            ? 'bg-blue-100 dark:bg-blue-900' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <CheckCircleIcon className="h-5 w-5 text-gray-500 mr-2" />
        <span className="text-sm font-medium">Concluído</span>
      </div>

      {/* Botão Configurações */}
      <div
        onClick={handleSettingsClick}
        className={`flex items-center px-3 py-2 mb-2 rounded-md cursor-pointer ${
          isSettingsPage 
            ? 'bg-blue-100 dark:bg-blue-900' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Cog6ToothIcon className="h-5 w-5 text-gray-500 mr-2" />
        <span className="text-sm font-medium">Configurações</span>
      </div>

      {/* Divisor */}
      <div className="h-px bg-gray-200 dark:bg-gray-700 mb-3"></div>

      {/* Projetos título */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Projetos</h2>
        
        <div className="flex space-x-1">
          <button
            onClick={() => setIsAddingProject(true)}
            className="text-gray-500 hover:text-blue-500"
            aria-label="Adicionar projeto"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {isAddingProject && (
        <div className="mb-3 flex items-center">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Nome do projeto"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddProject();
              if (e.key === 'Escape') setIsAddingProject(false);
            }}
          />
          <button
            onClick={handleAddProject}
            className="px-3 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
          >
            Adicionar
          </button>
        </div>
      )}
      
      <ul className="space-y-1">
        {Array.isArray(projects) ? projects.map(project => (
          <li key={project.id}>
            <div 
              className={`flex items-center py-2 px-2 rounded-md cursor-pointer ${
                shouldShowProjectSelection && effectiveSelectedProjectId === project.id && !project.sections?.some(s => s.id === effectiveSelectedProjectId)
                  ? 'bg-blue-100 dark:bg-blue-900' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProjectExpanded(project.id);
                  }}
                  className="focus:outline-none"
                >
                  {expandedProjects[project.id] ? (
                    <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-3 w-3 text-gray-500" />
                  )}
                </button>
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                ></span>
                <span>{project.name}</span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingSectionToProject(project.id);
                  }}
                  className="text-gray-500 hover:text-blue-500"
                  aria-label="Adicionar seção"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  className="text-gray-500 hover:text-red-500"
                  aria-label="Excluir projeto"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {addingSectionToProject === project.id && (
              <div className="ml-8 mt-2 mb-2 flex items-center">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Nome da seção"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSection(project.id);
                    if (e.key === 'Escape') setAddingSectionToProject(null);
                  }}
                />
                <button
                  onClick={() => handleAddSection(project.id)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
                >
                  Adicionar
                </button>
              </div>
            )}
            
            {expandedProjects[project.id] && project.sections && project.sections.length > 0 && (
              <ul className="ml-8 mt-1 space-y-1">
                {Array.isArray(project.sections) ? project.sections.map(section => (
                  <li key={section.id}>
                    <div 
                      className={`flex items-center px-3 py-2 rounded-lg cursor-pointer ${
                        shouldShowProjectSelection && effectiveSelectedProjectId === section.id
                          ? 'bg-blue-100 dark:bg-blue-900' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => handleProjectClick(project.id, section.id)}
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1">
                        {section.name}
                      </span>
                      
                      <button
                        onClick={(e) => handleDeleteSection(section.id, e)}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label="Excluir seção"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                )) : null}
              </ul>
            )}
          </li>
        )) : null}
      </ul>
    </div>
  );
} 