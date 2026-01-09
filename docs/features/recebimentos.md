# Recebimentos — Registro e Relatórios

Resumo: registro de pagamentos, associação a clientes (e possivelmente a vendas) e exibição de histórico e saldos.

Arquivos chave

- `src/pages/Payments.tsx`
- `src/components/forms/PaymentForm.tsx`

Fluxo

- Registrar pagamento → inserir em `payments` → invalidar queries relacionadas ao cliente e ao dashboard.
