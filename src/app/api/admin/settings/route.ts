import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await db.storeSetting.findMany();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return NextResponse.json(map);
  } catch (error: any) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Body should be an object of key-value pairs
    // Example: { "theme_hero_image": "http...", "theme_collections_banner": "http..." }

    const updatePromises = Object.entries(body).map(([key, value]) => {
      if (typeof value !== "string") return Promise.resolve();

      return db.storeSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
