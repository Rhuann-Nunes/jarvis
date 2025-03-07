# Sistema de Assinaturas do JARVIS

## Visão Geral

O JARVIS implementa um sistema de assinaturas com duas opções:

1. **Período de Teste Gratuito (7 dias)**
   - Acesso completo a todas as funcionalidades
   - Expira automaticamente após 7 dias
   - Disponível apenas uma vez por usuário

2. **Plano Anual (R$ 199,90)**
   - Acesso completo a todas as funcionalidades por 1 ano
   - Renovação manual ao final do período
   - Suporte prioritário e recursos premium

## Estrutura de Dados

### Tabela `subscriptions`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único da assinatura |
| user_id | UUID | Referência ao usuário (FK para auth.users) |
| plan_type | VARCHAR | Tipo do plano: 'free_trial' ou 'annual' |
| status | VARCHAR | Status: 'active', 'expired', 'canceled' |
| start_date | TIMESTAMP | Data de início da assinatura |
| end_date | TIMESTAMP | Data de término da assinatura |
| payment_id | VARCHAR | ID do pagamento (para plano anual) |
| payment_provider | VARCHAR | Provedor de pagamento (para plano anual) |
| created_at | TIMESTAMP | Data de criação do registro |
| updated_at | TIMESTAMP | Data da última atualização do registro |
| metadata | JSONB | Metadados adicionais da assinatura |

## Fluxo de Verificação de Assinaturas

1. Quando um usuário acessa o sistema, o middleware (`middleware.ts`) verifica se há uma assinatura ativa
2. Se não houver assinatura ativa, o usuário é redirecionado para a página de planos
3. A página de planos oferece as opções de período de teste gratuito ou plano anual
4. Após selecionar um plano, o usuário é redirecionado para a página adequada

### Diagrama de Fluxo

```
Usuário → Middleware → Verificação de Assinatura → Redirecionamento

Se não há assinatura:
Usuário → Página de Planos → Teste Gratuito ou Plano Anual → Ativação da Assinatura

Se já tem assinatura:
Usuário → Acesso ao Sistema
```

## Funcionalidades Implementadas

### 1. Verificação Automática de Assinaturas

- Middleware que verifica se o usuário possui assinatura ativa para acessar o sistema
- Redirecionamento automático para a página de planos quando necessário
- Proteção de rotas para garantir acesso apenas a usuários com assinatura ativa

### 2. Período de Teste Gratuito

- Criação de período de teste de 7 dias
- Verificação para garantir que o usuário só utilize o período de teste uma vez
- Expiração automática após 7 dias

### 3. Plano Anual

- Fluxo de pagamento (simulado) para o plano anual
- Criação de assinatura anual com validade de 365 dias
- Processamento seguro de informações de pagamento

### 4. Gerenciamento de Assinaturas

- Página para visualizar detalhes da assinatura atual
- Opção para cancelar assinatura
- Visualização do tempo restante da assinatura

### 5. APIs para Gerenciamento

- `GET /api/subscription` - Obter detalhes da assinatura atual
- `POST /api/subscription` - Criar assinatura de teste gratuito
- `PATCH /api/subscription` - Cancelar assinatura
- `POST /api/subscription/annual` - Criar assinatura anual

## Verificação e Expiração Automática

O sistema inclui dois mecanismos para expiração automática:

1. **Trigger SQL**: Atualiza automaticamente o status para 'expired' quando a data de término é ultrapassada
2. **Verificação em Tempo Real**: O middleware verifica a data de término para determinar se a assinatura ainda está ativa

## Integração com Pagamentos

Para o plano anual, o sistema está preparado para integração com provedores de pagamento como Stripe, PayPal, etc.

- O processo atual é uma simulação para demonstração
- A estrutura de dados já suporta informações de pagamento reais
- A implementação pode ser facilmente estendida para um provedor de pagamento real

## Próximos Passos

1. **Integração Real de Pagamentos**
   - Implementar integração com Stripe, PayPal ou outro provedor
   - Adicionar webhooks para processamento assíncrono de pagamentos

2. **Renovação Automática**
   - Implementar renovação automática de assinaturas anuais
   - Adicionar notificações por e-mail sobre renovação

3. **Planos Adicionais**
   - Adicionar novos tipos de planos (ex: mensal, trimestral)
   - Implementar funcionalidades premium para planos específicos

4. **Relatórios e Analytics**
   - Dashboard para administração com métricas de assinaturas
   - Relatórios sobre conversão, retenção e receita

## Como Usar o Sistema de Assinaturas

### Para Desenvolvedores

Para verificar se um usuário possui assinatura ativa:

```typescript
import SubscriptionService from '@/lib/subscription-service';

// Verificar assinatura ativa
const hasSubscription = await SubscriptionService.hasActiveSubscription(userId);

// Obter detalhes da assinatura atual
const subscription = await SubscriptionService.getCurrentSubscription(userId);

// Criar assinatura de teste gratuito
const freeTrial = await SubscriptionService.createFreeTrial(userId);

// Criar assinatura anual
const annualSub = await SubscriptionService.createAnnualSubscription(userId, {
  paymentId: 'payment_id',
  paymentProvider: 'stripe'
});

// Cancelar assinatura
const canceled = await SubscriptionService.cancelSubscription(subscriptionId);
```

### Para Administradores

Para gerenciar assinaturas no painel administrativo do Supabase:

1. Acesse o painel do Supabase e vá para a tabela `subscriptions`
2. Você pode visualizar, filtrar e editar assinaturas diretamente
3. Para relatórios avançados, use a interface SQL do Supabase para consultas personalizadas

## Considerações de Segurança

- As políticas RLS (Row Level Security) estão configuradas para garantir que um usuário só possa acessar suas próprias assinaturas
- As operações de criação e gerenciamento de assinaturas só podem ser realizadas pelo próprio usuário ou por administradores
- Toda a comunicação com APIs de pagamento deve ser feita pelo servidor, nunca diretamente pelo cliente 