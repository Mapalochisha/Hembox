"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/store/CartProvider";

export default function CartIcon() {
  const { itemCount, openCart } = useCart();

  return (
    <button onClick={openCart} className="relative p-1 hover:opacity-70 transition-opacity">
      <ShoppingCart size={18} />
      {itemCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-[#111] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
          {itemCount}
        </span>
      )}
    </button>
  );
}