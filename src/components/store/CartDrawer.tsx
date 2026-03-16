"use client";

import { useCart } from "@/components/store/CartProvider";
import Link from "next/link";
import { X, Plus, Minus, ShoppingCart } from "lucide-react";

export default function CartDrawer() {
  const { items, itemCount, subtotal, removeItem, updateQuantity, closeCart, isOpen } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm fade-in" onClick={closeCart} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} />
            <h2 className="font-black text-sm tracking-widest uppercase">Your Cart</h2>
            {itemCount > 0 && (
              <span className="bg-[#111] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-1 hover:opacity-60 transition-opacity btn-press">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart size={48} className="opacity-10 mb-4" />
              <p className="font-semibold text-sm mb-1">Your cart is empty</p>
              <p className="text-xs opacity-40 mb-6">Add some products to get started.</p>
              <button onClick={closeCart}
                className="bg-[#111] text-white text-xs px-6 py-3 tracking-widest uppercase rounded hover:bg-black transition-colors btn-press">
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-gray-50">
                  {/* Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">👔</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.slug}`} onClick={closeCart}
                      className="text-xs font-black tracking-wide uppercase hover:opacity-70 transition-opacity line-clamp-2">
                      {item.name}
                    </Link>
                    {Object.entries(item.attributes).length > 0 && (
                      <p className="text-[10px] opacity-40 mt-0.5 tracking-widest">
                        {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                    <p className="text-xs font-bold mt-1">K {(item.price * item.quantity).toFixed(2)}</p>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="w-6 h-6 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 transition-colors btn-press">
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="w-6 h-6 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 transition-colors btn-press">
                        <Plus size={10} />
                      </button>
                      <button onClick={() => removeItem(item.variantId)}
                        className="ml-2 text-[10px] tracking-widest uppercase opacity-30 hover:opacity-70 transition-opacity btn-press">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs opacity-50 tracking-widest uppercase">Subtotal</span>
              <span className="font-black text-sm">K {subtotal.toFixed(2)}</span>
            </div>
            <p className="text-[10px] opacity-35 text-center">Shipping calculated at checkout</p>
            <Link href="/checkout" onClick={closeCart}
              className="block w-full bg-[#111] text-white text-xs tracking-widest uppercase font-bold py-4 text-center rounded hover:bg-black transition-colors btn-press">
              Proceed to Checkout
            </Link>
            <button onClick={closeCart}
              className="block w-full text-xs tracking-widest uppercase font-bold py-3 text-center border border-gray-200 rounded hover:bg-gray-50 transition-colors btn-press">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}