import { Dispatch, SetStateAction, useEffect } from "react";
import { CartState } from "../data/commerce";
import { UserProfile } from "../data/users";
import { loadBuyerCart, persistBuyerCart } from "../services/cart/storage";

type UseBuyerCartPersistenceOptions = {
  currentUser: UserProfile | null;
  cart: CartState;
  setCart: Dispatch<SetStateAction<CartState>>;
};

export function useBuyerCartPersistence({
  currentUser,
  cart,
  setCart,
}: UseBuyerCartPersistenceOptions) {
  useEffect(() => {
    let mounted = true;

    loadBuyerCart(currentUser)
      .then((storedCart) => {
        if (!mounted || !storedCart) return;
        setCart(storedCart);
      })
      .catch(() => {
        // Ignore cart hydration errors and keep current runtime cart.
      });

    return () => {
      mounted = false;
    };
  }, [currentUser, setCart]);

  useEffect(() => {
    persistBuyerCart(currentUser, cart).catch(() => {
      // Ignore cart persistence errors and keep checkout path usable.
    });
  }, [cart, currentUser]);
}
