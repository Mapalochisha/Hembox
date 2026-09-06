import assert from "node:assert/strict";
import test from "node:test";

import { ShippingPriceStrategy, Prisma } from "@prisma/client";
import {
  normalizeLocationPart,
  normalizeShippingCode,
  normalizeShippingText,
  parseNonNegativeInt,
  parseOptionalInt,
  parseMoney,
  validatePricingStrategy,
  validateTierRange,
} from "../src/lib/shipping/admin";

test("shipping text normalization is stable", () => {
  assert.equal(normalizeShippingText("  DHL    Express  "), "DHL Express");
  assert.equal(normalizeShippingCode("  dhl express "), "DHL EXPRESS");
  assert.equal(normalizeLocationPart("  Copperbelt   Province "), "copperbelt province");
});

test("optional integers accept blank and valid integers", () => {
  assert.equal(parseOptionalInt("", "Points"), null);
  assert.equal(parseOptionalInt(" 5 ", "Points"), 5);
  assert.throws(() => parseOptionalInt("1.5", "Points"), /must be an integer/);
});

test("non-negative integers reject negative and fractional values", () => {
  assert.equal(parseNonNegativeInt("0", "Points"), 0);
  assert.equal(parseNonNegativeInt("9", "Points"), 9);
  assert.throws(() => parseNonNegativeInt("-1", "Points"), /non-negative integer/);
  assert.throws(() => parseNonNegativeInt("1.5", "Points"), /non-negative integer/);
});

test("money parser normalizes to two decimal places", () => {
  const value = parseMoney("75.126", "Price");
  assert.ok(value instanceof Prisma.Decimal);
  assert.equal(value.toFixed(2), "75.13");
  assert.throws(() => parseMoney("-1", "Price"), /non-negative number/);
});

test("tier range validation accepts open-ended ranges", () => {
  assert.doesNotThrow(() => validateTierRange(null, 2));
  assert.doesNotThrow(() => validateTierRange(7, null));
  assert.doesNotThrow(() => validateTierRange(3, 6));
});

test("tier range validation rejects invalid ranges", () => {
  assert.throws(() => validateTierRange(-1, 2), /cannot be negative/);
  assert.throws(() => validateTierRange(7, 6), /cannot exceed/);
});

test("pricing strategies enforce their value requirements", () => {
  assert.doesNotThrow(() =>
    validatePricingStrategy(ShippingPriceStrategy.FREE, null),
  );
  assert.doesNotThrow(() =>
    validatePricingStrategy(ShippingPriceStrategy.MATCH_COURIER_COST, null),
  );
  assert.throws(
    () =>
      validatePricingStrategy(
        ShippingPriceStrategy.FREE,
        new Prisma.Decimal("1"),
      ),
    /does not accept a pricing value/,
  );
  assert.throws(
    () => validatePricingStrategy(ShippingPriceStrategy.FIXED_AMOUNT, null),
    /non-negative pricing value is required/,
  );
  assert.doesNotThrow(() =>
    validatePricingStrategy(
      ShippingPriceStrategy.FIXED_AMOUNT,
      new Prisma.Decimal("75"),
    ),
  );
});
