-- ====================================
-- FASE 3: TRIGGERS E MIGRAÇÃO DE DADOS EXISTENTES
-- ====================================

-- 1. Criar triggers para auto-criação de customer_account
CREATE TRIGGER create_customer_account_trigger
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.create_customer_account();

-- 2. Criar triggers para atualização automática de saldos (vendas)
CREATE TRIGGER update_account_on_sale_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_on_sale_change();

-- 3. Criar triggers para atualização automática de saldos (pagamentos)  
CREATE TRIGGER update_account_on_payment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_on_payment_change();

-- 4. Trigger para atualizar updated_at nas customer_accounts
CREATE TRIGGER update_customer_accounts_updated_at
  BEFORE UPDATE ON public.customer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Criar customer_accounts para todos os clientes existentes
INSERT INTO public.customer_accounts (user_id, client_id)
SELECT c.user_id, c.id
FROM public.clients c
WHERE NOT EXISTS (
  SELECT 1 FROM public.customer_accounts ca 
  WHERE ca.client_id = c.id
);

-- 6. Marcar todas as vendas existentes como 'finalized' (já é o padrão)
UPDATE public.sales 
SET status = 'finalized' 
WHERE status IS NULL;

-- 7. Recalcular saldos para todas as accounts existentes
DO $$
DECLARE
    client_record RECORD;
BEGIN
    FOR client_record IN SELECT id FROM public.clients LOOP
        PERFORM public.recalculate_customer_account(client_record.id);
    END LOOP;
END $$;