**Visão Geral da Documentação**

Público: PO e Tech Lead.

Este repositório contém o frontend do D'Cris (React + Vite + TypeScript) integrado ao backend Supabase. A documentação abaixo organiza o projeto por Features e Core técnico, com diagramas Mermaid e procedimentos operacionais para migrations, RLS e builds mobile.

Estrutura principal
- **Features**: `docs/features/*` (Crediário, Clientes, Afiliações, Produtos, Vendas, Recebimentos, Auth, Dashboard, GPS)
- **Core**: `docs/core/*` (Supabase, QueryClient, Hooks, Integrações)
- **Diagramas**: `docs/diagrams.md`

Como usar
- Navegue pelas pastas em `docs/features` e `docs/core` para entender fluxos e responsabilidades.
- Use `docs/diagrams.md` para visualizar fluxos críticos em Mermaid.

Contribuição
- Leia `CONTRIBUTING.md` antes de alterar docs.
- Para mudanças de schema, inclua a migration em `supabase/migrations` e detalhe o impacto no PR.
