import { resetRuntimeState, runtimeStatePath } from "./lib/state.mjs";

const state = await resetRuntimeState();

console.log(
  `[backend] runtime reset at ${runtimeStatePath} with ${state.stores.length} stores, ${state.products.length} products and ${state.orders.length} orders`
);
