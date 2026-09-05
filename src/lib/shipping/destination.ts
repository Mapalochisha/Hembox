export interface ShippingDestinationInput {
  country: string;
  province: string;
  town: string;
}

export interface NormalizedShippingDestination {
  countryCode: string;
  provinceNormalized: string;
  townNormalized: string;
}

/**
 * Normalizes general text used for destination matching.
 *
 * Examples:
 * "  Lusaka  " -> "lusaka"
 * "LU SAKA"    -> "lu saka"
 * "LUSAKA"     -> "lusaka"
 */
export function normalizeDestinationText(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Converts a country value into the ISO-style country code
 * used by DeliveryLocation.
 *
 * Zambia is explicitly supported because it is the current
 * storefront market. Two-letter country codes are also accepted
 * so the shipping system remains extensible to other countries.
 */
export function normalizeCountryCode(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (normalized === "zambia" || normalized === "zm") {
    return "ZM";
  }

  if (/^[a-z]{2}$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  throw new Error(`Unsupported country value: ${value}`);
}

/**
 * Normalizes a province value supplied by the checkout.
 *
 * The checkout currently uses a controlled province dropdown,
 * so we deliberately do not try to "correct" arbitrary province
 * spellings here. We normalize casing and whitespace only.
 */
export function normalizeProvince(value: string): string {
  const normalized = normalizeDestinationText(value);

  if (!normalized) {
    throw new Error("Province is required.");
  }

  return normalized;
}

/**
 * Normalizes a town/city supplied by the customer.
 *
 * Towns remain free-text in checkout, so normalization removes
 * casing and surrounding/duplicate whitespace before matching
 * against configured DeliveryLocation records.
 */
export function normalizeTown(value: string): string {
  const normalized = normalizeDestinationText(value);

  if (!normalized) {
    throw new Error("Town is required.");
  }

  return normalized;
}

/**
 * Produces the canonical destination representation used by
 * the shipping engine and DeliveryLocation lookup.
 */
export function normalizeShippingDestination(
  input: ShippingDestinationInput,
): NormalizedShippingDestination {
  return {
    countryCode: normalizeCountryCode(input.country),
    provinceNormalized: normalizeProvince(input.province),
    townNormalized: normalizeTown(input.town),
  };
}