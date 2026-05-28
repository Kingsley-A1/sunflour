"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  isOrderable: boolean;
}

interface AddCartItemInput extends Omit<CartItem, "quantity"> {
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  displaySubtotal: number;
  addItem: (item: AddCartItemInput) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  getItemKey: (item: Pick<CartItem, "productId" | "variantId">) => string;
}

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "sunflour-cart-v1";
const emptyCart: CartItem[] = [];
const listeners = new Set<() => void>();
let cartCache: CartItem[] | null = null;

function getItemKey(item: Pick<CartItem, "productId" | "variantId">): string {
  return `${item.productId}:${item.variantId ?? "base"}`;
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") {
    return emptyCart;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as CartItem[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        item &&
        typeof item.productId === "string" &&
        typeof item.name === "string" &&
        Number.isSafeInteger(item.unitPrice) &&
        Number.isSafeInteger(item.quantity),
    );
  } catch {
    return [];
  }
}

function writeStoredCart(items: CartItem[]): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }
}

function notifyCartListeners(): void {
  listeners.forEach((listener) => listener());
}

function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getCartSnapshot(): CartItem[] {
  cartCache ??= readStoredCart();
  return cartCache;
}

function getServerCartSnapshot(): CartItem[] {
  return emptyCart;
}

function setCartItems(updater: (current: CartItem[]) => CartItem[]): void {
  cartCache = updater(getCartSnapshot());
  writeStoredCart(cartCache);
  notifyCartListeners();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );

  const addItem = useCallback((item: AddCartItemInput) => {
    setCartItems((current) => {
      const key = getItemKey(item);
      const existing = current.find((cartItem) => getItemKey(cartItem) === key);

      if (!existing) {
        return [...current, { ...item, quantity: Math.min(item.quantity, 99) }];
      }

      return current.map((cartItem) =>
        getItemKey(cartItem) === key
          ? {
              ...cartItem,
              quantity: Math.min(cartItem.quantity + item.quantity, 99),
            }
          : cartItem,
      );
    });
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setCartItems((current) =>
      current
        .map((item) =>
          getItemKey(item) === key
            ? { ...item, quantity: Math.min(Math.max(quantity, 1), 99) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setCartItems((current) =>
      current.filter((item) => getItemKey(item) !== key),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems(() => []);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const displaySubtotal = items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0,
    );

    return {
      items,
      itemCount,
      displaySubtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getItemKey,
    };
  }, [addItem, clearCart, items, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
