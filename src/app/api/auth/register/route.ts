import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import * as z from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    // Check if customer already exists
    const existingCustomer = await db.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { message: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const customer = await db.customer.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: customer.id },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    
    console.error("Registration error:", error);

    // Provide more specific message for common Prisma/DB errors during development
    if (error.code === "P2021") {
      return NextResponse.json({ message: "Database table is missing. Did you run prisma db push?" }, { status: 500 });
    }
    
    // Check for missing columns or other Prisma issues
    if (error.message?.includes("passwordHash") || error.message?.includes("column")) {
      return NextResponse.json({ 
        message: "Database schema is out of sync. Please run 'npx prisma db push' on your production/vercel environment." 
      }, { status: 500 });
    }

    return NextResponse.json({ message: "Internal server error: " + (error.message || "Unknown error") }, { status: 500 });
  }
}
