import { OrderItemRecord } from "../../data/orders";
import { UserProfile } from "../../data/users";
import { AdvanceOrderPayload, PlaceOrderPayload } from "./gateway";
import { localOrdersGateway } from "./local";
import {
  advanceOrderRemoteFirst,
  fetchOrdersForUserRemote,
  placeOrderRemoteFirst,
  shouldFallbackToLocalOrders,
} from "./remote";

export async function placeOrderWithFallback(payload: PlaceOrderPayload) {
  try {
    return await placeOrderRemoteFirst(payload);
  } catch (error) {
    if (shouldFallbackToLocalOrders(error)) {
      return localOrdersGateway.placeOrder(payload);
    }
    throw error;
  }
}

export async function advanceOrderWithFallback(payload: AdvanceOrderPayload) {
  try {
    return await advanceOrderRemoteFirst(payload);
  } catch (error) {
    if (shouldFallbackToLocalOrders(error)) {
      return localOrdersGateway.advanceOrder(payload);
    }
    throw error;
  }
}

export async function fetchOrdersForCurrentUserWithFallback(
  currentUser: UserProfile
): Promise<OrderItemRecord[] | null> {
  try {
    return await fetchOrdersForUserRemote(currentUser);
  } catch {
    return null;
  }
}
