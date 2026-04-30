import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL_URL) {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    console.log("🛠️ Initializing Collections tables individually...");

    // 1. Create collections table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "collections" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT,
        "imageUrl" TEXT,
        "featured" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
      );
    `);

    // 2. Create unique index
    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "collections_slug_key" ON "collections"("slug");
    `);

    // 3. Create product_collections table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "product_collections" (
        "productId" TEXT NOT NULL,
        "collectionId" TEXT NOT NULL,
        CONSTRAINT "product_collections_pkey" PRIMARY KEY ("productId","collectionId")
      );
    `);

    // 4. Add foreign keys (drop first to be safe)
    try {
      await db.$executeRawUnsafe(`ALTER TABLE "product_collections" DROP CONSTRAINT IF EXISTS "product_collections_productId_fkey";`);
      await db.$executeRawUnsafe(`ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    } catch (e) { console.log("FK 1 may already exist"); }

    try {
      await db.$executeRawUnsafe(`ALTER TABLE "product_collections" DROP CONSTRAINT IF EXISTS "product_collections_collectionId_fkey";`);
      await db.$executeRawUnsafe(`ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    } catch (e) { console.log("FK 2 may already exist"); }

    return NextResponse.json({ success: true, message: "Tables initialized" });
  } catch (error: any) {
    console.error("Init error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
