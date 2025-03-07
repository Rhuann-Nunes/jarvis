import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { PostgrestError } from '@supabase/supabase-js';

// Criando uma interface para o tipo de cleanupResult
interface CleanupResult {
  success: boolean;
  error: PostgrestError | null;
}

export async function GET() {
  try {
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    
    // Verificar se o usuário está autenticado
    const authStatus = {
      isAuthenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      } : null,
      hasToken: !!session?.supabaseAccessToken,
    };
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado',
        authStatus
      }, { status: 401 });
    }
    
    // Criar um cliente Supabase autenticado
    console.log('Criando cliente Supabase autenticado para teste');
    const authenticatedSupabase = createSupabaseClient(session);
    
    // Verificar se temos um token de acesso para Supabase
    const hasToken = !!session?.supabaseAccessToken;
    console.log('Token de acesso Supabase disponível:', hasToken);
    
    // Extrair informações de colunas da tabela projects
    console.log('Verificando schema da tabela projects...');
    const { data: schemaData, error: schemaError } = await authenticatedSupabase
      .from('projects')
      .select('*')
      .limit(1);
      
    if (schemaError) {
      console.error('Erro ao verificar schema:', schemaError);
    }
    
    // Cria um projeto de teste com UUID válido
    const testUuid = uuidv4();
    const testProject = {
      id: testUuid,
      name: 'Projeto de Teste',
      color: '#FF0000',
      user_id: session.user.id
    };
    
    console.log('Tentando criar projeto de teste:', testProject);
    console.log('Cliente:', authenticatedSupabase ? 'Autenticado' : 'Anônimo');
    
    // Tentar inserir usando o cliente autenticado
    const { data: projectData, error: projectError } = await authenticatedSupabase
      .from('projects')
      .insert([testProject])
      .select()
      .single();
      
    if (projectError) {
      console.error('Erro RLS ao tentar criar projeto:', projectError);
      
      // Se falhar, tentar outra abordagem usando função do servidor (caso exista)
      console.log('Tentando abordagem alternativa para contornar RLS...');
      
      // Tentar verificar se o usuário tem projetos existentes para testar acesso
      const { data: userProjects, error: userProjectsError } = await authenticatedSupabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(5);
        
      console.log('Projetos existentes do usuário:', userProjects?.length || 0);
      if (userProjectsError) {
        console.error('Erro ao verificar projetos do usuário:', userProjectsError);
      }
    }
    
    // Limpar o projeto de teste se foi criado com sucesso
    let cleanupResult: CleanupResult | null = null;
    if (projectData && !projectError) {
      const { error: deleteError } = await authenticatedSupabase
        .from('projects')
        .delete()
        .eq('id', testUuid);
        
      cleanupResult = {
        success: !deleteError,
        error: deleteError
      };
    }
    
    // Retornar resultados
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      auth: {
        ...authStatus,
        supabaseTokenLength: session?.supabaseAccessToken?.length || 0,
        hasSupabaseToken: !!session?.supabaseAccessToken
      },
      schemaInfo: {
        success: !schemaError,
        error: schemaError,
        columnNames: schemaData ? Object.keys(schemaData[0] || {}) : []
      },
      projectTest: {
        success: !!projectData && !projectError,
        projectData,
        error: projectError
      },
      cleanup: cleanupResult
    });
  } catch (error) {
    console.error('Erro ao testar criação de projeto:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 