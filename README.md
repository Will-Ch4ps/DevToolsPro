# Dev Tools Hub

Dev Tools Hub é uma suíte de ferramentas para desenvolvedores focada em preparar contexto de projetos, gerenciar prompts e executar operações remotas via SSH. A versão principal da aplicação fica em `dev-tools-hub-pro/`, que contém o app Electron.

## Visão geral

O objetivo do projeto é acelerar fluxos de trabalho que envolvem leitura de código, composição de contexto para modelos de IA e automações de desenvolvimento. A arquitetura é modular para facilitar a adição de features.

Principais módulos:
- `bundler`: explorador de arquivos e seleção de pacote de contexto
- `prompts`: gerenciador de prompts persistentes (JSON)
- `ssh`: integração para executar comandos via SSH (usa `ssh2`)

## Estrutura do repositório

- `dev-tools-hub-pro/` — código da aplicação Electron
  - `package.json` — scripts e configurações de build
  - `src/main/` — processo principal (IPC, gerenciador de módulos)
  - `src/renderer/` — UI (controllers, views, components)
  - `data/` — arquivos de dados locais (ex.: `prompts.json`)

Arquivos na raiz podem existir para auxiliá-lo em tasks locais, mas o app principal roda dentro de `dev-tools-hub-pro`.

## Dependências e ambiente

- Node.js 18+ recomendado
- `electron` (versão especificada em `dev-tools-hub-pro/package.json`)
- `ssh2` para integrações SSH

Recomendação: instale dependências apenas dentro de `dev-tools-hub-pro` e não comite `node_modules`.

## Como rodar (desenvolvimento)

No Windows (PowerShell):

```powershell
cd dev-tools-hub-pro
npm install
npm run dev
```

No Linux/macOS:

```bash
cd dev-tools-hub-pro
npm install
npm run dev
```

`npm run dev` inicia o Electron no modo de desenvolvimento. Se ocorrerem erros nativos, tente `npm rebuild` ou reinstalar dependências.

## Como construir (distribuição)

```bash
cd dev-tools-hub-pro
npm install
npm run build
```

Os artefatos de build serão gerados em `dev-tools-hub-pro/dist` conforme a configuração do `electron-builder`.

## Boas práticas (git)

- Não comite `node_modules`. Adicione `dev-tools-hub-pro/node_modules` ao `.gitignore` se necessário.
- Mantenha commits pequenos e com mensagens claras.

Se quiser, eu posso remover `node_modules` do histórico remoto e atualizar o `origin/main` com um snapshot limpo.

## Contribuindo

- Abra issues para bugs e solicitações de features.
- Crie branches com prefixos (`feat/`, `fix/`, `chore/`) e envie PRs.

## Resolução de problemas comuns

- Erro ao iniciar Electron: verifique versão do Node e dependências nativas.
- Problemas com SSH: confirme chaves, permissões e acesso ao host remoto.

## Contato

Mantido por Will-Ch4ps. Use o repositório GitHub para issues e PRs.
