export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-black uppercase mb-10 tracking-tight">Contact Us</h1>
      <div className="bg-gray-50 dark:bg-zinc-900 rounded-2xl p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Have a question? We&apos;re here to help.</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Email</p>
                <p className="text-gray-700 dark:text-gray-300">hello@hembox.com</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">WhatsApp</p>
                <p className="text-gray-700 dark:text-gray-300">+260 970 000 000</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-[120px] opacity-10">✉️</span>
          </div>
        </div>
      </div>
    </div>
  );
}
