import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {session.user?.name}.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: "K 0.00" },
            { label: "Active Orders", value: "0" },
            { label: "Total Products", value: "0" },
            { label: "Customers", value: "0" },
          ].map((card) => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold text-[#2D2D2D] mt-2">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[#2D2D2D] mb-3">✅ Phase 1 Complete</h2>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>✓ Next.js 14 project initialised</li>
            <li>✓ TypeScript + Tailwind CSS configured</li>
            <li>✓ Full database schema ready (Prisma)</li>
            <li>✓ Admin authentication (NextAuth.js)</li>
            <li>✓ Protected routes via middleware</li>
          </ul>
          <p className="mt-4 text-sm text-[#2D2D2D] font-medium">Phase 2 next → Full admin dashboard.</p>
        </div>
      </div>
    </div>
  );
}
