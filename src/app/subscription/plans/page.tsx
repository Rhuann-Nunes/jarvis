'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserId } from '@/lib/db';
import SubscriptionService from '@/lib/subscription-service';

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleStartFreeTrial = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando processo de criação de período de teste gratuito');
      const userId = await getUserId();
      
      if (!userId) {
        console.error('ID do usuário não encontrado');
        setError('Você precisa estar logado para iniciar o período de teste gratuito.');
        return;
      }
      
      console.log('ID do usuário obtido:', userId);
      
      // Verificar se o usuário já utilizou o período de teste
      const hasUsed = await SubscriptionService.hasUsedFreeTrial(userId);
      
      if (hasUsed) {
        console.log('Usuário já utilizou o período de teste gratuito');
        setError('Você já utilizou o período de teste gratuito.');
        return;
      }
      
      console.log('Criando assinatura de teste gratuito...');
      
      try {
        // Criar assinatura de teste gratuito
        const subscription = await SubscriptionService.createFreeTrial(userId);
        
        if (!subscription) {
          console.error('Falha ao criar período de teste - resposta nula');
          setError('Não foi possível criar o período de teste gratuito.');
          return;
        }
        
        console.log('Assinatura de teste criada com sucesso:', subscription.id);
        
        // Redirecionar para a página principal
        router.push('/dashboard');
      } catch (subscriptionError) {
        console.error('Erro detalhado ao criar assinatura:', subscriptionError);
        throw subscriptionError; // Repassar o erro para ser tratado no catch externo
      }
    } catch (err) {
      console.error('Erro ao iniciar período de teste:', err);
      setError(err instanceof Error ? err.message : 'Erro ao iniciar período de teste');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePurchaseAnnualPlan = () => {
    // Redirecionar para o checkout da Kiwify
    window.location.href = 'https://pay.kiwify.com.br/FVYCKyf';
  };
  
  // Lista de recursos disponíveis nos planos
  const features = [
    { 
      name: "Criação de tarefas de forma automatizada com linguagem natural", 
      freeTrial: true, 
      annual: true 
    },
    { 
      name: "Tarefas recorrentes e agendamento inteligente", 
      freeTrial: true, 
      annual: true 
    },
    { 
      name: "Acesso ao JARVIS no app", 
      freeTrial: true, 
      annual: true 
    },
    { 
      name: "Notificações no WhatsApp", 
      freeTrial: false, 
      annual: true 
    },
    { 
      name: "Acesso ilimitado a IA do JARVIS no WhatsApp", 
      freeTrial: false, 
      annual: true 
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Escolha seu Plano</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Comece com um período de teste gratuito ou assine nosso plano anual.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plano Gratuito */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 flex flex-col flex-grow">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Teste Gratuito</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">Grátis</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">por 7 dias</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6 flex-grow">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.freeTrial ? (
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`text-gray-700 dark:text-gray-300 ${!feature.freeTrial ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto">
                <button
                  onClick={handleStartFreeTrial}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processando...' : 'Começar Teste Gratuito'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Plano Anual */}
          <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-xl shadow-md overflow-hidden relative flex flex-col h-full">
            <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-medium">
              Mais Popular
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Plano Anual</h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">R$50</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">/ano</span>
                </div>
                <div>
                  <span className="text-sm line-through text-gray-500 dark:text-gray-400">R$150/ano</span>
                  <span className="ml-2 inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">Economia de 67%</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6 flex-grow">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{feature.name}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto">
                <button
                  onClick={handlePurchaseAnnualPlan}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-offset-gray-800"
                >
                  Assinar Plano Anual
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
          <p>Dúvidas? Entre em contato com nosso suporte.</p>
          <p className="mt-2">
            <Link href="/terms" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-4">
              Termos de Serviço
            </Link>
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 