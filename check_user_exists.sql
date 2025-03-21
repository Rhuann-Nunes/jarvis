-- Função para verificar se um usuário existe sem acessar diretamente next_auth.users
CREATE OR REPLACE FUNCTION public.check_user_exists(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS check_user_exists.sql
BEGIN
  RETURN EXISTS (SELECT 1 FROM next_auth.users WHERE id = user_id);
END
check_user_exists.sql;
-- Conceder permissão para usuários anônimos e autenticados
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO anon, authenticated;
