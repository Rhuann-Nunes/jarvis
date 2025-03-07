'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserId } from '@/lib/user-utils';
import SubscriptionService from '@/lib/subscription-service';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<{
    planType: string;
    endDate: Date;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadSubscriptionDetails = async () => {
      try {
        const userId = await getUserId();
        
        if (!userId) {
          router.push('/login');
          return;
        }
        
        const currentSubscription = await SubscriptionService.getCurrentSubscription(userId);
        
        if (!currentSubscription) {
          router.push('/subscription/plans');
          return;
        }
        
        setSubscription({
          planType: currentSubscription.planType,
          endDate: currentSubscription.endDate
        });
      } catch (error) {
        console.error('Erro ao carregar detalhes da assinatura:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSubscriptionDetails();
  }, [router]);
  
  // Formatação da data
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-8 text-center">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando informações da assinatura...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-10 w-10 text-green-600 dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assinatura Confirmada!</h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Obrigado por assinar o {subscription?.planType === 'annual' ? 'Plano Anual' : 'Período de Teste'}.
              Seu acesso está ativo até {subscription ? formatDate(subscription.endDate) : '...'}.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-2">O que acontece agora?</h3>
              <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-2 text-left">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Você tem acesso imediato a todas as funcionalidades do sistema</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Você receberá um e-mail com os detalhes da sua assinatura</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Você pode gerenciar sua assinatura a qualquer momento nas configurações</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-offset-gray-800"
              >
                Ir para o Dashboard
              </Link>
              
              <Link
                href="/settings/subscription"
                className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 dark:ring-offset-gray-800"
              >
                Gerenciar Assinatura
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 