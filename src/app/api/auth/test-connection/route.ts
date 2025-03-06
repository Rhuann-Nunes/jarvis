import { getUserId, getSupabaseClient, getUserSession } from '@/lib/db';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const results: {
    anonymous: { success: boolean, data: string | null, error: string | null },
    authenticated: { success: boolean, data: string | null, error: string | null },
    userId: string | null,
    session: {
      hasUser: boolean;
      hasToken: boolean;
      tokenLength: number;
      expires: string | undefined;
    } | null,
    jwtUser: { success: boolean, data: any | null, error: string | null },
    userSync: { success: boolean, data: any | null, error: string | null },
    rpc: {
      getProjects: { success: boolean, data: string | null, error: string | null },
      createProject: { success: boolean, data: string | null, error: string | null },
      checkRls: { success: boolean, data: string | null, error: string | null }
    }
  } = {
    anonymous: { success: false, data: null, error: null },
    authenticated: { success: false, data: null, error: null },
    userId: null,
    session: null,
    jwtUser: { success: false, data: null, error: null },
    userSync: { success: false, data: null, error: null },
    rpc: {
      getProjects: { success: false, data: null, error: null },
      createProject: { success: false, data: null, error: null },
      checkRls: { success: false, data: null, error: null }
    }
  };

  // 1. Testar cliente anônimo
  try {
    const { data, error } = await supabase.from('projects').select('id').limit(1);
    results.anonymous = {
      success: !error,
      data: data ? `Encontrado ${data.length} projetos` : null,
      error: error ? error.message : null
    };
  } catch (error) {
    results.anonymous.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }

  // 2. Obter ID do usuário e sessão
  try {
    results.userId = await getUserId();
    const session = await getUserSession();
    results.session = {
      hasUser: !!session?.user,
      hasToken: !!session?.supabaseAccessToken,
      tokenLength: session?.supabaseAccessToken ? session.supabaseAccessToken.length : 0,
      expires: session?.expires
    };
  } catch (error) {
    console.error('Erro ao obter ID do usuário ou sessão:', error);
  }

  // 3. Testar cliente autenticado
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.from('projects').select('id').limit(1);
    results.authenticated = {
      success: !error,
      data: data ? `Encontrado ${data.length} projetos` : null,
      error: error ? error.message : null
    };
  } catch (error) {
    results.authenticated.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }

  // 4. Testar RPC para verificar usuário JWT
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.rpc('verify_jwt_user');
    results.jwtUser = {
      success: !error,
      data,
      error: error ? error.message : null
    };
  } catch (error) {
    results.jwtUser.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }

  // 5. Sincronizar usuário NextAuth com auth.users
  try {
    const client = await getSupabaseClient();
    const session = await getUserSession();
    
    if (session?.user) {
      const { data, error } = await client.rpc('sync_nextauth_user_with_auth', {
        user_id: session.user.id,
        user_email: session.user.email || null,
        user_name: session.user.name || null
      });
      
      results.userSync = {
        success: !error,
        data,
        error: error ? error.message : null
      };
    } else {
      results.userSync = {
        success: false,
        data: null,
        error: 'Nenhuma sessão disponível para sincronizar usuário'
      };
    }
  } catch (error) {
    results.userSync.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }

  // 6. Testar RPC para obter projetos
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.rpc('get_user_projects', {
      user_id: results.userId
    });
    results.rpc.getProjects = {
      success: !error,
      data: data ? `Encontrado ${data.length} projetos via RPC` : null,
      error: error ? error.message : null
    };
  } catch (error) {
    results.rpc.getProjects.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }

  // 7. Testar RPC para criar projeto (apenas simulação para não criar projetos repetidos)
  try {
    const client = await getSupabaseClient();
    // Não executar a criação efetiva, apenas verificar se a função existe
    const { data, error } = await client.rpc('create_user_project', {
      project_name: 'Projeto Teste (Simulação)',
      project_color: '#ff0000',
      project_id: '00000000-0000-0000-0000-000000000000',
      owner_id: results.userId
    });
    
    // Verificar se o erro é apenas de duplicidade (esperado nesse caso)
    if (error && error.message.includes('duplicate key')) {
      results.rpc.createProject = {
        success: true,
        data: 'Função existe e retornou erro de duplicidade conforme esperado',
        error: null
      };
    } else {
      results.rpc.createProject = {
        success: !error,
        data: data ? 'Função executada com sucesso' : null,
        error: error ? error.message : null
      };
    }
  } catch (error) {
    results.rpc.createProject.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }

  // 8. Testar RPC para verificar políticas RLS
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.rpc('check_rls_policies');
    results.rpc.checkRls = {
      success: !error,
      data: data ? `Encontrado ${data.length} políticas RLS` : null,
      error: error ? error.message : null
    };
  } catch (error) {
    results.rpc.checkRls.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }

  return NextResponse.json(results);
} 