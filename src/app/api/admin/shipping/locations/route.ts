import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireShippingAdmin } from "@/lib/shipping/admin-auth";
import { normalizeLocationPart, normalizeShippingText } from "@/lib/shipping/admin";

export async function GET() {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;

  const locations = await db.deliveryLocation.findMany({
    orderBy: [{ isActive: "desc" }, { province: "asc" }, { town: "asc" }],
    include: { _count: { select: { zoneAssignments: true } } },
  });
  return NextResponse.json(locations);
}

export async function POST(req: Request) {
  const auth = await requireShippingAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const countryCode = normalizeShippingText(String(body.countryCode ?? "")).toUpperCase();
    const province = normalizeShippingText(String(body.province ?? ""));
    const town = normalizeShippingText(String(body.town ?? ""));
    if (!countryCode || !province || !town) {
      return NextResponse.json({ error: "Country code, province, and town are required." }, { status: 400 });
    }
    if (countryCode.length !== 2) return NextResponse.json({ error: "Country code must be a 2-letter ISO code." }, { status: 400 });

    const location = await db.deliveryLocation.create({
      data: {
        countryCode,
        province,
        provinceNormalized: normalizeLocationPart(province),
        town,
        townNormalized: normalizeLocationPart(town),
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "This delivery location already exists." }, { status: 409 });
    console.error(error);
    return NextResponse.json({ error: error?.message ?? "Failed to create location." }, { status: 400 });
  }
}
