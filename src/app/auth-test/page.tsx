'use client';

import { useSession } from 'next-auth/react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { useEffect, useState } from 'react';

export default function AuthTestPage() {
  const { data: session, status } = useSession();
  const supabase = useSupabase();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        setLoading(true);
        setError(null);

        // Se o usuário está autenticado
        if (status === 'authenticated' && session?.user) {
          // Vamos verificar o acesso ao Supabase
          const { data, error } = await supabase.from('users').select('*').limit(1);
          
          if (error) {
            throw new Error(`Erro ao acessar o Supabase: ${error.message}`);
          }

          setUserInfo({
            nextAuth: {
              ...session.user,
              expires: session.expires
            },
            supabaseData: data
          });
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchUserInfo();
  }, [session, status, supabase]);

  if (status === 'loading' || loading) {
    return <div className="p-8">Carregando informações de autenticação...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Teste de Autenticação</h1>
        <p className="text-red-500">Você não está autenticado. Por favor, faça login primeiro.</p>
        <a href="/login" className="text-blue-500 underline mt-4 block">Ir para o login</a>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Autenticação</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Erro:</strong> {error}</p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Status da Sessão:</h2>
        <p className="text-green-600 font-medium">{status}</p>
      </div>

      {userInfo && (
        <>
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Dados do NextAuth:</h2>
            <pre className="bg-gray-200 p-3 rounded whitespace-pre-wrap">
              {JSON.stringify(userInfo.nextAuth, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Dados do Supabase:</h2>
            <pre className="bg-gray-200 p-3 rounded whitespace-pre-wrap">
              {JSON.stringify(userInfo.supabaseData, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
} 