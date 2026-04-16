# BACKEND CONTRACTS

Contratos de backend do MVP real do `choppnow`.

Este documento traduz o escopo do [MVP.md](/media/pedro_abreu/DADOS/GIT/choppnow/MVP.md:1) em endpoints, payloads e regras de integracao.

Os tipos de apoio vivem em:

- `src/services/contracts/auth.ts`
- `src/services/contracts/catalog.ts`
- `src/services/contracts/orders.ts`
- `src/services/contracts/seller.ts`
- `src/services/contracts/endpoints.ts`

## Objetivo

Reduzir a ambiguidade entre:

- o runtime local atual do app
- o contrato real que o backend precisara expor

O backend nao precisa seguir a implementacao interna do app, mas deve honrar estes contratos funcionais para o MVP.

## Endpoints do MVP

### Auth

- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`

### Catalogo

- `GET /v1/catalog/snapshot`
- `POST /v1/seller/products`
- `PATCH /v1/seller/products/:id`
- `POST /v1/catalog/inventory/sync`

### Orders

- `POST /v1/orders`
- `GET /v1/orders/my`
- `GET /v1/seller/orders`
- `PATCH /v1/orders/:id/status`

### Seller ops

- `PATCH /v1/seller/store-availability`

## Contratos por dominio

### Auth

Payload minimo de login:

```json
{
  "email": "pedro@choppnow.app",
  "password": "pedro123"
}
```

Resposta minima:

```json
{
  "accessToken": "token",
  "refreshToken": "refresh-token",
  "expiresAt": "2026-04-15T21:00:00.000Z",
  "user": {
    "id": "user-pedro",
    "email": "pedro@choppnow.app",
    "name": "Pedro",
    "role": "buyer",
    "phone": "(61) 99999-1000",
    "address": "SQS 308, Asa Sul - Brasilia, DF",
    "notificationsEnabled": true
  }
}
```

Observacoes:

- `seller` deve vir com `sellerStoreId`
- Google OAuth pode ser adicionado depois sem mudar o contrato de sessao do MVP
- os dominios autenticados do app podem consumir `Authorization: Bearer <token>` a partir desta etapa

### Catalogo

Snapshot principal:

```json
{
  "version": 1,
  "fetchedAt": "2026-04-15T21:00:00.000Z",
  "stores": [],
  "beers": [],
  "discovery": {
    "version": 1,
    "highlights": [],
    "campaigns": [],
    "storySteps": [],
    "filters": []
  }
}
```

Regras:

- o header `x-choppnow-discovery-schema-version` continua obrigatorio
- o app espera fallback `api -> cache -> seed`
- `inventory.availableUnits` e `inventory.isAvailable` precisam refletir o estado real do produto

Criacao de produto do seller:

```json
{
  "storeId": "1",
  "name": "Apoena Fresh Hop",
  "style": "Fresh Hop IPA",
  "abv": "6.8%",
  "price": "R$ 24,90",
  "description": "Lote sazonal",
  "ibu": 55,
  "initialUnits": 18
}
```

### Inventory sync

O app hoje trabalha com eventos de ajuste. O backend pode internamente aplicar outra estrategia, mas para o cliente o contrato minimo e:

```json
{
  "syncedAt": "2026-04-15T21:00:00.000Z",
  "updates": [
    {
      "eventId": "sync-1713210000000-apoena-ipa",
      "beerId": "apoena-ipa",
      "availableUnits": 9,
      "reason": "checkout-order-placed",
      "queuedAt": "2026-04-15T20:59:00.000Z"
    }
  ]
}
```

Motivos aceitos no MVP:

- `checkout-order-placed`
- `seller-restock`
- `seller-stock-adjustment`

### Orders

Criacao de pedido:

```json
{
  "storeId": "1",
  "items": [
    {
      "beerId": "apoena-ipa",
      "quantity": 2,
      "addOns": [
        { "id": "cold-kit", "quantity": 1 }
      ]
    }
  ],
  "paymentMethod": "pix",
  "deliveryAddress": "SQS 308, Asa Sul - Brasilia, DF",
  "deliveryNotes": "Portaria principal",
  "couponCode": ""
}
```

Resposta:

```json
{
  "order": {
    "id": "order-2001",
    "buyerId": "user-pedro",
    "storeId": "1",
    "items": [],
    "totals": {
      "currency": "BRL",
      "subtotal": 37.8,
      "deliveryFee": 7.9,
      "serviceFee": 2.5,
      "total": 48.2
    },
    "createdAt": "2026-04-15T21:00:00.000Z",
    "status": "placed",
    "slaMinutes": 35,
    "checkoutReference": "LOCAL-12345",
    "buyerNotificationsEnabled": true
  }
}
```

Enquanto alguns dominios ainda migram totalmente para bearer session, a integracao de orders pode aceitar estes headers de contexto:

- `x-choppnow-user-id`
- `x-choppnow-user-role`
- `x-choppnow-user-email`
- `x-choppnow-store-id` quando o contexto for seller

Eles permitem manter compatibilidade enquanto a sessao remota se consolida em todo o app.

Status do MVP:

- `placed`
- `confirmed`
- `preparing`
- `ready_for_dispatch`
- `out_for_delivery`
- `delivered`

### Seller ops

Disponibilidade da loja:

```json
{
  "storeId": "1",
  "status": "paused"
}
```

Resposta:

```json
{
  "storeId": "1",
  "status": "paused",
  "updatedAt": "2026-04-15T21:00:00.000Z"
}
```

## Mapeamento com o app atual

### Auth

- hoje: sessao unificada em `src/services/auth/session.ts` com adaptador remoto-first em `src/services/auth/remote.ts`
- proximo passo: integrar Google e demais dominios diretamente via bearer session

### Catalogo

- hoje: `src/services/catalog/repository.ts`
- proximo passo: manter parse/fallback e trocar apenas a origem real dos dados e mutacoes

### Orders

- hoje: runtime remoto-first com fallback em `src/services/orders/runtime.ts`
- proximo passo: remover headers de compatibilidade e depender prioritariamente da sessao bearer

### Seller ops

- hoje: disponibilidade e fila operadas localmente
- proximo passo: persistencia remota mantendo o console atual como casca de UI

## Decisoes importantes desta etapa

- contratos do backend foram separados dos modelos puramente locais do app
- paths, payloads e respostas minimas do MVP agora tem uma fonte de verdade versionada
- a Etapa 8 pode partir destes contratos sem reabrir o escopo do MVP
