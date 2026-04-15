# MVP

Escopo do MVP real do `choppnow`, definido em 2026-04-15.

Este documento existe para responder uma pergunta simples:

- o que precisa funcionar de verdade para o app ser utilizavel na primeira versao real

Se alguma feature atual existir no app mas nao estiver marcada aqui como obrigatoria, ela nao bloqueia a entrega do MVP.

## Objetivo do MVP

Entregar uma primeira versao utilizavel do ChoppNow com:

- comprador autenticado de verdade
- seller basico autenticado de verdade
- catalogo persistido em backend
- pedidos persistidos em backend
- operacao minima da cervejaria funcionando ponta a ponta

O MVP nao busca monetizacao completa nem operacao perfeita. Ele busca validar o fluxo principal do produto com dados reais e persistidos.

## Promessa do produto no MVP

Um comprador consegue descobrir uma cervejaria, escolher cervejas, enviar um pedido e acompanhar seu status.

Uma cervejaria parceira consegue entrar na propria conta, manter seu catalogo basico, ajustar estoque, pausar a loja e operar pedidos recebidos.

## Perfil de uso do MVP

### Comprador

- login real com sessao remota persistida
- navegar por lojas e cervejas
- adicionar itens ao carrinho
- enviar pedido
- acompanhar status do pedido

### Seller

- login real com conta previamente provisionada
- ver apenas a propria cervejaria
- publicar produto basico
- ajustar estoque
- pausar ou reativar loja
- avancar status operacional de pedidos

## Escopo obrigatorio

### 1. Auth e sessao

Deve entrar no MVP:

- sessao remota real
- persistencia de sessao entre reinicios
- logout funcional
- diferenciacao entre `buyer` e `seller`

Decisao de escopo:

- email e senha remotos bastam para o MVP
- Google OAuth nao bloqueia a entrega do MVP
- contas demo deixam de ser fluxo principal e ficam apenas para QA/dev

### 2. Catalogo

Deve entrar no MVP:

- listar cervejarias
- listar cervejas
- busca basica
- detalhe de loja
- detalhe de cerveja
- catalogo vindo de backend
- fallback `api -> cache -> seed`

Tambem deve funcionar:

- produtos criados pelo seller persistidos no backend
- estoque refletido no catalogo do comprador
- loja sem estoque continuar operavel no console do seller

### 3. Carrinho e checkout

Deve entrar no MVP:

- carrinho de uma loja por vez
- resumo financeiro
- envio de pedido para backend
- captura de endereco e observacao no pedido
- metodo de pagamento registrado apenas como informacao operacional

Decisao de escopo:

- o checkout cria pedido real
- o pagamento continua sem captura real no MVP
- cupom nao entra no MVP

### 4. Pedidos

Deve entrar no MVP:

- criacao de pedido persistida
- listagem de pedidos do comprador
- listagem de pedidos da cervejaria
- timeline/status operacional
- atualizacao remota de status pelo seller
- pedido continuar visivel apos reiniciar o app

### 5. Operacao do seller

Deve entrar no MVP:

- disponibilidade da loja persistida
- criacao de produto basico
- ajuste de estoque
- fila de pedidos da propria loja
- transicoes operacionais minimas:
  - `placed`
  - `confirmed`
  - `preparing`
  - `ready_for_dispatch`
  - `out_for_delivery`
  - `delivered`

### 6. Qualidade minima de release

Deve entrar no MVP:

- `npm run validate` passando
- typecheck
- unit tests
- smoke tests
- export web

## O que fica fora do MVP

Nao bloqueia a entrega:

- pagamento real
- conciliacao financeira
- cupons reais
- onboarding self-service de cervejaria
- cadastro publico de comprador
- notificacoes push reais
- analytics e dashboards
- favoritos sincronizados em backend
- reviews e avaliacoes
- edicao completa de perfil
- multi-endereco
- multi-loja no carrinho
- gestao completa de add-ons pelo backend
- relatorios administrativos

## Regras de corte do MVP

Para considerar o MVP pronto, tudo abaixo precisa estar verdadeiro:

1. Um comprador autenticado consegue criar um pedido real e reencontrar esse pedido depois.
2. Um seller autenticado consegue ver esse mesmo pedido na sua fila e avancar o status ate `delivered`.
3. Um seller consegue publicar um produto e ajustar estoque, e o comprador enxerga essa mudanca no catalogo.
4. O catalogo continua navegavel se a API falhar, usando `cache` ou `seed`.
5. O app nao depende mais de estado local/mock para os fluxos criticos de auth, catalogo, estoque e pedidos.

## Contratos minimos que a Etapa 7 precisa definir

### Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Catalogo

- `GET /v1/catalog/snapshot`
- `POST /v1/seller/products`
- `PATCH /v1/seller/products/:id`
- `POST /v1/catalog/inventory/sync` ou equivalente mais simples

### Orders

- `POST /v1/orders`
- `GET /v1/orders/my`
- `GET /v1/seller/orders`
- `PATCH /v1/orders/:id/status`

### Seller Ops

- `PATCH /v1/seller/store-availability`

## Sequencia recomendada apos esta definicao

1. Etapa 7: contratos e payloads do backend
2. Etapa 8: catalogo e estoque remotos
3. Etapa 9: pedidos e checkout remotos
4. Etapa 10: auth remota
5. Etapa 11: seller ops remota
6. Etapa 12: corte final de release

## Decisoes que ja ficam fechadas

- o MVP e de dois lados: comprador + seller
- seller entra com escopo basico, nao administrativo
- pagamento real fica para depois
- Google OAuth nao bloqueia release
- demo accounts deixam de ser referencia de produto e passam a ser ferramenta de teste
- o fluxo critico a priorizar e: `login -> catalogo -> carrinho -> pedido -> operacao`
