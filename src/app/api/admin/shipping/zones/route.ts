import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireShippingAdmin } from "@/lib/shipping/admin-auth";
import { normalizeShippingCode, normalizeShippingText } from "@/lib/shipping/admin";

export async function GET() {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  const zones = await db.deliveryZone.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      courier: { select: { id: true, code: true, name: true } },
      _count: { select: { locations: true, rates: true, shipments: true } },
    },
  });
  return NextResponse.json(zones);
}

export async function POST(req: Request) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const courierId = String(body.courierId ?? "");
    const code = normalizeShippingCode(String(body.code ?? ""));
    const name = normalizeShippingText(String(body.name ?? ""));
    if (!courierId || !code || !name) return NextResponse.json({ error: "Courier, code, and name are required." }, { status: 400 });
    const courier = await db.courier.findUnique({ where: { id: courierId } });
    if (!courier) return NextResponse.json({ error: "Courier not found." }, { status: 404 });

    const zone = await db.deliveryZone.create({
      data: { courierId, code, name, description: body.description ? normalizeShippingText(String(body.description)) : null, isActive: body.isActive !== false },
      include: { courier: { select: { id: true, code: true, name: true } } },
    });
    return NextResponse.json(zone, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "A zone with this code already exists for this courier." }, { status: 409 });
    return NextResponse.json({ error: error?.message ?? "Failed to create zone." }, { status: 400 });
  }
}
