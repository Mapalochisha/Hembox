import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customer = await db.customer.findUnique({
      where: { id: (session.user as any).id },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const defaultAddress = customer.addresses[0];

    return NextResponse.json({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: defaultAddress ? {
        firstName: defaultAddress.firstName,
        lastName: defaultAddress.lastName,
        line1: defaultAddress.line1,
        city: defaultAddress.city,
        state: defaultAddress.state,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
