# Vendas — Fluxos e Regras de Negócio

Resumo: criação de vendas com múltiplos itens, vínculo a cliente e afiliação, captura de localização e estados (draft/finalized/cancelled).

Arquivos chave
- `src/pages/Sales.tsx`
- `src/components/forms/SaleForm.tsx`

Fluxo crítico
- O `SaleForm` calcula total automaticamente e ao submeter insere `sales` e `sale_items` no Supabase.
- Após inserção, invalidar queries: `sales`, `customer-accounts`, `dashboard-stats`.

Efeito colateral: atualizar `customer_accounts` (via função SQL ou lógica server-side) para refletir novo saldo.
