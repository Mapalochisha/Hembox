import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireShippingAdmin } from "@/lib/shipping/admin-auth";
import { normalizeLocationPart, normalizeShippingText } from "@/lib/shipping/admin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  const location = await db.deliveryLocation.findUnique({ where: { id: params.id }, include: { zoneAssignments: { include: { zone: { include: { courier: true } } } } } });
  if (!location) return NextResponse.json({ error: "Location not found." }, { status: 404 });
  return NextResponse.json(location);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const data: Prisma.DeliveryLocationUpdateInput = {};
    if (body.countryCode !== undefined) {
      const countryCode = normalizeShippingText(String(body.countryCode)).toUpperCase();
      if (countryCode.length !== 2) throw new Error("Country code must be a 2-letter ISO code.");
      data.countryCode = countryCode;
    }
    if (body.province !== undefined) {
      const province = normalizeShippingText(String(body.province));
      if (!province) throw new Error("Province cannot be empty.");
      data.province = province;
      data.provinceNormalized = normalizeLocationPart(province);
    }
    if (body.town !== undefined) {
      const town = normalizeShippingText(String(body.town));
      if (!town) throw new Error("Town cannot be empty.");
      data.town = town;
      data.townNormalized = normalizeLocationPart(town);
    }
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const current = await db.deliveryLocation.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Location not found." }, { status: 404 });
    if (data.countryCode === undefined) data.countryCode = current.countryCode;
    if (data.provinceNormalized === undefined) data.provinceNormalized = current.provinceNormalized;
    if (data.townNormalized === undefined) data.townNormalized = current.townNormalized;

    const location = await db.deliveryLocation.update({ where: { id: params.id }, data });
    return NextResponse.json(location);
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "This delivery location already exists." }, { status: 409 });
    if (error?.code === "P2025") return NextResponse.json({ error: "Location not found." }, { status: 404 });
    return NextResponse.json({ error: error?.message ?? "Failed to update location." }, { status: 400 });
  }
}
