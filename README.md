# ChoppNow (Expo)

App React Native com Expo para fluxo de entrada e navegacao inicial de visitante.

## O que ja funciona

- Tela de login com 2 etapas:
  - etapa 1: e-mail + botao "Continuar com e-mail" + botao Google + "Continuar sem login"
  - etapa 2: senha (front-only, sem validacao/back-end por enquanto)
- Fluxo visitante:
  - ao tocar em "Continuar sem login", abre a landing page
- Landing page (padrao atual):
  - header de entrega/alertas
  - categorias
  - banner principal
  - secoes de lojas e cervejas
  - barra inferior visual
- Botao "Entrar" na landing volta para a tela de login.

## Estrutura principal

- `App.tsx`: controle de tela (`login` <-> `landing`) por estado
- `src/pages/login/*`: UI de autenticacao
- `src/pages/landing/*`: UI de landing visitante
- `src/services/auth/google.ts`: hook de autenticacao Google (Expo Auth Session)

## Seguranca / segredos

IDs de OAuth Google nao ficam mais hardcoded no codigo.

Use variaveis de ambiente:

- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

Arquivos `.env` estao ignorados no Git.  
Arquivo versionado de exemplo: `.env.example`.

## Como rodar no PC de outra pessoa

1. Instalar dependencias:

```bash
npm install
```

2. Criar `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

3. Preencher os client IDs do Google no `.env` (se quiser testar login Google).

4. Subir o app:

```bash
npm run start
```

## Observacoes

- Sem `.env` preenchido, o app continua abrindo e o fluxo de visitante funciona.
- Login Google depende de configuracao correta no Google Cloud (OAuth consent + client IDs por plataforma).
