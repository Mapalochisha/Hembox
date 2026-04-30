import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, orderId } = await req.json();

    if (!email || !password || !orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if customer already exists
    let customer = await db.customer.findUnique({ where: { email } });

    if (customer) {
      if (customer.passwordHash) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
      }
      
      // Update existing guest customer with password
      const passwordHash = await bcrypt.hash(password, 12);
      await db.customer.update({
        where: { id: customer.id },
        data: { passwordHash }
      });
    } else {
      // Create new customer
      const passwordHash = await bcrypt.hash(password, 12);
      customer = await db.customer.create({
        data: {
          email,
          passwordHash,
        }
      });
    }

    // 2. Link existing order to this customer if not linked
    await db.order.update({
      where: { id: orderId },
      data: { customerId: customer.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Account creation error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
