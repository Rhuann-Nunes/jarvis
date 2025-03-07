'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

// Componente que usa useSearchParams
function LoginContent() {
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
      
      // Mapeamento de códigos de erro para mensagens mais amigáveis
      const errorMessages: Record<string, string> = {
        'OAuthSignin': 'Ocorreu um erro ao iniciar o processo de login.',
        'OAuthCallback': 'Ocorreu um erro ao processar o retorno de autenticação.',
        'OAuthCreateAccount': 'Não foi possível criar uma conta usando este provedor.',
        'EmailCreateAccount': 'Não foi possível criar uma conta com este e-mail.',
        'Callback': 'Ocorreu um erro durante o processamento do retorno de autenticação.',
        'OAuthAccountNotLinked': 'Este e-mail já está associado a outra conta. Por favor, faça login usando o método original.',
        'EmailSignin': 'Erro ao enviar o e-mail de login. Verifique se o endereço está correto.',
        'CredentialsSignin': 'As credenciais fornecidas não são válidas.',
        'SessionRequired': 'É necessário estar autenticado para acessar este recurso.',
        'Default': 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.'
      };
      
      setError(errorMessages[errorParam] || errorMessages['Default']);
    }
  }, [errorParam]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Inicia o processo de login com o Google
      await signIn('google', { callbackUrl });
    } catch (err) {
      console.error('Erro ao tentar login com Google:', err);
      setError('Ocorreu um erro ao tentar fazer login com o Google. Por favor, tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Entre na sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Gerencie suas tarefas e projetos de forma eficiente
          </p>
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-200 dark:text-red-800 rounded-lg" role="alert">
            <span className="font-medium">Erro:</span> {error}
          </div>
        )}
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Entrar com
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#fff"/>
                </svg>
              )}
              {isLoading ? "Processando..." : "Continuar com Google"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de fallback para mostrar enquanto o conteúdo está carregando
function LoadingLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-center text-xl font-medium text-gray-900 dark:text-white">
            Carregando página de login...
          </h2>
        </div>
      </div>
    </div>
  );
}

// Componente principal que usa Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingLogin />}>
      <LoginContent />
    </Suspense>
  );
} 