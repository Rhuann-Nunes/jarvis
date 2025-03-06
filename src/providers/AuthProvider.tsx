'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // O SessionProvider do NextAuth gerencia automaticamente a sessão
  // e agora inclui o token de acesso do Supabase
  
  return (
    <SessionProvider
      // Atualizar a sessão a cada 5 minutos
      refetchInterval={5 * 60}
      // Atualizar a sessão quando a janela ganhar foco
      refetchOnWindowFocus={true}
      // Tentar novamente se estiver offline
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}

