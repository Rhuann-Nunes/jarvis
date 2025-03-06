'use client';

import { useSession } from 'next-auth/react';
import { createSupabaseClient, supabase } from '../supabase';
import { useEffect, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../supabase';

/**
 * Hook para usar o cliente Supabase com autenticação
 * Agora adaptado para funcionar com o PrismaAdapter
 */
export function useSupabase() {
  const { data: session, status } = useSession();
  const [client, setClient] = useState<SupabaseClient<Database>>(supabase);

  useEffect(() => {
    // Atualiza o cliente sempre que a sessão mudar
    if (status === 'authenticated') {
      console.log('Atualizando cliente Supabase com token da sessão');
      setClient(createSupabaseClient(session));
    } else {
      console.log('Usando cliente Supabase anônimo');
      setClient(supabase);
    }
  }, [session, status]);

  return client;
} 