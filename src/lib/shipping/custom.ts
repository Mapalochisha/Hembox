export type CustomDeliveryReason =
  | "UNSUPPORTED_DESTINATION"
  | "NO_AVAILABLE_COURIER"
  | "NO_AVAILABLE_RATE"
  | "INVALID_SHIPPING_CONFIGURATION";

export interface CustomDeliveryResult {
  requiresCustomDelivery: true;
  selectionMethod: "CUSTOM_CONTACT_REQUIRED";
  customerShippingPrice: null;
  currencyCode: string;
  reason: CustomDeliveryReason;
  message: string;
}

export function createCustomDeliveryResult(
  reason: CustomDeliveryReason,
  currencyCode = "ZMW",
): CustomDeliveryResult {
  let message: string;

  switch (reason) {
    case "UNSUPPORTED_DESTINATION":
      message =
        "We do not currently have a configured courier for this destination. " +
        "Hembox will contact you to arrange delivery.";
      break;

    case "NO_AVAILABLE_COURIER":
      message =
        "No available courier can currently deliver to this destination. " +
        "Hembox will contact you to arrange delivery.";
      break;

    case "NO_AVAILABLE_RATE":
      message =
        "We could not find a configured shipping rate for this shipment. " +
        "Hembox will contact you to arrange delivery.";
      break;

    case "INVALID_SHIPPING_CONFIGURATION":
      message =
        "Standard shipping is currently unavailable for this shipment. " +
        "Hembox will contact you to arrange delivery.";
      break;

    default:
      throw new Error(
        `Unsupported custom delivery reason: ${reason}`,
      );
  }

  return {
    requiresCustomDelivery: true,
    selectionMethod: "CUSTOM_CONTACT_REQUIRED",
    customerShippingPrice: null,
    currencyCode,
    reason,
    message,
  };
}

export function requiresCustomDelivery(
  optionsCount: number,
): boolean {
  if (!Number.isInteger(optionsCount) || optionsCount < 0) {
    throw new Error(
      "Shipping options count must be a non-negative integer.",
    );
  }

  return optionsCount === 0;
}

/**
 * A custom package tier is still a normal shipping option when
 * the courier has a valid calculated customer price.
 *
 * Custom tier != custom delivery.
 */
export function isCustomTierOption(
  tierIsCustom: boolean,
  customerShippingPrice: number | null,
): boolean {
  return (
    tierIsCustom &&
    customerShippingPrice !== null
  );
}