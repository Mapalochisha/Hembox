import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireShippingAdmin } from "@/lib/shipping/admin-auth";
import { assertNoOverlappingTier, normalizeShippingCode, normalizeShippingText, parseOptionalInt, validateTierRange } from "@/lib/shipping/admin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  const tier = await db.packageTier.findUnique({ where: { id: params.id }, include: { courier: { select: { id: true, code: true, name: true } }, rates: { include: { deliveryZone: true } } } });
  if (!tier) return NextResponse.json({ error: "Tier not found." }, { status: 404 });
  return NextResponse.json(tier);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const current = await db.packageTier.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Tier not found." }, { status: 404 });
    const courierId = body.courierId === undefined ? current.courierId : String(body.courierId);
    const minPoints = body.minPoints === undefined ? current.minPoints : parseOptionalInt(body.minPoints, "Minimum points");
    const maxPoints = body.maxPoints === undefined ? current.maxPoints : parseOptionalInt(body.maxPoints, "Maximum points");
    const isCustom = body.isCustom === undefined ? current.isCustom : Boolean(body.isCustom);
    const isActive = body.isActive === undefined ? current.isActive : Boolean(body.isActive);
    validateTierRange(minPoints, maxPoints, isCustom);
    if (isActive) await assertNoOverlappingTier(courierId, minPoints, maxPoints, params.id);

    const data: Prisma.PackageTierUncheckedUpdateInput = { courierId, minPoints, maxPoints, isCustom, isActive };
    if (body.code !== undefined) data.code = normalizeShippingCode(String(body.code));
    if (body.name !== undefined) data.name = normalizeShippingText(String(body.name));
    if (body.position !== undefined) {
      const position = Number(body.position);
      if (!Number.isInteger(position) || position < 0) throw new Error("Position must be a non-negative integer.");
      data.position = position;
    }
    if (data.code === "" || data.name === "") throw new Error("Code and name cannot be empty.");

    const tier = await db.packageTier.update({ where: { id: params.id }, data });
    return NextResponse.json(tier);
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "A tier with this code already exists for this courier." }, { status: 409 });
    if (error?.code === "P2025") return NextResponse.json({ error: "Tier not found." }, { status: 404 });
    return NextResponse.json({ error: error?.message ?? "Failed to update tier." }, { status: 400 });
  }
}
