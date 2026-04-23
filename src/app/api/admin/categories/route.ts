export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await db.category.findMany({
    include: { children: true, products: true },
    orderBy: { position: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, slug, description, parentId, featured, imageUrl } = await req.json();

    if (!name || !slug) return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });

    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "A category with this slug already exists." }, { status: 400 });

    const category = await db.category.create({
      data: { name, slug, description, parentId: parentId || null, featured, imageUrl: imageUrl || null },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}