import { NextResponse } from "next/server";
import { Prisma, ShippingPriceStrategy } from "@prisma/client";
import { db } from "@/lib/db";
import { requireShippingAdmin } from "@/lib/shipping/admin-auth";
import { normalizeShippingText, parseMoney, validatePricingStrategy } from "@/lib/shipping/admin";

function isStrategy(value: unknown): value is ShippingPriceStrategy {
  return typeof value === "string" && Object.values(ShippingPriceStrategy).includes(value as ShippingPriceStrategy);
}

export async function GET() {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  const rates = await db.shippingRate.findMany({
    orderBy: [{ deliveryZone: { name: "asc" } }, { packageTier: { position: "asc" } }],
    include: {
      deliveryZone: { include: { courier: { select: { id: true, code: true, name: true } } } },
      packageTier: { select: { id: true, code: true, name: true, minPoints: true, maxPoints: true, isCustom: true, position: true } },
    },
  });
  return NextResponse.json(rates);
}

export async function POST(req: Request) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const deliveryZoneId = String(body.deliveryZoneId ?? "");
    const packageTierId = String(body.packageTierId ?? "");
    const parsedCourierCost = parseMoney(body.courierCost, "Courier cost");
    const courierCost = parsedCourierCost ?? undefined;
    const strategy = body.customerPriceStrategy;
    const customerPriceValue = parseMoney(body.customerPriceValue, "Customer pricing value", true);
    const currencyCode = normalizeShippingText(String(body.currencyCode ?? "ZMW")).toUpperCase();
    if (!deliveryZoneId || !packageTierId) return NextResponse.json({ error: "Delivery zone and package tier are required." }, { status: 400 });
    if (!isStrategy(strategy)) return NextResponse.json({ error: "Invalid customer pricing strategy." }, { status: 400 });
    validatePricingStrategy(strategy, customerPriceValue);
    if (!/^[A-Z]{3}$/.test(currencyCode)) return NextResponse.json({ error: "Currency code must be a 3-letter ISO code." }, { status: 400 });
    if (courierCost === undefined) return NextResponse.json({ error: "Courier cost is required." }, { status: 400 });

    const [zone, tier] = await Promise.all([
      db.deliveryZone.findUnique({ where: { id: deliveryZoneId } }),
      db.packageTier.findUnique({ where: { id: packageTierId } }),
    ]);
    if (!zone) return NextResponse.json({ error: "Delivery zone not found." }, { status: 404 });
    if (!tier) return NextResponse.json({ error: "Package tier not found." }, { status: 404 });
    if (zone.courierId !== tier.courierId) return NextResponse.json({ error: "Zone and package tier must belong to the same courier." }, { status: 400 });

    const rate = await db.shippingRate.create({ data: { deliveryZoneId, packageTierId, courierCost, customerPriceStrategy: strategy, customerPriceValue, currencyCode, isActive: body.isActive !== false } });
    return NextResponse.json(rate, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "A shipping rate already exists for this zone and package tier." }, { status: 409 });
    return NextResponse.json({ error: error?.message ?? "Failed to create shipping rate." }, { status: 400 });
  }
}
