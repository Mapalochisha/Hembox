export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900">HemBox</h1>
        <p className="text-gray-500 mt-4">Storefront coming soon.</p>
        <a href="/admin" className="inline-block mt-6 px-6 py-3 bg-gray-900 text-white rounded-md text-sm">
          Go to Admin Dashboard
        </a>
      </div>
    </main>
  );
}