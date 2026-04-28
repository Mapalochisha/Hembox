import Link from "next/link";

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderNumber = searchParams.order ?? "—";

  return (
    <div className="px-10 py-24 max-w-2xl mx-auto text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto mb-8">
        <span className="text-4xl">✓</span>
      </div>

      <h1 className="text-4xl font-black uppercase tracking-tight mb-4">Order Placed!</h1>
      <p className="text-sm opacity-50 leading-relaxed mb-8 max-w-md mx-auto">
        Thank you for your order. Our team will reach out to you shortly via WhatsApp or phone to arrange payment and confirm delivery.
      </p>

      {/* Order number */}
      <div className="bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl px-8 py-5 inline-block mb-10">
        <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Order Number</p>
        <p className="font-black text-xl tracking-widest">{orderNumber}</p>
      </div>

      {/* What happens next */}
      <div className="bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl p-6 text-left mb-10">
        <h2 className="font-black text-xs tracking-widest uppercase mb-5">What Happens Next</h2>
        <div className="space-y-4">
          {[
            { step: "01", title: "Order Confirmation", desc: "You'll receive a confirmation to the email address you provided." },
            { step: "02", title: "Payment Arrangement", desc: "Our team will contact you via WhatsApp or phone to arrange mobile money or bank transfer payment." },
            { step: "03", title: "Processing & Dispatch", desc: "Once payment is confirmed, your order will be packed and dispatched within 1–2 business days." },
            { step: "04", title: "Delivery", desc: "Your order will be delivered to the address you provided. Delivery times vary by province." },
          ].map(item => (
            <div key={item.step} className="flex gap-4">
              <span className="text-[10px] font-black opacity-20 tracking-widest mt-0.5">{item.step}</span>
              <div>
                <p className="text-xs font-black tracking-wide uppercase mb-0.5">{item.title}</p>
                <p className="text-xs opacity-50 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/products"
          className="bg-[#111] dark:bg-white text-white dark:text-black text-xs px-8 py-4 tracking-widest uppercase rounded hover:opacity-90 transition-opacity">
          Continue Shopping
        </Link>
        <Link href="/"
          className="border border-gray-200 dark:border-white/10 text-xs px-8 py-4 tracking-widest uppercase rounded hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
