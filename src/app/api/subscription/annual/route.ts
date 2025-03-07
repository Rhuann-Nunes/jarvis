import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { addYears } from 'date-fns';

// Criar assinatura anual
export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request as any });
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = token.sub;
    
    // Obter dados de pagamento do corpo da requisição
    const { paymentId, paymentProvider } = await request.json();
    
    if (!paymentId || !paymentProvider) {
      return NextResponse.json({ error: 'Dados de pagamento incompletos' }, { status: 400 });
    }
    
    // Verificar se o usuário já tem uma assinatura anual ativa
    const { data: existingData, error: existingError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_type', 'annual')
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .limit(1);
    
    if (existingError) {
      console.error('Erro ao verificar assinatura existente:', existingError);
      return NextResponse.json({ error: 'Erro ao verificar assinatura existente' }, { status: 500 });
    }
    
    if (existingData && existingData.length > 0) {
      return NextResponse.json({ error: 'Usuário já possui uma assinatura anual ativa' }, { status: 400 });
    }
    
    // Criar assinatura anual
    const now = new Date();
    const endDate = addYears(now, 1); // 1 ano de assinatura
    
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'annual',
        status: 'active',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        payment_id: paymentId,
        payment_provider: paymentProvider,
        metadata: { 
          source: 'annual_api_purchase',
          amount: 19990, // Valor em centavos: R$ 199,90
          currency: 'BRL'
        }
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar assinatura anual:', error);
      return NextResponse.json({ error: 'Erro ao criar assinatura anual' }, { status: 500 });
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
        paymentId: data.payment_id,
        paymentProvider: data.payment_provider,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('Erro ao criar assinatura anual:', error);
    return NextResponse.json({ error: 'Erro ao criar assinatura anual' }, { status: 500 });
  }
} 