export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateProductShippingFields } from "@/lib/shipping/validation";

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
    validateProductShippingFields(body);

    const {
      name,
      slug,
      description,
      status,
      variants,
      selectedCategories,
      selectedCollections,
      images,
      shippingPoints,
    } = body;

    const incomingIds = variants.filter((v: any) => v.id).map((v: any) => v.id);
    const historicalVariants = await db.productVariant.findMany({
      where: {
        productId: params.id,
        id: { notIn: incomingIds },
        orderItems: { some: {} },
      },
      select: { sku: true },
    });

    if (historicalVariants.length > 0) {
      return NextResponse.json(
        { error: "Variants with historical order items cannot be removed." },
        { status: 409 },
      );
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description,
        status,
        ...(shippingPoints !== undefined && { shippingPoints }),
      },
    });

    // Sync variants — delete removed ones, update existing, create new
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
            ...(Object.prototype.hasOwnProperty.call(v, "shippingPointsOverride") && {
              shippingPointsOverride: v.shippingPointsOverride,
            }),
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
            shippingPointsOverride: v.shippingPointsOverride ?? null,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid shipping points." }, { status: 400 });
    }
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
    const historicalOrderItemCount = await db.orderItem.count({
      where: { productId: params.id },
    });

    if (historicalOrderItemCount > 0) {
      const archivedProduct = await db.product.update({
        where: { id: params.id },
        data: { status: "ARCHIVED", featured: false },
      });
      return NextResponse.json({
        archived: true,
        product: archivedProduct,
        message: "Products with historical order items are archived instead of deleted.",
      });
    }

    // Get all variant ids first
    const variants = await db.productVariant.findMany({
      where: { productId: params.id },
      select: { id: true },
    });
    const variantIds = variants.map(v => v.id);

    // Delete variant-related records that are not historical order data.
    if (variantIds.length > 0) {
      await db.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
      await db.stockAlert.deleteMany({ where: { variantId: { in: variantIds } } });
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
