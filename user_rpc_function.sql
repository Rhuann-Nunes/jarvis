-- Função para buscar ID de usuário pelo email na tabela next_auth.users
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS TABLE(user_id UUID) 
LANGUAGE SQL
SECURITY DEFINER -- executa com privilégios do criador
AS $$
  SELECT id as user_id
  FROM next_auth.users
  WHERE email = LOWER(user_email)
  LIMIT 1;
$$;

-- Permissões para a função
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO anon, authenticated, service_role; 