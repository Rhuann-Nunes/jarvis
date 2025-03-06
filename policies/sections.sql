-- Políticas e funções relacionadas a seções

-- 1. Ativar Row Level Security
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- 2. Criar funções RPC para acesso a seções
-- Função para buscar seções de vários projetos
CREATE OR REPLACE FUNCTION get_project_sections(project_ids UUID[])
RETURNS SETOF sections
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM sections
  WHERE sections.project_id = ANY(get_project_sections.project_ids);
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION get_project_sections(UUID[]) TO authenticated;

-- 3. Configurar políticas RLS para tabela sections
-- Política para leitura de seções
CREATE POLICY "Usuarios podem ler secoes de seus projetos"
ON public.sections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = sections.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Política para criar seções
CREATE POLICY "Usuarios podem criar secoes em seus projetos"
ON public.sections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = sections.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Política para atualizar seções
CREATE POLICY "Usuarios podem atualizar secoes de seus projetos"
ON public.sections
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = sections.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Política para excluir seções
CREATE POLICY "Usuarios podem excluir secoes de seus projetos"
ON public.sections
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = sections.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Conceder permissões completas para usuários autenticados na tabela sections
GRANT ALL ON public.sections TO authenticated;