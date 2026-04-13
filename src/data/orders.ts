export type OrderStatusCode =
  | "placed"
  | "confirmed"
  | "preparing"
  | "ready_for_dispatch"
  | "out_for_delivery"
  | "delivered";

export type OrderStateModel = {
  code: OrderStatusCode;
  customerLabel: string;
  partnerLabel: string;
  customerMessage: string;
  partnerMessage: string;
  stepLabel: string;
  stepIndex: number;
  isTerminal: boolean;
  next?: OrderStatusCode;
};

const ORDER_STATE_MODEL: Record<OrderStatusCode, OrderStateModel> = {
  placed: {
    code: "placed",
    customerLabel: "Pedido recebido",
    partnerLabel: "Novo pedido",
    customerMessage: "Pedido criado e aguardando confirmacao da loja.",
    partnerMessage: "Pedido entrou na fila e precisa de confirmacao.",
    stepLabel: "Recebido",
    stepIndex: 0,
    isTerminal: false,
    next: "confirmed",
  },
  confirmed: {
    code: "confirmed",
    customerLabel: "Confirmado",
    partnerLabel: "Confirmado",
    customerMessage: "Loja confirmou os itens e iniciou a operacao.",
    partnerMessage: "Itens validados. Pedido pronto para iniciar preparo.",
    stepLabel: "Confirmado",
    stepIndex: 1,
    isTerminal: false,
    next: "preparing",
  },
  preparing: {
    code: "preparing",
    customerLabel: "Em preparo",
    partnerLabel: "Em producao",
    customerMessage: "Pedido em producao pela cervejaria.",
    partnerMessage: "Equipe em preparo. Monitore SLA de bancada.",
    stepLabel: "Preparo",
    stepIndex: 2,
    isTerminal: false,
    next: "ready_for_dispatch",
  },
  ready_for_dispatch: {
    code: "ready_for_dispatch",
    customerLabel: "Pronto para envio",
    partnerLabel: "Pronto para motoboy",
    customerMessage: "Pedido embalado e aguardando retirada.",
    partnerMessage: "Pedido embalado. Acione retirador para despacho.",
    stepLabel: "Despacho",
    stepIndex: 3,
    isTerminal: false,
    next: "out_for_delivery",
  },
  out_for_delivery: {
    code: "out_for_delivery",
    customerLabel: "Saiu para entrega",
    partnerLabel: "Em rota",
    customerMessage: "Pedido esta a caminho do endereco.",
    partnerMessage: "Pedido em rota de entrega.",
    stepLabel: "Entrega",
    stepIndex: 4,
    isTerminal: false,
    next: "delivered",
  },
  delivered: {
    code: "delivered",
    customerLabel: "Entregue",
    partnerLabel: "Concluido",
    customerMessage: "Pedido finalizado com sucesso.",
    partnerMessage: "Pedido concluido e removido da fila ativa.",
    stepLabel: "Concluido",
    stepIndex: 5,
    isTerminal: true,
  },
};

const ORDER_TIMELINE = [
  "Pedido recebido",
  "Confirmado",
  "Em preparo",
  "Pronto para envio",
  "Saiu para entrega",
  "Entregue",
] as const;

export type OrderTimelineStep = {
  label: string;
  done: boolean;
  current: boolean;
};

export type OrderItem = {
  beerId: string;
  quantity: number;
};

export type OrderItemRecord = {
  id: string;
  buyerId: string;
  storeId: string;
  items: OrderItem[];
  total: string;
  createdAt: string;
  slaMinutes: number;
  status: OrderStatusCode;
};

export const initialOrders: OrderItemRecord[] = [
  {
    id: "order-1001",
    buyerId: "user-pedro",
    storeId: "1",
    items: [
      { beerId: "apoena-ipa", quantity: 2 },
      { beerId: "apoena-pilsen", quantity: 1 },
    ],
    total: "R$ 51,70",
    createdAt: "Hoje, 19:10",
    slaMinutes: 35,
    status: "preparing",
  },
  {
    id: "order-1002",
    buyerId: "user-pedro",
    storeId: "2",
    items: [{ beerId: "cruls-red-ale", quantity: 2 }],
    total: "R$ 33,80",
    createdAt: "Hoje, 17:45",
    slaMinutes: 25,
    status: "out_for_delivery",
  },
  {
    id: "order-0998",
    buyerId: "user-pedro",
    storeId: "1",
    items: [{ beerId: "apoena-stout", quantity: 1 }],
    total: "R$ 19,90",
    createdAt: "Ontem, 20:05",
    slaMinutes: 30,
    status: "delivered",
  },
];

export function getOrderStateModel(status: OrderStatusCode): OrderStateModel {
  return ORDER_STATE_MODEL[status];
}

export function getOrderTimeline(status: OrderStatusCode): OrderTimelineStep[] {
  const current = getOrderStateModel(status);
  return ORDER_TIMELINE.map((label, index) => ({
    label,
    done: index < current.stepIndex,
    current: index === current.stepIndex,
  }));
}

export function isActiveOrder(status: OrderStatusCode) {
  return !ORDER_STATE_MODEL[status].isTerminal;
}

export function canAdvanceOrderStatus(status: OrderStatusCode) {
  return Boolean(ORDER_STATE_MODEL[status].next);
}

export function advanceOrderStatus(status: OrderStatusCode): OrderStatusCode {
  return ORDER_STATE_MODEL[status].next ?? status;
}
