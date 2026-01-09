# Exemplos Executáveis e Payloads

Este arquivo reúne comandos úteis, snippets e payloads de exemplo para desenvolvimento, migrações e integrações com Supabase.

## Comandos locais

- Instalar dependências (use `npm` ou `pnpm`):

```bash
npm install
# ou
pnpm install
```

- Rodar em desenvolvimento (Vite):

```bash
npm run dev
```

- Build (produção):

```bash
npm run build
```

- Preview da build:

```bash
npm run preview
```

- Lintar código:

```bash
npm run lint
```

## Capacitor (mobile)

- Adicionar platforma Android/iOS e sincronizar:

```bash
npx cap add android
npx cap add ios
npx cap sync
npx cap open android
```

- Checklist rápido para GPS em mobile:
- Configurar permissões em `AndroidManifest.xml` e `Info.plist`.
- Conceder permissão no app.

## Supabase — Migrations

- Criar nova migration (Supabase CLI):

```bash
supabase migration new "add_column_x"
```

- Aplicar migrations localmente (quando disponível na sua configuração):

```bash
supabase db push
# ou use o fluxo do seu CI para aplicar em staging/prod
```

> Sempre inclua o arquivo SQL gerado em `supabase/migrations` no PR.

## Snippets supabase-js (exemplos)

- Inserir um cliente (exemplo):

```ts
import { supabase } from "./src/integrations/supabase/client";

const payload = {
  name: "João Silva",
  phone: "+5511999999999",
  cpf: "12345678901",
  email: "joao@example.com",
  cep: "01001000",
  address: "Praça da Sé, 1",
  lat: -23.55052,
  lng: -46.633308,
};

const { data, error } = await supabase.from("clients").insert(payload).select();
```

- Criar venda com itens (exemplo):

```ts
const sale = {
  client_id: "uuid-do-cliente",
  affiliation_id: "uuid-da-afiliacao",
  total: 150.0,
  status: "finalized",
  lat: -23.55,
  lng: -46.63,
};

const items = [
  { product_id: "uuid-prod-1", price: 50.0, quantity: 1 },
  { product_id: "uuid-prod-2", price: 100.0, quantity: 1 },
];

// Exemplo simplificado: inserir venda e items em transação (ou chamadas encadeadas)
const { data: saleData, error: saleError } = await supabase
  .from("sales")
  .insert(sale)
  .select();
if (saleError) throw saleError;
const saleId = saleData[0].id;
await supabase
  .from("sale_items")
  .insert(items.map((i) => ({ ...i, sale_id: saleId })));

// Invalidate queries (ex.: com react-query)
// queryClient.invalidateQueries(['sales'])
```

- Registrar pagamento (exemplo):

```ts
const payment = {
  client_id: "uuid-do-cliente",
  amount: 50.0,
  method: "cash",
  note: "Pagamento parcial",
  received_at: new Date().toISOString(),
};

await supabase.from("payments").insert(payment);
// queryClient.invalidateQueries(['customer-accounts','dashboard-stats'])
```

## Exemplos de payloads JSON

- Cliente (JSON):

```json
{
  "name": "Maria Pereira",
  "phone": "+5511988887777",
  "cpf": "98765432100",
  "email": "maria@example.com",
  "cep": "20040002",
  "address": "Rua Exemplo, 123",
  "lat": -22.9035,
  "lng": -43.2096
}
```

- Venda (JSON):

```json
{
  "client_id": "uuid-do-cliente",
  "affiliation_id": "uuid-da-afiliacao",
  "total": 120.0,
  "status": "finalized",
  "items": [
    { "product_id": "uuid-prod-1", "price": 60.0, "quantity": 1 },
    { "product_id": "uuid-prod-2", "price": 60.0, "quantity": 1 }
  ]
}
```

- Recebimento (JSON):

```json
{
  "client_id": "uuid-do-cliente",
  "amount": 120.0,
  "method": "cash",
  "note": "Pagamento da venda #123",
  "received_at": "2026-01-09T10:00:00.000Z"
}
```

## Comandos úteis para debugging

- Ver logs do Vite no console durante `npm run dev`.
- Usar `console.log` temporário em `AuthContext` para inspecionar sessão.

## Observações finais

- Não inclua chaves do Supabase no repo; use `.env` ou variáveis do CI.
- Referência: veja `docs/core/supabase.md` para fluxo de migrations e RLS.
