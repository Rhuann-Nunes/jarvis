'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getUserId } from '@/lib/user-utils';
import SubscriptionService from '@/lib/subscription-service';

interface CheckoutFormData {
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CheckoutFormData>({
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Formatação específica para cada campo
    let formattedValue = value;
    
    if (name === 'cardNumber') {
      // Formatar número do cartão: xxxx xxxx xxxx xxxx
      formattedValue = value
        .replace(/\s/g, '') // Remover espaços
        .replace(/\D/g, '') // Manter apenas dígitos
        .replace(/(\d{4})(?=\d)/g, '$1 ') // Adicionar espaço a cada 4 dígitos
        .trim();
    } else if (name === 'cardExpiry') {
      // Formatar data de expiração: MM/YY
      formattedValue = value
        .replace(/\D/g, '') // Manter apenas dígitos
        .replace(/(\d{2})(?=\d)/g, '$1/') // Adicionar / após 2 dígitos
        .slice(0, 5); // Limitar a 5 caracteres (MM/YY)
    } else if (name === 'cardCvc') {
      // Formatar CVC: manter apenas dígitos e limitar a 4 caracteres
      formattedValue = value
        .replace(/\D/g, '') // Manter apenas dígitos
        .slice(0, 4); // Limitar a 4 caracteres
    } else if (name === 'zipCode') {
      // Formatar CEP: 12345-678
      formattedValue = value
        .replace(/\D/g, '') // Manter apenas dígitos
        .replace(/^(\d{5})(\d)/g, '$1-$2') // Adicionar - após 5 dígitos
        .slice(0, 9); // Limitar a 9 caracteres (XXXXX-XXX)
    }
    
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };
  
  const validateForm = (): boolean => {
    // Simplificado para este exemplo, você pode adicionar validações mais robustas
    if (!formData.cardName || formData.cardName.length < 3) {
      setError('Nome do titular inválido');
      return false;
    }
    
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 15) {
      setError('Número do cartão inválido');
      return false;
    }
    
    if (!formData.cardExpiry || formData.cardExpiry.length !== 5) {
      setError('Data de expiração inválida');
      return false;
    }
    
    if (!formData.cardCvc || formData.cardCvc.length < 3) {
      setError('CVC inválido');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = await getUserId();
      
      if (!userId) {
        setError('Você precisa estar logado para assinar o plano anual.');
        return;
      }
      
      // Simulação de processamento de pagamento
      // Em produção, aqui você usaria um serviço de pagamento real como Stripe, Paypal, etc.
      const simulatePaymentProcessing = async (): Promise<{ id: string, provider: string }> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              provider: 'stripe_demo'
            });
          }, 2000); // Simulação de 2 segundos de processamento
        });
      };
      
      // Processar pagamento
      const paymentResult = await simulatePaymentProcessing();
      
      // Criar assinatura anual
      const subscription = await SubscriptionService.createAnnualSubscription(userId, {
        paymentId: paymentResult.id,
        paymentProvider: paymentResult.provider
      });
      
      if (!subscription) {
        setError('Não foi possível criar a assinatura anual.');
        return;
      }
      
      // Redirecionar para a página de sucesso
      router.push('/subscription/success');
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 p-8 bg-blue-600 dark:bg-blue-700">
            <h2 className="text-2xl font-bold text-white mb-6">Resumo do Pedido</h2>
            <div className="border-t border-blue-500 pt-4 mb-4">
              <div className="flex justify-between text-blue-100 mb-2">
                <span>Plano Anual</span>
                <span>R$50,00</span>
              </div>
              <div className="flex justify-between text-blue-100 mb-2">
                <span>Valor anterior</span>
                <span className="line-through">R$150,00</span>
              </div>
              <div className="flex justify-between text-blue-100 mb-2">
                <span>Economia</span>
                <span>R$100,00</span>
              </div>
              <div className="flex justify-between text-blue-100 mb-2">
                <span>Impostos</span>
                <span>Inclusos</span>
              </div>
              <div className="flex justify-between text-white font-bold text-lg mt-4 pt-4 border-t border-blue-500">
                <span>Total</span>
                <span>R$50,00</span>
              </div>
            </div>
            <div className="mt-8 text-blue-100">
              <h3 className="font-medium text-white mb-2">O que você recebe:</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Criação de tarefas com linguagem natural</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Tarefas recorrentes e agendamento</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Notificações no WhatsApp</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>IA JARVIS ilimitada no WhatsApp</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="md:w-1/2 p-8 dark:bg-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Informações de Pagamento</h2>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome no Cartão
                </label>
                <input
                  type="text"
                  id="cardName"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  placeholder="Digite o nome como está no cartão"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número do Cartão
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    id="cardExpiry"
                    name="cardExpiry"
                    value={formData.cardExpiry}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    placeholder="MM/AA"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    id="cardCvc"
                    name="cardCvc"
                    value={formData.cardCvc}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  placeholder="Rua, número, complemento"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    placeholder="Sua cidade"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    placeholder="UF"
                    maxLength={2}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  placeholder="12345-678"
                  maxLength={9}
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processando...' : 'Finalizar Compra'}
              </button>
              
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                Seus dados de pagamento são processados com segurança.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 