# PLAYBOOK

Retomada do ChoppNow em modo `Codex-only`.

## Objetivo

Desenvolver o app usando somente:

- o repositorio `choppnow`
- a documentacao versionada no proprio repo
- checkpoints em Git
- sessoes curtas e focadas no Codex

Sem dependencias operacionais do `paperclip-local-lab`.

## Regra central

A unica fonte de verdade e:

- `/media/pedro_abreu/DADOS/GIT/choppnow`

Se alguma ideia, nota antiga ou contexto externo divergir do repo, vale o que estiver no repo.

## Como economizar tokens sem Paperclip

### 1. Carregar so o minimo necessario

Toda sessao deve abrir apenas:

- `STATUS.md`
- `PLAYBOOK.md`
- os arquivos que realmente vao mudar

Nao recapitular o projeto inteiro em toda tarefa.

### 2. Trabalhar uma frente por vez

Nao misturar discovery, checkout, auth e partner ops no mesmo ciclo.

Cada sessao deve ter:

- uma frente
- um objetivo unico
- um conjunto pequeno de arquivos

### 3. Entregas pequenas e fechadas

Cada corte deve terminar com:

- implementacao
- validacao local
- commit quando fizer sentido

Isso reduz a necessidade de reabrir muito contexto depois.

### 4. Documentacao curta e viva

Usar:

- `README.md` para descrever o produto real
- `STATUS.md` para dizer em que pe estamos
- `PLAYBOOK.md` para explicar como vamos operar

Evitar documentos longos, paralelos ou fora do repo.

### 5. Priorizar reducao de contexto futuro

Sempre que uma mudanca reduzir releitura futura, ela tem prioridade.

Exemplos:

- quebrar arquivos grandes
- extrair modulos de estado
- adicionar scripts de validacao
- formalizar contratos

## O que fica em cada arquivo de apoio

### `README.md`

- o que o app e
- o que ja funciona
- o que ainda e local/mock
- como rodar

### `STATUS.md`

- retrato atual do produto
- limites tecnicos reais
- avaliacao honesta da base
- proxima abordagem

### `PLAYBOOK.md`

- como desenvolver com pouco contexto
- ordem de retomada
- workflow por sessao

## Frentes de trabalho

### Foundation

Escopo:

- reduzir responsabilidades de `App.tsx`
- separar melhor auth, cart, orders e catalog
- criar trilhos simples de validacao

Objetivo:

- diminuir custo de manutencao e de contexto por sessao

### Auth

Escopo:

- encapsular o fluxo de autenticacao
- ligar Google auth ao estado principal quando fizer sentido
- manter conta demo apenas como ferramenta de teste

Objetivo:

- parar de usar autenticacao demo como eixo do produto

### Commerce

Escopo:

- detalhe de produto
- add-ons
- carrinho
- checkout
- adaptadores de persistencia

Objetivo:

- sair do checkout local placeholder para um fluxo preparado para persistencia real

### Partner Ops

Escopo:

- pedidos
- timeline
- console do parceiro
- disponibilidade

Objetivo:

- transformar operacao em fluxo persistivel e menos dependente de estado em memoria

### Discovery & Catalog

Escopo:

- landing
- highlights
- campanhas
- filtros
- snapshot remoto
- sync de inventario

Objetivo:

- consolidar a camada `api -> cache -> seed`

### QA

Escopo:

- smoke checks
- regressao
- readiness de corte

Objetivo:

- garantir que os cortes continuem estaveis

## Ordem recomendada para retomada

### Fase 0. Base segura

Ja concluido:

- checkpoint Git
- `README.md` atualizado
- `STATUS.md` criado

### Fase 1. Foundation enxuta

Escopo:

- quebrar `App.tsx`
- adicionar scripts em `package.json`
- preparar contratos de auth, checkout e orders

Por que vem primeiro:

- reduz custo de contexto em todas as fases seguintes

### Fase 2. Auth melhor encapsulada

Escopo:

- ligar ou preparar auth real
- separar demo mode de auth principal

### Fase 3. Checkout e pedidos com persistencia real

Escopo:

- trocar gateway local por adaptador real
- persistir pedidos
- recuperar historico

### Fase 4. Catalogo e estoque reais

Escopo:

- ligar snapshot remoto
- ligar sync de inventario
- validar fallback e retry

### Fase 5. QA de corte

Escopo:

- smoke tests dos fluxos criticos
- typecheck
- export web

## Workflow recomendado por sessao

### Sessao de implementacao

Abrir:

- `STATUS.md`
- `PLAYBOOK.md`
- 2 a 5 arquivos do repo relevantes

Executar:

- implementar uma fatia pequena
- validar localmente

Fechar:

- commitar se o corte estiver coerente
- atualizar `STATUS.md` apenas se o estado estrutural mudou

### Sessao de validacao

Abrir:

- `STATUS.md`
- diff ou arquivos alterados

Executar:

- validar fluxo afetado
- registrar o que passou e o que faltou validar

## Comandos padrao de validacao

Typecheck:

```bash
./node_modules/.bin/tsc --noEmit
```

Export web:

```bash
./node_modules/.bin/expo export --platform web
```

## O que nao fazer

- nao depender de contexto externo para entender o app
- nao abrir frentes demais no mesmo ciclo
- nao deixar backlog real fora do repo
- nao pular validacao basica
- nao deixar grandes mudancas sem checkpoint

## Template de pedido economico

Quando formos abrir uma nova tarefa, o formato ideal e:

1. frente ativa
2. objetivo unico
3. arquivos candidatos
4. validacao esperada
5. o que fica fora do escopo

Exemplo:

```text
Frente: Foundation
Objetivo: extrair estado de carrinho de App.tsx para um modulo dedicado
Arquivos: App.tsx, src/data/commerce.ts, novo modulo de cart
Validacao: tsc --noEmit e expo export --platform web
Fora do escopo: auth, partner ops, discovery
```

## Decisao pratica

Vamos seguir sem Paperclip.

O modo de trabalho sera:

- repo `choppnow` como verdade
- documentacao curta dentro do repo
- uma fatia por vez
- validacao local
- checkpoints frequentes
