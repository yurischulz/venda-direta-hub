# Clientes — CRUD e Regras de Dados

Resumo: gerenciamento de clientes com dados de contato, CPF, CEP e coordenadas.

Arquivos chave

- `src/pages/Clients.tsx`
- `src/components/forms/ClientForm.tsx`
- `src/lib/phone-utils.ts`

Regras importantes

- Campos: `name`, `phone`, `cpf`, `email`, `cep`, `address`, `lat`, `lng`.
- CEP: preencher endereço via serviço externo (ver `docs/core/integrations.md`).
- Coordenadas: armazenar `lat`/`lng` quando disponíveis para permitir proximidade.

Validações

- Validar CPF e telefone conforme utilitários em `src/lib`.
