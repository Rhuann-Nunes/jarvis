import { createClient } from '@supabase/supabase-js';
import { Session } from 'next-auth';

// Tipos para o banco de dados
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          color: string;
          user_id: string;
          created_at: Date;
          updated_at: Date;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          user_id: string;
          created_at?: Date;
          updated_at?: Date;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          user_id?: string;
          created_at?: Date;
          updated_at?: Date;
        };
      };
      sections: {
        Row: {
          id: string;
          name: string;
          project_id: string;
          created_at: Date;
          updated_at: Date;
        };
        Insert: {
          id?: string;
          name: string;
          project_id: string;
          created_at?: Date;
          updated_at?: Date;
        };
        Update: {
          id?: string;
          name?: string;
          project_id?: string;
          created_at?: Date;
          updated_at?: Date;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          completed: boolean;
          completed_at: Date | null;
          due_date: Date | null;
          recurrence_type: string | null;
          recurrence_interval: number | null;
          recurrence_days_of_week: number[] | null;
          is_recurrence_occurrence: boolean;
          original_task_id: string | null;
          project_id: string | null;
          section_id: string | null;
          user_id: string;
          created_at: Date;
          updated_at: Date;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          completed?: boolean;
          completed_at?: Date | null;
          due_date?: Date | null;
          recurrence_type?: string | null;
          recurrence_interval?: number | null;
          recurrence_days_of_week?: number[] | null;
          is_recurrence_occurrence?: boolean;
          original_task_id?: string | null;
          project_id?: string | null;
          section_id?: string | null;
          user_id: string;
          created_at?: Date;
          updated_at?: Date;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          completed?: boolean;
          completed_at?: Date | null;
          due_date?: Date | null;
          recurrence_type?: string | null;
          recurrence_interval?: number | null;
          recurrence_days_of_week?: number[] | null;
          is_recurrence_occurrence?: boolean;
          original_task_id?: string | null;
          project_id?: string | null;
          section_id?: string | null;
          user_id?: string;
          created_at?: Date;
          updated_at?: Date;
        };
      };
    };
  };
  next_auth: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          emailVerified: Date | null;
          image: string | null;
          created_at: Date | null;
          updated_at: Date | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          emailVerified?: Date | null;
          image?: string | null;
          created_at?: Date | null;
          updated_at?: Date | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          emailVerified?: Date | null;
          image?: string | null;
          created_at?: Date | null;
          updated_at?: Date | null;
        };
      };
      accounts: {
        Row: {
          id: string;
          type: string;
          provider: string;
          providerAccountId: string;
          refresh_token: string | null;
          access_token: string | null;
          expires_at: number | null;
          token_type: string | null;
          scope: string | null;
          id_token: string | null;
          session_state: string | null;
          userId: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          sessionToken: string;
          userId: string;
          expires: Date;
        };
      };
      verification_tokens: {
        Row: {
          identifier: string;
          token: string;
          expires: Date;
        };
      };
    };
  };
};

// Cria um cliente Supabase básico (sem token de autenticação)
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Verificar se o cliente foi criado corretamente
console.log('Cliente Supabase inicializado:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configurado' : 'não configurado',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configurado' : 'não configurado'
});

// Verificar a conexão do Supabase na inicialização
(async () => {
  try {
    const { data, error } = await supabase.from('tasks').select('id').limit(1);
    if (error) {
      console.error('Erro ao verificar conexão do Supabase:', error);
    } else {
      console.log('Conexão com Supabase estabelecida com sucesso');
    }
  } catch (err) {
    console.error('Exceção ao verificar conexão do Supabase:', err);
  }
})();

// Função para criar um cliente Supabase com autenticação
export function createSupabaseClient(session: Session | null) {
  try {
    if (!session?.supabaseAccessToken) {
      console.log('Criando cliente Supabase anônimo (sem token de acesso)');
      return supabase;
    }

    console.log('Criando cliente Supabase autenticado com token de acesso');
    // Log apenas os primeiros e últimos caracteres do token para depuração
    const tokenStart = session.supabaseAccessToken.substring(0, 5);
    const tokenEnd = session.supabaseAccessToken.substring(session.supabaseAccessToken.length - 5);
    console.log(`Token: ${tokenStart}...${tokenEnd} (tamanho: ${session.supabaseAccessToken.length})`);
    
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session.supabaseAccessToken}`,
          },
        },
        auth: {
          persistSession: false,
        },
      }
    );
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error);
    return supabase; // Fallback para cliente anônimo
  }
}

// Função para testar a conexão e diagnóstico do Supabase
export async function testSupabaseConnection() {
  console.log('Iniciando teste de conexão com Supabase...');
  
  // Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Configuração do Supabase:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'não definida',
    anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 5)}...` : 'não definida',
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0
  });
  
  try {
    // Teste 1: Verificar se consegue ler dados (sem autenticação)
    console.log('Teste 1: Tentando ler dados públicos...');
    const { data: readData, error: readError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);
      
    if (readError) {
      console.error('Erro ao ler dados:', readError);
    } else {
      console.log('Leitura bem-sucedida. Resultado:', readData);
    }
    
    // Teste 2: Tentar inserir um registro de teste (pode falhar por falta de auth)
    console.log('Teste 2: Tentando inserir dados (pode falhar sem autenticação)...');
    const testTask = {
      id: `test-${Date.now()}`,
      title: 'Tarefa de teste',
      completed: false,
      user_id: 'test-user',
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('tasks')
      .insert([testTask])
      .select();
      
    if (insertError) {
      console.error('Erro ao inserir dados (esperado sem autenticação):', insertError);
      console.log('Código de erro:', insertError.code);
      console.log('Mensagem de erro:', insertError.message);
      console.log('Detalhes:', insertError.details);
    } else {
      console.log('Inserção bem-sucedida. Resultado:', insertData);
      
      // Se conseguiu inserir, tenta excluir para limpar
      if (insertData && insertData.length > 0) {
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', testTask.id);
          
        if (deleteError) {
          console.error('Erro ao excluir tarefa de teste:', deleteError);
        } else {
          console.log('Tarefa de teste excluída com sucesso');
        }
      }
    }
    
    return {
      success: !readError,
      readResult: { data: readData, error: readError },
      insertResult: { data: insertData, error: insertError }
    };
  } catch (err) {
    console.error('Exceção durante o teste de conexão:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
} 