'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const errorParam = searchParams?.get('error');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há erros na URL
  useEffect(() => {
    // Tratamento de erros do OAuth
    if (errorParam) {
      console.error('Erro de autenticação recebido:', errorParam);
      
      // Mapeamento de erros para mensagens mais amigáveis
      const errorMessages: Record<string, string> = {
        'Callback': 'Erro durante o processo de autenticação. Por favor, tente novamente.',
        'AccessDenied': 'Acesso negado pelo provedor de autenticação.',
        'OAuthSignin': 'Erro ao iniciar o processo de autenticação.',
        'OAuthCallback': 'Erro durante o retorno da autenticação.',
        'OAuthCreateAccount': 'Não foi possível criar sua conta. Por favor, entre em contato com o suporte.',
        'Default': 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.'
      };
      
      setError(errorMessages[errorParam] || errorMessages['Default']);
    }
  }, [errorParam]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando autenticação com Google...');
      console.log('Callback URL da consulta:', callbackUrl);
      
      // Usando o callbackUrl da URL ou a página inicial como padrão
      const result = await signIn('google', { 
        callbackUrl: callbackUrl, // Usar o callbackUrl da URL
        redirect: true
      });
      
      // O código abaixo não será executado devido ao redirecionamento imediato
      // Mas mantemos como proteção caso o redirecionamento não funcione
      if (result?.error) {
        console.error('Erro retornado durante signIn:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Erro durante login:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Ocorreu um erro durante o login. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center w-full px-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-white opacity-90" />
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">JARVIS</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Seu assistente pessoal de produtividade
            </p>
          </div>
          
          <div className="mt-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm">
                {error === 'CLIENT_FETCH_ERROR' 
                  ? 'Iniciando autenticação com Google...'
                  : `Erro: ${error}`}
              </div>
            )}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-3 border border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600 disabled:opacity-50 transition-all"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              {isLoading ? 'Entrando com Google...' : 'Entrar com Google'}
            </button>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </div>
        </div>
        
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          JARVIS &copy; {new Date().getFullYear()} - Seu assistente pessoal
        </p>
      </div>
    </div>
  );
} 