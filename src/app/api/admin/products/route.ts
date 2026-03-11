import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await db.product.findMany({
    include: {
      images: true,
      variants: true,
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, description, status, variants, selectedCategories } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }

    const existing = await db.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A product with this slug already exists." }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        status,
        variants: {
          create: variants.map((v: any) => ({
            sku:          v.sku,
            price:        v.price,
            comparePrice: v.comparePrice ?? null,
            inventory:    v.inventory,
            attributes:   v.attributes ?? {},
          })),
        },
        categories: {
          create: (selectedCategories ?? []).map((categoryId: string) => ({
            categoryId,
          })),
        },
      },
      include: { variants: true, categories: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A product with this SKU or slug already exists." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}