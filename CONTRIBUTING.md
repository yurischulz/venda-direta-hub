# Contribuindo com a documentação

Público alvo: PO e TL. Siga estas regras ao alterar a documentação:

1. Abra uma branch com prefixo `docs/`.
2. Atualize `docs/README.md` se adicionar novas páginas.
3. Para mudanças de schema: inclua migration em `supabase/migrations` e descreva impacto em RLS no PR.
4. Use arquivos Mermaid em `docs/diagrams.md` para descrever fluxos.
5. Adicione exemplos executáveis quando possível (comandos `npm run dev`, `npm run build`).

Checklist de PRs de docs

- [ ] Link para arquivos modificados
- [ ] Se mudou schema: migration incluida
- [ ] Se afetou RLS: notas para revisão do TL
