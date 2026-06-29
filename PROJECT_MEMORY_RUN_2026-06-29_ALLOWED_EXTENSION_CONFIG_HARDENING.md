# PROJECT MEMORY - 2026-06-29 - Allowed extension config hardening

## Avaliacao inicial do repositorio

Arquivos e areas examinadas antes da alteracao:

- `README.md`: confirma backend Node.js 20+, Ollama local, Windows, 8 GB RAM, sem GPU obrigatoria, scripts Windows e endpoints principais.
- `package.json`: projeto sem dependencias externas, `node --test`, `npm run start:windows` e `npm run test:windows`.
- `docs/backend-mvp-status.md`: registra MVP funcional em termos de implementacao/documentacao, com pendencia de validacao objetiva por `npm test`, `npm run test:windows` ou CI verde.
- `src/config.js`: concentra parsing de ambiente, limites conservadores, URL do Ollama, porta, flags booleanas, logs e allowlist de extensoes.
- `src/project-files.js`: usa `ALLOWED_FILE_EXTENSIONS` para leitura segura de arquivos textuais pequenos de contexto.
- `test/config.test.js`: cobre defaults conservadores, inteiros, porta, URL do Ollama, flags e log level.
- `scripts/test-windows.ps1`: validacao offline conservadora para Windows.

PRs recentes e issues abertas foram consultados pelo conector GitHub e nao retornaram resultados relevantes. A busca textual disponivel nao encontrou registros claros de Claude Agent.

## Decisao tomada

A proxima tarefa segura foi endurecer a configuracao de `ALLOWED_FILE_EXTENSIONS`, porque essa variavel influencia diretamente quais arquivos podem ser lidos pela API de contexto. A mudanca e pequena, reversivel, nao adiciona dependencias e preserva defaults seguros para PC fraco.

## Arquivos alterados

- `src/config.js`
  - Criada `normalizeAllowedFileExtension(value)`.
  - Extensoes customizadas agora sao normalizadas para minusculas e ponto inicial.
  - Itens com barras, caracteres inseguros ou formato invalido sao ignorados.
  - Duplicatas sao removidas com `Set`.
  - Quando nenhuma entrada customizada valida sobra, a configuracao volta para `DEFAULT_ALLOWED_FILE_EXTENSIONS`.

- `test/config.test.js`
  - Importa e testa `normalizeAllowedFileExtension`.
  - Adiciona cobertura para extensoes validas simples.
  - Adiciona cobertura para rejeicao de entradas inseguras.
  - Adiciona cobertura para deduplicacao e fallback da allowlist.

## Commits criados

- `24a87163f9e5b8b4ac5a3f22c2ffe312c9892946` - `src/config.js`
- `03202931437756d98dbb1e1999c934273745f715` - `test/config.test.js`

## Validacoes executadas

Nao foi possivel executar `npm test` neste ambiente porque a execucao local/checkouts anteriores estavam bloqueados. A alteracao foi limitada a parsing puro de configuracao e testes isolados com `node:test`, sem chamada ao Ollama e sem dependencias externas.

Validacao recomendada:

```bash
npm test
```

No Windows:

```powershell
npm run test:windows
```

## Riscos

- A mudanca restringe entradas customizadas de `ALLOWED_FILE_EXTENSIONS` a extensoes simples no formato `.nome`, com letras, numeros, `_` e `-`.
- Caso alguem precise permitir extensoes exoticas com outros caracteres, isso agora exigira decisao explicita futura.
- O backend continua sem evidencia objetiva de CI verde para o commit mais recente.

## Proximos passos

1. Confirmar `npm test`, `npm run test:windows` ou CI verde.
2. Se a validacao estiver verde, registrar o backend como MVP funcional completo.
3. Evitar refatoracoes amplas em `src/server.js` ate existir evidencia de testes passando.
4. Depois da validacao, considerar extrair roteamento/handlers em pequenas etapas.

## Compatibilidade com Claude Agent

Nenhum registro claro de Claude Agent foi encontrado nesta execucao. A memoria acima foi escrita para facilitar continuidade por outros agentes e evitar repeticao de analise.
