'use client';

import { useState, useEffect } from 'react';
import { getUserSession } from '@/lib/user-utils';
import { JarvisClient } from '@/lib/jarvis-api';

interface JarvisUserData {
  userId: string;
  userName: string;
  isLoading: boolean;
  error: string | null;
  jarvis: JarvisClient | null;
}

export function useJarvisUser(): JarvisUserData {
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('Usuário');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [jarvis, setJarvis] = useState<JarvisClient | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Obtém a sessão completa do usuário para acessar mais informações
        const session = await getUserSession();
        const id = session?.user?.id;
        
        if (id) {
          setUserId(id);
          
          // Obtém o nome do usuário da sessão
          // Prioriza name -> email -> 'Usuário'
          const name = session.user?.name || session.user?.email || 'Usuário';
          setUserName(name);
          console.log(`Usuário autenticado: ${name} (${id})`);
          
          // Cria uma instância do cliente Jarvis com o nome real do usuário
          const jarvisClient = new JarvisClient(id, name);
          
          // Carrega os dados do usuário no sistema RAG JARVIS
          const loadSuccess = await jarvisClient.loadUserData();
          if (!loadSuccess) {
            console.warn('Dados do usuário carregados parcialmente no RAG JARVIS');
          }
          
          setJarvis(jarvisClient);
        } else {
          // Para fins de demonstração, podemos usar um UUID fictício
          const demoUserId = 'demo-user-' + Math.random().toString(36).substring(2, 9);
          const demoName = 'Demo User';
          
          console.log(`Usando usuário de demonstração: ${demoName} (${demoUserId})`);
          setUserId(demoUserId);
          setUserName(demoName);
          
          const jarvisClient = new JarvisClient(demoUserId, demoName);
          setJarvis(jarvisClient);
          
          // Nota: não tentamos carregar dados para usuários demo
        }
      } catch (err) {
        console.error('Erro ao obter dados do usuário:', err);
        setError('Não foi possível carregar os dados do usuário.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return { userId, userName, isLoading, error, jarvis };
} 