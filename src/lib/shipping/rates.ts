export interface ShippingRate {
  id: string;
  deliveryZoneId: string;
  packageTierId: string;
  courierCost: number;
  customerPriceStrategy:
    | "MATCH_COURIER_COST"
    | "FIXED_AMOUNT"
    | "MARKUP_AMOUNT"
    | "MARKUP_PERCENT"
    | "SUBSIDY_AMOUNT"
    | "FREE";
  customerPriceValue: number | null;
  currencyCode: string;
  isActive: boolean;
}

export interface ShippingRateContext {
  courierId: string;
  zoneId: string;
  tierId: string;
}

export type ShippingRateResolutionResult =
  | {
      status: "MATCHED";
      rate: ShippingRate;
    }
  | {
      status: "NO_MATCH";
      rate: null;
      reason: string;
    }
  | {
      status: "AMBIGUOUS";
      rate: null;
      reason: string;
    }
  | {
      status: "INVALID_CONFIGURATION";
      rate: null;
      reason: string;
    };

function validateRate(rate: ShippingRate): string | null {
  if (!rate.id) {
    return "Shipping rate requires a valid ID.";
  }

  if (!rate.deliveryZoneId) {
    return `Shipping rate ${rate.id} requires a delivery zone.`;
  }

  if (!rate.packageTierId) {
    return `Shipping rate ${rate.id} requires a package tier.`;
  }

  if (typeof rate.courierCost !== "number") {
    return `Shipping rate ${rate.id} has an invalid courier cost.`;
  }

  if (!Number.isFinite(rate.courierCost)) {
    return `Shipping rate ${rate.id} has an invalid courier cost.`;
  }

  if (rate.courierCost < 0) {
    return `Shipping rate ${rate.id} cannot have a negative courier cost.`;
  }

  if (!rate.currencyCode || !/^[A-Z]{3}$/.test(rate.currencyCode)) {
    return `Shipping rate ${rate.id} has an invalid currency code.`;
  }

  const strategiesRequiringValue = new Set([
    "FIXED_AMOUNT",
    "MARKUP_AMOUNT",
    "MARKUP_PERCENT",
    "SUBSIDY_AMOUNT",
  ]);

  const strategiesWithoutValue = new Set([
    "MATCH_COURIER_COST",
    "FREE",
  ]);

  if (
    strategiesRequiringValue.has(rate.customerPriceStrategy) &&
    rate.customerPriceValue === null
  ) {
    return (
      `Shipping rate ${rate.id} requires customerPriceValue ` +
      `for strategy ${rate.customerPriceStrategy}.`
    );
  }

  if (
    strategiesWithoutValue.has(rate.customerPriceStrategy) &&
    rate.customerPriceValue !== null
  ) {
    return (
      `Shipping rate ${rate.id} must not define customerPriceValue ` +
      `for strategy ${rate.customerPriceStrategy}.`
    );
  }

  if (
    rate.customerPriceValue !== null &&
    (!Number.isFinite(rate.customerPriceValue) ||
      rate.customerPriceValue < 0)
  ) {
    return `Shipping rate ${rate.id} has an invalid customer price value.`;
  }

  if (
    rate.customerPriceStrategy === "MARKUP_PERCENT" &&
    rate.customerPriceValue !== null &&
    rate.customerPriceValue < 0
  ) {
    return `Shipping rate ${rate.id} cannot have a negative markup percentage.`;
  }

  return null;
}

/**
 * Resolves exactly one active rate for a courier, zone and package tier.
 *
 * The database schema currently guarantees uniqueness for
 * deliveryZoneId + packageTierId, but the resolver also validates
 * the supplied collection so that bad data cannot silently produce
 * an arbitrary result.
 */
export function resolveShippingRate(
  context: ShippingRateContext,
  rates: ShippingRate[],
): ShippingRateResolutionResult {
  if (!context.courierId) {
    return {
      status: "INVALID_CONFIGURATION",
      rate: null,
      reason: "Courier ID is required.",
    };
  }

  if (!context.zoneId) {
    return {
      status: "INVALID_CONFIGURATION",
      rate: null,
      reason: "Delivery zone ID is required.",
    };
  }

  if (!context.tierId) {
    return {
      status: "INVALID_CONFIGURATION",
      rate: null,
      reason: "Package tier ID is required.",
    };
  }

  const matchingRates = rates.filter(
    (rate) =>
      rate.isActive &&
      rate.deliveryZoneId === context.zoneId &&
      rate.packageTierId === context.tierId,
  );

  for (const rate of matchingRates) {
    const error = validateRate(rate);

    if (error) {
      return {
        status: "INVALID_CONFIGURATION",
        rate: null,
        reason: error,
      };
    }
  }

  if (matchingRates.length === 0) {
    return {
      status: "NO_MATCH",
      rate: null,
      reason:
        "No active shipping rate is configured for the selected " +
        "delivery zone and package tier.",
    };
  }

  if (matchingRates.length > 1) {
    return {
      status: "AMBIGUOUS",
      rate: null,
      reason:
        "Multiple active shipping rates are configured for the " +
        "selected delivery zone and package tier.",
    };
  }

  return {
    status: "MATCHED",
    rate: matchingRates[0],
  };
}

/**
 * Validates that a rate belongs to the courier selected for the
 * shipping calculation.
 *
 * The current Prisma schema does not store courierId directly on
 * ShippingRate, so the caller supplies the owning courier IDs from
 * the related zone and package tier records.
 */
export function validateShippingRateOwnership(
  rate: ShippingRate,
  expectedCourierId: string,
  zoneCourierId: string,
  tierCourierId: string,
): void {
  if (!rate.id) {
    throw new Error("Shipping rate requires a valid ID.");
  }

  if (!expectedCourierId) {
    throw new Error("Courier ID is required.");
  }

  if (zoneCourierId !== expectedCourierId) {
    throw new Error(
      `Delivery zone belongs to courier ${zoneCourierId}, ` +
        `not courier ${expectedCourierId}.`,
    );
  }

  if (tierCourierId !== expectedCourierId) {
    throw new Error(
      `Package tier belongs to courier ${tierCourierId}, ` +
        `not courier ${expectedCourierId}.`,
    );
  }
}