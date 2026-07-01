# Contrato seguro de OLLAMA_URL

Este backend foi pensado para uso local em PC fraco com Windows, 8 GB de RAM e sem GPU. A variável `OLLAMA_URL` deve apontar para a raiz do runtime Ollama local, sem credenciais, query string, hash ou caminho de endpoint.

## Valor recomendado

```text
OLLAMA_URL=http://127.0.0.1:11434
```

Também é aceitável usar `http://localhost:11434`, um IPv4 de loopback válido no bloco `127.0.0.0/8` ou `http://[::1]:11434` quando o Ollama estiver respondendo no loopback local.

## Contrato do MVP

Por padrão, o backend aceita apenas hosts de loopback para `OLLAMA_URL`:

- `localhost`
- `127.0.0.1` e demais endereços IPv4 válidos em `127.0.0.0/8`
- `::1`

URLs com host remoto, IP de rede local, domínio público, túnel, serviço externo ou IPv4 malformado são normalizadas para o padrão seguro `http://127.0.0.1:11434`. Isso evita que prompts e trechos de código do projeto sejam enviados para fora do computador por configuração acidental e evita endpoints locais ambíguos que falhariam em tempo de execução.

## Evite estes formatos

```text
OLLAMA_URL=http://127.0.0.1:11434/api
OLLAMA_URL=http://127.0.0.1:11434/api/generate
OLLAMA_URL=http://user:password@127.0.0.1:11434/?token=secret
OLLAMA_URL=http://192.168.0.10:11434
OLLAMA_URL=https://ollama.local:11434
OLLAMA_URL=http://127.999.999.999:11434
```

O backend normaliza casos comuns antes de montar a chamada para `/api/generate`, mas manter a variável com a raiz limpa reduz ambiguidade em scripts, logs locais e integrações futuras.

## Checklist de segurança

- Não use credenciais na URL.
- Não aponte para runtime remoto no MVP.
- Não use IPv4 local malformado; prefira `127.0.0.1`.
- Não exponha `OLLAMA_URL` em prints, issues ou documentação com dados reais.
- Mantenha `HOST=127.0.0.1` quando a API for usada somente na própria máquina.
- Para PC com 8 GB RAM sem GPU, mantenha `GENERATION_CONCURRENCY=1` e modelo pequeno, como `qwen2.5-coder:1.5b-instruct`.

## Validação rápida no Windows

```powershell
$env:OLLAMA_URL="http://127.0.0.1:11434"
npm run smoke:windows
```

Esse smoke test valida rotas offline e não executa código gerado pelo modelo.
