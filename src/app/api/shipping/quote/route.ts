import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

import {
  calculateShippingQuote,
  type ShippingQuote,
} from "@/lib/shipping/calculator";

import {
  normalizeShippingDestination,
} from "@/lib/shipping/destination";

import type { ShippingCartLine } from "@/lib/shipping/types";
import type {
  ShippingZoneData,
  ShippingCourier,
  ShippingZone,
  ShippingLocation,
} from "@/lib/shipping/zones";
import type { ShippingPackageTier } from "@/lib/shipping/tiers";
import type { ShippingRate } from "@/lib/shipping/rates";

const quoteRequestSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().trim().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),

  shipping: z.object({
    city: z.string().trim().min(1),
    province: z.string().trim().min(1),
  }),
});

function decimalToNumber(
  value: unknown,
): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof value.toNumber === "function"
  ) {
    return value.toNumber();
  }

  return Number(value);
}

async function loadShippingConfiguration(
  city: string,
  province: string,
): Promise<{
  zones: ShippingZoneData[];
  tiers: ShippingPackageTier[];
  rates: ShippingRate[];
}> {
  const destination =
    normalizeShippingDestination({
      country: "ZM",
      province,
      town: city,
    });

  const location =
    await db.deliveryLocation.findUnique({
      where: {
        countryCode_provinceNormalized_townNormalized: {
          countryCode:
            destination.countryCode,

          provinceNormalized:
            destination.provinceNormalized,

          townNormalized:
            destination.townNormalized,
        },
      },

      include: {
        zoneAssignments: {
          where: {
            zone: {
              isActive: true,
              courier: {
                isActive: true,
              },
            },
          },

          include: {
            zone: {
              include: {
                courier: true,
              },
            },
          },
        },
      },
    });

  if (!location) {
    return {
      zones: [],
      tiers: [],
      rates: [],
    };
  }

  const locations: ShippingLocation[] = [
    {
      id: location.id,
      countryCode:
        location.countryCode,
      provinceNormalized:
        location.provinceNormalized,
      townNormalized:
        location.townNormalized,
      isActive:
        location.isActive,
    },
  ];

  const zones: ShippingZoneData[] =
    location.zoneAssignments.map(
      (assignment) => {
        const courier: ShippingCourier = {
          id:
            assignment.zone.courier.id,

          code:
            assignment.zone.courier.code,

          name:
            assignment.zone.courier.name,

          isActive:
            assignment.zone.courier.isActive,
        };

        const zone: ShippingZone = {
          id:
            assignment.zone.id,

          courierId:
            assignment.zone.courierId,

          code:
            assignment.zone.code,

          name:
            assignment.zone.name,

          isActive:
            assignment.zone.isActive,
        };

        return {
          courier,
          zone,
          location: locations[0],
        };
      },
    );

  const courierIds = Array.from(
    new Set(
      zones.map(
        (entry) =>
          entry.courier.id,
      ),
    ),
  );

  const zoneIds = Array.from(
    new Set(
      zones.map(
        (entry) =>
          entry.zone.id,
      ),
    ),
  );

  if (
    courierIds.length === 0 ||
    zoneIds.length === 0
  ) {
    return {
      zones,
      tiers: [],
      rates: [],
    };
  }

  const [tierRows, rateRows] =
    await Promise.all([
      db.packageTier.findMany({
        where: {
          courierId: {
            in: courierIds,
          },

          isActive: true,
        },

        orderBy: [
          {
            courierId: "asc",
          },

          {
            position: "asc",
          },
        ],
      }),

      db.shippingRate.findMany({
        where: {
          deliveryZoneId: {
            in: zoneIds,
          },

          isActive: true,
        },
      }),
    ]);

  const tiers: ShippingPackageTier[] =
    tierRows.map((tier) => ({
      id: tier.id,

      courierId:
        tier.courierId,

      code: tier.code,

      name: tier.name,

      minPoints:
        tier.minPoints,

      maxPoints:
        tier.maxPoints,

      isCustom:
        tier.isCustom,

      isActive:
        tier.isActive,

      position:
        tier.position,
    }));

  const rates: ShippingRate[] =
    rateRows.map((rate) => ({
      id: rate.id,

      deliveryZoneId:
        rate.deliveryZoneId,

      packageTierId:
        rate.packageTierId,

      courierCost:
        decimalToNumber(
          rate.courierCost,
        ),

      customerPriceStrategy:
        rate.customerPriceStrategy,

      customerPriceValue:
        rate.customerPriceValue === null
          ? null
          : decimalToNumber(
              rate.customerPriceValue,
            ),

      currencyCode:
        rate.currencyCode,

      isActive:
        rate.isActive,
    }));

  return {
    zones,
    tiers,
    rates,
  };
}

function serializeShippingOption(
  option: ShippingQuote["options"][number],
) {
  return {
    courier: {
      id:
        option.courierId,

      code:
        option.courierCode,

      name:
        option.courierName,
    },

    zone: {
      id:
        option.zoneId,

      code:
        option.zoneCode,

      name:
        option.zoneName,
    },

    tier: {
      id:
        option.tierId,

      code:
        option.tierCode,

      name:
        option.tierName,

      minPoints:
        option.tierMinPoints,

      maxPoints:
        option.tierMaxPoints,

      isCustom:
        option.tierIsCustom,
    },

    rate: {
      id:
        option.rateId,

      currencyCode:
        option.currencyCode,
    },

    courierCost:
      option.courierCost,

    customerShippingPrice:
      option.customerShippingPrice,

    pricingStrategy:
      option.pricingStrategy,

    pricingValue:
      option.pricingValue,
  };
}

function serializeShippingQuote(
  quote: ShippingQuote,
) {
  return {
    status:
      quote.status,

    selectionMethod:
      quote.selectionMethod,

    currencyCode:
      quote.currencyCode,

    shippingPoints:
      quote.shippingPoints,

    destination:
      quote.destination,

    requiresCustomDelivery:
      quote.requiresCustomDelivery,

    customDeliveryReason:
      quote.customDeliveryReason,

    customDeliveryMessage:
      quote.customDeliveryMessage,

    selectedOption:
      quote.selectedOption
        ? serializeShippingOption(
            quote.selectedOption,
          )
        : null,

    options:
      quote.options.map(
        serializeShippingOption,
      ),
  };
}

export async function POST(
  request: Request,
) {
  try {
    const body: unknown =
      await request.json();

    const parsed =
      quoteRequestSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Invalid shipping quote request",

          details:
            parsed.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const variantIds =
      Array.from(
        new Set(
          parsed.data.items.map(
            (item) =>
              item.variantId,
          ),
        ),
      );

    const variants =
      await db.productVariant.findMany({
        where: {
          id: {
            in: variantIds,
          },
        },

        include: {
          product: true,
        },
      });

    const variantMap =
      new Map(
        variants.map(
          (variant) => [
            variant.id,
            variant,
          ],
        ),
      );

    const cartLines: ShippingCartLine[] =
      parsed.data.items.map(
        (item) => {
          const variant =
            variantMap.get(
              item.variantId,
            );

          if (!variant) {
            throw new Error(
              `Product variant not found: ${item.variantId}`,
            );
          }

          if (
            variant.product.status !==
            "ACTIVE"
          ) {
            throw new Error(
              `Product is not available: ${variant.product.name}`,
            );
          }

          if (
            variant.inventory <
            item.quantity
          ) {
            throw new Error(
              `Product is out of stock: ${variant.product.name}`,
            );
          }

          return {
            variantId:
              variant.id,

            productId:
              variant.productId,

            quantity:
              item.quantity,

            shippingPoints:
              variant.product
                .shippingPoints,

            shippingPointsOverride:
              variant.shippingPointsOverride,
          };
        },
      );

    const configuration =
      await loadShippingConfiguration(
        parsed.data.shipping.city,
        parsed.data.shipping.province,
      );

    const quote =
      calculateShippingQuote({
        cartLines,

        destination: {
          country: "ZM",

          province:
            parsed.data.shipping.province,

          town:
            parsed.data.shipping.city,
        },

        zones:
          configuration.zones,

        tiers:
          configuration.tiers,

        rates:
          configuration.rates,
      });

    return NextResponse.json({
      success: true,

      shipping:
        serializeShippingQuote(
          quote,
        ),
    });
  } catch (error) {
    console.error(
      "Failed to calculate shipping quote:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate shipping quote",
      },
      {
        status: 400,
      },
    );
  }
}