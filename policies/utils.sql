-- Funções utilitárias e de diagnóstico

-- 1. Função de diagnóstico para verificar políticas RLS
CREATE OR REPLACE FUNCTION check_rls_policies(schema_name TEXT DEFAULT 'public')
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    action TEXT,
    roles TEXT,
    cmd TEXT,
    permissive TEXT,
    using_expression TEXT,
    with_check_expression TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.relname::TEXT AS table_name,
        p.polname::TEXT AS policy_name,
        CASE
            WHEN (p.polpermissive AND p.polcmd = '*') THEN 'ALL'
            WHEN (p.polpermissive AND p.polcmd = 'r') THEN 'SELECT'
            WHEN (p.polpermissive AND p.polcmd = 'a') THEN 'INSERT'
            WHEN (p.polpermissive AND p.polcmd = 'w') THEN 'UPDATE'
            WHEN (p.polpermissive AND p.polcmd = 'd') THEN 'DELETE'
            ELSE 'UNKNOWN'
        END AS action,
        array_to_string(ARRAY(
            SELECT r.rolname 
            FROM pg_roles r
            WHERE pg_has_role('authenticated', r.oid, 'MEMBER')
        ), ', ') AS roles,
        p.polcmd::TEXT AS cmd,
        CASE WHEN p.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS permissive,
        pg_get_expr(p.polqual, t.oid, true) AS using_expression,
        pg_get_expr(p.polwithcheck, t.oid, true) AS with_check_expression
    FROM pg_policy p
    JOIN pg_class t ON t.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = schema_name
    ORDER BY t.relname, p.polname;
END;
$$;

-- Conceder permissão para a função de diagnóstico
GRANT EXECUTE ON FUNCTION check_rls_policies(TEXT) TO authenticated;

-- Comentário final
COMMENT ON FUNCTION check_rls_policies IS 'Função para examinar as políticas RLS configuradas em um schema específico';

-- 2. Função para verificar e sincronizar usuário do JWT
CREATE OR REPLACE FUNCTION verify_jwt_user()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  user_exists BOOLEAN;
  user_info RECORD;
  result JSON;
BEGIN
  -- Obter o ID do usuário atual do JWT
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Nenhum usuário autenticado',
      'user_id', NULL,
      'exists_in_auth', FALSE,
      'exists_in_next_auth', FALSE
    );
  END IF;
  
  -- Verificar se o usuário existe na tabela auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = current_user_id
  ) INTO user_exists;
  
  -- Verificar se o usuário existe na tabela next_auth.users
  SELECT u.id, u.email, u.name
  FROM next_auth.users u
  WHERE u.id = current_user_id
  INTO user_info;
  
  -- Preparar resultado
  result := json_build_object(
    'success', TRUE,
    'user_id', current_user_id,
    'exists_in_auth', user_exists,
    'exists_in_next_auth', user_info.id IS NOT NULL,
    'user_info', CASE WHEN user_info.id IS NOT NULL THEN
      json_build_object(
        'id', user_info.id,
        'email', user_info.email,
        'name', user_info.name
      )
    ELSE
      NULL
    END
  );
  
  RETURN result;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION verify_jwt_user() TO authenticated;

-- 3. Função para sincronizar usuários NextAuth com Supabase Auth
CREATE OR REPLACE FUNCTION sync_nextauth_user_with_auth(
  user_id UUID, 
  user_email TEXT DEFAULT NULL, 
  user_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_in_nextauth BOOLEAN;
  exists_in_auth BOOLEAN;
  result JSON;
BEGIN
  -- Verificar se o usuário existe em next_auth.users
  SELECT EXISTS (
    SELECT 1 FROM next_auth.users WHERE id = user_id
  ) INTO exists_in_nextauth;
  
  -- Verificar se o usuário existe em auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id
  ) INTO exists_in_auth;
  
  -- Se o usuário existe em next_auth mas não em auth, criar em auth
  IF exists_in_nextauth AND NOT exists_in_auth THEN
    BEGIN
      -- Tentar inserir na tabela auth.users
      INSERT INTO auth.users (
        id, 
        email,
        instance_id,
        aud,
        role,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change_token_new,
        recovery_token
      )
      VALUES (
        user_id,
        user_email,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        now(),
        now(),
        now(),
        '',
        '',
        ''
      );
      
      -- Criar um registro em auth.identities
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at
      )
      VALUES (
        user_id,
        user_id,
        jsonb_build_object('sub', user_id, 'email', user_email, 'name', user_name),
        'next_auth',
        now(),
        now()
      );
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'Erro ao criar usuário em auth: ' || SQLERRM
      );
    END;
    
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'Usuário sincronizado de next_auth para auth',
      'user_id', user_id
    );
  END IF;
  
  -- Usuário já existe em ambos ou só em auth
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Nenhuma sincronização necessária',
    'exists_in_nextauth', exists_in_nextauth,
    'exists_in_auth', exists_in_auth,
    'user_id', user_id
  );
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION sync_nextauth_user_with_auth(UUID, TEXT, TEXT) TO authenticated; 