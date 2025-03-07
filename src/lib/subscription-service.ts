'use client';

import { supabase } from './supabase';
import { addDays, addYears } from 'date-fns';

export type SubscriptionPlan = 'free_trial' | 'annual';
export type SubscriptionStatus = 'active' | 'expired' | 'canceled';

export interface Subscription {
  id: string;
  userId: string;
  planType: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  paymentId?: string;
  paymentProvider?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export const SubscriptionService = {
  /**
   * Verifica se o usuário possui uma assinatura ativa
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    if (!userId) return false;
    
    try {
      console.log('Verificando assinatura ativa para userId:', userId);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Erro ao verificar assinatura ativa:', error);
        return false;
      }
      
      const hasSubscription = Boolean(data && data.length > 0);
      console.log('Usuário possui assinatura ativa?', hasSubscription);
      
      return hasSubscription;
    } catch (error) {
      console.error('Erro ao verificar assinatura ativa:', error);
      return false;
    }
  },
  
  /**
   * Obtém os detalhes da assinatura atual do usuário
   */
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    if (!userId) return null;
    
    try {
      console.log('Buscando assinatura atual para userId:', userId);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('end_date', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Erro ao obter assinatura atual:', error);
        return null;
      }
      
      console.log('Dados de assinatura recuperados:', data?.length ? 'Sim' : 'Não');
      
      if (!data || data.length === 0) return null;
      
      return {
        id: data[0].id,
        userId: data[0].user_id,
        planType: data[0].plan_type,
        status: data[0].status,
        startDate: new Date(data[0].start_date),
        endDate: new Date(data[0].end_date),
        paymentId: data[0].payment_id,
        paymentProvider: data[0].payment_provider,
        createdAt: new Date(data[0].created_at),
        updatedAt: new Date(data[0].updated_at),
        metadata: data[0].metadata
      };
    } catch (error) {
      console.error('Erro ao obter assinatura atual:', error);
      return null;
    }
  },
  
  /**
   * Verifica se o usuário já utilizou o período de teste gratuito
   */
  async hasUsedFreeTrial(userId: string): Promise<boolean> {
    if (!userId) return false;
    
    try {
      console.log('Verificando uso de período de teste para userId:', userId);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_type', 'free_trial')
        .limit(1);
      
      if (error) {
        console.error('Erro ao verificar uso do período de teste:', error);
        return false;
      }
      
      const hasUsed = Boolean(data && data.length > 0);
      console.log('Usuário já utilizou período de teste?', hasUsed);
      
      return hasUsed;
    } catch (error) {
      console.error('Erro ao verificar uso do período de teste:', error);
      return false;
    }
  },
  
  /**
   * Cria uma assinatura de período de teste gratuito
   */
  async createFreeTrial(userId: string): Promise<Subscription | null> {
    if (!userId) return null;
    
    try {
      console.log('Tentando criar período de teste gratuito para userId:', userId);
      
      // Verificar se o usuário já utilizou o período de teste
      const hasUsed = await this.hasUsedFreeTrial(userId);
      
      if (hasUsed) {
        console.warn('Usuário já utilizou o período de teste gratuito');
        throw new Error('O usuário já utilizou o período de teste gratuito');
      }
      
      const now = new Date();
      const endDate = addDays(now, 7); // 7 dias de período de teste
      
      console.log('Inserindo registro de assinatura de teste gratuito com datas:', {
        start: now.toISOString(),
        end: endDate.toISOString()
      });
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'free_trial',
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          metadata: { source: 'user_signup' }
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar período de teste gratuito:', error);
        throw new Error(`Erro ao criar período de teste gratuito: ${JSON.stringify(error)}`);
      }
      
      console.log('Período de teste gratuito criado com sucesso, id:', data.id);
      
      return {
        id: data.id,
        userId: data.user_id,
        planType: data.plan_type,
        status: data.status,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Erro ao criar período de teste gratuito:', error);
      throw error;
    }
  },
  
  /**
   * Cria uma assinatura anual
   */
  async createAnnualSubscription(userId: string, paymentDetails: { 
    paymentId: string, 
    paymentProvider: string 
  }): Promise<Subscription | null> {
    if (!userId) return null;
    
    try {
      console.log('Tentando criar assinatura anual para userId:', userId);
      
      const now = new Date();
      const endDate = addYears(now, 1); // 1 ano de assinatura
      
      console.log('Inserindo registro de assinatura anual com datas:', {
        start: now.toISOString(),
        end: endDate.toISOString()
      });
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'annual',
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          payment_id: paymentDetails.paymentId,
          payment_provider: paymentDetails.paymentProvider,
          metadata: { source: 'annual_purchase' }
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar assinatura anual:', error);
        throw new Error(`Erro ao criar assinatura anual: ${JSON.stringify(error)}`);
      }
      
      console.log('Assinatura anual criada com sucesso, id:', data.id);
      
      return {
        id: data.id,
        userId: data.user_id,
        planType: data.plan_type,
        status: data.status,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        paymentId: data.payment_id,
        paymentProvider: data.payment_provider,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Erro ao criar assinatura anual:', error);
      throw error;
    }
  },
  
  /**
   * Cancela a assinatura atual do usuário
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!subscriptionId) return false;
    
    try {
      console.log('Tentando cancelar assinatura id:', subscriptionId);
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscriptionId);
      
      if (error) {
        console.error('Erro ao cancelar assinatura:', error);
        return false;
      }
      
      console.log('Assinatura cancelada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return false;
    }
  },
  
  /**
   * Verifica quantos dias restam na assinatura atual
   */
  async getRemainingDays(userId: string): Promise<number | null> {
    const subscription = await this.getCurrentSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
      return null;
    }
    
    const now = new Date();
    const endDate = subscription.endDate;
    
    // Calcular a diferença em milissegundos e converter para dias
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays); // Garantir que não retorne número negativo
  }
};

export default SubscriptionService; 