import { Task, Project, Section } from '@/types';
import { supabase, createSupabaseClient } from './supabase';
import { Session } from 'next-auth';

// Importar serviços do db-utils que usam Supabase
import { 
  TaskService as SupabaseTaskService,
  ProjectService as SupabaseProjectService,
  SectionService as SupabaseSectionService
} from './db-utils';

// Apenas para compatibilidade durante a migração - 
// este arquivo será completamente substituído pelo db-utils.ts no futuro
// Todas as chamadas de serviço redirecionam para os novos serviços do Supabase

// Tipo básico para a sessão do usuário
interface UserSession {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
  expires?: string;
  supabaseAccessToken?: string;
}

// Obtém a sessão completa do usuário, compatível com next-auth Session
export const getUserSession = async (): Promise<Session | null> => {
  try {
    console.log('Obtendo sessão completa do usuário...');
    const response = await fetch('/api/auth/session');
    
    if (!response.ok) {
      console.error(`Erro ao obter sessão: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const session = await response.json();
    
    console.log('Sessão obtida:', JSON.stringify({
      hasUser: !!session?.user,
      hasToken: !!session?.supabaseAccessToken,
      expires: session?.expires
    }));
    
    return session as Session;
  } catch (error) {
    console.error('Erro ao obter sessão do usuário:', error);
    return null;
  }
};

// Obtém o ID do usuário da sessão
export const getUserId = async (): Promise<string | null> => {
  try {
    // Tenta obter o usuário atual da sessão
    const session = await getUserSession();
    
    if (session?.user?.id) {
      console.log('ID do usuário encontrado:', session.user.id);
      return session.user.id;
    }
    
    console.warn('Nenhum ID de usuário encontrado na sessão. Dados da sessão:', 
      JSON.stringify({
        hasUser: !!session?.user,
        hasToken: !!session?.supabaseAccessToken,
        expires: session?.expires
      }));
    
    return null;
  } catch (error) {
    console.error('Erro ao obter ID do usuário:', error);
    return null;
  }
};

// Task operations
export const TaskService = {
  getAllTasks: async (): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    return SupabaseTaskService.getAllTasks(userId);
  },
  
  getAllTasksIncludingCompleted: async (): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    return SupabaseTaskService.getAllTasksIncludingCompleted(userId);
  },
  
  getTasksWithoutProject: async (): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    return SupabaseTaskService.getTasksWithoutProject(userId);
  },
  
  getTasksByProject: async (projectId: string): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId || !projectId) return [];
    
    try {
      // Use SupabaseTaskService to get properly mapped tasks with recurrence
      return await SupabaseTaskService.getTasksByProject(userId, projectId);
    } catch (error) {
      console.error('Error fetching tasks by project:', error);
      return [];
    }
  },
  
  getTasksBySection: async (sectionId: string): Promise<Task[]> => {
    console.log('A tabela de seções foi removida. Redirecionando para getTasksByProject');
    
    // Se temos um sectionId, precisamos do projectId correspondente
    // Como não podemos fazer essa busca, vamos apenas retornar um array vazio
    // ou podemos obter o projectId de outro lugar se necessário
    console.log(`Não é mais possível buscar tarefas por sectionId: ${sectionId}`);
    return [];
  },
  
  getTaskById: async (taskId: string): Promise<Task | undefined> => {
    const task = await SupabaseTaskService.getTaskById(taskId);
    return task || undefined;
  },
  
  getTasksDueToday: async (): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    return SupabaseTaskService.getTasksDueToday(userId);
  },
  
  getTasksDueThisWeek: async (): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    return SupabaseTaskService.getTasksDueThisWeek(userId);
  },
  
  getIncompleteTasks: async (): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    return SupabaseTaskService.getIncompleteTasks(userId);
  },
  
  getCompletedTasks: async (): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    return SupabaseTaskService.getCompletedTasks(userId);
  },
  
  // Método para obter tarefas futuras em um período específico
  getUpcomingTasks: async (
    days: number = 30,
    startDate?: Date,
    endDate?: Date
  ): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    // Usar a implementação de SupabaseTaskService que já está otimizada
    return SupabaseTaskService.getUpcomingTasks(userId, days, startDate, endDate);
  },
  
  // Método para obter todas as tarefas recorrentes
  getRecurringTasks: async (): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    return SupabaseTaskService.getRecurringTasks(userId);
  },
  
  createTask: async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    try {
      const userId = await getUserId();
      console.log('ID do usuário para criar tarefa:', userId);
      
      if (!userId) {
        const errorMsg = 'Não foi possível criar a tarefa: usuário não autenticado';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Garantir que o userId esteja nos dados da tarefa
      const taskWithUserId = {
        ...taskData,
        userId
      };
      
      console.log('Enviando dados para createTask do SupabaseTaskService:', 
        JSON.stringify(taskWithUserId, null, 2));
      
      const result = await SupabaseTaskService.createTask(taskWithUserId);
      console.log('Tarefa criada com sucesso:', result);
      return result;
    } catch (error) {
      console.error('Erro detalhado ao criar tarefa em TaskService:', error);
      
      // Capturar e relançar o erro para manter a mensagem original
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Erro desconhecido ao criar tarefa');
      }
    }
  },
  
  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task | undefined> => {
    try {
      console.log(`Tentando atualizar tarefa ${taskId} com:`, JSON.stringify(updates, null, 2));
      
      // Verificar se o ID foi fornecido
      if (!taskId) {
        console.error('ID da tarefa não fornecido na atualização');
        throw new Error('ID da tarefa é obrigatório');
      }
      
      // Obter o userId atual para logs
      const userId = await getUserId();
      console.log(`Usuário atual: ${userId || 'não autenticado'}`);
      
      // Tentar atualizar a tarefa
      console.log('Chamando SupabaseTaskService.updateTask com os seguintes dados:',
        JSON.stringify({ taskId, updates }, null, 2));
      
      const updated = await SupabaseTaskService.updateTask(taskId, updates);
      
      if (!updated) {
        console.error('Falha ao atualizar tarefa - resposta nula do Supabase');
        throw new Error('Não foi possível atualizar a tarefa');
      }
      
      console.log('Tarefa atualizada com sucesso:', JSON.stringify(updated, null, 2));
      return updated;
    } catch (error) {
      console.error('Erro detalhado ao atualizar tarefa em TaskService:', 
        error instanceof Error ? error.stack : JSON.stringify(error, null, 2));
      
      // Manter a informação do erro original
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Erro ao atualizar tarefa: ${JSON.stringify(error, null, 2)}`);
      }
    }
  },
  
  deleteTask: async (taskId: string): Promise<void> => {
    await SupabaseTaskService.deleteTask(taskId);
  },
  
  completeTask: async (taskId: string): Promise<Task | undefined> => {
    const completed = await SupabaseTaskService.completeTask(taskId);
    return completed || undefined;
  },
  
  completeRecurringTask: async (taskId: string): Promise<Task | undefined> => {
    try {
      const completed = await SupabaseTaskService.completeRecurringTask(taskId);
      return completed || undefined;
    } catch (error) {
      console.error('Erro ao completar tarefa recorrente:', error);
      throw error;
    }
  },
  
  uncompleteTask: async (taskId: string): Promise<Task | undefined> => {
    const uncompleted = await SupabaseTaskService.uncompleteTask(taskId);
    return uncompleted || undefined;
  },

  getTasksByDateRange: async (
    startDate?: Date, 
    endDate?: Date, 
    days: number = 0
  ): Promise<Task[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    // Implementando a lógica diretamente aqui já que não existe na SupabaseTaskService
    const start = startDate || new Date();
    const end = endDate || new Date(start);
    if (!endDate && days > 0) {
      end.setDate(end.getDate() + days);
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .gte('due_date', start.toISOString())
      .lte('due_date', end.toISOString())
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching tasks by date range:', error);
      return [];
    }
    
    // Converter campos do Supabase para o formato Task
    return (data || []).map(task => ({
      ...task,
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      completed: task.completed,
      completedAt: task.completed_at || undefined,
      dueDate: task.due_date || undefined,
      projectId: task.project_id || undefined,
      recurrenceType: task.recurrence_type || undefined,
      recurrenceInterval: task.recurrence_interval || undefined,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    })) as Task[];
  },

  getAllProjects: async (): Promise<Project[]> => {
    try {
      console.log('Buscando todos os projetos do usuário atual...');
      const userId = await getUserId();
      
      if (!userId) {
        console.warn('getAllProjects: Usuário não autenticado. Retornando array vazio.');
        return [];
      }
      
      console.log(`getAllProjects: Usuário ${userId} autenticado, buscando projetos...`);
      
      // Tentar obter a sessão para usar cliente autenticado se possível
      const session = await getUserSession();
      const client = await getSupabaseClient();
      console.log('getAllProjects: Usando cliente', client === supabase ? 'anônimo' : 'autenticado');
      
      // Tentar com SupabaseProjectService
      try {
        console.log('getAllProjects: Chamando SupabaseProjectService.getAllProjects...');
        const projects = await SupabaseProjectService.getAllProjects(userId);
        console.log(`getAllProjects: Sucesso! ${projects.length} projetos encontrados.`);
        return projects;
      } catch (error) {
        console.error('getAllProjects: Erro ao buscar projetos via SupabaseProjectService:', error);
        
        // Se tiver cliente autenticado, tentar diretamente
        if (client !== supabase) {
          console.log('getAllProjects: Tentando método alternativo com cliente autenticado');
          try {
            const { data, error: queryError } = await client
              .from('projects')
              .select('*')
              .eq('user_id', userId)
              .order('name', { ascending: true });
              
            if (queryError) throw queryError;
            
            if (!data || data.length === 0) {
              console.log('getAllProjects (alt): Nenhum projeto encontrado');
              return [];
            }
            
            console.log(`getAllProjects (alt): ${data.length} projetos encontrados`);
            
            // Os projetos ainda precisam de seções
            // Mas retornamos sem seções em caso de falha no método principal
            return data.map(project => ({
              ...project,
              sections: []
            }));
          } catch (altError) {
            console.error('getAllProjects: Erro no método alternativo:', altError);
            throw altError;
          }
        }
        
        // Se nenhuma alternativa funcionar, propagar o erro original
        throw error;
      }
    } catch (error) {
      console.error('getAllProjects: Erro não tratado:', error);
      // Em último caso, retornar array vazio para não quebrar a UI
      return [];
    }
  },
};

// Obtém um cliente Supabase autenticado
export const getSupabaseClient = async () => {
  try {
    const session = await getUserSession();
    return createSupabaseClient(session);
  } catch (error) {
    console.error('Erro ao obter cliente Supabase autenticado:', error);
    return supabase; // Fallback para o cliente anônimo
  }
};

// Project operations
export const ProjectService = {
  getAllProjects: async (): Promise<Project[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    return SupabaseProjectService.getAllProjects(userId);
  },

  getProjectById: async (projectId: string): Promise<Project | undefined> => {
    const project = await SupabaseProjectService.getProjectById(projectId);
    return project || undefined;
  },

  createProject: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'sections'>): Promise<Project> => {
    const userId = await getUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    
    // Obter a sessão completa para acessar o token do Supabase
    const session = await getUserSession();
    
    // Obter um cliente autenticado para superar RLS
    const client = await getSupabaseClient();
    console.log('Criando projeto com cliente:', client === supabase ? 'anônimo' : 'autenticado');
    
    type ProjectWithUserId = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'sections'> & { userId: string };
    
    const projectWithUserId: ProjectWithUserId = {
      ...project,
      userId
    };
    
    // Tentativa direta com SupabaseProjectService, passando a sessão se disponível
    try {
      // Só passa a sessão se ela não for null
      return await SupabaseProjectService.createProject(projectWithUserId, session || undefined);
    } catch (error) {
      console.error('Erro na primeira tentativa de criar projeto:', error);
      
      // Tentativa alternativa direto com cliente autenticado
      if (client !== supabase) {
        try {
          console.log('Tentando método alternativo com cliente autenticado');
          
          const newProject = {
            id: crypto.randomUUID(),
            name: project.name,
            color: project.color,
            user_id: userId
          };
          
          const { data, error } = await client
            .from('projects')
            .insert([newProject])
            .select()
            .single();
            
          if (error) throw error;
          if (!data) throw new Error('Nenhum dado retornado');
          
          return { ...data, sections: [] };
        } catch (altError) {
          console.error('Erro na tentativa alternativa:', altError);
          throw new Error(`Falha ao criar projeto: ${altError instanceof Error ? altError.message : 'Erro desconhecido'}`);
        }
      }
      
      // Se chegou aqui, repassar o erro original
      throw error;
    }
  },

  updateProject: async (projectId: string, updates: Partial<Project>): Promise<Project | undefined> => {
    const updated = await SupabaseProjectService.updateProject(projectId, updates);
    return updated || undefined;
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await SupabaseProjectService.deleteProject(projectId);
  }
};

// Section operations - redirecionando para SupabaseSectionService
export const SectionService = {
  // Implementação local para getAllSections já que não existe em SupabaseSectionService
  getAllSections: async (): Promise<Section[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    // Primeiro, buscar todos os projetos do usuário
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId);
    
    if (projectsError || !projects) {
      console.error('Error fetching projects for sections:', projectsError);
      return [];
    }
    
    // Obter os IDs dos projetos
    const projectIds = projects.map(p => p.id);
    
    // Buscar todas as seções para esses projetos
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .in('project_id', projectIds);
    
    if (error) {
      console.error('Error fetching all sections:', error);
      return [];
    }
    
    return (data || []).map(section => ({
      id: section.id,
      name: section.name,
      projectId: section.project_id,
      createdAt: section.created_at,
      updatedAt: section.updated_at
    }));
  },

  getSectionsByProject: async (projectId: string): Promise<Section[]> => {
    // Usar o método existente, mas adaptar o nome
    return SupabaseSectionService.getSectionsByProjectId(projectId);
  },

  getSectionById: async (sectionId: string): Promise<Section | undefined> => {
    // Implementar diretamente já que não existe no SupabaseSectionService
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching section by ID:', error);
      return undefined;
    }
    
    return {
      id: data.id,
      name: data.name,
      projectId: data.project_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  createSection: async (section: Omit<Section, 'id' | 'createdAt' | 'updatedAt'>): Promise<Section> => {
    return SupabaseSectionService.createSection(section);
  },

  updateSection: async (sectionId: string, updates: Partial<Section>): Promise<Section | undefined> => {
    const updated = await SupabaseSectionService.updateSection(sectionId, updates);
    return updated || undefined;
  },

  deleteSection: async (sectionId: string): Promise<void> => {
    await SupabaseSectionService.deleteSection(sectionId);
  }
};

// Exportações já estão definidas corretamente acima com "export const" 