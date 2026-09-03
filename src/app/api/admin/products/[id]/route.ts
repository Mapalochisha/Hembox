export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateProductShippingFields } from "@/lib/shipping/validation";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(product);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const updatedProduct = await db.$transaction(async (tx) => {
      /*
       * Load the variants that actually belong to this product.
       *
       * This gives us an authoritative ownership check instead of
       * trusting variant IDs supplied by the browser.
       */
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: params.id },
        select: {
          id: true,
          sku: true,
        },
      });

      const existingVariantIds = new Set(
        existingVariants.map((variant) => variant.id),
      );

      const incomingIds = variants
        .filter((variant: any) => variant.id)
        .map((variant: any) => variant.id);

      /*
       * Reject any existing variant ID that does not belong to this
       * product. This prevents a crafted request from modifying a
       * different product's variant.
       */
      const foreignVariantIds = incomingIds.filter(
        (variantId: string) => !existingVariantIds.has(variantId),
      );

      if (foreignVariantIds.length > 0) {
        throw new Error(
          "One or more variants do not belong to this product.",
        );
      }

      /*
       * Historical variants must never be removed because their IDs
       * are referenced by historical order items.
       */
      const historicalVariants = await tx.productVariant.findMany({
        where: {
          productId: params.id,
          id: { notIn: incomingIds },
          orderItems: { some: {} },
        },
        select: {
          sku: true,
        },
      });

      if (historicalVariants.length > 0) {
        throw new Error(
          "Variants with historical order items cannot be removed.",
        );
      }

      const product = await tx.product.update({
        where: { id: params.id },
        data: {
          name,
          slug,
          description,
          status,
          ...(shippingPoints !== undefined && { shippingPoints }),
        },
      });

      /*
       * Delete only variants belonging to this product.
       *
       * Historical variants were already checked above.
       */
      await tx.productVariant.deleteMany({
        where: {
          productId: params.id,
          id: { notIn: incomingIds },
        },
      });

      /*
       * Update existing variants only after their ownership has
       * been explicitly verified above.
       */
      for (const variant of variants) {
        if (variant.id) {
          await tx.productVariant.update({
            where: {
              id: variant.id,
            },
            data: {
              sku: variant.sku,
              price: variant.price,
              comparePrice: variant.comparePrice ?? null,
              inventory: variant.inventory,
              attributes: variant.attributes ?? {},
              ...(Object.prototype.hasOwnProperty.call(
                variant,
                "shippingPointsOverride",
              ) && {
                shippingPointsOverride: variant.shippingPointsOverride,
              }),
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: params.id,
              sku: variant.sku,
              price: variant.price,
              comparePrice: variant.comparePrice ?? null,
              inventory: variant.inventory,
              attributes: variant.attributes ?? {},
              shippingPointsOverride:
                variant.shippingPointsOverride ?? null,
            },
          });
        }
      }

      // Sync categories
      await tx.productCategory.deleteMany({
        where: { productId: params.id },
      });

      if (selectedCategories?.length) {
        await tx.productCategory.createMany({
          data: selectedCategories.map((categoryId: string) => ({
            productId: params.id,
            categoryId,
          })),
        });
      }

      // Sync collections
      await tx.productCollection.deleteMany({
        where: { productId: params.id },
      });

      if (selectedCollections?.length) {
        await tx.productCollection.createMany({
          data: selectedCollections.map((collectionId: string) => ({
            productId: params.id,
            collectionId,
          })),
        });
      }

      // Sync images
      if (images !== undefined) {
        await tx.productImage.deleteMany({
          where: { productId: params.id },
        });

        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((image: any) => ({
              productId: params.id,
              url: image.url,
              publicId: image.publicId,
              isPrimary: image.isPrimary,
              position: image.position ?? 0,
            })),
          });
        }
      }

      return product;
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            error.issues[0]?.message ?? "Invalid shipping points.",
        },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "One or more variants do not belong to this product."
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "Variants with historical order items cannot be removed."
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 },
      );
    }

    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "A product with this slug or SKU already exists.",
        },
        { status: 400 },
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const historicalOrderItemCount = await db.orderItem.count({
      where: { productId: params.id },
    });

    if (historicalOrderItemCount > 0) {
      const archivedProduct = await db.product.update({
        where: { id: params.id },
        data: {
          status: "ARCHIVED",
          featured: false,
        },
      });

      return NextResponse.json({
        archived: true,
        product: archivedProduct,
        message:
          "Products with historical order items are archived instead of deleted.",
      });
    }

    // Get all variant IDs first
    const variants = await db.productVariant.findMany({
      where: { productId: params.id },
      select: { id: true },
    });

    const variantIds = variants.map((variant) => variant.id);

    // Delete variant-related records that are not historical order data
    if (variantIds.length > 0) {
      await db.cartItem.deleteMany({
        where: { variantId: { in: variantIds } },
      });

      await db.stockAlert.deleteMany({
        where: { variantId: { in: variantIds } },
      });
    }

    // Delete product-related records
    await db.productImage.deleteMany({
      where: { productId: params.id },
    });

    await db.productVariant.deleteMany({
      where: { productId: params.id },
    });

    await db.productCategory.deleteMany({
      where: { productId: params.id },
    });

    await db.productTag.deleteMany({
      where: { productId: params.id },
    });

    await db.wishlistItem.deleteMany({
      where: { productId: params.id },
    });

    await db.review.deleteMany({
      where: { productId: params.id },
    });

    await db.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 },
    );
  }
}