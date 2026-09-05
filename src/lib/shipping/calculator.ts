import {
  DEFAULT_PRODUCT_SHIPPING_POINTS,
  nonNegativeIntegerSchema,
} from "./validation";
import {
  normalizeShippingDestination,
  type ShippingDestinationInput,
  type NormalizedShippingDestination,
} from "./destination";
import {
  resolveShippingAvailability,
  type ShippingAvailabilityInput,
  type ShippingAvailabilityResult,
  type ShippingOption,
} from "./availability";
import type {
  ShippingCartLine,
  ShippingPointsResult,
} from "./types";

type ShippingPointSource =
  | "VARIANT_OVERRIDE"
  | "PRODUCT_DEFAULT"
  | "SYSTEM_DEFAULT";

export interface ShippingCalculationInput {
  cartLines: ShippingCartLine[];
  destination: ShippingDestinationInput;
  zones: ShippingAvailabilityInput["zones"];
  tiers: ShippingAvailabilityInput["tiers"];
  rates: ShippingAvailabilityInput["rates"];
  currencyCode?: string;
}

export interface ShippingQuote {
  shippingPoints: ShippingPointsResult;
  destination: NormalizedShippingDestination;
  status: ShippingAvailabilityResult["status"];
  selectionMethod: ShippingAvailabilityResult["selectionMethod"];
  options: ShippingOption[];
  selectedOption: ShippingOption | null;
  requiresCustomDelivery: boolean;
  customDeliveryReason: string | null;
  customDeliveryMessage: string | null;
  currencyCode: string;
}

function resolvePointsPerUnit(
  line: ShippingCartLine,
): {
  points: number;
  source: ShippingPointSource;
} {
  if (line.shippingPointsOverride !== null) {
    return {
      points: line.shippingPointsOverride,
      source: "VARIANT_OVERRIDE",
    };
  }

  if (
    line.shippingPoints !== undefined &&
    line.shippingPoints !== null
  ) {
    return {
      points: line.shippingPoints,
      source: "PRODUCT_DEFAULT",
    };
  }

  return {
    points: DEFAULT_PRODUCT_SHIPPING_POINTS,
    source: "SYSTEM_DEFAULT",
  };
}

/**
 * Calculates the shipping-point total for the cart.
 *
 * This function is pure and does not access the database.
 */
export function calculateShippingPoints(
  lines: ShippingCartLine[],
): ShippingPointsResult {
  if (lines.length === 0) {
    return {
      totalPoints: 0,
      lines: [],
    };
  }

  let totalPoints = 0;

  const results = lines.map((line) => {
    if (!line.variantId || !line.productId) {
      throw new Error(
        "Shipping calculation requires valid product and variant IDs.",
      );
    }

    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error(
        `Invalid quantity for variant ${line.variantId}. Quantity must be a positive integer.`,
      );
    }

    if (!Number.isInteger(line.shippingPoints)) {
      throw new Error(
        `Invalid product shipping points for variant ${line.variantId}.`,
      );
    }

    nonNegativeIntegerSchema.parse(line.shippingPoints);

    if (line.shippingPointsOverride !== null) {
      if (!Number.isInteger(line.shippingPointsOverride)) {
        throw new Error(
          `Invalid variant shipping-points override for variant ${line.variantId}.`,
        );
      }

      nonNegativeIntegerSchema.parse(
        line.shippingPointsOverride,
      );
    }

    const { points, source } = resolvePointsPerUnit(line);
    const lineTotal = points * line.quantity;

    totalPoints += lineTotal;

    return {
      variantId: line.variantId,
      productId: line.productId,
      quantity: line.quantity,
      pointsPerUnit: points,
      pointSource: source,
      totalPoints: lineTotal,
    };
  });

  return {
    totalPoints,
    lines: results,
  };
}

/**
 * Calculates the complete shipping quote.
 *
 * This function orchestrates the complete shipping domain:
 *
 *   cart
 *     -> shipping points
 *     -> destination normalization
 *     -> courier/zone resolution
 *     -> package tier resolution
 *     -> shipping rate resolution
 *     -> customer price calculation
 *     -> courier selection
 *
 * It is intentionally pure and read-only.
 */
export function calculateShippingQuote(
  input: ShippingCalculationInput,
): ShippingQuote {
  if (!input || typeof input !== "object") {
    throw new Error(
      "Shipping calculation input is required.",
    );
  }

  if (!Array.isArray(input.cartLines)) {
    throw new Error(
      "Shipping calculation requires cart lines.",
    );
  }

  const currencyCode =
    input.currencyCode?.trim().toUpperCase() || "ZMW";

  const shippingPoints = calculateShippingPoints(
    input.cartLines,
  );

  const destination =
    normalizeShippingDestination(input.destination);

  const availability =
    resolveShippingAvailability({
      destination,
      shippingPoints: shippingPoints.totalPoints,
      zones: input.zones,
      tiers: input.tiers,
      rates: input.rates,
    });

  if (
    availability.status ===
    "CUSTOM_CONTACT_REQUIRED"
  ) {
    return {
      shippingPoints,
      destination,
      status: availability.status,
      selectionMethod: availability.selectionMethod,
      options: [],
      selectedOption: null,
      requiresCustomDelivery: true,
      customDeliveryReason: availability.reason,
      customDeliveryMessage: availability.reason,
      currencyCode,
    };
  }

  const options = availability.options;

  if (options.length === 0) {
    throw new Error(
      "Shipping availability returned no options without requiring custom delivery.",
    );
  }

  const selectedOption =
    availability.selectionMethod === "AUTO_SELECTED"
      ? options[0]
      : null;

  return {
    shippingPoints,
    destination,
    status: availability.status,
    selectionMethod: availability.selectionMethod,
    options,
    selectedOption,
    requiresCustomDelivery: false,
    customDeliveryReason: null,
    customDeliveryMessage: null,
    currencyCode,
  };
}