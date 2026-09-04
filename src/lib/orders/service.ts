import "server-only";

import {
  Prisma,
  ShippingPointSource,
  ShipmentSelectionMethod,
} from "@prisma/client";

import { db } from "@/lib/db";

import {
  calculateShippingQuote,
  type ShippingQuote,
} from "@/lib/shipping/calculator";

import {
  normalizeShippingDestination,
  type ShippingDestinationInput,
} from "@/lib/shipping/destination";

import type { ShippingCartLine } from "@/lib/shipping/types";
import type { ShippingZoneData } from "@/lib/shipping/zones";
import type { ShippingPackageTier } from "@/lib/shipping/tiers";
import type { ShippingRate } from "@/lib/shipping/rates";

const SYSTEM_DEFAULT_SHIPPING_POINTS = 1;

export interface CreateOrderInput {
  items: {
    variantId: string;
    quantity: number;
  }[];

  shipping: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    notes?: string | null;
  };

  selectedShippingRateId?: string | null;
}

export interface CreatedOrderResult {
  orderId: string;
  orderNumber: string;

  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  tax: number;
  total: number;

  requiresCustomDelivery: boolean;
  shippingSelectionMethod: ShipmentSelectionMethod;
  shippingQuote: ShippingQuote;

  emailData: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;

    items: {
      name: string;
      sku: string;
      quantity: number;
      price: number;
      attributes: Record<string, string>;
    }[];

    subtotal: number;
    shippingCost: number;
    total: number;

    shippingAddress: {
      address: string;
      city: string;
      province: string;
    };

    notes?: string;
  };
}

function normalizeRequiredString(
  value: string,
  fieldName: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

function validateInput(input: CreateOrderInput): void {
  if (!input.items.length) {
    throw new Error("At least one item is required");
  }

  for (const item of input.items) {
    if (!item.variantId.trim()) {
      throw new Error("Each item must have a variant ID");
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(
        "Each item quantity must be a positive integer",
      );
    }
  }

  normalizeRequiredString(input.shipping.name, "Name");
  normalizeRequiredString(input.shipping.email, "Email");
  normalizeRequiredString(input.shipping.phone, "Phone");
  normalizeRequiredString(input.shipping.address, "Address");
  normalizeRequiredString(input.shipping.city, "City");
  normalizeRequiredString(input.shipping.province, "Province");

  if (
    input.selectedShippingRateId !== undefined &&
    input.selectedShippingRateId !== null &&
    !input.selectedShippingRateId.trim()
  ) {
    throw new Error("Invalid shipping rate selection");
  }
}

function decimalToNumber(
  value: Prisma.Decimal | number | string | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }

  return Number(value);
}

function splitName(name: string): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function jsonObjectToStringRecord(
  value: Prisma.JsonValue,
): Record<string, string> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean"
    ) {
      result[key] = String(entry);
    }
  }

  return result;
}

function buildShippingCartLines(
  variants: {
    id: string;
    productId: string;
    product: {
      id: string;
      name: string;
      shippingPoints: number;
    };
    shippingPointsOverride: number | null;
  }[],
  requestedItems: CreateOrderInput["items"],
): ShippingCartLine[] {
  const variantMap = new Map(
    variants.map((variant) => [variant.id, variant]),
  );

  return requestedItems.map((item) => {
    const variant = variantMap.get(item.variantId);

    if (!variant) {
      throw new Error(
        `Product variant not found: ${item.variantId}`,
      );
    }

    return {
      variantId: variant.id,
      productId: variant.productId,
      quantity: item.quantity,
      shippingPoints: variant.product.shippingPoints,
      shippingPointsOverride:
        variant.shippingPointsOverride,
    };
  });
}

async function loadShippingConfiguration(
  destination: ShippingDestinationInput,
): Promise<{
  zones: ShippingZoneData[];
  tiers: ShippingPackageTier[];
  rates: ShippingRate[];
}> {
  const normalizedDestination =
    normalizeShippingDestination(destination);

  const location = await db.deliveryLocation.findUnique({
    where: {
      countryCode_provinceNormalized_townNormalized: {
        countryCode: normalizedDestination.countryCode,
        provinceNormalized:
          normalizedDestination.provinceNormalized,
        townNormalized:
          normalizedDestination.townNormalized,
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

  const zones: ShippingZoneData[] =
    location.zoneAssignments.map((assignment) => ({
      courier: {
        id: assignment.zone.courier.id,
        code: assignment.zone.courier.code,
        name: assignment.zone.courier.name,
        isActive: assignment.zone.courier.isActive,
      },

      zone: {
        id: assignment.zone.id,
        courierId: assignment.zone.courierId,
        code: assignment.zone.code,
        name: assignment.zone.name,
        isActive: assignment.zone.isActive,
      },

      location: {
        id: location.id,
        countryCode: location.countryCode,
        provinceNormalized:
          location.provinceNormalized,
        townNormalized:
          location.townNormalized,
        isActive: location.isActive,
      },
    }));

  const courierIds = Array.from(
    new Set(
      location.zoneAssignments.map(
        (assignment) => assignment.zone.courierId,
      ),
    ),
  );

  const zoneIds = zones.map(
    (zone) => zone.zone.id,
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

  const [tiers, rates] = await Promise.all([
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

        deliveryZone: {
          isActive: true,

          courier: {
            isActive: true,
          },
        },

        packageTier: {
          isActive: true,
        },
      },

      include: {
        deliveryZone: {
          include: {
            courier: true,
          },
        },

        packageTier: true,
      },
    }),
  ]);

  const shippingTiers: ShippingPackageTier[] =
    tiers.map((tier) => ({
      id: tier.id,
      courierId: tier.courierId,
      code: tier.code,
      name: tier.name,
      minPoints: tier.minPoints,
      maxPoints: tier.maxPoints,
      isCustom: tier.isCustom,
      isActive: tier.isActive,
      position: tier.position,
    }));

  const shippingRates: ShippingRate[] =
    rates.map((rate) => ({
      id: rate.id,
      deliveryZoneId: rate.deliveryZoneId,
      packageTierId: rate.packageTierId,
      courierCost: decimalToNumber(
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
      currencyCode: rate.currencyCode,
      isActive: rate.isActive,
    }));

  return {
    zones,
    tiers: shippingTiers,
    rates: shippingRates,
  };
}

function selectShippingOption(
  quote: ShippingQuote,
  selectedShippingRateId?: string | null,
) {
  if (quote.requiresCustomDelivery) {
    return null;
  }

  if (quote.options.length === 0) {
    throw new Error(
      "No shipping options are available",
    );
  }

  if (
    quote.selectionMethod ===
    "AUTO_SELECTED"
  ) {
    return quote.options[0];
  }

  if (
    quote.selectionMethod ===
    "CUSTOMER_SELECTED"
  ) {
    if (!selectedShippingRateId) {
      throw new Error(
        "Please select a shipping option",
      );
    }

    const selectedOption =
      quote.options.find(
        (option) =>
          option.rateId ===
          selectedShippingRateId,
      );

    if (!selectedOption) {
      throw new Error(
        "The selected shipping option is no longer available",
      );
    }

    return selectedOption;
  }

  return null;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreatedOrderResult> {
  validateInput(input);

  const customerName =
    normalizeRequiredString(
      input.shipping.name,
      "Name",
    );

  const customerEmail =
    normalizeRequiredString(
      input.shipping.email,
      "Email",
    ).toLowerCase();

  const phone =
    normalizeRequiredString(
      input.shipping.phone,
      "Phone",
    );

  const address =
    normalizeRequiredString(
      input.shipping.address,
      "Address",
    );

  const city =
    normalizeRequiredString(
      input.shipping.city,
      "City",
    );

  const province =
    normalizeRequiredString(
      input.shipping.province,
      "Province",
    );

  const notes =
    input.shipping.notes?.trim() || undefined;

  const variantIds = Array.from(
    new Set(
      input.items.map(
        (item) => item.variantId,
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

  if (variants.length !== variantIds.length) {
    const foundIds = new Set(
      variants.map(
        (variant) => variant.id,
      ),
    );

    const missingVariantId =
      variantIds.find(
        (id) => !foundIds.has(id),
      );

    throw new Error(
      `Product variant not found: ${missingVariantId ?? "unknown"}`,
    );
  }

  for (const variant of variants) {
    if (
      variant.product.status !== "ACTIVE"
    ) {
      throw new Error(
        `Product is not available: ${variant.product.name}`,
      );
    }

    const requestedQuantity =
      input.items.find(
        (item) =>
          item.variantId === variant.id,
      )?.quantity ?? 0;

    if (
      variant.inventory <
        requestedQuantity &&
      !variant.allowBackorder
    ) {
      throw new Error(
        `Product is out of stock: ${variant.product.name}`,
      );
    }

    if (
      !Number.isInteger(
        variant.product.shippingPoints,
      ) ||
      variant.product.shippingPoints < 0
    ) {
      throw new Error(
        `Invalid shipping points configured for product: ${variant.product.name}`,
      );
    }

    if (
      variant.shippingPointsOverride !==
        null &&
      (!Number.isInteger(
        variant.shippingPointsOverride,
      ) ||
        variant.shippingPointsOverride < 0)
    ) {
      throw new Error(
        `Invalid shipping points configured for variant: ${variant.sku}`,
      );
    }

    if (variant.price.lt(0)) {
      throw new Error(
        `Invalid price configured for variant: ${variant.sku}`,
      );
    }
  }

  const shippingCartLines =
    buildShippingCartLines(
      variants,
      input.items,
    );

  const destination: ShippingDestinationInput = {
    country: "ZM",
    province,
    town: city,
  };

  const shippingConfiguration =
    await loadShippingConfiguration(
      destination,
    );

  const shippingQuote =
    calculateShippingQuote({
      cartLines: shippingCartLines,
      destination,
      zones:
        shippingConfiguration.zones,
      tiers:
        shippingConfiguration.tiers,
      rates:
        shippingConfiguration.rates,
    });

  const selectedOption =
    selectShippingOption(
      shippingQuote,
      input.selectedShippingRateId,
    );

  const variantMap = new Map(
    variants.map(
      (variant) => [variant.id, variant],
    ),
  );

  const subtotal = input.items.reduce(
    (sum, item) => {
      const variant =
        variantMap.get(
          item.variantId,
        );

      if (!variant) {
        throw new Error(
          `Product variant not found: ${item.variantId}`,
        );
      }

      return (
        sum +
        decimalToNumber(
          variant.price,
        ) * item.quantity
      );
    },
    0,
  );

  const shippingCost =
    selectedOption?.customerShippingPrice ??
    0;

  const discountAmount = 0;
  const tax = 0;

  const total =
    subtotal +
    shippingCost -
    discountAmount +
    tax;

  const orderNumber =
    `HB-${Date.now()}-${Math.floor(
      Math.random() * 10000,
    )
      .toString()
      .padStart(4, "0")}`;

  const {
    firstName,
    lastName,
  } = splitName(customerName);

  const transactionResult =
    await db.$transaction(
      async (tx) => {
        let customer =
          await tx.customer.findUnique({
            where: {
              email: customerEmail,
            },
          });

        if (!customer) {
          customer =
            await tx.customer.create({
              data: {
                email: customerEmail,
                name: customerName,
                phone,
              },
            });
        } else {
          const customerUpdate:
            Prisma.CustomerUpdateInput = {};

          if (!customer.name) {
            customerUpdate.name =
              customerName;
          }

          if (!customer.phone) {
            customerUpdate.phone = phone;
          }

          if (
            Object.keys(
              customerUpdate,
            ).length > 0
          ) {
            customer =
              await tx.customer.update({
                where: {
                  id: customer.id,
                },
                data: customerUpdate,
              });
          }
        }

        let existingAddress =
          await tx.address.findFirst({
            where: {
              customerId:
                customer.id,
              line1: address,
              city,
              state: province,
              country: "ZM",
            },
          });

        if (!existingAddress) {
          existingAddress =
            await tx.address.create({
              data: {
                customerId:
                  customer.id,
                firstName,
                lastName,
                line1: address,
                city,
                state: province,
                country: "ZM",
                phone,
              },
            });
        }

        const order =
          await tx.order.create({
            data: {
              orderNumber,

              customerId:
                customer.id,

              addressId:
                existingAddress.id,

              subtotal:
                new Prisma.Decimal(
                  subtotal.toFixed(2),
                ),

              shippingCost:
                new Prisma.Decimal(
                  shippingCost.toFixed(2),
                ),

              discountAmount:
                new Prisma.Decimal(
                  discountAmount.toFixed(2),
                ),

              tax:
                new Prisma.Decimal(
                  tax.toFixed(2),
                ),

              total:
                new Prisma.Decimal(
                  total.toFixed(2),
                ),

              guestEmail:
                customerEmail,

              guestName:
                customerName,

              shippingMethod:
                selectedOption?.courierName ??
                null,

              shippingAddress: {
                name: customerName,
                phone,
                address,
                city,
                province,
                country: "ZM",
              },

              paymentStatus:
                "PENDING",

              notes:
                notes ?? null,

              requiresCustomDelivery:
                shippingQuote.requiresCustomDelivery,

              items: {
                create:
                  input.items.map(
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

                      const shippingLine =
                        shippingCartLines.find(
                          (line) =>
                            line.variantId ===
                            variant.id,
                        );

                      if (!shippingLine) {
                        throw new Error(
                          `Shipping line not found for variant: ${variant.id}`,
                        );
                      }

                      const shippingPointSource =
                        shippingLine.shippingPointsOverride !==
                        null
                          ? ShippingPointSource.VARIANT_OVERRIDE
                          : ShippingPointSource.PRODUCT_DEFAULT;

                      return {
                        productId:
                          variant.productId,

                        variantId:
                          variant.id,

                        quantity:
                          item.quantity,

                        priceAtPurchase:
                          variant.price,

                        variantSnapshot: {
                          id: variant.id,

                          sku: variant.sku,

                          attributes:
                            jsonObjectToStringRecord(
                              variant.attributes,
                            ),

                          product: {
                            id: variant.product.id,
                            name: variant.product.name,
                          },
                        },

                        shippingPointsPerUnit:
                          shippingLine.shippingPointsOverride ??
                          shippingLine.shippingPoints,

                        shippingPointSource,
                      };
                    },
                  ),
              },

              shipment: {
                create: {
                  courierId:
                    selectedOption?.courierId ??
                    null,

                  deliveryZoneId:
                    selectedOption?.zoneId ??
                    null,

                  packageTierId:
                    selectedOption?.tierId ??
                    null,

                  status:
                    "PENDING",

                  selectionMethod:
                    shippingQuote.selectionMethod,

                  shippingPoints:
                    shippingQuote
                      .shippingPoints
                      .totalPoints,

                  customerShippingPrice:
                    selectedOption
                      ? new Prisma.Decimal(
                          selectedOption.customerShippingPrice.toFixed(
                            2,
                          ),
                        )
                      : null,

                  courierCost:
                    selectedOption
                      ? new Prisma.Decimal(
                          selectedOption.courierCost.toFixed(
                            2,
                          ),
                        )
                      : null,

                  currencyCode:
                    shippingQuote.currencyCode,

                  destinationCountryCode:
                    shippingQuote
                      .destination
                      .countryCode,

                  destinationProvince:
                    shippingQuote
                      .destination
                      .provinceNormalized,

                  destinationTown:
                    shippingQuote
                      .destination
                      .townNormalized,

                  courierCodeSnapshot:
                    selectedOption?.courierCode ??
                    null,

                  courierNameSnapshot:
                    selectedOption?.courierName ??
                    null,

                  zoneCodeSnapshot:
                    selectedOption?.zoneCode ??
                    null,

                  zoneNameSnapshot:
                    selectedOption?.zoneName ??
                    null,

                  tierCodeSnapshot:
                    selectedOption?.tierCode ??
                    null,

                  tierNameSnapshot:
                    selectedOption?.tierName ??
                    null,

                  tierMinPointsSnapshot:
                    selectedOption?.tierMinPoints ??
                    null,

                  tierMaxPointsSnapshot:
                    selectedOption?.tierMaxPoints ??
                    null,

                  tierIsCustomSnapshot:
                    selectedOption?.tierIsCustom ??
                    null,

                  rateIdSnapshot:
                    selectedOption?.rateId ??
                    null,

                  pricingStrategySnapshot:
                    selectedOption?.pricingStrategy ??
                    null,

                  pricingValueSnapshot:
                    selectedOption?.pricingValue !==
                      null &&
                    selectedOption?.pricingValue !==
                      undefined
                      ? new Prisma.Decimal(
                          selectedOption.pricingValue.toFixed(
                            2,
                          ),
                        )
                      : null,
                },
              },
            },

            include: {
              items: true,
            },
          });

        return {
          order,
          customer,
        };
      },
    );

  const emailItems =
    input.items.map((item) => {
      const variant =
        variantMap.get(
          item.variantId,
        );

      if (!variant) {
        throw new Error(
          `Product variant not found: ${item.variantId}`,
        );
      }

      return {
        name:
          variant.product.name,

        sku:
          variant.sku,

        quantity:
          item.quantity,

        price:
          decimalToNumber(
            variant.price,
          ),

        attributes:
          jsonObjectToStringRecord(
            variant.attributes,
          ),
      };
    });

  return {
    orderId:
      transactionResult.order.id,

    orderNumber:
      transactionResult.order.orderNumber,

    subtotal,
    shippingCost,
    discountAmount,
    tax,
    total,

    requiresCustomDelivery:
      shippingQuote.requiresCustomDelivery,

    shippingSelectionMethod:
      shippingQuote.selectionMethod,

    shippingQuote,

    emailData: {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone: phone,

      items: emailItems,

      subtotal,
      shippingCost,
      total,

      shippingAddress: {
        address,
        city,
        province,
      },

      ...(notes
        ? { notes }
        : {}),
    },
  };
}