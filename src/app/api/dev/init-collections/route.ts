import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  // Only allow in development or preview environments
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL_URL) {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    console.log("🛠️ Initializing Collections tables...");

    // Create collections table
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

    // Create unique index on slug
    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "collections_slug_key" ON "collections"("slug");
    `);

    // Create product_collections table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "product_collections" (
        "productId" TEXT NOT NULL,
        "collectionId" TEXT NOT NULL,

        CONSTRAINT "product_collections_pkey" PRIMARY KEY ("productId","collectionId")
      );
    `);

    // Add foreign keys
    await db.$executeRawUnsafe(`
      ALTER TABLE "product_collections" DROP CONSTRAINT IF EXISTS "product_collections_productId_fkey";
      ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_productId_fkey" 
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await db.$executeRawUnsafe(`
      ALTER TABLE "product_collections" DROP CONSTRAINT IF EXISTS "product_collections_collectionId_fkey";
      ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collectionId_fkey" 
      FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    return NextResponse.json({ 
      success: true, 
      message: "Collections tables initialized successfully" 
    });
  } catch (error: any) {
    console.error("Init DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
