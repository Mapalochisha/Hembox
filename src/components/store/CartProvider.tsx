"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  comparePrice: number | null;
  sku: string;
  attributes: Record<string, string>;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const STORAGE_KEY = "hembox_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const addItem = useCallback((newItem: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.variantId === newItem.variantId);
      if (existing) {
        return prev.map(i =>
          i.variantId === newItem.variantId
            ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
            : i
        );
      }
      return [...prev, { ...newItem, id: generateId(), quantity: newItem.quantity ?? 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems(prev => prev.filter(i => i.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.variantId !== variantId));
    } else {
      setItems(prev => prev.map(i => i.variantId === variantId ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, itemCount, subtotal,
      addItem, removeItem, updateQuantity, clearCart,
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}