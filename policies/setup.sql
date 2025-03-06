-- Script principal para configuração do Supabase
-- Importa todos os arquivos SQL com políticas e funções

-- Importar configurações de projetos
\i 'policies/projects.sql'

-- Importar configurações de seções
\i 'policies/sections.sql'

-- Importar configurações de tarefas
\i 'policies/tasks.sql'

-- Importar funções utilitárias
\i 'policies/utils.sql'

-- Confirmar a conclusão da importação
DO $$
BEGIN
  RAISE NOTICE 'Configuração concluída com sucesso. Todas as políticas e funções foram aplicadas.';
END $$; 