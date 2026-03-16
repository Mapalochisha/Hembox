"use client";

import { useCart } from "@/components/store/CartProvider";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity, itemCount } = useCart();

  const shipping = subtotal >= 500 ? 0 : 50;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="px-6 md:px-10 py-24 text-center">
        <p className="text-6xl mb-6">🛒</p>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-3">Your cart is empty</h1>
        <p className="text-sm opacity-50 mb-8">Looks like you have not added anything yet.</p>
        <Link href="/products"
          className="bg-[#111] text-white text-xs px-10 py-4 tracking-widest uppercase inline-block rounded hover:bg-black transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-12">
      <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Your Cart</h1>
      <p className="text-xs opacity-40 tracking-widest mb-10">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Items */}
        <div className="md:col-span-2 space-y-1">
          <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] tracking-widest uppercase opacity-35 pb-3 border-b border-gray-100">
            <span className="col-span-6">Product</span>
            <span className="col-span-2 text-center">Price</span>
            <span className="col-span-2 text-center">Quantity</span>
            <span className="col-span-2 text-right">Total</span>
          </div>

          {items.map(item => (
            <div key={item.id} className="flex gap-4 items-start py-5 border-b border-gray-50">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl opacity-20">👔</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`}
                  className="text-xs font-black tracking-wide uppercase hover:opacity-70 transition-opacity line-clamp-2">
                  {item.name}
                </Link>
                {Object.entries(item.attributes).length > 0 && (
                  <p className="text-[10px] opacity-40 mt-0.5 tracking-widest">
                    {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </p>
                )}
                <p className="text-xs font-bold mt-1">K {(item.price * item.quantity).toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <Minus size={10} />
                  </button>
                  <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <Plus size={10} />
                  </button>
                  <button onClick={() => removeItem(item.variantId)}
                    className="ml-2 text-[10px] opacity-30 hover:opacity-70 transition-opacity tracking-widest uppercase flex items-center gap-1">
                    <X size={10} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 rounded-xl p-6 md:sticky md:top-20">
            <h2 className="font-black text-sm tracking-widest uppercase mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs">
                <span className="opacity-50">Subtotal</span>
                <span className="font-semibold">K {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-50">Shipping</span>
                <span className="font-semibold">
                  {shipping === 0 ? <span className="text-green-600">Free</span> : `K ${shipping.toFixed(2)}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-[10px] opacity-35 leading-relaxed">
                  Add K {(500 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-xs font-black tracking-widest uppercase">Total</span>
                <span className="font-black text-base">K {total.toFixed(2)}</span>
              </div>
            </div>
            <Link href="/checkout"
              className="block w-full bg-[#111] text-white text-xs tracking-widest uppercase font-bold py-4 text-center rounded hover:bg-black transition-colors mb-3">
              Proceed to Checkout
            </Link>
            <Link href="/products"
              className="block w-full text-xs tracking-widest uppercase font-bold py-3 text-center border border-gray-200 rounded hover:bg-gray-50 transition-colors">
              Continue Shopping
            </Link>
            <div className="mt-6 space-y-2">
              <p className="text-[10px] opacity-35 text-center">📦 Free shipping over K 500</p>
              <p className="text-[10px] opacity-35 text-center">↩ 30-day returns</p>
              <p className="text-[10px] opacity-35 text-center">✓ Secure checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}