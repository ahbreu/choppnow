export type OrderStatus = "Em preparo" | "Saiu para entrega" | "Entregue";

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
  eta: string;
  status: OrderStatus;
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
    eta: "20-30 min",
    status: "Em preparo",
  },
  {
    id: "order-1002",
    buyerId: "user-pedro",
    storeId: "2",
    items: [{ beerId: "cruls-red-ale", quantity: 2 }],
    total: "R$ 33,80",
    createdAt: "Hoje, 17:45",
    eta: "10 min",
    status: "Saiu para entrega",
  },
  {
    id: "order-0998",
    buyerId: "user-pedro",
    storeId: "1",
    items: [{ beerId: "apoena-stout", quantity: 1 }],
    total: "R$ 19,90",
    createdAt: "Ontem, 20:05",
    eta: "Concluido",
    status: "Entregue",
  },
];

export function isActiveOrder(status: OrderStatus) {
  return status !== "Entregue";
}

export function advanceOrderStatus(status: OrderStatus): OrderStatus {
  if (status === "Em preparo") return "Saiu para entrega";
  if (status === "Saiu para entrega") return "Entregue";
  return "Entregue";
}
