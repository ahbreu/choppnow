import { BeerWithStore } from "./stores";

export type AddOnOption = {
  id: string;
  label: string;
  description: string;
  price: number;
};

export type CartItemAddOn = {
  id: string;
  label: string;
  price: number;
  quantity: number;
};

export type CartItem = {
  id: string;
  beerId: string;
  beerName: string;
  beerStyle: string;
  storeId: string;
  storeName: string;
  unitPrice: number;
  quantity: number;
  addOns: CartItemAddOn[];
};

export type CartState = {
  storeId: string | null;
  storeName: string | null;
  items: CartItem[];
};

export type CheckoutDraft = {
  paymentMethod: "pix" | "card";
  deliveryNotes: string;
  couponCode: string;
};

export const initialCartState: CartState = {
  storeId: null,
  storeName: null,
  items: [],
};

export const addOnOptions: AddOnOption[] = [
  {
    id: "cold-kit",
    label: "Kit gelo extra",
    description: "Mantem os rotulos gelados por mais tempo.",
    price: 4.9,
  },
  {
    id: "glass-cup",
    label: "Copo lager 300ml",
    description: "Copo reutilizavel para servir o chopp.",
    price: 9.9,
  },
  {
    id: "pairing-snack",
    label: "Snack de harmonizacao",
    description: "Mix salgado leve para acompanhar a cerveja.",
    price: 12.9,
  },
];

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function parsePriceToNumber(price: string) {
  const normalized = price.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getCartItemLineTotal(item: CartItem) {
  const addOnsTotal = item.addOns.reduce((sum, addOn) => sum + addOn.price * addOn.quantity, 0);
  return (item.unitPrice + addOnsTotal) * item.quantity;
}

export function getCartSubtotal(cart: CartState) {
  return cart.items.reduce((sum, item) => sum + getCartItemLineTotal(item), 0);
}

export function getCartItemsCount(cart: CartState) {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getUpsellSuggestions(beers: BeerWithStore[], currentBeerId: string, storeId: string) {
  return beers
    .filter((beer) => beer.storeId === storeId && beer.id !== currentBeerId)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
}
