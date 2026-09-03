import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PRODUCT_SHIPPING_POINTS,
  parseProductShippingFields,
  productShippingPointsForCreate,
} from "../src/lib/shipping/validation";

test("product shipping points default to 1 when not explicitly supplied", () => {
  const fields = parseProductShippingFields({ variants: [] });
  assert.equal(fields.shippingPoints, undefined);
  assert.equal(productShippingPointsForCreate(fields.shippingPoints), DEFAULT_PRODUCT_SHIPPING_POINTS);
});

test("a null variant shipping-points override means inherit the product value", () => {
  const fields = parseProductShippingFields({
    variants: [{ shippingPointsOverride: null }],
  });
  assert.equal(fields.variants?.[0]?.shippingPointsOverride, null);
});

test("a zero variant shipping-points override remains valid", () => {
  const fields = parseProductShippingFields({
    variants: [{ shippingPointsOverride: 0 }],
  });
  assert.equal(fields.variants?.[0]?.shippingPointsOverride, 0);
});

test("negative shipping points are rejected", () => {
  assert.throws(() => parseProductShippingFields({ shippingPoints: -1 }));
  assert.throws(() => parseProductShippingFields({
    variants: [{ shippingPointsOverride: -1 }],
  }));
});
