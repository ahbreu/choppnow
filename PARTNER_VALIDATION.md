# PARTNER VALIDATION

Roteiro para validar o ChoppNow como ele existe hoje, usando o backend local de validacao que fica dentro do proprio repo.

## O que este backend cobre

- login remoto por e-mail
- sessao remota com `auth/me`
- snapshot remoto de catalogo
- criacao e listagem de pedidos
- avancar status operacional do pedido
- publicacao de produto pelo seller
- sync remoto de estoque
- pausa e reativacao da loja

Persistencia:

- local em arquivo
- seed inicial ja pronto
- resetavel a qualquer momento

Arquivo de runtime:

- `backend/runtime/state.json`

## Credenciais de validacao

Comprador:

- e-mail: `pedro@choppnow.app`
- senha: `pedro123`

Seller:

- e-mail: `apoena@choppnow.app`
- senha: `apoena123`

## Fluxo rapido para validar na mesma maquina

1. Instale as dependencias:

```bash
npm install
```

2. Crie o `.env`:

```bash
cp .env.example .env
```

3. Aponte o app para o backend local:

```bash
EXPO_PUBLIC_AUTH_API_BASE_URL=http://127.0.0.1:4010
EXPO_PUBLIC_CATALOG_API_BASE_URL=http://127.0.0.1:4010
EXPO_PUBLIC_ORDERS_API_BASE_URL=http://127.0.0.1:4010
```

4. Resete o estado do backend:

```bash
npm run backend:reset
```

5. Rode o smoke do backend:

```bash
npm run backend:smoke
```

6. Em um terminal, suba o backend:

```bash
npm run backend:start
```

7. Em outro terminal, suba o app web:

```bash
npm run web
```

8. Valide os dois fluxos principais:

- comprador: login, catalogo, carrinho, checkout, pedidos
- seller: login, fila operacional, avancar status, publicar produto, ajustar estoque

## Fluxo para mostrar ao socio em preview web

Esse modo e bom quando voce quer entregar uma versao pronta no navegador, sem depender do Expo aberto.

### Se o socio vai validar na mesma maquina

Use no `.env`:

```bash
EXPO_PUBLIC_AUTH_API_BASE_URL=http://127.0.0.1:4010
EXPO_PUBLIC_CATALOG_API_BASE_URL=http://127.0.0.1:4010
EXPO_PUBLIC_ORDERS_API_BASE_URL=http://127.0.0.1:4010
```

Depois rode:

```bash
npm run backend:reset
npm run partner:preview
```

Abra:

- `http://127.0.0.1:4010`

### Se o socio vai validar em outro notebook ou celular na mesma rede

1. Descubra o IP local da sua maquina.
2. No `.env`, troque `127.0.0.1` pelo IP real da maquina.

Exemplo:

```bash
EXPO_PUBLIC_AUTH_API_BASE_URL=http://192.168.0.25:4010
EXPO_PUBLIC_CATALOG_API_BASE_URL=http://192.168.0.25:4010
EXPO_PUBLIC_ORDERS_API_BASE_URL=http://192.168.0.25:4010
```

3. Suba o preview expondo o backend na rede local:

```bash
CHOPPNOW_BACKEND_HOST=0.0.0.0 npm run partner:preview
```

4. Peca para o socio abrir:

- `http://SEU_IP_LOCAL:4010`

Observacao importante:

- se a build web for gerada com `127.0.0.1`, outro dispositivo nao vai conseguir falar com a API
- para validar em outro dispositivo, sempre exporte de novo com o IP real no `.env`

## Cenarios recomendados para o socio

1. Login como comprador e fechar um pedido simples.
2. Abrir a aba de pedidos e confirmar que o pedido apareceu.
3. Entrar como seller e ver a fila operacional.
4. Avancar o pedido de `placed` para `confirmed`.
5. Publicar um produto novo e ajustar estoque.

## Comandos uteis

Reset do backend:

```bash
npm run backend:reset
```

Smoke do backend:

```bash
npm run backend:smoke
```

Validacao completa do repo:

```bash
npm run validate
```

Preview web completo:

```bash
npm run partner:preview
```
