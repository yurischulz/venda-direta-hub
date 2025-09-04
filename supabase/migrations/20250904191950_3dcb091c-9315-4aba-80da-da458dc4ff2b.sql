-- ====================================
-- FASE 2: FUNÇÕES E TRIGGERS AUTOMÁTICOS
-- ====================================

-- 1. Função para criar customer_account automaticamente quando um cliente é criado
CREATE OR REPLACE FUNCTION public.create_customer_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_accounts (user_id, client_id)
  VALUES (NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para recalcular saldos da customer_account
CREATE OR REPLACE FUNCTION public.recalculate_customer_account(account_client_id UUID)
RETURNS VOID AS $$
DECLARE
  account_record RECORD;
  total_sales_amount NUMERIC := 0;
  total_payments_amount NUMERIC := 0;
  last_transaction TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar o registro da account
  SELECT * INTO account_record 
  FROM public.customer_accounts 
  WHERE client_id = account_client_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calcular total de vendas finalizadas
  SELECT COALESCE(SUM(total), 0) INTO total_sales_amount
  FROM public.sales 
  WHERE client_id = account_client_id 
  AND status = 'finalized';
  
  -- Calcular total de recebimentos
  SELECT COALESCE(SUM(amount), 0) INTO total_payments_amount
  FROM public.payments 
  WHERE client_id = account_client_id;
  
  -- Buscar última transação (mais recente entre vendas e pagamentos)
  SELECT GREATEST(
    COALESCE((SELECT MAX(created_at) FROM public.sales WHERE client_id = account_client_id), '1970-01-01'::timestamp),
    COALESCE((SELECT MAX(paid_at) FROM public.payments WHERE client_id = account_client_id), '1970-01-01'::timestamp)
  ) INTO last_transaction;
  
  -- Atualizar customer_account
  UPDATE public.customer_accounts 
  SET 
    total_sales = total_sales_amount,
    total_payments = total_payments_amount,
    current_balance = total_sales_amount - total_payments_amount,
    last_transaction_at = CASE WHEN last_transaction > '1970-01-01'::timestamp THEN last_transaction ELSE NULL END,
    updated_at = now()
  WHERE client_id = account_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função trigger para atualizar saldos quando vendas mudam
CREATE OR REPLACE FUNCTION public.update_account_on_sale_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' then
    PERFORM public.recalculate_customer_account(OLD.client_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.recalculate_customer_account(OLD.client_id);
    IF OLD.client_id != NEW.client_id THEN
      PERFORM public.recalculate_customer_account(NEW.client_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_customer_account(NEW.client_id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função trigger para atualizar saldos quando pagamentos mudam
CREATE OR REPLACE FUNCTION public.update_account_on_payment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_customer_account(OLD.client_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.recalculate_customer_account(OLD.client_id);
    IF OLD.client_id != NEW.client_id THEN
      PERFORM public.recalculate_customer_account(NEW.client_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_customer_account(NEW.client_id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;