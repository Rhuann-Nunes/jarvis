-- Script para criar políticas RLS para a tabela de projetos
-- Ativar RLS para a tabela projetos
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- Limpar políticas existentes para começar do zero
DROP POLICY IF EXISTS \
Usuários
podem
ler
seus
próprios
projetos\ ON public.projects;
-- Criar uma função para verificar políticas (para depuração)
