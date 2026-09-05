import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireShippingAdmin } from "@/lib/shipping/admin-auth";
import { assertNoOverlappingTier, normalizeShippingCode, normalizeShippingText, parseOptionalInt, validateTierRange } from "@/lib/shipping/admin";

export async function GET() {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  const tiers = await db.packageTier.findMany({
    orderBy: [{ courier: { name: "asc" } }, { position: "asc" }, { minPoints: "asc" }],
    include: { courier: { select: { id: true, code: true, name: true } }, _count: { select: { rates: true, shipments: true } } },
  });
  return NextResponse.json(tiers);
}

export async function POST(req: Request) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const courierId = String(body.courierId ?? "");
    const code = normalizeShippingCode(String(body.code ?? ""));
    const name = normalizeShippingText(String(body.name ?? ""));
    const minPoints = parseOptionalInt(body.minPoints, "Minimum points");
    const maxPoints = parseOptionalInt(body.maxPoints, "Maximum points");
    const position = body.position === undefined ? 0 : Number(body.position);
    if (!courierId || !code || !name) return NextResponse.json({ error: "Courier, code, and name are required." }, { status: 400 });
    if (!Number.isInteger(position) || position < 0) throw new Error("Position must be a non-negative integer.");
    validateTierRange(minPoints, maxPoints);
    await assertNoOverlappingTier(courierId, minPoints, maxPoints);
    const courier = await db.courier.findUnique({ where: { id: courierId } });
    if (!courier) return NextResponse.json({ error: "Courier not found." }, { status: 404 });

    const tier = await db.packageTier.create({ data: { courierId, code, name, minPoints, maxPoints, isCustom: body.isCustom === true, position, isActive: body.isActive !== false } });
    return NextResponse.json(tier, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "A tier with this code already exists for this courier." }, { status: 409 });
    return NextResponse.json({ error: error?.message ?? "Failed to create tier." }, { status: 400 });
  }
}
