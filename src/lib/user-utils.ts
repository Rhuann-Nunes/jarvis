import { createClient } from '@supabase/supabase-js';
import { Session } from 'next-auth';
import { supabase } from './supabase';

// Tipos básicos para a aplicação
interface UserSession {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
  expires?: string;
  supabaseAccessToken?: string;
}

// Obtém a sessão completa do usuário, compatível com next-auth Session
export const getUserSession = async (): Promise<Session | null> => {
  try {
    console.log('Obtendo sessão completa do usuário...');
    const response = await fetch('/api/auth/session');
    
    if (!response.ok) {
      console.error(`Erro ao obter sessão: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const session = await response.json();
    
    console.log('Sessão obtida:', JSON.stringify({
      hasUser: !!session?.user,
      hasToken: !!session?.supabaseAccessToken,
      expires: session?.expires
    }));
    
    return session as Session;
  } catch (error) {
    console.error('Erro ao obter sessão do usuário:', error);
    return null;
  }
};

// Obtém o ID do usuário da sessão
export const getUserId = async (): Promise<string | null> => {
  try {
    // Tenta obter o usuário atual da sessão
    const session = await getUserSession();
    
    if (session?.user?.id) {
      console.log('ID do usuário encontrado:', session.user.id);
      return session.user.id;
    }
    
    console.error('Não foi possível obter ID do usuário da sessão');
    return null;
  } catch (error) {
    console.error('Erro ao obter ID do usuário:', error);
    return null;
  }
};

// Obtém uma instância do cliente Supabase com token da sessão
export const getSupabaseClient = async () => {
  // Obter a sessão do usuário
  const session = await getUserSession();
  
  // Se não temos um token, retorna o cliente padrão (limitado)
  if (!session?.supabaseAccessToken) {
    console.warn('Usando cliente Supabase sem autenticação');
    return supabase;
  }
  
  console.log('Criando cliente Supabase autenticado com token da sessão');
  
  // Criar cliente com token de acesso
  return createClient(
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
}; 