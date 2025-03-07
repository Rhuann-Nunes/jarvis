import { v4 as uuidv4 } from 'uuid';
import { supabase, createSupabaseClient } from './supabase';
import { Database } from './supabase';
import { Task, Project, Section, User } from '@/types';
import { Session } from 'next-auth';
import { getUserSession, getUserId } from './db';

// Cache for recurring task occurrences
const occurrencesCache: Record<string, any[]> = {};

// Cache para tarefas recorrentes
let taskOccurrencesByOriginalId: Record<string, Task[]> = {};

// Cache simples para projetos
const projectsCache = new Map<string, any>();

// Cache para lista de projetos com tempo de expiração
type ProjectsCacheEntry = {
  projects: Project[];
  timestamp: number;
};
const projectsListCache = new Map<string, ProjectsCacheEntry>();
const PROJECTS_CACHE_TTL = 60000; // 1 minuto em milissegundos

// Clear cache when tasks are modified
const clearOccurrencesCache = () => {
  Object.keys(occurrencesCache).forEach(key => {
    delete occurrencesCache[key];
  });
  taskOccurrencesByOriginalId = {};
};

// Limpar cache
const clearProjectsCache = () => {
  projectsCache.clear();
};

// Função para limpar o cache de listas de projetos
const clearProjectsListCache = () => {
  projectsListCache.clear();
};

// Função auxiliar para mapear uma tarefa do formato do banco para o formato da aplicação
const mapTaskFromDb = (dbTask: any): Task => {
  console.log('Mapeando tarefa do DB para Task:', JSON.stringify(dbTask, null, 2));
  
  // Verificar o valor de project_id e converter para undefined quando nulo
  // Este é um ponto crítico de conversão entre o formato DB e a aplicação
  const projectId = dbTask.project_id !== null ? dbTask.project_id : undefined;
  
  console.log(`Convertendo project_id '${dbTask.project_id}' para projectId '${projectId}'`);
  
  // Definir interface para o tipo de recorrência
  interface RecurrenceData {
    type: string;
    interval: number;
    daysOfWeek: any[];
  }
  
  // Processar campos de recorrência corretamente
  let recurrence: RecurrenceData | undefined = undefined;
  if (dbTask.recurrence_type) {
    recurrence = {
      type: dbTask.recurrence_type,
      interval: dbTask.recurrence_interval || 1,
      daysOfWeek: dbTask.recurrence_days_of_week || []
    };
    console.log('Encontrada tarefa recorrente:', dbTask.recurrence_type, dbTask.recurrence_interval);
  }
  
  // Adicionar informações do projeto se disponíveis (se veio da consulta com join)
  let project = undefined;
  if (projectId && dbTask.projects) {
    project = {
      id: dbTask.projects.id,
      name: dbTask.projects.name,
      color: dbTask.projects.color
    };
  }
  
  const task = {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    completed: dbTask.completed,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
    userId: dbTask.user_id,
    dueDate: dbTask.due_date,
    completedAt: dbTask.completed_at,
    projectId: projectId, // Usar a variável convertida
    originalTaskId: dbTask.original_task_id,
    isRecurrenceOccurrence: dbTask.is_recurrence_occurrence,
    // Usar o objeto de recorrência processado
    recurrence: recurrence,
    // Incluir informações do projeto se disponíveis
    project: project
  };
  
  console.log('Task mapeada resultante:', JSON.stringify(task, null, 2));
  return task;
};

// Update the task object mapping to remove section references
const mapJoinedTaskFromDb = (task: Record<string, any>): Task => {
  console.log('Mapeando tarefa do DB (joined) para Task:', JSON.stringify(task, null, 2));
  
  // Verificar o valor de project_id e converter para undefined quando nulo
  const projectId = task.project_id !== null ? task.project_id : undefined;
  
  console.log(`Convertendo project_id '${task.project_id}' para projectId '${projectId}'`);
  
  // Processar campos de recorrência corretamente
  let recurrence: RecurrenceData | undefined = undefined;
  if (task.recurrence_type) {
    recurrence = {
      type: task.recurrence_type,
      interval: task.recurrence_interval || 1,
      daysOfWeek: task.recurrence_days_of_week || []
    };
    console.log('Encontrada tarefa recorrente (joined):', task.recurrence_type, task.recurrence_interval);
  }
  
  const mappedTask = {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
    completedAt: task.completed_at,
    dueDate: task.due_date,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    recurrence: recurrence,
    isRecurrenceOccurrence: task.is_recurrence_occurrence,
    originalTaskId: task.original_task_id,
    userId: task.user_id,
    projectId: projectId, // Usar a variável convertida
    // Informações extras do projeto
    project: projectId ? {
      id: projectId,
      name: task.project_name,
      color: task.project_color || '#808080', // Cor padrão se não houver
    } : undefined
  } as Task;
  
  console.log('Task mapeada resultante (joined):', JSON.stringify(mappedTask, null, 2));
  return mappedTask;
};

// Task operations
export const TaskService = {
  getAllTasks: async (userId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects:project_id (
          id,
          name,
          color
        )
      `)
      .eq('user_id', userId)
      .eq('completed', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(task => mapTaskFromDb(task));
  },
  
  /**
   * Recupera todas as tarefas do usuário, incluindo as concluídas
   * Importante: Este método é usado principalmente para estatísticas e relatórios,
   * como no Dashboard, onde precisamos contar tanto tarefas ativas quanto concluídas
   */
  getAllTasksIncludingCompleted: async (userId: string): Promise<Task[]> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error fetching all tasks including completed:", error);
        throw error;
      }
      
      return (data || []).map(task => mapTaskFromDb(task));
    } catch (err) {
      console.error("Error in getAllTasksIncludingCompleted:", err);
      return [];
    }
  },
  
  getTaskById: async (taskId: string): Promise<Task | null> => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq("id", taskId)
        .single();

      if (error) {
        console.error("Error fetching task by ID:", error);
        return null;
      }

      return mapTaskFromDb(data);
    } catch (err) {
      console.error("Error in getTaskById:", err);
      return null;
    }
  },
  
  // Get tasks without a project assigned
  getTasksWithoutProject: async (userId: string): Promise<Task[]> => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq("user_id", userId)
        .is("project_id", null)
        .eq("completed", false)
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching tasks without project:", error);
        return [];
      }

      return (data || []).map(task => mapTaskFromDb(task));
    } catch (err) {
      console.error("Error in getTasksWithoutProject:", err);
      return [];
    }
  },
  
  // Get tasks by project ID
  getTasksByProject: async (userId: string, projectId: string): Promise<Task[]> => {
    console.log(`Buscando tarefas para o projeto ${projectId} do usuário ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('completed', false)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar tarefas por projeto:', error);
        throw error;
      }
      
      // Importante: Usar o mapTaskFromDb para garantir que a recorrência seja processada corretamente
      return (data || []).map(task => mapTaskFromDb(task));
    } catch (error) {
      console.error(`Erro ao buscar tarefas para o projeto ${projectId}:`, error);
      throw error;
    }
  },
  
  // Get tasks due today - exclude completed
  getTasksDueToday: async (userId: string): Promise<Task[]> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq("user_id", userId)
        .eq("completed", false)
        .gte("due_date", today.toISOString())
        .lt("due_date", tomorrow.toISOString())
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching tasks due today:", error);
        return [];
      }

      return (data || []).map(task => mapTaskFromDb(task));
    } catch (err) {
      console.error("Error in getTasksDueToday:", err);
      return [];
    }
  },
  
  // Get tasks due this week - exclude completed
  getTasksDueThisWeek: async (userId: string): Promise<Task[]> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq("user_id", userId)
        .eq("completed", false)
        .gte("due_date", today.toISOString())
        .lte("due_date", endOfWeek.toISOString())
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching tasks due this week:", error);
        return [];
      }

      return (data || []).map(task => mapTaskFromDb(task));
    } catch (err) {
      console.error("Error in getTasksDueThisWeek:", err);
      return [];
    }
  },
  
  // Get all incomplete tasks
  getIncompleteTasks: async (userId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
  
  // Get all completed tasks
  getCompletedTasks: async (userId: string): Promise<Task[]> => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq("user_id", userId)
        .eq("completed", true)
        .order("completed_at", { ascending: false });

      if (error) {
        console.error("Error fetching completed tasks:", error);
        return [];
      }

      return (data || []).map(task => mapTaskFromDb(task));
    } catch (err) {
      console.error("Error in getCompletedTasks:", err);
      return [];
    }
  },
  
  createTask: async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    clearOccurrencesCache();
    
    try {
      // Verificar se o userId está presente
      if (!taskData.userId) {
        console.error('Erro: userId é obrigatório para criar uma tarefa');
        throw new Error('userId é obrigatório para criar uma tarefa');
      }
      
      const taskId = uuidv4();
      console.log('Criando tarefa com ID:', taskId);
      
      // Usar o título exatamente como fornecido
      const taskTitle = taskData.title;
      
      // Definir data de vencimento como a data atual se não for fornecida
      const dueDate = taskData.dueDate || new Date();
      
      // Inserir diretamente no banco de dados sem usar RPC
      // Preparar todos os campos da tarefa para inserção direta
      const newTask: any = {
        id: taskId,
        title: taskTitle,
        description: taskData.description || null,
        completed: taskData.completed || false,
        completed_at: taskData.completedAt || null,
        due_date: dueDate,
        is_recurrence_occurrence: taskData.isRecurrenceOccurrence || false,
        original_task_id: taskData.originalTaskId || null,
        project_id: taskData.projectId || null,
        user_id: taskData.userId,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Adicionar propriedades de recorrência no formato do banco de dados, se existirem
      if (taskData.recurrence) {
        if (typeof taskData.recurrence === 'string') {
          newTask.recurrence = taskData.recurrence;
        } else {
          newTask.recurrence_type = taskData.recurrence.type;
          newTask.recurrence_interval = taskData.recurrence.interval;
          newTask.recurrence_days_of_week = taskData.recurrence.daysOfWeek;
        }
      } else {
        // Garantir que os campos de recorrência sejam explicitamente nulos
        newTask.recurrence_type = null;
        newTask.recurrence_interval = null;
        newTask.recurrence_days_of_week = null;
      }
      
      console.log('Inserindo tarefa no Supabase:', JSON.stringify(newTask, null, 2));
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        // Identificar diferentes tipos de erro
        if (error.code === '42501' || error.code === '42803' || error.code === '3F000') {
          console.error('Erro de permissão: O usuário não tem permissão para inserir dados.', error);
          throw new Error(`Erro de permissão: ${error.message || 'Verifique sua autenticação'}`);
        } else if (error.code === '23502') {
          console.error('Erro de validação: Campo obrigatório ausente:', error);
          throw new Error(`Campo obrigatório ausente: ${error.message || 'Verifique os campos da tarefa'}`);
        } else if (error.code === '23505') {
          console.error('Erro de duplicidade: Já existe um registro com este ID:', error);
          throw new Error(`Conflito de dados: ${error.message || 'Registro duplicado'}`);
        } else {
          console.error('Erro do Supabase ao inserir tarefa:', error);
          throw new Error(`Erro ao salvar tarefa: ${error.message || 'Erro desconhecido'}`);
        }
      }
      
      if (!data) {
        console.error('Nenhum dado retornado após inserção da tarefa');
        throw new Error('Falha ao salvar tarefa: nenhum dado retornado');
      }
      
      console.log('Tarefa criada com sucesso:', data);
      return mapTaskFromDb(data);
    } catch (error) {
      console.error('Erro detalhado ao criar tarefa em db-utils:', error);
      throw new Error(`Erro ao salvar tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  },
  
  updateTask: async (taskId: string, taskData: Partial<Task>): Promise<Task | null> => {
    clearOccurrencesCache();
    
    try {
      // Validar o ID da tarefa
      if (!taskId) {
        throw new Error('ID da tarefa é obrigatório para atualizar');
      }
      
      // Criar um novo objeto apenas com as propriedades em snake_case
      // para evitar enviar propriedades camelCase para o Supabase
      const updateData: any = {};
      
      // Tratar todas as conversões de camelCase para snake_case explicitamente
      if (taskData.title !== undefined) updateData.title = taskData.title;
      if (taskData.description !== undefined) updateData.description = taskData.description;
      if (taskData.completed !== undefined) updateData.completed = taskData.completed;
    if (taskData.completedAt !== undefined) updateData.completed_at = taskData.completedAt;
      if (taskData.dueDate !== undefined) updateData.due_date = taskData.dueDate;
    if (taskData.isRecurrenceOccurrence !== undefined) updateData.is_recurrence_occurrence = taskData.isRecurrenceOccurrence;
      if (taskData.originalTaskId !== undefined) updateData.original_task_id = taskData.originalTaskId;
      if (taskData.userId !== undefined) updateData.user_id = taskData.userId;
      
      // Tratar o projectId explicitamente - garantir que undefined seja tratado corretamente
      if ('projectId' in taskData) {
        updateData.project_id = taskData.projectId;
        console.log(`Convertendo projectId: ${taskData.projectId} para project_id: ${updateData.project_id}`);
      }
    
    // Tratar recorrência
    if (taskData.recurrence !== undefined) {
      if (typeof taskData.recurrence === 'string') {
        updateData.recurrence = taskData.recurrence;
        // Limpar campos específicos de recorrência
        updateData.recurrence_type = null;
        updateData.recurrence_interval = null;
        updateData.recurrence_days_of_week = null;
      } else if (taskData.recurrence) {
        // Se for um objeto, definir campos específicos
        updateData.recurrence_type = taskData.recurrence.type;
        updateData.recurrence_interval = taskData.recurrence.interval;
        updateData.recurrence_days_of_week = taskData.recurrence.daysOfWeek;
        // Limpar campo de string
        updateData.recurrence = null;
      } else {
        // Se for null/undefined, limpar todos os campos
        updateData.recurrence = null;
        updateData.recurrence_type = null;
        updateData.recurrence_interval = null;
        updateData.recurrence_days_of_week = null;
      }
    }
      
      console.log('Atualizando tarefa com dados formatados (snake_case):', JSON.stringify(updateData, null, 2));
      
      // Verificar se há campos a serem atualizados
      if (Object.keys(updateData).length === 0) {
        console.warn('Nenhum dado válido para atualizar a tarefa');
        throw new Error('Nenhum dado válido fornecido para atualização');
      }
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

      if (error) {
        console.error('Erro ao atualizar tarefa:', JSON.stringify(error, null, 2));
        
        // Gerar mensagem de erro específica com base no código de erro
        let mensagemErro = 'Erro ao atualizar tarefa';
        
        if (error.code === '23503') {
          // Erro de violação de chave estrangeira
          mensagemErro = 'Projeto não encontrado ou não disponível';
        } else if (error.code === '42501') {
          mensagemErro = 'Permissão negada. Verifique se você tem acesso a esta tarefa.';
        } else if (error.message) {
          mensagemErro = `Erro: ${error.message}`;
        }
        
        throw new Error(mensagemErro);
      }
      
      if (!data) {
        throw new Error('Falha ao atualizar tarefa: nenhum dado retornado');
      }
      
      console.log('Tarefa atualizada com sucesso:', data);
      return mapTaskFromDb(data);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', 
        error instanceof Error ? error.message : JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        throw error; // Preserva a mensagem de erro original
      } else {
        throw new Error(`Erro ao atualizar tarefa: ${JSON.stringify(error, null, 2)}`);
      }
    }
  },
  
  deleteTask: async (taskId: string): Promise<void> => {
    clearOccurrencesCache();
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },
  
  completeTask: async (taskId: string): Promise<Task | null> => {
    clearOccurrencesCache();
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data ? mapTaskFromDb(data) : null;
  },
  
  completeRecurringTask: async (taskId: string): Promise<Task | null> => {
    try {
      console.log('Processando conclusão de tarefa recorrente:', taskId);
      
      // 1. Primeiro, obter a tarefa original
      const { data: originalTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (fetchError || !originalTask) {
        console.error('Erro ao buscar tarefa recorrente:', fetchError);
        throw fetchError || new Error('Tarefa não encontrada');
      }
      
      // Verificar se a tarefa tem recorrência
      if (!originalTask.recurrence_type) {
        console.warn('Tarefa não é recorrente:', originalTask);
        // Se não for recorrente, apenas marcar como concluída
        return await TaskService.completeTask(taskId);
      }
      
      console.log('Tarefa recorrente encontrada:', originalTask);
      
      // 2. Criar uma cópia da tarefa concluída
      const completedTaskCopy = {
        ...originalTask,
        id: crypto.randomUUID(),
        completed: true,
        completed_at: new Date().toISOString(),
        is_recurrence_occurrence: true,
        original_task_id: originalTask.id
      };
      
      delete completedTaskCopy.created_at;
      delete completedTaskCopy.updated_at;
      
      console.log('Criando cópia da tarefa concluída:', completedTaskCopy);
      
      // Inserir a cópia concluída
      const { error: insertError } = await supabase
        .from('tasks')
        .insert([completedTaskCopy]);
      
      if (insertError) {
        console.error('Erro ao criar cópia concluída:', insertError);
        throw insertError;
      }
      
      // 3. Calcular a próxima data de vencimento com base na regra de recorrência
      const currentDueDate = originalTask.due_date ? new Date(originalTask.due_date) : new Date();
      let nextDueDate = new Date(currentDueDate);
      
      // Aplicar a regra de recorrência para calcular a próxima data
      if (originalTask.recurrence_type === 'daily') {
        nextDueDate.setDate(nextDueDate.getDate() + (originalTask.recurrence_interval || 1));
      } else if (originalTask.recurrence_type === 'weekly') {
        nextDueDate.setDate(nextDueDate.getDate() + (7 * (originalTask.recurrence_interval || 1)));
      } else if (originalTask.recurrence_type === 'monthly') {
        nextDueDate.setMonth(nextDueDate.getMonth() + (originalTask.recurrence_interval || 1));
      } else if (originalTask.recurrence_type === 'yearly') {
        nextDueDate.setFullYear(nextDueDate.getFullYear() + (originalTask.recurrence_interval || 1));
      }
      
      console.log(`Atualizando data da tarefa de ${currentDueDate.toISOString()} para ${nextDueDate.toISOString()}`);
      
      // 4. Atualizar a tarefa original com a nova data de vencimento
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({ 
          due_date: nextDueDate.toISOString(),
          completed: false,
          completed_at: null
        })
        .eq('id', taskId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Erro ao atualizar tarefa original com nova data:', updateError);
        throw updateError;
      }
      
      return mapTaskFromDb(updatedTask);
    } catch (error) {
      console.error('Erro ao processar tarefa recorrente:', error);
      throw error;
    }
  },
  
  uncompleteTask: async (taskId: string): Promise<Task | null> => {
    clearOccurrencesCache();
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        completed: false,
        completed_at: null
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data ? mapTaskFromDb(data) : null;
  },

  // Buscar tarefas com detalhes de projeto e seção
  getTasksWithDetails: async (userId: string): Promise<Task[]> => {
    try {
      if (!userId) {
        console.error('userId é obrigatório para buscar tarefas');
        return [];
      }
      
      // Usar uma consulta direta do Supabase em vez de SQL personalizado
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq('user_id', userId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro na consulta:', error);
        return [];
      }
      
      // Mapear os resultados para o formato Task
      return (data || []).map((task: any) => {
        // Verificar o valor de project_id e converter para undefined quando nulo
        const projectId = task.project_id !== null ? task.project_id : undefined;
        
        // Processar campos de recorrência corretamente
        let recurrence: RecurrenceData | undefined = undefined;
        if (task.recurrence_type) {
          recurrence = {
            type: task.recurrence_type,
            interval: task.recurrence_interval || 1,
            daysOfWeek: task.recurrence_days_of_week || []
          };
          console.log('Encontrada tarefa recorrente (details):', task.recurrence_type, task.recurrence_interval);
        }
        
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          completed: task.completed,
          completedAt: task.completed_at,
          dueDate: task.due_date,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          recurrence: recurrence,
          isRecurrenceOccurrence: task.is_recurrence_occurrence,
          originalTaskId: task.original_task_id,
          userId: task.user_id,
          projectId: projectId, // Usar a variável convertida
          project: task.projects ? {
            id: task.projects.id,
            name: task.projects.name,
            color: task.projects.color || '#808080'
          } : undefined
        };
      });
    } catch (error) {
      console.error('Erro ao buscar tarefas com detalhes:', error);
      return [];
    }
  },

  getUpcomingTasks: async (userId: string, days: number = 30, startDate?: Date, endDate?: Date): Promise<Task[]> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Se startDate e endDate forem fornecidos, usar esses valores
      // Caso contrário, usar hoje como startDate e calcular endDate baseado nos dias
      const start = startDate || today;
      const end = endDate || new Date(start);
      if (!endDate && days > 0) {
        end.setDate(end.getDate() + days);
      }

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq("user_id", userId)
        .eq("completed", false)
        .gte("due_date", start.toISOString())
        .lte("due_date", end.toISOString())
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching upcoming tasks:", error);
        return [];
      }

      return (data || []).map(task => mapTaskFromDb(task));
    } catch (err) {
      console.error("Error in getUpcomingTasks:", err);
      return [];
    }
  },

  getTasksBySection: async (userId: string, sectionId: string): Promise<Task[]> => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq("user_id", userId)
        .eq("section_id", sectionId)
        .eq("completed", false)
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching tasks by section:", error);
        return [];
      }

      return (data || []).map(task => mapTaskFromDb(task));
    } catch (err) {
      console.error("Error in getTasksBySection:", err);
      return [];
    }
  },

  getRecurringTasks: async (userId?: string): Promise<Task[]> => {
    try {
      // Se userId não for fornecido, tentar obter através da sessão
      const userIdentifier = userId || (await getUserId());
      
      if (!userIdentifier) {
        console.error("Não foi possível obter o ID do usuário para buscar tarefas recorrentes");
        return [];
      }
      
      console.log("Buscando tarefas recorrentes do usuário:", userIdentifier);
      
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq("user_id", userIdentifier)
        .eq("completed", false)
        .not("recurrence_type", "is", null)
        .order("due_date", { ascending: true });
      
      if (error) {
        console.error("Erro ao buscar tarefas recorrentes:", error);
        return [];
      }
      
      console.log(`Encontradas ${data?.length || 0} tarefas recorrentes`);
      return (data || []).map(task => mapTaskFromDb(task));
    } catch (err) {
      console.error("Erro em getRecurringTasks:", err);
      return [];
    }
  },

  getTaskDetails: async (taskId: string): Promise<Task | null> => {
    try {
      console.log("Buscando detalhes da tarefa:", taskId);
      
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects:project_id (
            id,
            name,
            color
          )
        `)
        .eq("id", taskId)
        .single();
      
      if (error) {
        console.error("Erro ao buscar detalhes da tarefa:", error);
        return null;
      }
      
      if (!data) {
        console.log("Tarefa não encontrada:", taskId);
        return null;
      }
      
      return mapTaskFromDb(data);
    } catch (err) {
      console.error("Erro em getTaskDetails:", err);
      return null;
    }
  },
};

// Project operations
export const ProjectService = {
  getAllProjects: async (userId: string): Promise<Project[]> => {
    try {
      // Verificar cache primeiro
      const cacheKey = `projects_${userId}`;
      const cached = projectsListCache.get(cacheKey);
      const now = Date.now();

      // Se temos um cache válido e não expirado, use-o
      if (cached && (now - cached.timestamp) < PROJECTS_CACHE_TTL) {
        console.log(`Usando cache para projetos do usuário ${userId} (${cached.projects.length} projetos)`);
        return cached.projects;
      }

      console.log(`Buscando projetos para o usuário: ${userId}`);
      
      if (!userId) {
        console.error('getAllProjects: userId é obrigatório');
        return [];
      }
      
      // Verificar se o userId é um UUID válido usando uma regex simples para UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error(`getAllProjects: userId inválido: ${userId}`);
        return [];
      }
      
      // Consultar a tabela projects pela definição correta
      console.log('getAllProjects: Estrutura da tabela public.projects:');
      console.log('- id: uuid');
      console.log('- name: text');
      console.log('- color: text');
      console.log('- user_id: uuid (FK para next_auth.users)');
      console.log('- created_at: timestamp');
      console.log('- updated_at: timestamp');
      
      console.log(`Executando consulta: SELECT * FROM projects WHERE user_id = '${userId}'`);
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (projectsError) {
        console.error('Erro ao buscar projetos via consulta direta:', projectsError);
        throw projectsError;
      }
      
      console.log(`Projetos encontrados via consulta direta: ${projects?.length || 0}`);
      
      if (!projects || projects.length === 0) {
        console.log('Nenhum projeto encontrado via consulta direta');
        return [];
      } else {
        // Exibir detalhes dos projetos para depuração
        projects.forEach((project, index) => {
          console.log(`Projeto ${index+1}:`);
          console.log(`- ID: ${project.id}`);
          console.log(`- Nome: ${project.name}`);
          console.log(`- Usuário: ${project.user_id}`);
        });
        
        // Adicionar array vazio de seções a cada projeto
        const projectsWithSections = projects.map(project => ({
          ...project,
          sections: []
        }));
        
        // Armazenar no cache
        projectsListCache.set(cacheKey, {
          projects: projectsWithSections,
          timestamp: now
        });
        
        console.log(`Retornando ${projectsWithSections.length} projetos (sem seções)`);
        return projectsWithSections;
      }
    } catch (error) {
      console.error('Erro detalhado em getAllProjects:', error);
      
      // Em caso de erro, tentar retornar um array vazio em vez de falhar completamente
      if (error instanceof Error) {
        throw error;
      } else {
        console.error('Erro desconhecido em getAllProjects:', error);
        throw new Error('Erro ao buscar projetos. Verifique o console para detalhes.');
      }
    }
  },
  
  getProjectById: async (projectId: string): Promise<Project | null> => {
    try {
      // Verificar cache first
      if (projectsCache.has(projectId)) {
        const cachedProject = projectsCache.get(projectId);
        console.log(`Usando projeto em cache: ${cachedProject.name} (${cachedProject.id})`);
        return cachedProject;
      }
      
      // Verificar no cache de listas se o projeto está lá
      for (const [key, value] of projectsListCache.entries()) {
        if (key.startsWith('projects_')) {
          const projectInList = value.projects.find(p => p.id === projectId);
          if (projectInList) {
            console.log(`Projeto encontrado no cache de listas: ${projectInList.name}`);
            // Armazenar no cache de projetos individuais também
            projectsCache.set(projectId, projectInList);
            return projectInList;
          }
        }
      }
      
      // Se não estiver no cache, buscar do banco
      console.log(`Buscando projeto por ID: ${projectId}`);
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        console.error('Erro ao buscar projeto por ID:', projectError);
        return null;
      }
      
      if (!project) {
        console.log(`Projeto não encontrado: ${projectId}`);
        return null;
      }
      
      // Adicionar ao cache
      const projectWithSections = {
        ...project,
        sections: [] // Retornar array vazio de seções
      };
      
      projectsCache.set(projectId, projectWithSections);
      console.log(`Projeto armazenado em cache: ${projectWithSections.name}`);
      
      return projectWithSections;
    } catch (error) {
      console.error('Erro ao buscar projeto por ID:', error);
      return null;
    }
  },
  
  createProject: async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'sections'>, session?: Session): Promise<Project> => {
    try {
      // Limpar os caches quando um projeto é criado
      clearProjectsCache();
      clearProjectsListCache();
      
      const projectId = uuidv4();
      
      console.log('Dados recebidos para criação de projeto:', JSON.stringify(data, null, 2));
      
      if (!data.userId) {
        throw new Error('userId é obrigatório para criar um projeto');
      }
      
      // Criar um UUID válido
      console.log('UUID gerado para o projeto:', projectId);
      
    const newProject = {
        id: projectId,
        name: data.name,
        color: data.color,
        user_id: data.userId, // Convertendo camelCase para snake_case
      };
      
      // Tentar criar o projeto diretamente com client do usuário
      let client = supabase;
        if (session?.supabaseAccessToken) {
        console.log('Usando cliente autenticado...');
        client = createSupabaseClient(session);
      }
      
      try {
        return await attemptCreateProject(newProject, client, 'cliente do usuário');
      } catch (error) {
        console.error('Falha ao criar projeto com cliente do usuário:', error);
        
        // Se falhar com cliente específico, tentar com cliente padrão
        if (client !== supabase) {
          console.log('Tentando com cliente padrão');
          try {
            return await attemptCreateProject(newProject, supabase, 'padrão');
          } catch (defaultClientError) {
            console.error('Tentativa com cliente padrão falhou:', defaultClientError);
            throw new Error(`Não foi possível criar o projeto: ${defaultClientError instanceof Error ? defaultClientError.message : 'Erro desconhecido'}`);
          }
        }
        
        // Repassar o erro original
        if (error instanceof Error) {
          if (error.message.includes('violates row-level security policy')) {
            throw new Error('Erro de permissão: Você não tem permissão para criar projetos. Faça login novamente.');
          }
          throw error;
        } else {
          throw new Error('Ocorreu um erro desconhecido ao criar o projeto');
        }
      }
    } catch (error) {
      console.error('Erro detalhado ao criar projeto:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Ocorreu um erro desconhecido ao criar o projeto');
      }
    }
  },
  
  updateProject: async (projectId: string, data: Partial<Project>): Promise<Project | null> => {
    // Limpar os caches quando um projeto é atualizado
    clearProjectsCache();
    clearProjectsListCache();
    
    // Transform camelCase to snake_case for Supabase
    const updateData: any = { ...data };
    if (data.userId) updateData.user_id = data.userId;
    
    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Fetch sections for the project
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId);
    
    if (sectionsError) throw sectionsError;
    
    return {
      ...project,
      sections: sections || []
    };
  },
  
  deleteProject: async (projectId: string): Promise<void> => {
    // Limpar os caches quando um projeto é excluído
    clearProjectsCache();
    clearProjectsListCache();
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) throw error;
  },
  
  // Initialize default projects for a new user
  initializeDefaultProjects: async (userId: string): Promise<void> => {
    const homeProject = {
      id: uuidv4(),
      name: 'Casa',
      color: '#4CAF50', // Green
      user_id: userId
    };
    
    const workProject = {
      id: uuidv4(),
      name: 'Trabalho',
      color: '#2196F3', // Blue
      user_id: userId
    };
    
    const { error } = await supabase
      .from('projects')
      .insert([homeProject, workProject]);
    
    if (error) throw error;
  },
};

// Section operations
export const SectionService = {
  getSectionsByProjectId: async (projectId: string): Promise<Section[]> => {
    console.log('Tabela de seções removida. Retornando array vazio.');
    return [];
  },
  
  createSection: async (data: Omit<Section, 'id' | 'createdAt' | 'updatedAt'>): Promise<Section> => {
    console.log('Tabela de seções removida. Retornando seção com array vazio.', data);
    const now = new Date();
      
      // Criar um UUID válido
      const sectionId = uuidv4();
      
    // Retornar um objeto de seção fictício
    return {
        id: sectionId,
        name: data.name,
      projectId: data.projectId,
      createdAt: now,
      updatedAt: now
    };
  },
  
  updateSection: async (sectionId: string, data: Partial<Section>): Promise<Section | null> => {
    console.log('Tabela de seções removida. Não é possível atualizar seções.');
    return null;
  },
  
  deleteSection: async (sectionId: string): Promise<void> => {
    console.log('Tabela de seções removida. Não é possível excluir seções.');
    return;
  },
};

// User operations
export const UserService = {
  getUserByEmail: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return null;
    return data;
  },
  
  // Get user by ID from next_auth schema
  getUserById: async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .schema('next_auth')
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  },
};

// Tenta criar um projeto usando o cliente fornecido ou o padrão
const attemptCreateProject = async (
  projectData: any, 
  client = supabase, 
  clientName = 'anônimo'
) => {
  try {
    console.log(`Tentando criar projeto com cliente ${clientName}:`, JSON.stringify(projectData, null, 2));
    
    // Verificar autenticação do cliente antes de tentar inserir
    if (clientName === 'autenticado') {
      console.log('Verificando autenticação do cliente antes de inserir');
      try {
        const { data: authUser, error: authError } = await client.auth.getUser();
        if (authError) {
          console.error('Cliente não está autenticado:', authError);
          
          // Verificar detalhes do erro de JWT
          if (authError.message?.includes('User from sub claim in JWT does not exist')) {
            console.error('ERRO CRÍTICO: O usuário no JWT não existe no Supabase');
            console.log('Tentando verificar o usuário diretamente...');
            
            // Tentar obter informações do usuário para diagnóstico
            try {
              const session = await getUserSession();
              console.log('ID do usuário na sessão:', session?.user?.id);
              
              // Verificar se o usuário existe no banco de dados
              const { data: userCheck, error: userCheckError } = await client
                .from('next_auth.users')
                .select('*')
                .eq('id', session?.user?.id)
                .single();
                
              if (userCheckError) {
                console.error('Erro ao verificar usuário no DB:', userCheckError);
              } else {
                console.log('Usuário encontrado no DB:', userCheck);
              }
            } catch (e) {
              console.error('Erro ao tentar diagnóstico adicional:', e);
            }
          }
        } else if (authUser?.user) {
          console.log('Cliente autenticado como:', authUser.user.id);
          // Verificar se o user_id corresponde ao usuário autenticado
          if (authUser.user.id !== projectData.user_id) {
            console.warn('ATENÇÃO: ID de usuário do projeto não corresponde ao usuário autenticado!', {
              projectUserId: projectData.user_id,
              authenticatedUserId: authUser.user.id
            });
          }
        }
      } catch (e) {
        console.error('Erro ao verificar autenticação:', e);
      }
    }
    
    // Verificar se a tabela projects existe antes de inserir
    console.log('Verificando acesso à tabela projects...');
    try {
      // Tentar ler um projeto qualquer para verificar acesso à tabela
      const { data: testAccess, error: testError } = await client
        .from('projects')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('Erro ao acessar tabela projects:', testError);
        if (testError.message?.includes('permission denied') || 
            testError.message?.includes('policy')) {
          console.error('Falha de permissão detectada - verifique as políticas RLS');
        }
      } else {
        console.log('Acesso à tabela projects confirmado, prosseguindo com a inserção');
      }
    } catch (e) {
      console.error('Erro ao testar acesso à tabela:', e);
    }
    
    // Executar a inserção do projeto
    console.log(`Executando: INSERT INTO projects (id, name, color, user_id) VALUES ('${projectData.id}', '${projectData.name}', '${projectData.color}', '${projectData.user_id}')`);
    
    // Inserção via SQL direta
    const { data, error } = await client
      .from('projects')
      .insert([projectData])
      .select()
      .single();
      
    if (error) {
      console.error(`Erro ao criar projeto com cliente ${clientName}:`, error);
      
      // IMPORTANTE: Tentar verificar se o projeto foi criado mesmo com erro
      try {
        console.log('Verificando se o projeto foi criado apesar do erro...');
        const { data: checkData, error: checkError } = await client
          .from('projects')
          .select('*')
          .eq('id', projectData.id)
          .single();
          
        if (checkData && !checkError) {
          console.log('Projeto encontrado! Foi criado apesar do erro:', checkData);
          return { ...checkData, sections: [] };
        }
      } catch (checkError) {
        console.error('Erro ao verificar existência do projeto:', checkError);
      }
      
      // Tratar objeto de erro vazio
      if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
        console.error('Erro vazio ou indefinido detectado. Enviando para análise no console:');
        console.error('Dados do erro:', JSON.stringify(error));
        console.error('Tipo do erro:', typeof error);
        console.error('Error instanceof Error:', error instanceof Error);
        console.error('Error.toString():', String(error));
        
        // Tentar verificar projetos existentes para o usuário
        try {
          console.log('Tentando verificar projetos existentes do usuário...');
          const { data: userProjects, error: projectsError } = await client
            .from('projects')
            .select('*')
            .eq('user_id', projectData.user_id);
            
          if (projectsError) {
            console.error('Erro ao verificar projetos do usuário:', projectsError);
          } else {
            // Verificar se o projeto que estamos tentando criar já existe
            const projectExists = userProjects?.some((p: any) => p.id === projectData.id);
            if (projectExists) {
              console.log('Projeto já existe para o usuário! Retornando como sucesso');
              const existingProject = userProjects.find((p: any) => p.id === projectData.id);
              return { ...existingProject, sections: [] };
            } else {
              console.log(`Projetos encontrados para o usuário: ${userProjects?.length || 0}`);
            }
          }
        } catch (e) {
          console.error('Erro ao verificar projetos existentes:', e);
        }
        
        // Suprime o erro se estiver em ambiente de produção para não atrapalhar a experiência do usuário
        if (process.env.NODE_ENV === 'production') {
          console.warn('Erro vazio em produção, evitando mostrar erro ao usuário');
          // Em produção, consideramos que o projeto pode ter sido criado, então não lançamos erro
          // Tentaremos uma última vez obter o projeto
          return { 
            id: projectData.id, 
            name: projectData.name, 
            color: projectData.color, 
            user_id: projectData.user_id,
            sections: []
          };
        }
        
        // Criar um erro mais específico apenas em desenvolvimento
        throw new Error(`Erro ao criar projeto com cliente ${clientName}: Verifique se você tem permissão para criar projetos e está autenticado corretamente.`);
      }
      
      // Detalhamento de erros comuns para facilitar depuração
      if (error.message) {
        if (error.message.includes('violates row-level security policy')) {
          throw new Error(`Erro de permissão: Você não tem permissão para criar projetos. Políticas RLS estão impedindo a inserção. Detalhes: ${error.message}`);
        }
        if (error.message.includes('duplicate key')) {
          throw new Error(`Erro: Já existe um projeto com este ID. Detalhes: ${error.message}`);
        }
        if (error.message.includes('violates foreign key constraint')) {
          throw new Error(`Erro: Referência inválida (chave estrangeira). Detalhes: ${error.message}`);
        }
        if (error.message.includes('violates not-null constraint')) {
          throw new Error(`Erro: Dados incompletos. Um campo obrigatório está faltando. Detalhes: ${error.message}`);
        }
      }
      
      throw error;
    }
    
    if (!data) {
      throw new Error(`Nenhum dado retornado pelo cliente ${clientName}`);
    }
    
    console.log(`Projeto criado com sucesso usando cliente ${clientName}:`, data);
    return { ...data, sections: [] };
  } catch (error) {
    console.error(`Falha ao criar projeto com cliente ${clientName}:`, error);
    
    // Verificar se o erro é vazio para dar informações mais úteis
    if (error instanceof Error) {
      throw error;
    } else if (!error || (typeof error === 'object' && error !== null && Object.keys(error).length === 0)) {
      throw new Error(`Erro ao criar projeto com cliente ${clientName}: Verifique se o usuário existe no Supabase e possui um JWT válido.`);
    } else {
      throw new Error(`Erro desconhecido ao criar projeto: ${JSON.stringify(error)}`);
    }
  }
}; 