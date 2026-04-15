# STATUS

Snapshot do estado atual do `choppnow` em 2026-04-15.

Para o fluxo de retomada em modo `Codex-only`, veja `PLAYBOOK.md`.
Para o escopo da primeira release real, veja `MVP.md`.

## Contexto

- Branch atual: `master`
- Base conhecida antes deste snapshot: `afc45e7`
- Natureza do projeto: app Expo/React Native de marketplace de cervejas/chopp artesanal

## Entendimento do produto

O ChoppNow ja esta modelado como um app com dois lados:

- comprador, que descobre cervejarias, navega pelo catalogo, monta carrinho, faz checkout e acompanha pedidos
- parceiro/vendedor, que visualiza fila operacional, muda disponibilidade da loja, acompanha pedidos da cervejaria e publica novos produtos localmente

Nao e mais um prototipo de login + landing. Hoje o repositorio ja representa uma vertical slice funcional do produto.

## O que esta implementado

### Navegacao e experiencia principal

- landing de descoberta
- catalogo de cervejarias
- catalogo de cervejas
- busca
- detalhe de cervejaria
- detalhe de cerveja
- carrinho
- checkout
- pedidos
- perfil

### Fluxo comprador

- login com conta demo
- uso como visitante
- adicionar produto com quantidade
- add-ons por item
- upsell local na tela da cerveja
- carrinho persistido localmente por usuario comprador
- checkout local
- criacao de pedido em runtime
- acompanhamento de pedidos ativos e historico

### Fluxo vendedor

- login com conta demo de parceiro
- visualizacao da fila da propria cervejaria
- alternancia entre loja recebendo pedidos e loja pausada
- avancar status operacional do pedido
- cancelar pedidos em estados permitidos
- publicar produto novo em overlay persistido do catalogo
- ajustar estoque operacional por produto a partir do perfil

### Catalogo e resiliencia de dados

- seed local de lojas, cervejas, discovery e pedidos
- tentativa de carregar catalogo remoto
- fallback para cache local
- fallback final para seed
- normalizacao de payload remoto
- contrato versionado de discovery
- fila local de sincronizacao de inventario
- overlay persistido para produtos locais do parceiro
- runtime de inventario separado do catalogo visivel ao comprador
- metadados e logs locais de sincronizacao
- chips de status do runtime na home e no catalogo

## O que ainda nao esta concluido

### Autenticacao

- sessao local agora e unificada e persistida entre reinicios
- login por e-mail continua usando usuarios demo, mas isolado como provedor de teste
- Google OAuth agora conversa com o estado principal do app quando configurado no ambiente
- contas Google entram como comprador local do app ate existir backend real
- nao existe sessao remota real nem sincronizacao de perfil com backend

### Checkout e pedidos

- checkout continua local, mas agora o runtime operacional fica persistido entre reinicios
- nao existe gateway real de pagamento
- endereco agora respeita o perfil autenticado no checkout
- cupom ainda e placeholder
- pedidos, notificacoes e disponibilidade do parceiro agora persistem localmente no app
- ainda nao existe persistencia em backend para pedidos, notificacoes ou checkout

### Operacao do parceiro

- disponibilidade da loja, pedidos e notificacoes ja persistem localmente
- produtos novos e ajustes de estoque agora persistem localmente no runtime do catalogo
- produtos locais ainda nao persistem em backend nem participam de um sync remoto real

### Qualidade e manutencao

- `App.tsx` foi enxugado na Fase 1, mas ainda concentra regras demais
- `src/services/catalog/repository.ts` concentra contrato, parse, cache, sync e status em um unico arquivo grande
- existe uma base de testes unitarios e smoke cobrindo auth, carrinho, pedidos, helpers de catalogo e readiness estrutural do app
- ainda nao existe lint nem cobertura de smoke end-to-end
- `README.md`, `STATUS.md` e `PLAYBOOK.md` viraram a documentacao viva do repo

## Avaliacao da estrutura

### O que esta bom

- estrutura por `pages`, `services`, `data`, `components`, `utils`
- separacao inicial entre UI, seeds e servicos
- camada de catalogo ja preparada para integracao real
- camada de catalogo agora preserva produtos locais do seller sem quebrar `api -> cache -> seed`
- camada de auth agora separa sessao, provedor demo e provedor Google
- camada de orders agora separa runtime persistido local de gateway operacional
- fluxo de comprador e parceiro visiveis o suficiente para orientar backlog
- uso de TypeScript estrito
- scripts de validacao repetiveis para retomar o app com pouco contexto

### O que precisa melhorar

- extrair estado de auth, cart, orders e catalogo de `App.tsx`
- separar `repository.ts` em modulos menores
- formalizar contratos do backend em arquivos dedicados
- substituir produtos locais e placeholders por adaptadores reais de backend
- ampliar os testes para cobrir fluxos completos de compra e autenticacao

## Verificacoes executadas neste snapshot

- typecheck: script dedicado concluido com sucesso
- testes unitarios: fluxo base concluido com sucesso
- smoke tests: readiness e fluxo critico concluidos com sucesso
- export web: script dedicado concluido com sucesso

## Leitura honesta do momento do projeto

O app esta em um ponto bom para retomar.

O que falta hoje nao e reorganizar tudo do zero. O que falta e transformar uma base funcional, hoje muito local/mock, em uma base integrada e persistida de verdade.

O bloqueio principal nao e apenas "tokens do Codex". Os limites reais sao:

- falta de documentacao fiel ao estado atual
- concentracao de logica em poucos arquivos grandes
- ausencia de backend real conectado nos fluxos criticos
- ausencia de persistencia remota para auth, pedidos e operacao

## Proxima abordagem recomendada

1. Considerar `MVP.md` como escopo congelado do que entra na primeira versao real.
2. Entrar na Etapa 7 definindo contratos de backend para auth, catalogo, estoque, pedidos e seller ops.
3. Priorizar a troca dos fluxos criticos locais por persistencia remota:
   - catalogo
   - estoque
   - pedidos
   - sessao
4. Manter `npm run validate` como gate minimo a cada corte.
5. Seguir em entregas pequenas, sempre fechando documento + validacao + commit.
