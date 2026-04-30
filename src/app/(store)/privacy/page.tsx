import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getContent(url: string | undefined) {
  if (!url) return null;
  if (!url.startsWith("http")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export default async function PrivacyPage() {
  const setting = await db.storeSetting.findUnique({ where: { key: "privacy_policy" } });
  const content = await getContent(setting?.value);

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-black uppercase mb-10 tracking-tight">Privacy Policy</h1>
      <div className="bg-gray-50 dark:bg-zinc-900 rounded-2xl p-8 md:p-12">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {content || "Our privacy policy is being updated."}
        </p>
      </div>
    </div>
  );
}
