# Execução 2026-06-28 - README com contrato da API e status do MVP

## Avaliação inicial do repositório

- Repositório analisado: `PheidiasSoftware/TESTE`.
- Branch padrão observada: `main`.
- Permissões disponíveis pelo conector: leitura e escrita no repositório.
- PRs recentes do usuário no repositório: nenhum retornado pelo conector nesta execução.
- Registros claros de Claude Agent, branches paralelas, issues ou PRs conflitantes: não encontrados nos arquivos analisados nesta execução.

## Arquivos analisados antes de alterar

- `README.md`
- `package.json`
- `src/server.js`
- `src/http.js`
- `src/ollama.js`
- `memory.md`
- `PROJECT_MEMORY.md`
- `docs/backend-mvp-status.md`
- `docs/api-contract.md`

## Leitura técnica

- O README já documentava objetivo, requisitos, Windows, testes, CI, variáveis e endpoints.
- `docs/api-contract.md` já existia e descrevia o contrato estável da API local.
- `docs/backend-mvp-status.md` ainda marcava como pendente linkar o contrato da API no README.
- `src/server.js` ainda concentra responsabilidades, apesar de já existirem `src/http.js` e `src/ollama.js` como módulos auxiliares.
- Como a próxima integração em `src/server.js` exige cuidado maior e validação de testes, a tarefa mais segura desta execução foi fechar a pendência documental explícita sem alterar comportamento runtime.

## Decisão tomada

Atualizar a documentação principal e o status do MVP, sem modificar código de produção, para deixar o projeto mais navegável para clientes locais, revisão futura e outros agentes.

## Arquivos alterados/criados

- `README.md`
  - Adicionado link para `docs/api-contract.md`.
  - Adicionado link para `docs/backend-mvp-status.md`.

- `docs/backend-mvp-status.md`
  - Movido o link do README para critérios atendidos.
  - Removida a pendência de linkar `docs/api-contract.md` no README.
  - Reordenados próximos passos seguros para focar em integração gradual de `src/ollama.js`, `src/http.js` e extrações menores.

- `PROJECT_MEMORY_RUN_2026-06-28_README_API_STATUS_LINKS.md`
  - Criado este registro de execução.

## Validações executadas

- Validação estática manual dos links relativos adicionados no README.
- Conferido que a alteração é apenas documental e não muda API, runtime, dependências ou scripts.
- Conferido que o contrato da API e o status do MVP já existiam antes de serem linkados.
- `npm test` não foi executado nesta automação porque o conector GitHub não executa comandos locais.

## Riscos

- Risco funcional baixo, pois não houve alteração em código de execução.
- O principal risco técnico permanece: `src/server.js` ainda concentra muita lógica e deve ser modularizado em passos pequenos.
- A validação completa continua dependendo de CI ou execução local com Node.js 20+.

## Pendências

1. Verificar status da CI para commits recentes quando disponível.
2. Integrar `src/ollama.js` no `src/server.js` em alteração pequena, reutilizando `buildOllamaGeneratePayload()` e `parseOllamaStreamLine()`.
3. Integrar `src/http.js` no `src/server.js` em alteração pequena, preservando `MAX_BODY_BYTES`.
4. Extrair cache, fila e leitura segura para módulos próprios depois das integrações menores.
5. Rodar `npm test` em ambiente local ou CI.

## Compatibilidade com Claude Agent

Nenhum arquivo ou registro específico de Claude Agent foi encontrado nesta execução. As alterações foram feitas de forma documental, incremental e compatível com futura atuação de outro agente.
