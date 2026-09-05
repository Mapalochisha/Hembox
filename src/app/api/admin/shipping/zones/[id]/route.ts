import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireShippingAdmin } from "@/lib/shipping/admin-auth";
import { normalizeShippingCode, normalizeShippingText } from "@/lib/shipping/admin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  const zone = await db.deliveryZone.findUnique({
    where: { id: params.id },
    include: {
      courier: { select: { id: true, code: true, name: true, isActive: true } },
      locations: { include: { location: true }, orderBy: { location: { town: "asc" } } },
      rates: { include: { packageTier: true }, orderBy: { packageTier: { position: "asc" } } },
    },
  });
  if (!zone) return NextResponse.json({ error: "Zone not found." }, { status: 404 });
  return NextResponse.json(zone);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const data: Prisma.DeliveryZoneUncheckedUpdateInput = {};
    if (body.courierId !== undefined) data.courierId = String(body.courierId);
    if (body.code !== undefined) data.code = normalizeShippingCode(String(body.code));
    if (body.name !== undefined) data.name = normalizeShippingText(String(body.name));
    if (body.description !== undefined) data.description = body.description ? normalizeShippingText(String(body.description)) : null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (data.code === "" || data.name === "") throw new Error("Code and name cannot be empty.");
    if (data.courierId) {
      const courier = await db.courier.findUnique({ where: { id: data.courierId } });
      if (!courier) return NextResponse.json({ error: "Courier not found." }, { status: 404 });
    }

    const zone = await db.deliveryZone.update({ where: { id: params.id }, data, include: { courier: { select: { id: true, code: true, name: true } } } });
    return NextResponse.json(zone);
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Zone not found." }, { status: 404 });
    if (error?.code === "P2002") return NextResponse.json({ error: "A zone with this code already exists for this courier." }, { status: 409 });
    return NextResponse.json({ error: error?.message ?? "Failed to update zone." }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    if (!Array.isArray(body.locationIds) || body.locationIds.some((id: unknown) => typeof id !== "string")) {
      return NextResponse.json({ error: "locationIds must be an array of location IDs." }, { status: 400 });
    }

    const zone = await db.deliveryZone.findUnique({ where: { id: params.id } });
    if (!zone) return NextResponse.json({ error: "Zone not found." }, { status: 404 });

    const uniqueIds = [...new Set(body.locationIds as string[])];
    const count = await db.deliveryLocation.count({ where: { id: { in: uniqueIds }, isActive: true } });
    if (count !== uniqueIds.length) return NextResponse.json({ error: "One or more locations do not exist or are inactive." }, { status: 400 });

    await db.$transaction(async (tx) => {
      await tx.deliveryZoneLocation.deleteMany({ where: { zoneId: params.id } });
      if (uniqueIds.length) {
        await tx.deliveryZoneLocation.createMany({ data: uniqueIds.map((locationId) => ({ zoneId: params.id, locationId })) });
      }
    });

    const updated = await db.deliveryZone.findUnique({ where: { id: params.id }, include: { locations: { include: { location: true } } } });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error?.message ?? "Failed to update zone locations." }, { status: 400 });
  }
}
