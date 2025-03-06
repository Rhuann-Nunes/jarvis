-- Políticas e funções relacionadas a projetos

-- 1. Ativar Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 2. Criar funções RPC para acesso a projetos
-- Função para buscar projetos de um usuário
CREATE OR REPLACE FUNCTION get_user_projects(user_id UUID)
RETURNS SETOF projects
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM projects
  WHERE projects.user_id = get_user_projects.user_id
  ORDER BY name ASC;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION get_user_projects(UUID) TO authenticated;

-- Função para criar um projeto como usuário autenticado
CREATE OR REPLACE FUNCTION create_user_project(
  project_name TEXT,
  project_color TEXT,
  project_id UUID DEFAULT uuid_generate_v4(),
  owner_id UUID DEFAULT auth.uid()
)
RETURNS projects
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_project projects;
BEGIN
  -- Verificar se o usuário existe
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'ID do usuário não pode ser nulo';
  END IF;
  
  -- Inserir o projeto
  INSERT INTO projects (id, name, color, user_id)
  VALUES (project_id, project_name, project_color, owner_id)
  RETURNING * INTO new_project;
  
  RETURN new_project;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar projeto: %', SQLERRM;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION create_user_project(TEXT, TEXT, UUID, UUID) TO authenticated;

-- 3. Configurar políticas RLS para tabela projects
-- Política para leitura: usuários podem ler seus próprios projetos
CREATE POLICY "Usuarios podem ler seus proprios projetos"
ON public.projects
FOR SELECT
USING (auth.uid() = user_id);

-- Política para inserção: usuários podem criar seus próprios projetos
CREATE POLICY "Usuarios podem criar seus proprios projetos"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para atualização: usuários podem atualizar seus próprios projetos
CREATE POLICY "Usuarios podem atualizar seus proprios projetos"
ON public.projects
FOR UPDATE
USING (auth.uid() = user_id);

-- Política para exclusão: usuários podem excluir seus próprios projetos
CREATE POLICY "Usuarios podem excluir seus proprios projetos"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);

-- Conceder permissões completas para usuários autenticados na tabela projects
GRANT ALL ON public.projects TO authenticated; 