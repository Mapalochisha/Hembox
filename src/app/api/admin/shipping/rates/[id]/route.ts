import { NextResponse } from "next/server";
import { Prisma, ShippingPriceStrategy } from "@prisma/client";
import { db } from "@/lib/db";
import { requireShippingAdmin } from "@/lib/shipping/admin-auth";
import { normalizeShippingText, parseMoney, validatePricingStrategy } from "@/lib/shipping/admin";

const SHIPPING_CURRENCY = "ZMW";
function isStrategy(value: unknown): value is ShippingPriceStrategy { return typeof value === "string" && Object.values(ShippingPriceStrategy).includes(value as ShippingPriceStrategy); }

export async function GET(_req: Request, { params }: { params: { id: string } }) { const auth = await requireShippingAdmin(); if (auth.response) return auth.response; const rate = await db.shippingRate.findUnique({ where: { id: params.id }, include: { deliveryZone: { include: { courier: true } }, packageTier: true } }); if (!rate) return NextResponse.json({ error: "Shipping rate not found." }, { status: 404 }); return NextResponse.json(rate); }

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireShippingAdmin(); if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const current = await db.shippingRate.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Shipping rate not found." }, { status: 404 });
    const deliveryZoneId = body.deliveryZoneId === undefined ? current.deliveryZoneId : String(body.deliveryZoneId);
    const packageTierId = body.packageTierId === undefined ? current.packageTierId : String(body.packageTierId);
    const courierCost = body.courierCost === undefined ? current.courierCost : parseMoney(body.courierCost, "Courier cost");
    const strategy = body.customerPriceStrategy === undefined ? current.customerPriceStrategy : body.customerPriceStrategy;
    const customerPriceValue = body.customerPriceValue === undefined ? current.customerPriceValue : parseMoney(body.customerPriceValue, "Customer pricing value", true);
    const currencyCode = body.currencyCode === undefined ? current.currencyCode : normalizeShippingText(String(body.currencyCode)).toUpperCase();
    if (!isStrategy(strategy)) throw new Error("Invalid customer pricing strategy.");
    validatePricingStrategy(strategy, customerPriceValue);
    if (currencyCode !== SHIPPING_CURRENCY) throw new Error(`Shipping rates must use ${SHIPPING_CURRENCY}.`);
    const [zone, tier] = await Promise.all([db.deliveryZone.findUnique({ where: { id: deliveryZoneId } }), db.packageTier.findUnique({ where: { id: packageTierId } })]);
    if (!zone) return NextResponse.json({ error: "Delivery zone not found." }, { status: 404 });
    if (!tier) return NextResponse.json({ error: "Package tier not found." }, { status: 404 });
    if (zone.courierId !== tier.courierId) return NextResponse.json({ error: "Zone and package tier must belong to the same courier." }, { status: 400 });
    const data: Prisma.ShippingRateUncheckedUpdateInput = { deliveryZoneId, packageTierId, courierCost: courierCost ?? undefined, customerPriceStrategy: strategy, customerPriceValue, currencyCode };
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    const rate = await db.shippingRate.update({ where: { id: params.id }, data });
    return NextResponse.json(rate);
  } catch (error: any) { if (error?.code === "P2002") return NextResponse.json({ error: "A shipping rate already exists for this zone and package tier." }, { status: 409 }); if (error?.code === "P2025") return NextResponse.json({ error: "Shipping rate not found." }, { status: 404 }); return NextResponse.json({ error: error?.message ?? "Failed to update shipping rate." }, { status: 400 }); }
}
