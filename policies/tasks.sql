-- Políticas e funções relacionadas a tarefas

-- 1. Ativar Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes para a tabela tasks (para evitar conflitos)
DROP POLICY IF EXISTS "Usuarios podem ler suas proprias tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Usuarios podem criar suas proprias tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Usuarios podem atualizar suas proprias tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Usuarios podem excluir suas proprias tarefas" ON public.tasks;

-- 3. Criar funções RPC para acesso a tarefas
-- Função para criar uma tarefa como usuário autenticado
CREATE OR REPLACE FUNCTION create_user_task(
  task_title TEXT,
  task_description TEXT DEFAULT NULL,
  task_due_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  task_completed BOOLEAN DEFAULT FALSE,
  task_project_id UUID DEFAULT NULL,
  task_section_id UUID DEFAULT NULL,
  task_id UUID DEFAULT uuid_generate_v4(),
  owner_id UUID DEFAULT auth.uid()
)
RETURNS tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_task tasks;
  project_exists BOOLEAN;
  section_exists BOOLEAN;
  current_time TIMESTAMPTZ := CURRENT_TIMESTAMP;
BEGIN
  -- Verificar se o usuário existe
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'ID do usuário não pode ser nulo';
  END IF;
  
  -- Verificar se o projeto pertence ao usuário (se um projectId foi fornecido)
  IF task_project_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM projects
      WHERE id = task_project_id
    ) INTO project_exists;
    
    IF NOT project_exists THEN
      RAISE EXCEPTION 'O projeto especificado não existe';
    END IF;
  END IF;
  
  -- Verificar se a seção pertence ao projeto fornecido (se uma sectionId foi fornecida)
  IF task_section_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM sections
      WHERE id = task_section_id 
      AND (
        task_project_id IS NULL 
        OR project_id = task_project_id
      )
    ) INTO section_exists;
    
    IF NOT section_exists THEN
      RAISE EXCEPTION 'A seção especificada não pertence ao projeto fornecido ou não existe';
    END IF;
  END IF;
  
  -- Verificar se já existe uma tarefa com este ID
  IF EXISTS (SELECT 1 FROM tasks WHERE id = task_id) THEN
    RAISE EXCEPTION 'Já existe uma tarefa com este ID';
  END IF;
  
  -- Inserir a tarefa com permissão de SECURITY DEFINER
  INSERT INTO tasks (
    id, 
    title, 
    description, 
    completed, 
    due_date, 
    project_id, 
    section_id, 
    user_id,
    created_at,
    updated_at
  )
  VALUES (
    task_id, 
    task_title, 
    task_description, 
    task_completed, 
    COALESCE(task_due_date, current_time),
    task_project_id, 
    task_section_id, 
    owner_id,
    current_time,
    current_time
  )
  RETURNING * INTO new_task;
  
  RETURN new_task;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar tarefa: % [Código: %]', SQLERRM, SQLSTATE;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION create_user_task(TEXT, TEXT, TIMESTAMPTZ, BOOLEAN, UUID, UUID, UUID, UUID) TO authenticated;

-- 4. Configurar políticas RLS para tabela tasks
-- Política para leitura de tarefas pelo dono
CREATE POLICY "Usuarios podem ler suas proprias tarefas"
ON public.tasks
FOR SELECT
USING (auth.uid() = user_id);

-- Política para criar tarefas
CREATE POLICY "Usuarios podem criar suas proprias tarefas"
ON public.tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para atualizar tarefas
CREATE POLICY "Usuarios podem atualizar suas proprias tarefas"
ON public.tasks
FOR UPDATE
USING (auth.uid() = user_id);

-- Política para excluir tarefas
CREATE POLICY "Usuarios podem excluir suas proprias tarefas"
ON public.tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Conceder permissões completas para usuários autenticados na tabela tasks
GRANT ALL ON public.tasks TO authenticated;

-- Função para buscar tarefas de um usuário com detalhes do projeto e seção
CREATE OR REPLACE FUNCTION get_tasks_with_details(
  user_uuid UUID DEFAULT auth.uid(),
  include_completed BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  completed BOOLEAN,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_id UUID,
  project_id UUID,
  project_name TEXT,
  project_color TEXT,
  section_id UUID,
  section_name TEXT,
  recurrence_type TEXT,
  recurrence_interval INTEGER,
  recurrence_days_of_week INTEGER[],
  is_recurrence_occurrence BOOLEAN,
  original_task_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.completed,
    t.completed_at,
    t.due_date,
    t.created_at,
    t.updated_at,
    t.user_id,
    t.project_id,
    p.name AS project_name,
    p.color AS project_color,
    t.section_id,
    s.name AS section_name,
    t.recurrence_type,
    t.recurrence_interval,
    t.recurrence_days_of_week,
    t.is_recurrence_occurrence,
    t.original_task_id
  FROM 
    tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN sections s ON t.section_id = s.id
  WHERE 
    t.user_id = user_uuid
    AND (include_completed OR t.completed = FALSE)
  ORDER BY 
    t.due_date ASC,
    t.created_at DESC;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION get_tasks_with_details(UUID, BOOLEAN) TO authenticated; 