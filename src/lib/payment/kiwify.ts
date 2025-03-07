import { addYears } from 'date-fns';

// Tipos de eventos do Kiwify
export enum KiwifyEventType {
  ORDER_APPROVED = 'order_approved',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_REFUNDED = 'order_refunded',
  SUBSCRIPTION_CHARGED = 'subscription_charged',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  SUBSCRIPTION_EXPIRED = 'subscription_expired'
}

// Tipo para resposta do Kiwify
export interface KiwifyCustomer {
  email: string;
  first_name: string;
  full_name: string;
  city: string;
  state: string;
  zipcode: string;
  mobile?: string;
}

export interface KiwifySubscription {
  id: string;
  plan: {
    id: string;
    name: string;
    frequency: string;
  };
  start_date: string;
  next_payment: string;
  status: string;
}

export interface KiwifyOrderData {
  order_id: string;
  order_ref: string;
  order_status: string;
  payment_method: string;
  card_last4digits?: string;
  card_type?: string;
  webhook_event_type: string;
  Customer: KiwifyCustomer;
  Subscription?: KiwifySubscription;
}

export interface SubscriptionData {
  userId: string;
  planType: 'annual' | 'free_trial';
  startDate: Date;
  endDate: Date;
  paymentId: string;
  paymentProvider: string;
  metadata: Record<string, any>;
}

/**
 * Converte dados do webhook do Kiwify para o formato de assinatura da aplicação
 */
export const convertKiwifyOrderToSubscription = (
  userId: string,
  kiwifyData: KiwifyOrderData
): SubscriptionData => {
  const startDate = kiwifyData.Subscription 
    ? new Date(kiwifyData.Subscription.start_date) 
    : new Date();
  
  const endDate = addYears(startDate, 1); // Assinatura anual
  
  return {
    userId,
    planType: 'annual',
    startDate,
    endDate,
    paymentId: kiwifyData.order_id,
    paymentProvider: 'kiwify',
    metadata: {
      subscription_id: kiwifyData.Subscription?.id,
      payment_method: kiwifyData.payment_method,
      card_last4digits: kiwifyData.card_last4digits,
      order_id: kiwifyData.order_id,
      order_ref: kiwifyData.order_ref,
      customer_email: kiwifyData.Customer.email,
      customer_name: kiwifyData.Customer.full_name,
      source: 'kiwify_webhook'
    }
  };
};

/**
 * Valida a assinatura do webhook do Kiwify
 * Na implementação real, você deve verificar a assinatura HMAC
 */
export const validateKiwifySignature = (signature: string, payload: any): boolean => {
  // TODO: Implementar verificação real
  // Em um ambiente de produção, isso deve validar o HMAC
  
  // Por enquanto, apenas verificamos se há uma assinatura
  return !!signature;
}; 