import { z } from "zod";

export const DEFAULT_PRODUCT_SHIPPING_POINTS = 1;
export const nonNegativeIntegerSchema = z.number().int().min(0);
export const nonNegativeMoneySchema = z.number().finite().min(0);

export const productShippingFieldsSchema = z.object({
  shippingPoints: nonNegativeIntegerSchema.optional(),
  variants: z
    .array(
      z
        .object({
          shippingPointsOverride: nonNegativeIntegerSchema.nullable().optional(),
        })
        .passthrough(),
    )
    .optional(),
});

export const packageTierFieldsSchema = z
  .object({
    minPoints: nonNegativeIntegerSchema.nullable(),
    maxPoints: nonNegativeIntegerSchema.nullable(),
    isCustom: z.boolean(),
  })
  .superRefine((tier, context) => {
    if (tier.isCustom) {
      if (tier.minPoints !== null || tier.maxPoints !== null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom package tiers cannot define point bounds.",
        });
      }
      return;
    }

    if (tier.minPoints === null || tier.maxPoints === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Standard package tiers require minimum and maximum points.",
      });
    } else if (tier.minPoints > tier.maxPoints) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A package tier minimum cannot exceed its maximum.",
      });
    }
  });

export const shippingRateFieldsSchema = z.object({
  courierCost: nonNegativeMoneySchema,
  customerPriceValue: nonNegativeMoneySchema.nullable(),
});

/**
 * Validate only shipping-related fields on an existing product payload.
 *
 * The product APIs predate the shipping subsystem and contain many unrelated
 * fields. Keeping those fields out of this schema preserves the existing API
 * contract and prevents Zod from turning unrelated values into `unknown` at
 * the call site.
 */
export function validateProductShippingFields(input: unknown): void {
  if (typeof input !== "object" || input === null) {
    throw new z.ZodError([
      {
        code: "custom",
        path: [],
        message: "Invalid product payload.",
      },
    ]);
  }

  const body = input as Record<string, unknown>;

  productShippingFieldsSchema.parse({
    shippingPoints: body.shippingPoints,
    variants: body.variants,
  });
}

export function productShippingPointsForCreate(
  value: number | undefined,
) {
  return value ?? DEFAULT_PRODUCT_SHIPPING_POINTS;
}
