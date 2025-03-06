import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase';

// Função para obter um cliente Supabase autenticado em rotas de servidor ou componentes de servidor
export async function getSupabaseServerClient() {
  const session = await getServerSession(authOptions);
  
  // Se não houver sessão ou token de acesso, retorne um cliente anônimo
  if (!session?.supabaseAccessToken) {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  
  // Retorna um cliente Supabase autenticado
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${session.supabaseAccessToken}`,
        },
      },
    }
  );
} 