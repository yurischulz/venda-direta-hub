-- ====================================
-- FASE 1: REESTRUTURAÇÃO PARA SISTEMA DE CREDIÁRIO/FICHA
-- ====================================

-- 1. Criar enum para status das vendas
CREATE TYPE public.sale_status AS ENUM ('draft', 'finalized', 'cancelled');

-- 2. Criar enum para status das contas de clientes  
CREATE TYPE public.account_status AS ENUM ('active', 'blocked', 'inactive');

-- 3. Criar tabela central: customer_accounts (ficha do cliente)
CREATE TABLE public.customer_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL UNIQUE, -- relacionamento 1:1 com cliente
  current_balance NUMERIC NOT NULL DEFAULT 0, -- saldo atual (vendas - recebimentos)
  total_sales NUMERIC NOT NULL DEFAULT 0, -- total de vendas acumulado
  total_payments NUMERIC NOT NULL DEFAULT 0, -- total de recebimentos acumulado
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  status account_status NOT NULL DEFAULT 'active',
  notes TEXT, -- observações sobre a conta
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Adicionar colunas à tabela sales
ALTER TABLE public.sales 
ADD COLUMN status sale_status NOT NULL DEFAULT 'finalized',
ADD COLUMN payment_terms TEXT,
ADD COLUMN due_date DATE,
ADD COLUMN notes TEXT;

-- 5. Adicionar coluna à tabela payments para vincular a vendas específicas
ALTER TABLE public.payments 
ADD COLUMN sale_id UUID, -- nullable - para pagamentos vinculados a vendas específicas
ADD COLUMN notes TEXT;

-- 6. Habilitar RLS na nova tabela
ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para customer_accounts
CREATE POLICY "customer_accounts_select_own" 
  ON public.customer_accounts 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "customer_accounts_insert_own" 
  ON public.customer_accounts 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "customer_accounts_update_own" 
  ON public.customer_accounts 
  FOR UPDATE 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "customer_accounts_delete_own" 
  ON public.customer_accounts 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 8. Criar índices para performance
CREATE INDEX idx_customer_accounts_user_id ON public.customer_accounts(user_id);
CREATE INDEX idx_customer_accounts_client_id ON public.customer_accounts(client_id);
CREATE INDEX idx_customer_accounts_status ON public.customer_accounts(status);
CREATE INDEX idx_payments_sale_id ON public.payments(sale_id) WHERE sale_id IS NOT NULL;
CREATE INDEX idx_sales_status ON public.sales(status);
CREATE INDEX idx_sales_due_date ON public.sales(due_date) WHERE due_date IS NOT NULL;