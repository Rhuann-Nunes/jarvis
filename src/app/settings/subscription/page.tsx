'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserId } from '@/lib/user-utils';
import SubscriptionService, { Subscription } from '@/lib/subscription-service';

export default function SubscriptionSettingsPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
        
        setSubscription(currentSubscription);
        
        // Calcular dias restantes
        const days = await SubscriptionService.getRemainingDays(userId);
        setRemainingDays(days);
      } catch (error) {
        console.error('Erro ao carregar detalhes da assinatura:', error);
        setError('Não foi possível carregar os detalhes da assinatura. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSubscriptionDetails();
  }, [router]);
  
  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    const confirmCancel = window.confirm(
      'Tem certeza que deseja cancelar sua assinatura? Você continuará tendo acesso até o final do período atual.'
    );
    
    if (!confirmCancel) return;
    
    setIsCanceling(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const success = await SubscriptionService.cancelSubscription(subscription.id);
      
      if (success) {
        setSuccessMessage('Sua assinatura foi cancelada com sucesso. Você continuará tendo acesso até o final do período atual.');
        
        // Atualizar os detalhes da assinatura
        const userId = await getUserId();
        if (userId) {
          const updatedSubscription = await SubscriptionService.getCurrentSubscription(userId);
          if (updatedSubscription) {
            setSubscription(updatedSubscription);
          }
        }
      } else {
        setError('Não foi possível cancelar a assinatura. Tente novamente mais tarde.');
      }
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err);
      setError(err instanceof Error ? err.message : 'Erro ao cancelar assinatura');
    } finally {
      setIsCanceling(false);
    }
  };
  
  // Formatar data
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Obter nome do plano
  const getPlanName = (planType: string): string => {
    switch (planType) {
      case 'free_trial':
        return 'Período de Teste Gratuito';
      case 'annual':
        return 'Plano Anual';
      default:
        return planType;
    }
  };
  
  // Obter status da assinatura
  const getStatusLabel = (status: string): { label: string; color: string } => {
    switch (status) {
      case 'active':
        return { label: 'Ativa', color: 'bg-green-100 text-green-800' };
      case 'expired':
        return { label: 'Expirada', color: 'bg-gray-100 text-gray-800' };
      case 'canceled':
        return { label: 'Cancelada', color: 'bg-red-100 text-red-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gerenciar Assinatura</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      {isLoading ? (
        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-center h-40">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-600">Carregando informações da assinatura...</p>
          </div>
        </div>
      ) : subscription ? (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Detalhes da Assinatura</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusLabel(subscription.status).color}`}>
                {getStatusLabel(subscription.status).label}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Plano</dt>
                    <dd className="mt-1 text-sm text-gray-900">{getPlanName(subscription.planType)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Data de Início</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(subscription.startDate)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Data de Término</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(subscription.endDate)}</dd>
                  </div>
                  
                  {subscription.paymentId && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ID do Pagamento</dt>
                      <dd className="mt-1 text-sm text-gray-900">{subscription.paymentId}</dd>
                    </div>
                  )}
                </dl>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Status da Assinatura</h3>
                
                {subscription.status === 'active' && remainingDays !== null && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Tempo Restante</span>
                      <span className="text-sm text-gray-900">{remainingDays} dias</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (remainingDays / (subscription.planType === 'free_trial' ? 7 : 365)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-gray-600 mb-4">
                  {subscription.status === 'active' ? (
                    subscription.planType === 'free_trial' ? (
                      <>
                        <p>Seu período de teste termina em {remainingDays} dias.</p>
                        <p className="mt-2">Após o término, você precisará assinar um plano para continuar utilizando o sistema.</p>
                      </>
                    ) : (
                      <>
                        <p>Sua assinatura anual está ativa.</p>
                        <p className="mt-2">Você tem acesso completo a todas as funcionalidades do sistema até {formatDate(subscription.endDate)}.</p>
                      </>
                    )
                  ) : subscription.status === 'expired' ? (
                    <>
                      <p>Sua assinatura expirou em {formatDate(subscription.endDate)}.</p>
                      <p className="mt-2">Renove agora para retomar o acesso ao sistema.</p>
                    </>
                  ) : (
                    <>
                      <p>Sua assinatura foi cancelada.</p>
                      <p className="mt-2">Você pode renovar a qualquer momento para retomar o acesso.</p>
                    </>
                  )}
                </div>
                
                <div className="space-y-3">
                  {subscription.status === 'active' && subscription.planType === 'free_trial' && (
                    <a
                      href="https://pay.kiwify.com.br/FVYCKyf"
                      className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Assinar Plano Anual
                    </a>
                  )}
                  
                  {subscription.status === 'active' && subscription.planType === 'annual' && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={isCanceling}
                      className="block w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-center text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isCanceling ? 'Cancelando...' : 'Cancelar Assinatura'}
                    </button>
                  )}
                  
                  {(subscription.status === 'expired' || subscription.status === 'canceled') && (
                    <a
                      href="https://pay.kiwify.com.br/FVYCKyf"
                      className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Renovar Assinatura
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-600 mb-4">Você não possui uma assinatura ativa.</p>
          <Link
            href="/subscription/plans"
            className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Ver Planos Disponíveis
          </Link>
        </div>
      )}
    </div>
  );
} 