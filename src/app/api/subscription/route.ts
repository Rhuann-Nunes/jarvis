import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { addDays, addYears } from 'date-fns';

// Obter detalhes da assinatura do usuário atual
export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request as any });
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = token.sub;
    
    // Buscar a assinatura atual do usuário
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('end_date', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Erro ao buscar assinatura:', error);
      return NextResponse.json({ error: 'Erro ao buscar assinatura' }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ hasSubscription: false });
    }
    
    // Verificar se a assinatura está ativa
    const subscription = data[0];
    const isActive = subscription.status === 'active' && new Date(subscription.end_date) > new Date();
    
    return NextResponse.json({
      hasSubscription: isActive,
      subscription: {
        id: subscription.id,
        userId: subscription.user_id,
        planType: subscription.plan_type,
        status: subscription.status,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        paymentId: subscription.payment_id,
        paymentProvider: subscription.payment_provider,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at,
        metadata: subscription.metadata
      }
    });
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return NextResponse.json({ error: 'Erro ao verificar assinatura' }, { status: 500 });
  }
}

// Criar assinatura de teste gratuito
export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request as any });
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = token.sub;
    
    // Verificar se o usuário já tem uma assinatura ativa
    const { data: existingData, error: existingError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .limit(1);
    
    if (existingError) {
      console.error('Erro ao verificar assinatura existente:', existingError);
      return NextResponse.json({ error: 'Erro ao verificar assinatura existente' }, { status: 500 });
    }
    
    if (existingData && existingData.length > 0) {
      return NextResponse.json({ error: 'Usuário já possui uma assinatura ativa' }, { status: 400 });
    }
    
    // Verificar se o usuário já utilizou o período de teste gratuito
    const { data: trialData, error: trialError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_type', 'free_trial')
      .limit(1);
    
    if (trialError) {
      console.error('Erro ao verificar uso do período de teste:', trialError);
      return NextResponse.json({ error: 'Erro ao verificar uso do período de teste' }, { status: 500 });
    }
    
    if (trialData && trialData.length > 0) {
      return NextResponse.json({ error: 'Usuário já utilizou o período de teste gratuito' }, { status: 400 });
    }
    
    // Criar assinatura de teste gratuito
    const now = new Date();
    const endDate = addDays(now, 7); // 7 dias de período de teste
    
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'free_trial',
        status: 'active',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        metadata: { source: 'api_request' }
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar assinatura de teste gratuito:', error);
      return NextResponse.json({ error: 'Erro ao criar assinatura de teste gratuito' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: data.id,
        userId: data.user_id,
        planType: data.plan_type,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('Erro ao criar assinatura de teste gratuito:', error);
    return NextResponse.json({ error: 'Erro ao criar assinatura de teste gratuito' }, { status: 500 });
  }
}

// Cancelar assinatura
export async function PATCH(request: Request) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request as any });
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = token.sub;
    
    // Obter ID da assinatura do corpo da requisição
    const { subscriptionId } = await request.json();
    
    if (!subscriptionId) {
      return NextResponse.json({ error: 'ID da assinatura não fornecido' }, { status: 400 });
    }
    
    // Verificar se a assinatura pertence ao usuário
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();
    
    if (subscriptionError) {
      console.error('Erro ao verificar assinatura:', subscriptionError);
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }
    
    // Cancelar assinatura
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('id', subscriptionId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 });
  }
} 