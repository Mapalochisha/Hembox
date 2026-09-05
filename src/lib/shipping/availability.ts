import type { NormalizedShippingDestination } from "./destination";
import {
  resolveCourierZones,
  type ShippingZoneData,
} from "./zones";
import {
  resolvePackageTier,
  type ShippingPackageTier,
} from "./tiers";
import {
  resolveShippingRate,
  type ShippingRate,
} from "./rates";
import {
  calculateCustomerShippingPrice,
  type ShippingPriceStrategy,
} from "./pricing";

export interface ShippingAvailabilityInput {
  destination: NormalizedShippingDestination;
  shippingPoints: number;
  zones: ShippingZoneData[];
  tiers: ShippingPackageTier[];
  rates: ShippingRate[];
}

export interface ShippingOption {
  courierId: string;
  courierCode: string;
  courierName: string;

  zoneId: string;
  zoneCode: string;
  zoneName: string;

  tierId: string;
  tierCode: string;
  tierName: string;
  tierMinPoints: number | null;
  tierMaxPoints: number | null;
  tierIsCustom: boolean;

  rateId: string;
  courierCost: number;
  customerShippingPrice: number;
  currencyCode: string;

  pricingStrategy: ShippingPriceStrategy;
  pricingValue: number | null;
}

export type ShippingSelectionMethod =
  | "AUTO_SELECTED"
  | "CUSTOMER_SELECTED"
  | "CUSTOM_CONTACT_REQUIRED";

export type ShippingAvailabilityResult =
  | {
      status: "AVAILABLE";
      selectionMethod: "AUTO_SELECTED" | "CUSTOMER_SELECTED";
      options: ShippingOption[];
    }
  | {
      status: "CUSTOM_CONTACT_REQUIRED";
      selectionMethod: "CUSTOM_CONTACT_REQUIRED";
      options: [];
      reason: string;
    };

function createShippingOption(
  zoneData: ShippingZoneData,
  tier: ShippingPackageTier,
  rate: ShippingRate,
): ShippingOption {
  const pricing = calculateCustomerShippingPrice({
    courierCost: rate.courierCost,
    strategy: rate.customerPriceStrategy,
    value: rate.customerPriceValue,
  });

  return {
    courierId: zoneData.courier.id,
    courierCode: zoneData.courier.code,
    courierName: zoneData.courier.name,

    zoneId: zoneData.zone.id,
    zoneCode: zoneData.zone.code,
    zoneName: zoneData.zone.name,

    tierId: tier.id,
    tierCode: tier.code,
    tierName: tier.name,
    tierMinPoints: tier.minPoints,
    tierMaxPoints: tier.maxPoints,
    tierIsCustom: tier.isCustom,

    rateId: rate.id,
    courierCost: pricing.courierCost,
    customerShippingPrice: pricing.customerPrice,
    currencyCode: rate.currencyCode,

    pricingStrategy: pricing.strategy,
    pricingValue: pricing.value,
  };
}

/**
 * Resolves every shipping option that is actually available for a
 * destination and shipping-point total.
 *
 * A courier is available only when all of the following resolve:
 *
 *   courier → zone → package tier → shipping rate → customer price
 *
 * Invalid or incomplete courier configuration is excluded from the
 * customer-facing options rather than producing a fake shipping price.
 */
export function resolveShippingAvailability(
  input: ShippingAvailabilityInput,
): ShippingAvailabilityResult {
  const zoneResult = resolveCourierZones(
    input.destination,
    input.zones,
  );

  if (zoneResult.status === "NO_MATCH") {
    return {
      status: "CUSTOM_CONTACT_REQUIRED",
      selectionMethod: "CUSTOM_CONTACT_REQUIRED",
      options: [],
      reason:
        "No configured courier serves the selected destination.",
    };
  }

  if (zoneResult.status === "AMBIGUOUS") {
    throw new Error(zoneResult.reason);
  }

  const options: ShippingOption[] = [];

  for (const match of zoneResult.matches) {
    const tierResult = resolvePackageTier(
      match.courier.id,
      input.shippingPoints,
      input.tiers,
    );

    if (tierResult.status === "INVALID_CONFIGURATION") {
      throw new Error(tierResult.reason);
    }

    if (tierResult.status === "NO_MATCH") {
      continue;
    }

    const rateResult = resolveShippingRate(
      {
        courierId: match.courier.id,
        zoneId: match.zone.id,
        tierId: tierResult.tier.id,
      },
      input.rates,
    );

    if (rateResult.status === "INVALID_CONFIGURATION") {
      throw new Error(rateResult.reason);
    }

    if (rateResult.status === "AMBIGUOUS") {
      throw new Error(rateResult.reason);
    }

    if (rateResult.status === "NO_MATCH") {
      continue;
    }

    options.push(
      createShippingOption(
        {
          courier: match.courier,
          zone: match.zone,
          location: {
            id: "",
            countryCode: input.destination.countryCode,
            provinceNormalized:
              input.destination.provinceNormalized,
            townNormalized:
              input.destination.townNormalized,
            isActive: true,
          },
        },
        tierResult.tier,
        rateResult.rate,
      ),
    );
  }

  if (options.length === 0) {
    return {
      status: "CUSTOM_CONTACT_REQUIRED",
      selectionMethod: "CUSTOM_CONTACT_REQUIRED",
      options: [],
      reason:
        "No configured courier can currently provide shipping for " +
        "the selected destination and package size.",
    };
  }

  if (options.length === 1) {
    return {
      status: "AVAILABLE",
      selectionMethod: "AUTO_SELECTED",
      options,
    };
  }

  return {
    status: "AVAILABLE",
    selectionMethod: "CUSTOMER_SELECTED",
    options,
  };
}