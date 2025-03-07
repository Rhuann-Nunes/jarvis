-- Criação da tabela de assinaturas
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free_trial', 'annual')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'expired', 'canceled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_id VARCHAR(255),
  payment_provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Índices para melhorar a performance das consultas mais comuns
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);

-- Adicionar políticas de acesso RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados verem apenas suas próprias assinaturas
CREATE POLICY "Users can view their own subscriptions" 
ON subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Política para permitir que apenas o próprio usuário ou administradores possam atualizar assinaturas
CREATE POLICY "Users can update their own subscriptions" 
ON subscriptions FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para permitir inserções apenas para o próprio usuário
CREATE POLICY "Users can insert their own subscriptions" 
ON subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Corrigir o problema de recursão na função para expirar assinaturas automaticamente
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS TRIGGER AS $$
BEGIN
  -- Usar uma cláusula WHERE mais específica para evitar recursão
  -- Nós adicionamos "AND status <> 'expired'" para garantir que só atualizamos 
  -- o que precisa ser atualizado e evitamos recursão infinita
  UPDATE subscriptions
  SET status = 'expired'
  WHERE end_date < NOW() 
    AND status = 'active'
    -- Identificar explicitamente qual registro está sendo atualizado para evitar loops
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Tornar o trigger mais específico para INSERT apenas
-- Isso evita a recursão durante as operações de UPDATE
CREATE TRIGGER check_expired_subscriptions_trigger
AFTER INSERT ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION check_expired_subscriptions();

-- Para ativar o job de expiração diária, criamos uma função separada sem trigger
CREATE OR REPLACE FUNCTION expire_old_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired'
  WHERE end_date < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Agendador para verificar assinaturas expiradas diariamente
-- Nota: Esta parte requer a extensão pg_cron no Supabase
-- Se ocorrer erro, você pode removê-la e criar uma tarefa programada na aplicação
-- ou executar esta função periodicamente por outro meio
SELECT cron.schedule(
  'check-expired-subscriptions-daily',
  '0 0 * * *',  -- Executa diariamente à meia-noite
  $$
  SELECT expire_old_subscriptions();
  $$
); 