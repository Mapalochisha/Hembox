import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createOrder,
  type CreateOrderInput,
} from "@/lib/orders/service";

import {
  sendAdminOrderNotification,
  sendOrderConfirmationEmail,
} from "@/lib/email";

import type { ShippingOption } from "@/lib/shipping/availability";
import type { ShippingQuote } from "@/lib/shipping/calculator";

const orderRequestSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z
          .string()
          .trim()
          .min(1),

        quantity: z
          .number()
          .int()
          .positive(),
      }),
    )
    .min(1),

  shipping: z.object({
    name: z
      .string()
      .trim()
      .min(1),

    email: z
      .string()
      .trim()
      .email(),

    phone: z
      .string()
      .trim()
      .min(1),

    address: z
      .string()
      .trim()
      .min(1),

    city: z
      .string()
      .trim()
      .min(1),

    province: z
      .string()
      .trim()
      .min(1),

    notes: z
      .string()
      .trim()
      .nullable()
      .optional(),
  }),

  selectedShippingRateId: z
    .string()
    .trim()
    .min(1)
    .nullable()
    .optional(),
});

function isExpectedOrderError(
  error: unknown,
): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const expectedPrefixes = [
    "At least one item is required",
    "Each item must have a variant ID",
    "Each item quantity must be",
    "Name is required",
    "Email is required",
    "Phone is required",
    "Address is required",
    "City is required",
    "Province is required",
    "Invalid shipping rate selection",
    "Product variant not found:",
    "Product is not available:",
    "Product is out of stock:",
    "Invalid shipping points configured",
    "Invalid price configured",
    "No shipping options are available",
    "Please select a shipping option",
    "The selected shipping option is no longer available",
    "Shipping calculation",
    "No configured courier",
    "No package tier",
    "No active shipping rate",
    "Multiple active shipping rates",
    "Courier",
    "Package tier",
  ];

  return expectedPrefixes.some(
    (prefix) =>
      error.message.startsWith(prefix),
  );
}

function serializeShippingOption(
  option: ShippingOption,
) {
  return {
    courier: {
      id: option.courierId,
      code: option.courierCode,
      name: option.courierName,
    },

    zone: {
      id: option.zoneId,
      code: option.zoneCode,
      name: option.zoneName,
    },

    tier: {
      id: option.tierId,
      code: option.tierCode,
      name: option.tierName,
      minPoints:
        option.tierMinPoints,
      maxPoints:
        option.tierMaxPoints,
      isCustom:
        option.tierIsCustom,
    },

    rate: {
      id: option.rateId,
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
      orderRequestSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Invalid order request",

          details:
            parsed.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const input: CreateOrderInput = {
      items: parsed.data.items.map(
        (item) => ({
          variantId:
            item.variantId,

          quantity:
            item.quantity,
        }),
      ),

      shipping: {
        name:
          parsed.data.shipping.name,

        email:
          parsed.data.shipping.email,

        phone:
          parsed.data.shipping.phone,

        address:
          parsed.data.shipping.address,

        city:
          parsed.data.shipping.city,

        province:
          parsed.data.shipping.province,

        notes:
          parsed.data.shipping.notes ??
          null,
      },

      selectedShippingRateId:
        parsed.data
          .selectedShippingRateId ??
        null,
    };

    const result =
      await createOrder(input);

    const emailResults =
      await Promise.allSettled([
        sendOrderConfirmationEmail(
          result.emailData,
        ),

        sendAdminOrderNotification(
          result.emailData,
        ),
      ]);

    const failedEmailCount =
      emailResults.filter(
        (emailResult) =>
          emailResult.status ===
          "rejected",
      ).length;

    if (failedEmailCount > 0) {
      console.error(
        `Order ${result.orderNumber} was created successfully, but ${failedEmailCount} email notification(s) failed.`,
        emailResults,
      );
    }

    return NextResponse.json(
      {
        success: true,

        order: {
          id:
            result.orderId,

          orderNumber:
            result.orderNumber,

          subtotal:
            result.subtotal,

          shippingCost:
            result.shippingCost,

          discountAmount:
            result.discountAmount,

          tax:
            result.tax,

          total:
            result.total,

          requiresCustomDelivery:
            result.requiresCustomDelivery,

          shippingSelectionMethod:
            result.shippingSelectionMethod,

          shipping:
            serializeShippingQuote(
              result.shippingQuote,
            ),
        },

        emailNotifications: {
          attempted: true,
          failed:
            failedEmailCount,
        },
      },

      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Failed to create order:",
      error,
    );

    if (
      isExpectedOrderError(error)
    ) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid order request",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to create order",
      },
      {
        status: 500,
      },
    );
  }
}
