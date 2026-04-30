export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      variants: true,
      images: true,
      categories: { include: { category: true } },
      collections: { include: { collection: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, description, status, variants, selectedCategories, selectedCollections, images } = body;

    const product = await db.product.update({
      where: { id: params.id },
      data: { name, slug, description, status },
    });

    // Sync variants — delete removed ones, update existing, create new
    const incomingIds = variants.filter((v: any) => v.id).map((v: any) => v.id);
    await db.productVariant.deleteMany({
      where: { productId: params.id, id: { notIn: incomingIds } },
    });

    for (const v of variants) {
      if (v.id) {
        await db.productVariant.update({
          where: { id: v.id },
          data: {
            sku:          v.sku,
            price:        v.price,
            comparePrice: v.comparePrice ?? null,
            inventory:    v.inventory,
            attributes:   v.attributes ?? {},
          },
        });
      } else {
        await db.productVariant.create({
          data: {
            productId:    params.id,
            sku:          v.sku,
            price:        v.price,
            comparePrice: v.comparePrice ?? null,
            inventory:    v.inventory,
            attributes:   v.attributes ?? {},
          },
        });
      }
    }

    // Sync categories
    await db.productCategory.deleteMany({ where: { productId: params.id } });
    if (selectedCategories?.length) {
      await db.productCategory.createMany({
        data: selectedCategories.map((categoryId: string) => ({
          productId: params.id,
          categoryId,
        })),
      });
    }

    // Sync collections
    await db.productCollection.deleteMany({ where: { productId: params.id } });
    if (selectedCollections?.length) {
      await db.productCollection.createMany({
        data: selectedCollections.map((collectionId: string) => ({
          productId: params.id,
          collectionId,
        })),
      });
    }

    // Sync images
    if (images !== undefined) {
      await db.productImage.deleteMany({ where: { productId: params.id } });
      if (images.length > 0) {
        await db.productImage.createMany({
          data: images.map((img: any) => ({
            productId: params.id,
            url:       img.url,
            publicId:  img.publicId,
            isPrimary: img.isPrimary,
            position:  img.position ?? 0,
          })),
        });
      }
    }

    return NextResponse.json(product);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A product with this slug or SKU already exists." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get all variant ids first
    const variants = await db.productVariant.findMany({
      where: { productId: params.id },
      select: { id: true },
    });
    const variantIds = variants.map(v => v.id);

    // Delete variant-related records
  if (variantIds.length > 0) {
    await db.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
    await db.stockAlert.deleteMany({ where: { variantId: { in: variantIds } } });
    await db.orderItem.deleteMany({ where: { variantId: { in: variantIds } } });
  }

    // Delete product-related records
    await db.productImage.deleteMany({ where: { productId: params.id } });
    await db.productVariant.deleteMany({ where: { productId: params.id } });
    await db.productCategory.deleteMany({ where: { productId: params.id } });
    await db.productTag.deleteMany({ where: { productId: params.id } });
    await db.wishlistItem.deleteMany({ where: { productId: params.id } });
    await db.review.deleteMany({ where: { productId: params.id } });
    await db.product.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete product." }, { status: 500 });
  }
}