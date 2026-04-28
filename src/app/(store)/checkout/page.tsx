"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/store/CartProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  notes: string;
}

const PROVINCES = [
  "Central", "Copperbelt", "Eastern", "Luapula",
  "Lusaka", "Muchinga", "Northern", "North-Western",
  "Southern", "Western",
];

export default function CheckoutPage() {
  const { status } = useSession();
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<"shipping" | "review">("shipping");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ShippingDetails>({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", province: "", notes: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/account/profile")
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setForm(prev => ({
              ...prev,
              firstName: data.address?.firstName || data.name?.split(" ")[0] || "",
              lastName: data.address?.lastName || data.name?.split(" ").slice(1).join(" ") || "",
              email: data.email || "",
              phone: data.phone || "",
              address: data.address?.line1 || "",
              city: data.address?.city || "",
              province: data.address?.state || "",
            }));
          }
        })
        .catch(err => console.error("Error fetching profile:", err));
    }
  }, [status]);

  const shipping = subtotal >= 500 ? 0 : 50;
  const total = subtotal + shipping;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault();
    const required = ["firstName", "lastName", "email", "phone", "address", "city", "province"];
    const missing = required.filter(f => !form[f as keyof ShippingDetails].trim());
    if (missing.length > 0) { setError("Please fill in all required fields."); return; }
    setError("");
    setStep("review");
  }

  async function handlePlaceOrder() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({
            variantId: i.variantId,
            productId: i.productId,
            name: i.name,
            sku: i.sku,
            price: i.price,
            quantity: i.quantity,
            attributes: i.attributes,
          })),
          shipping: {
            name: `${form.firstName} ${form.lastName}`,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            province: form.province,
            notes: form.notes,
          },
          subtotal,
          shippingCost: shipping,
          total,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to place order");
      clearCart();
      router.push(`/checkout/success?order=${data.orderNumber}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="px-6 md:px-10 py-24 text-center">
        <p className="text-6xl mb-6">🛒</p>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-3">Your cart is empty</h1>
        <Link href="/products" className="bg-[#111] dark:bg-white text-white dark:text-black text-xs px-10 py-4 tracking-widest uppercase inline-block rounded">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-10">
        {["shipping", "review"].map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black
              ${step === s || (s === "shipping" && step === "review") ? "bg-[#111] dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-white/5 opacity-40"}`}>
              {i + 1}
            </div>
            <span className={`text-xs tracking-widest uppercase ${step === s ? "font-black" : "opacity-40"}`}>
              {s === "shipping" ? "Shipping" : "Review & Pay"}
            </span>
            {i < 1 && <span className="opacity-20 mx-1">—</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Left */}
        <div className="md:col-span-2">
          {step === "shipping" && (
            <form onSubmit={handleShippingSubmit} className="space-y-5">
              <h2 className="font-black text-sm tracking-widest uppercase mb-6">Shipping Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "firstName", label: "First Name" },
                  { name: "lastName", label: "Last Name" },
                ].map(f => (
                  <div key={f.name}>
                    <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">{f.label} *</label>
                    <input name={f.name} value={form[f.name as keyof ShippingDetails]} onChange={handleChange}
                      className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-transparent transition-colors" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "email", label: "Email Address", type: "email" },
                  { name: "phone", label: "Phone Number", type: "tel" },
                ].map(f => (
                  <div key={f.name}>
                    <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">{f.label} *</label>
                    <input name={f.name} type={f.type} value={form[f.name as keyof ShippingDetails]} onChange={handleChange}
                      className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-transparent transition-colors" />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">Street Address *</label>
                <input name="address" value={form.address} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-transparent transition-colors" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">City *</label>
                  <input name="city" value={form.city} onChange={handleChange}
                    className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-transparent transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">Province *</label>
                  <select name="province" value={form.province} onChange={handleChange}
                    className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-white dark:bg-[#0f0f0f] transition-colors">
                    <option value="">Select province</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] tracking-widest uppercase opacity-50 block mb-1.5">Order Notes (optional)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                  className="w-full border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#111] dark:focus:border-white bg-transparent transition-colors resize-none" />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button type="submit"
                className="w-full bg-[#111] dark:bg-white text-white dark:text-black text-xs tracking-widest uppercase font-bold py-4 rounded hover:opacity-90 transition-opacity">
                Continue to Review
              </button>
            </form>
          )}

          {step === "review" && (
            <div>
              <h2 className="font-black text-sm tracking-widest uppercase mb-6">Review Your Order</h2>

              <div className="bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl p-5 mb-6">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] tracking-widest uppercase opacity-40">Shipping To</p>
                  <button onClick={() => setStep("shipping")} className="text-[10px] tracking-widest uppercase opacity-40 hover:opacity-70 underline">Edit</button>
                </div>
                <p className="text-sm font-semibold">{form.firstName} {form.lastName}</p>
                <p className="text-xs opacity-60 mt-1">{form.address}, {form.city}, {form.province}</p>
                <p className="text-xs opacity-60">{form.email} · {form.phone}</p>
                {form.notes && <p className="text-xs opacity-40 mt-2 italic">&ldquo;{form.notes}&rdquo;</p>}
              </div>

              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 items-center py-3 border-b border-gray-50 dark:border-white/5">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg opacity-20">👔</div>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black tracking-wide uppercase">{item.name}</p>
                      <p className="text-[10px] opacity-40">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold">K {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 mb-6 text-amber-900 dark:text-amber-200">
                <p className="text-xs font-bold mb-1">💳 Payment</p>
                <p className="text-xs opacity-80 leading-relaxed">
                  After placing your order, our team will contact you via WhatsApp or phone to arrange payment.
                </p>
              </div>

              {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

              <button onClick={handlePlaceOrder} disabled={loading}
                className={`w-full text-white dark:text-black text-xs tracking-widest uppercase font-bold py-4 rounded transition-opacity
                  ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#111] dark:bg-white hover:opacity-90"}`}>
                {loading ? "Placing Order..." : "Place Order"}
              </button>
              <button onClick={() => setStep("shipping")}
                className="w-full text-xs tracking-widest uppercase font-bold py-3 text-center border border-gray-200 dark:border-white/10 rounded hover:bg-gray-50 dark:hover:bg-white/5 transition-colors mt-3">
                Back to Shipping
              </button>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl p-6 md:sticky md:top-20">
            <h2 className="font-black text-sm tracking-widest uppercase mb-5">Summary</h2>
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-xs">
                <span className="opacity-50">Subtotal</span>
                <span className="font-semibold">K {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-50">Shipping</span>
                <span className="font-semibold">
                  {shipping === 0 ? <span className="text-green-600 dark:text-green-400 font-bold">Free</span> : `K ${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between">
                <span className="text-xs font-black tracking-widest uppercase">Total</span>
                <span className="font-black text-base">K {total.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] opacity-35">📦 Free shipping over K 500</p>
              <p className="text-[10px] opacity-35">↩ 30-day returns</p>
              <p className="text-[10px] opacity-35">✓ Secure checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}