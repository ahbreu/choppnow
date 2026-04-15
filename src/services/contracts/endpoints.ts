import type { BackendEndpointDefinition } from "./common";
import { AUTH_LOGIN_PATH, AUTH_LOGOUT_PATH, AUTH_ME_PATH } from "./auth";
import {
  CATALOG_INVENTORY_SYNC_PATH,
  CATALOG_SNAPSHOT_PATH,
  SELLER_PRODUCT_BY_ID_PATH,
  SELLER_PRODUCTS_PATH,
} from "./catalog";
import {
  BUYER_ORDERS_PATH,
  ORDER_STATUS_BY_ID_PATH,
  ORDERS_PATH,
  SELLER_ORDERS_PATH,
} from "./orders";
import { SELLER_STORE_AVAILABILITY_PATH } from "./seller";

export const backendContractEndpoints: BackendEndpointDefinition[] = [
  {
    id: "auth.login",
    area: "auth",
    method: "POST",
    path: AUTH_LOGIN_PATH,
    summary: "Abre sessao para buyer ou seller.",
    mvpRequired: true,
  },
  {
    id: "auth.logout",
    area: "auth",
    method: "POST",
    path: AUTH_LOGOUT_PATH,
    summary: "Encerra a sessao atual.",
    mvpRequired: true,
  },
  {
    id: "auth.me",
    area: "auth",
    method: "GET",
    path: AUTH_ME_PATH,
    summary: "Recupera o usuario autenticado e o papel atual.",
    mvpRequired: true,
  },
  {
    id: "catalog.snapshot",
    area: "catalog",
    method: "GET",
    path: CATALOG_SNAPSHOT_PATH,
    summary: "Entrega o snapshot principal do catalogo para discovery e listagens.",
    mvpRequired: true,
  },
  {
    id: "catalog.inventory.sync",
    area: "catalog",
    method: "POST",
    path: CATALOG_INVENTORY_SYNC_PATH,
    summary: "Sincroniza ajustes de estoque com o backend.",
    mvpRequired: true,
  },
  {
    id: "seller.products.create",
    area: "catalog",
    method: "POST",
    path: SELLER_PRODUCTS_PATH,
    summary: "Publica um produto basico da cervejaria.",
    mvpRequired: true,
  },
  {
    id: "seller.products.update",
    area: "catalog",
    method: "PATCH",
    path: SELLER_PRODUCT_BY_ID_PATH,
    summary: "Atualiza os dados editaveis de um produto do seller.",
    mvpRequired: true,
  },
  {
    id: "orders.create",
    area: "orders",
    method: "POST",
    path: ORDERS_PATH,
    summary: "Cria um pedido real a partir do checkout.",
    mvpRequired: true,
  },
  {
    id: "orders.my",
    area: "orders",
    method: "GET",
    path: BUYER_ORDERS_PATH,
    summary: "Lista os pedidos do comprador autenticado.",
    mvpRequired: true,
  },
  {
    id: "orders.seller",
    area: "orders",
    method: "GET",
    path: SELLER_ORDERS_PATH,
    summary: "Lista a fila operacional da cervejaria autenticada.",
    mvpRequired: true,
  },
  {
    id: "orders.status.update",
    area: "orders",
    method: "PATCH",
    path: ORDER_STATUS_BY_ID_PATH,
    summary: "Avanca ou altera o status operacional do pedido.",
    mvpRequired: true,
  },
  {
    id: "seller.store-availability",
    area: "seller",
    method: "PATCH",
    path: SELLER_STORE_AVAILABILITY_PATH,
    summary: "Pausa ou reativa o recebimento de pedidos da loja.",
    mvpRequired: true,
  },
];

export function getBackendEndpointById(id: string) {
  return backendContractEndpoints.find((endpoint) => endpoint.id === id) ?? null;
}

export function getMvpRequiredEndpoints() {
  return backendContractEndpoints.filter((endpoint) => endpoint.mvpRequired);
}
