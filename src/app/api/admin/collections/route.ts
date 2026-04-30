import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await db.collection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    return NextResponse.json(collections);
  } catch (error: any) {
    console.error("GET /api/admin/collections error:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, description, imageUrl, featured } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const collection = await db.collection.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        featured: !!featured,
      },
    });

    return NextResponse.json(collection);
  } catch (error: any) {
    console.error("POST /api/admin/collections error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create collection" },
      { status: 500 }
    );
  }
}
