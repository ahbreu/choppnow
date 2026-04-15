# STATUS

Snapshot do estado atual do `choppnow` em 2026-04-14.

Para o fluxo de retomada em modo `Codex-only`, veja `PLAYBOOK.md`.

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
- publicar produto novo localmente

### Catalogo e resiliencia de dados

- seed local de lojas, cervejas, discovery e pedidos
- tentativa de carregar catalogo remoto
- fallback para cache local
- fallback final para seed
- normalizacao de payload remoto
- contrato versionado de discovery
- fila local de sincronizacao de inventario
- metadados e logs locais de sincronizacao
- chips de status do runtime na home e no catalogo

## O que ainda nao esta concluido

### Autenticacao

- login por e-mail ainda usa usuarios demo hardcoded
- Google OAuth nao esta conectado ao estado principal do app
- nao existe sessao remota real

### Checkout e pedidos

- checkout ainda e placeholder/local
- nao existe gateway real de pagamento
- endereco e cupom ainda sao placeholders
- pedidos e notificacoes nao estao persistidos em backend

### Operacao do parceiro

- disponibilidade da loja e alteracoes de fila vivem em memoria durante a sessao
- cadastro de novo produto nao persiste remotamente

### Qualidade e manutencao

- `App.tsx` concentrou muita responsabilidade e precisa ser quebrado em modulos quando a retomada comecar
- `src/services/catalog/repository.ts` concentra contrato, parse, cache, sync e status em um unico arquivo grande
- nao existe suite de testes automatizados
- `package.json` ainda nao expoe scripts de `typecheck`, `lint` ou `test`
- `README.md` estava atrasado em relacao ao produto e foi atualizado neste snapshot

## Avaliacao da estrutura

### O que esta bom

- estrutura por `pages`, `services`, `data`, `components`, `utils`
- separacao inicial entre UI, seeds e servicos
- camada de catalogo ja preparada para integracao real
- fluxo de comprador e parceiro visiveis o suficiente para orientar backlog
- uso de TypeScript estrito

### O que precisa melhorar

- extrair estado de auth, cart, orders e catalogo de `App.tsx`
- separar `repository.ts` em modulos menores
- formalizar contratos do backend em arquivos dedicados
- substituir dados demo e placeholders por adaptadores reais
- criar scripts e testes minimos de seguranca para retomada

## Verificacoes executadas neste snapshot

- typecheck: `tsc --noEmit` concluido com sucesso
- export web: `expo export --platform web` concluido com sucesso

## Leitura honesta do momento do projeto

O app esta em um ponto bom para retomar.

O que falta hoje nao e reorganizar tudo do zero. O que falta e transformar uma base funcional, hoje muito local/mock, em uma base integrada e persistida de verdade.

O bloqueio principal nao e apenas "tokens do Codex". Os limites reais sao:

- falta de documentacao fiel ao estado atual
- concentracao de logica em poucos arquivos grandes
- ausencia de backend real conectado nos fluxos criticos
- ausencia de testes e scripts de validacao rapida

## Proxima abordagem recomendada

1. Preservar este snapshot como marco de retomada.
2. Extrair modulos de estado antes de novas features grandes.
3. Escolher um MVP real de integracao:
   - auth real
   - persistencia de pedidos
   - persistencia de produtos/estoque
4. Adicionar validacoes minimas:
   - typecheck
   - export web
   - testes de smoke para carrinho e pedido
5. Seguir em entregas pequenas, sempre fechando documento + validacao + commit.
