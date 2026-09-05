export type ShippingPriceStrategy =
  | "MATCH_COURIER_COST"
  | "FIXED_AMOUNT"
  | "MARKUP_AMOUNT"
  | "MARKUP_PERCENT"
  | "SUBSIDY_AMOUNT"
  | "FREE";

export interface ShippingPricingInput {
  courierCost: number;
  strategy: ShippingPriceStrategy;
  value: number | null;
}

export interface ShippingPricingResult {
  customerPrice: number;
  courierCost: number;
  strategy: ShippingPriceStrategy;
  value: number | null;
}

const MONEY_SCALE = 100;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * MONEY_SCALE) / MONEY_SCALE;
}

function validateMoneyValue(
  name: string,
  value: number,
): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number.`);
  }

  if (value < 0) {
    throw new Error(`${name} cannot be negative.`);
  }
}

function validatePricingValue(
  strategy: ShippingPriceStrategy,
  value: number | null,
): void {
  const strategiesRequiringValue: ShippingPriceStrategy[] = [
    "FIXED_AMOUNT",
    "MARKUP_AMOUNT",
    "MARKUP_PERCENT",
    "SUBSIDY_AMOUNT",
  ];

  const strategiesWithoutValue: ShippingPriceStrategy[] = [
    "MATCH_COURIER_COST",
    "FREE",
  ];

  if (
    strategiesRequiringValue.includes(strategy) &&
    value === null
  ) {
    throw new Error(
      `Pricing strategy ${strategy} requires a configured value.`,
    );
  }

  if (
    strategiesWithoutValue.includes(strategy) &&
    value !== null
  ) {
    throw new Error(
      `Pricing strategy ${strategy} must not have a configured value.`,
    );
  }

  if (value !== null) {
    validateMoneyValue("Pricing value", value);
  }
}

/**
 * Calculates the amount charged to the customer for shipping.
 *
 * Courier cost and customer shipping price are intentionally kept
 * separate. The courier cost represents the business's actual cost,
 * while customerPrice represents what the customer is charged.
 */
export function calculateCustomerShippingPrice(
  input: ShippingPricingInput,
): ShippingPricingResult {
  validateMoneyValue("Courier cost", input.courierCost);

  validatePricingValue(
    input.strategy,
    input.value,
  );

  let customerPrice: number;

  switch (input.strategy) {
    case "MATCH_COURIER_COST":
      customerPrice = input.courierCost;
      break;

    case "FIXED_AMOUNT":
      customerPrice = input.value as number;
      break;

    case "MARKUP_AMOUNT":
      customerPrice =
        input.courierCost + (input.value as number);
      break;

    case "MARKUP_PERCENT":
      customerPrice =
        input.courierCost *
        (1 + (input.value as number) / 100);
      break;

    case "SUBSIDY_AMOUNT":
      customerPrice = Math.max(
        0,
        input.courierCost - (input.value as number),
      );
      break;

    case "FREE":
      customerPrice = 0;
      break;

    default:
      throw new Error(
        `Unsupported shipping pricing strategy: ${input.strategy}`,
      );
  }

  customerPrice = roundMoney(customerPrice);

  if (!Number.isFinite(customerPrice)) {
    throw new Error(
      "Calculated customer shipping price is invalid.",
    );
  }

  if (customerPrice < 0) {
    throw new Error(
      "Calculated customer shipping price cannot be negative.",
    );
  }

  return {
    customerPrice,
    courierCost: roundMoney(input.courierCost),
    strategy: input.strategy,
    value: input.value,
  };
}