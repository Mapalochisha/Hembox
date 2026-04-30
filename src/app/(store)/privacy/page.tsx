import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const setting = await db.storeSetting.findUnique({ where: { key: "privacy_policy" } });
  const content = setting?.value || "Our privacy policy is being updated.";

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-black uppercase mb-10 tracking-tight">Privacy Policy</h1>
      <div className="bg-gray-50 dark:bg-zinc-900 rounded-2xl p-8 md:p-12">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}
