# QueryClient — Estratégia de Cache

Resumo: o projeto usa `@tanstack/react-query` para cache, prefetch e invalidação de queries via `src/lib/queryClient.ts`.

Arquivos chave

- `src/lib/queryClient.ts`

Padrões

- Prefetch de dados críticos no `Dashboard`.
- Invalidação após mutações: ex.: ao criar venda, invalidar `['sales','customer-accounts','dashboard-stats']`.
- Persistência simples em `localStorage` para restaurar cache ao iniciar.
