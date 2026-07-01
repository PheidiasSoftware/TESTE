# Contrato seguro de OLLAMA_URL

Este backend foi pensado para uso local em PC fraco com Windows, 8 GB de RAM e sem GPU. A variável `OLLAMA_URL` deve apontar para a raiz do runtime Ollama local, sem credenciais, query string, hash ou caminho de endpoint.

## Valor recomendado

```text
OLLAMA_URL=http://127.0.0.1:11434
```

Também é aceitável usar `http://localhost:11434` quando o Ollama estiver respondendo no loopback local.

## Evite estes formatos

```text
OLLAMA_URL=http://127.0.0.1:11434/api
OLLAMA_URL=http://127.0.0.1:11434/api/generate
OLLAMA_URL=http://user:password@127.0.0.1:11434/?token=secret
```

O backend normaliza casos comuns antes de montar a chamada para `/api/generate`, mas manter a variável com a raiz limpa reduz ambiguidade em scripts, logs locais e integrações futuras.

## Checklist de segurança

- Não use credenciais na URL.
- Não aponte para runtime remoto sem decisão explícita do usuário.
- Não exponha `OLLAMA_URL` em prints, issues ou documentação com dados reais.
- Mantenha `HOST=127.0.0.1` quando a API for usada somente na própria máquina.
- Para PC com 8 GB RAM sem GPU, mantenha `GENERATION_CONCURRENCY=1` e modelo pequeno, como `qwen2.5-coder:1.5b-instruct`.

## Validação rápida no Windows

```powershell
$env:OLLAMA_URL="http://127.0.0.1:11434"
npm run smoke:windows
```

Esse smoke test valida rotas offline e não executa código gerado pelo modelo.
