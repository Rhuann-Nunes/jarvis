'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

// Componente que usa useSearchParams
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    // Mapeamento de erros para mensagens mais amigáveis
    const errorMessages: Record<string, string> = {
      'Configuration': 'Erro na configuração do servidor de autenticação. Entre em contato com o suporte.',
      'AccessDenied': 'Acesso negado. A autorização foi negada para esta solicitação.',
      'Verification': 'O token de verificação expirou ou já foi utilizado.',
      'OAuthSignin': 'Erro ao iniciar o processo de autenticação com o provedor.',
      'OAuthCallback': 'Erro durante o retorno da autenticação. Tente novamente.',
      'OAuthCreateAccount': 'Não foi possível criar uma conta vinculada ao provedor.',
      'EmailCreateAccount': 'Não foi possível criar uma conta com esse e-mail.',
      'Callback': 'Erro durante o processamento do retorno. Tente novamente.',
      'OAuthAccountNotLinked': 'Este e-mail já está associado a outra conta. Faça login usando o método original.',
      'EmailSignin': 'Erro ao enviar o e-mail de verificação. Verifique se o e-mail foi inserido corretamente.',
      'CredentialsSignin': 'Falha no login. Verifique se as credenciais estão corretas.',
      'SessionRequired': 'Esta ação requer que você esteja logado.',
      'Default': 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.'
    };
    
    // Log do erro para diagnóstico
    console.error('Auth Error:', error);
    
    // Definir a mensagem de erro apropriada
    setErrorMessage(error ? (errorMessages[error] || errorMessages['Default']) : errorMessages['Default']);
  }, [error]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Erro de Autenticação
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
        </div>
        
        {/* Mostrar detalhes do erro apenas em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md overflow-x-auto">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Detalhes técnicos:</h3>
            <pre className="mt-2 text-xs text-gray-800 dark:text-gray-300">
              Error Code: {error || 'Unknown'}
            </pre>
          </div>
        )}
        
        <div className="mt-6">
          <Link href="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}

// Componente de fallback para mostrar enquanto o conteúdo está carregando
function LoadingError() {
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
            Carregando...
          </h2>
        </div>
      </div>
    </div>
  );
}

// Componente principal que usa Suspense
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingError />}>
      <AuthErrorContent />
    </Suspense>
  );
} 