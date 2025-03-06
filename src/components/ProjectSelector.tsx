'use client';

import { useState, useRef, useEffect } from 'react';
import { FolderIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ProjectService, TaskService } from '@/lib/db';
import { Project, Task } from '@/types';
import toast from 'react-hot-toast';

interface ProjectSelectorProps {
  task: Task;
  onTaskUpdated: () => void;
}

export default function ProjectSelector({ task, onTaskUpdated }: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Ref para controlar se os projetos já foram carregados
  const projectsLoadedRef = useRef(false);
  
  // Carregar projetos quando o componente monta
  useEffect(() => {
    const loadProjects = async () => {
      // Se os projetos já foram carregados, não carregue novamente
      if (projectsLoadedRef.current) {
        return;
      }
      
      try {
        setLoading(true);
        const projectsData = await ProjectService.getAllProjects();
        console.log(`${projectsData.length} projetos carregados`);
        setProjects(projectsData);
        projectsLoadedRef.current = true;
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        toast.error('Erro ao carregar projetos');
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, []);
  
  // Carregar projetos novamente quando o dropdown é aberto
  useEffect(() => {
    if (isOpen && !loading && (projects.length === 0 || !projectsLoadedRef.current)) {
      const refreshProjects = async () => {
        try {
          setLoading(true);
          const projectsData = await ProjectService.getAllProjects();
          setProjects(projectsData);
          projectsLoadedRef.current = true;
        } catch (error) {
          console.error('Erro ao atualizar projetos:', error);
        } finally {
          setLoading(false);
        }
      };
      
      refreshProjects();
    }
  }, [isOpen, projects.length, loading]);
  
  // Fechar o dropdown quando clicado fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Vincular a tarefa a um projeto
  const assignToProject = async (projectId: string) => {
    try {
      console.log(`Tentando mover tarefa ${task.id} para o projeto ${projectId}`);
      console.log('Estado atual da tarefa:', JSON.stringify(task, null, 2));
      
      // Verificar se o projectId é válido
      if (!projectId) {
        console.error('ID do projeto não fornecido');
        toast.error('Não foi possível mover a tarefa: ID do projeto inválido');
        return;
      }
      
      // Verificar se a tarefa tem um ID
      if (!task.id) {
        console.error('ID da tarefa não disponível');
        toast.error('Não foi possível mover a tarefa: ID da tarefa inválido');
        return;
      }
      
      // Atualiza o status para indicar que está processando
      setIsOpen(false);
      const toastId = toast.loading('Movendo tarefa...');
      
      try {
        // Criar um objeto com apenas o campo projectId para atualização
        const updateData = {
          projectId: projectId  // Este será convertido para project_id no updateTask
        };
        
        console.log('Dados de atualização para assignToProject:', JSON.stringify(updateData, null, 2));
        
        // No método updateTask, projectId será convertido para project_id
        const updatedTask = await TaskService.updateTask(task.id, updateData);
        
        if (updatedTask) {
          console.log('Tarefa atualizada com sucesso:', updatedTask);
          toast.dismiss(toastId);
          toast.success('Tarefa movida para o projeto');
          onTaskUpdated();
        } else {
          console.error('Falha ao atualizar tarefa - resposta vazia');
          toast.dismiss(toastId);
          toast.error('Erro ao mover tarefa para o projeto');
        }
      } catch (error) {
        console.error('Erro na chamada da API:', error);
        toast.dismiss(toastId);
        
        // Extrair e mostrar a mensagem de erro específica
        if (error instanceof Error) {
          toast.error(`Erro: ${error.message}`);
        } else {
          toast.error('Ocorreu um erro ao mover a tarefa');
        }
      }
    } catch (error) {
      console.error('Erro geral ao mover tarefa para projeto:', error);
      toast.dismiss();
      
      if (error instanceof Error) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error('Ocorreu um erro ao mover a tarefa');
      }
    }
  };
  
  // Remover a tarefa de qualquer projeto (mover para Entradas)
  const removeFromProject = async () => {
    if (task.projectId) {
      try {
        console.log(`Tentando remover tarefa ${task.id} do projeto ${task.projectId}`);
        console.log('Estado atual da tarefa:', JSON.stringify(task, null, 2));
        
        // Verificar se a tarefa tem um ID
        if (!task.id) {
          console.error('ID da tarefa não disponível');
          toast.error('Não foi possível mover a tarefa: ID da tarefa inválido');
          return;
        }
        
        // Atualiza o status para indicar que está processando
        setIsOpen(false);
        const toastId = toast.loading('Movendo tarefa para Entradas...');
        
        try {
          // Criar um objeto com apenas o campo projectId para atualização
          const updateData = {
            projectId: undefined  // Usando undefined pois a interface Task espera string | undefined
          };
          
          console.log('Dados de atualização para removeFromProject:', JSON.stringify(updateData, null, 2));
          
          // No método updateTask, projectId será convertido para project_id
          const updatedTask = await TaskService.updateTask(task.id, updateData);
          
          if (updatedTask) {
            console.log('Tarefa removida do projeto com sucesso:', updatedTask);
            toast.dismiss(toastId);
            toast.success('Tarefa movida para Entradas');
            onTaskUpdated();
          } else {
            console.error('Falha ao remover tarefa do projeto - resposta vazia');
            toast.dismiss(toastId);
            toast.error('Erro ao mover tarefa para Entradas');
          }
        } catch (error) {
          console.error('Erro na chamada da API:', error);
          toast.dismiss(toastId);
          
          // Extrair e mostrar a mensagem de erro específica
          if (error instanceof Error) {
            toast.error(`Erro: ${error.message}`);
          } else {
            toast.error('Ocorreu um erro ao mover a tarefa para Entradas');
          }
        }
      } catch (error) {
        console.error('Erro geral ao remover tarefa do projeto:', error);
        toast.dismiss();
        
        if (error instanceof Error) {
          toast.error(`Erro: ${error.message}`);
        } else {
          toast.error('Ocorreu um erro ao mover a tarefa para Entradas');
        }
      }
    }
  };
  
  // Obter o projeto atual
  const [currentProject, setCurrentProject] = useState<Project | null>(
    task.project ? {
      id: task.project.id,
      name: task.project.name,
      color: task.project.color,
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: task.userId
    } as Project : null
  );
  
  useEffect(() => {
    const fetchCurrentProject = async () => {
      // Se já temos o projeto na tarefa, use-o
      if (task.project) {
        setCurrentProject({
          id: task.project.id,
          name: task.project.name,
          color: task.project.color,
          sections: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: task.userId
        } as Project);
      }
      // Se não temos o projeto, mas temos o ID, verifique primeiro na lista de projetos carregados
      else if (task.projectId) {
        // Procurar na lista de projetos já carregados
        const projectInList = projects.find(p => p.id === task.projectId);
        if (projectInList) {
          setCurrentProject(projectInList);
        } else {
          // Se não estiver na lista, buscar do serviço
          const project = await ProjectService.getProjectById(task.projectId);
          setCurrentProject(project || null);
        }
      } else {
        setCurrentProject(null);
      }
    };
    
    fetchCurrentProject();
  }, [task.projectId, task.project, task.userId, projects]);
  
  // Texto exibido no botão
  const displayText = currentProject 
    ? currentProject.name 
    : "Sem projeto";
      
  // Cor do projeto atual
  const projectColor = currentProject?.color || '#6B7280';
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-xs py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Selecionar projeto"
      >
        <span 
          className="inline-block w-2 h-2 rounded-full mr-1.5" 
          style={{ backgroundColor: projectColor }}
        ></span>
        <span className="truncate max-w-[120px]">{displayText}</span>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 max-h-[300px] overflow-y-auto w-64">
          {loading ? (
            <div className="py-2 px-4 text-sm text-gray-500">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ) : (
            <div className="py-1">
              {/* Opção para remover do projeto */}
              <div 
                className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${!task.projectId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={removeFromProject}
              >
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full mr-2 bg-gray-400"></span>
                  <span>Sem projeto (Entradas)</span>
                </div>
                {!task.projectId && (
                  <CheckIcon className="h-4 w-4 text-blue-500" />
                )}
              </div>
              
              {/* Divisor */}
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
              
              {/* Lista de projetos */}
              {projects.map(project => (
                <div key={project.id} className="text-sm">
                  <div 
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      task.projectId === project.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => assignToProject(project.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <span 
                          className="inline-block w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: project.color }}
                        ></span>
                        <span>{project.name}</span>
                      </div>
                      
                      <div className="flex items-center">
                        {task.projectId === project.id && (
                          <CheckIcon className="h-4 w-4 text-blue-500 mr-2" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 