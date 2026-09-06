import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireShippingAdmin } from "@/lib/shipping/admin-auth";
import { normalizeShippingCode, normalizeShippingText } from "@/lib/shipping/admin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;

  const courier = await db.courier.findUnique({
    where: { id: params.id },
    include: { _count: { select: { zones: true, tiers: true, shipments: true } } },
  });
  if (!courier) return NextResponse.json({ error: "Courier not found." }, { status: 404 });
  return NextResponse.json(courier);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const data: { code?: string; name?: string; isActive?: boolean } = {};
    if (body.code !== undefined) data.code = normalizeShippingCode(String(body.code));
    if (body.name !== undefined) data.name = normalizeShippingText(String(body.name));
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (data.code === "" || data.name === "") return NextResponse.json({ error: "Code and name cannot be empty." }, { status: 400 });

    const courier = await db.courier.update({ where: { id: params.id }, data });
    return NextResponse.json(courier);
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Courier not found." }, { status: 404 });
    if (error?.code === "P2002") return NextResponse.json({ error: "A courier with this code already exists." }, { status: 409 });
    console.error(error);
    return NextResponse.json({ error: error?.message ?? "Failed to update courier." }, { status: 400 });
  }
}
