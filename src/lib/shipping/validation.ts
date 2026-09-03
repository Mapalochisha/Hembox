import { z } from "zod";

export const DEFAULT_PRODUCT_SHIPPING_POINTS = 1;
export const nonNegativeIntegerSchema = z.number().int().min(0);
export const nonNegativeMoneySchema = z.number().finite().min(0);

export const productShippingFieldsSchema = z.object({
  shippingPoints: nonNegativeIntegerSchema.optional(),
  variants: z.array(z.object({
    shippingPointsOverride: nonNegativeIntegerSchema.nullable().optional(),
  }).passthrough()).optional(),
}).passthrough();

export const packageTierFieldsSchema = z.object({
  minPoints: nonNegativeIntegerSchema.nullable(),
  maxPoints: nonNegativeIntegerSchema.nullable(),
  isCustom: z.boolean(),
}).superRefine((tier, context) => {
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

export function parseProductShippingFields(input: unknown) {
  return productShippingFieldsSchema.parse(input);
}

export function productShippingPointsForCreate(value: number | undefined) {
  return value ?? DEFAULT_PRODUCT_SHIPPING_POINTS;
}
