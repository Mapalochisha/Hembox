import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireShippingAdmin } from "@/lib/shipping/admin-auth";
import { normalizeShippingCode, normalizeShippingText } from "@/lib/shipping/admin";

export async function GET() {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;

  const couriers = await db.courier.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { zones: true, tiers: true, shipments: true } } },
  });
  return NextResponse.json(couriers);
}

export async function POST(req: Request) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const code = normalizeShippingCode(String(body.code ?? ""));
    const name = normalizeShippingText(String(body.name ?? ""));
    if (!code || !name) return NextResponse.json({ error: "Code and name are required." }, { status: 400 });

    const courier = await db.courier.create({ data: { code, name, isActive: body.isActive !== false } });
    return NextResponse.json(courier, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "A courier with this code already exists." }, { status: 409 });
    console.error(error);
    return NextResponse.json({ error: error?.message ?? "Failed to create courier." }, { status: 400 });
  }
}
