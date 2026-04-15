# ChoppNow (Expo)

App Expo/React Native para descoberta, compra e operacao de pedidos de cervejas e chopp artesanal.

O projeto ja nao e apenas uma landing com login. Hoje ele cobre uma fatia vertical funcional do produto, com experiencia de comprador, experiencia de parceiro e uma camada de catalogo preparada para integrar com backend quando ele existir.

Para um retrato mais objetivo do estado atual, veja `STATUS.md`.

## O que o app e hoje

- Marketplace mobile-first de cervejarias e rotulos artesanais.
- Dois perfis de uso:
  - comprador
  - vendedor/parceiro
- Fluxos principais:
  - descoberta de cervejarias e cervejas
  - busca com filtros
  - detalhe de loja e detalhe de produto
  - carrinho e checkout local
  - acompanhamento de pedidos
  - painel operacional basico do parceiro

## O que ja funciona

- Login por e-mail com contas demo.
- Entrada como visitante.
- Landing page com:
  - destaques
  - campanhas
  - storytelling de descoberta
  - status do runtime do catalogo
  - atalhos para catalogo, busca, pedidos e perfil
- Catalogo em dois modos:
  - cervejarias
  - cervejas
- Busca por texto, estilo e faixa de amargor.
- Tela de cervejaria com listagem de cervejas.
- Tela de cerveja com:
  - quantidade
  - add-ons
  - subtotal parcial
  - upsell de outros rotulos da mesma loja
- Carrinho com:
  - persistencia local por comprador
  - troca automatica de loja ao adicionar item de outro parceiro
  - resumo de subtotal, entrega e taxa de servico
- Checkout local com:
  - metodo de pagamento
  - observacao de entrega
  - resumo financeiro
- Pedidos com:
  - timeline operacional
  - historico e ativos
  - notificacoes in-app
  - console do parceiro para avancar status e pausar loja
- Perfil com:
  - contas demo
  - favoritos
  - visao de comprador
  - visao de vendedor
  - cadastro local de novo produto
- Tema claro/escuro com persistencia local.

## O que ainda esta local/mock

- Autenticacao real ainda nao esta concluida.
- Login por e-mail usa contas demo hardcoded.
- OAuth Google tem request configurada, mas o fluxo ainda nao esta conectado ao estado principal do app.
- Checkout ainda usa gateway local placeholder.
- Pagamento real nao existe.
- Endereco de entrega e cupom ainda sao placeholders.
- Pedidos, notificacoes e disponibilidade do parceiro vivem majoritariamente em memoria.
- Cadastro de novo produto atualiza o estado local da sessao, sem persistencia remota.

## Catalogo e backend

A camada de catalogo ja foi preparada para funcionar com fallback resiliente:

- `api -> cache -> seed`

Ela tambem possui fila local de sincronizacao de inventario, metadados de sync e contrato versionado para discovery.

Sem backend ativo, o app continua navegavel usando cache ou seed local.

### Contrato esperado do snapshot

O endpoint de snapshot deve responder com:

- `stores`
- `beers`
- `discovery`

`discovery` usa schema versionado:

```json
{
  "version": 1,
  "highlights": [],
  "campaigns": [],
  "storySteps": [],
  "filters": []
}
```

O cliente envia o header `x-choppnow-discovery-schema-version` para negociar a versao suportada.

## Estrutura principal

- `App.tsx`: orquestracao de rotas, sessao local, carrinho, pedidos e fluxo principal
- `src/pages/*`: telas do app
- `src/data/*`: seeds e modelos locais
- `src/services/auth/*`: autenticacao Google
- `src/services/catalog/*`: contrato remoto, fallback, cache e sync local
- `src/services/checkout/*`: gateway de checkout
- `src/utils/storage.ts`: persistencia local com AsyncStorage

## Variaveis de ambiente

### Google OAuth

- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

### Catalogo runtime

- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_CATALOG_API_BASE_URL`
- `EXPO_PUBLIC_CATALOG_API_TIMEOUT_MS`
- `EXPO_PUBLIC_CATALOG_SNAPSHOT_TIMEOUT_MS`
- `EXPO_PUBLIC_CATALOG_SNAPSHOT_RETRY_ATTEMPTS`
- `EXPO_PUBLIC_CATALOG_SNAPSHOT_RETRY_DELAY_MS`
- `EXPO_PUBLIC_CATALOG_SYNC_TIMEOUT_MS`
- `EXPO_PUBLIC_CATALOG_SYNC_RETRY_ATTEMPTS`
- `EXPO_PUBLIC_CATALOG_SYNC_RETRY_DELAY_MS`
- `EXPO_PUBLIC_CATALOG_SYNC_RETRY_MULTIPLIER`
- `EXPO_PUBLIC_CATALOG_SYNC_RETRY_MAX_DELAY_MS`
- `EXPO_PUBLIC_CATALOG_DEBUG_WARNINGS`
- `EXPO_PUBLIC_CATALOG_STATUS_REFRESH_MS`

Arquivos `.env` continuam ignorados no Git.
Arquivo versionado de exemplo: `.env.example`.

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Crie o `.env`:

```bash
cp .env.example .env
```

3. Preencha os client IDs do Google se quiser testar OAuth.

4. Rode o projeto:

```bash
npm run start
```

Para web:

```bash
npm run web
```

## Verificacao recomendada

Typecheck:

```bash
./node_modules/.bin/tsc --noEmit
```

Export web:

```bash
./node_modules/.bin/expo export --platform web
```

## Estado atual resumido

- A base esta consistente para retomar desenvolvimento.
- O app sobe e exporta para web.
- O principal trabalho restante nao e refazer estrutura.
- O principal trabalho restante e concluir integracoes reais, persistencia e qualidade operacional.
