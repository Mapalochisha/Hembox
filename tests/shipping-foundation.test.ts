import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PRODUCT_SHIPPING_POINTS,
  validateProductShippingFields,
  productShippingPointsForCreate,
} from "../src/lib/shipping/validation";

test("product shipping points default to 1 when not explicitly supplied", () => {
  validateProductShippingFields({ variants: [] });

  assert.equal(
    productShippingPointsForCreate(undefined),
    DEFAULT_PRODUCT_SHIPPING_POINTS,
  );
});

test("a null variant shipping-points override means inherit the product value", () => {
  validateProductShippingFields({
    variants: [{ shippingPointsOverride: null }],
  });
});

test("a zero variant shipping-points override remains valid", () => {
  validateProductShippingFields({
    variants: [{ shippingPointsOverride: 0 }],
  });
});

test("negative shipping points are rejected", () => {
  assert.throws(() =>
    validateProductShippingFields({
      shippingPoints: -1,
    }),
  );

  assert.throws(() =>
    validateProductShippingFields({
      variants: [{ shippingPointsOverride: -1 }],
    }),
  );
});
