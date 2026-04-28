export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customers = await db.customer.findMany({
      include: {
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
        addresses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("Admin customers GET error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch customers", 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}