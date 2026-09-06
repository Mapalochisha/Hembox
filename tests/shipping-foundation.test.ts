import assert from "node:assert/strict";
import test from "node:test";

import {
  createCustomDeliveryResult,
  isCustomTierOption,
  requiresCustomDelivery,
  type CustomDeliveryReason,
} from "../src/lib/shipping/custom";

import {
  resolveShippingAvailability,
  type ShippingAvailabilityInput,
} from "../src/lib/shipping/availability";

import {
  calculateShippingPoints,
  calculateShippingQuote,
} from "../src/lib/shipping/calculator";

import {
  normalizeCountryCode,
  normalizeDestinationText,
  normalizeProvince,
  normalizeShippingDestination,
  normalizeTown,
} from "../src/lib/shipping/destination";

import {
  resolveCourierZones,
  type ShippingZoneData,
} from "../src/lib/shipping/zones";

import {
  resolvePackageTier,
  validatePackageTierConfiguration,
  type ShippingPackageTier,
} from "../src/lib/shipping/tiers";

import {
  resolveShippingRate,
  validateShippingRateOwnership,
  type ShippingRate,
} from "../src/lib/shipping/rates";

import {
  calculateCustomerShippingPrice,
  type ShippingPricingInput,
  type ShippingPriceStrategy,
} from "../src/lib/shipping/pricing";

test("variant override takes precedence over product default", () => {
  const result = calculateShippingPoints([
    {
      variantId: "variant-1",
      productId: "product-1",
      quantity: 2,
      shippingPoints: 3,
      shippingPointsOverride: 5,
    },
  ]);

  assert.equal(result.totalPoints, 10);
  assert.deepEqual(result.lines[0], {
    variantId: "variant-1",
    productId: "product-1",
    quantity: 2,
    pointsPerUnit: 5,
    pointSource: "VARIANT_OVERRIDE",
    totalPoints: 10,
  });
});

test("product default is used when variant override is null", () => {
  const result = calculateShippingPoints([
    {
      variantId: "variant-1",
      productId: "product-1",
      quantity: 3,
      shippingPoints: 2,
      shippingPointsOverride: null,
    },
  ]);

  assert.equal(result.totalPoints, 6);
  assert.equal(result.lines[0].pointsPerUnit, 2);
  assert.equal(result.lines[0].pointSource, "PRODUCT_DEFAULT");
});

test("shipping points are multiplied by quantity", () => {
  const result = calculateShippingPoints([
    {
      variantId: "variant-1",
      productId: "product-1",
      quantity: 4,
      shippingPoints: 3,
      shippingPointsOverride: null,
    },
  ]);

  assert.equal(result.totalPoints, 12);
  assert.equal(result.lines[0].totalPoints, 12);
});

test("multiple cart lines are summed correctly", () => {
  const result = calculateShippingPoints([
    {
      variantId: "variant-1",
      productId: "product-1",
      quantity: 2,
      shippingPoints: 1,
      shippingPointsOverride: null,
    },
    {
      variantId: "variant-2",
      productId: "product-2",
      quantity: 3,
      shippingPoints: 2,
      shippingPointsOverride: null,
    },
  ]);

  assert.equal(result.totalPoints, 8);
  assert.equal(result.lines.length, 2);
});

test("explicit zero product shipping points are preserved", () => {
  const result = calculateShippingPoints([
    {
      variantId: "variant-1",
      productId: "product-1",
      quantity: 2,
      shippingPoints: 0,
      shippingPointsOverride: null,
    },
  ]);

  assert.equal(result.totalPoints, 0);
  assert.equal(result.lines[0].pointsPerUnit, 0);
  assert.equal(result.lines[0].pointSource, "PRODUCT_DEFAULT");
});

test("explicit zero variant override is preserved", () => {
  const result = calculateShippingPoints([
    {
      variantId: "variant-1",
      productId: "product-1",
      quantity: 2,
      shippingPoints: 5,
      shippingPointsOverride: 0,
    },
  ]);

  assert.equal(result.totalPoints, 0);
  assert.equal(result.lines[0].pointsPerUnit, 0);
  assert.equal(result.lines[0].pointSource, "VARIANT_OVERRIDE");
});

test("empty cart returns zero shipping points", () => {
  const result = calculateShippingPoints([]);

  assert.equal(result.totalPoints, 0);
  assert.deepEqual(result.lines, []);
});

test("invalid quantity is rejected", () => {
  assert.throws(
    () =>
      calculateShippingPoints([
        {
          variantId: "variant-1",
          productId: "product-1",
          quantity: 0,
          shippingPoints: 1,
          shippingPointsOverride: null,
        },
      ]),
    /Quantity must be a positive integer/,
  );
});

test("fractional quantity is rejected", () => {
  assert.throws(
    () =>
      calculateShippingPoints([
        {
          variantId: "variant-1",
          productId: "product-1",
          quantity: 1.5,
          shippingPoints: 1,
          shippingPointsOverride: null,
        },
      ]),
    /Quantity must be a positive integer/,
  );
});

test("negative product shipping points are rejected", () => {
  assert.throws(
    () =>
      calculateShippingPoints([
        {
          variantId: "variant-1",
          productId: "product-1",
          quantity: 1,
          shippingPoints: -1,
          shippingPointsOverride: null,
        },
      ]),
  );
});

test("negative variant shipping-points override is rejected", () => {
  assert.throws(
    () =>
      calculateShippingPoints([
        {
          variantId: "variant-1",
          productId: "product-1",
          quantity: 1,
          shippingPoints: 1,
          shippingPointsOverride: -1,
        },
      ]),
  );
});

test("fractional product shipping points are rejected", () => {
  assert.throws(
    () =>
      calculateShippingPoints([
        {
          variantId: "variant-1",
          productId: "product-1",
          quantity: 1,
          shippingPoints: 1.5,
          shippingPointsOverride: null,
        },
      ]),
  );
});

test("fractional variant shipping-points override is rejected", () => {
  assert.throws(
    () =>
      calculateShippingPoints([
        {
          variantId: "variant-1",
          productId: "product-1",
          quantity: 1,
          shippingPoints: 1,
          shippingPointsOverride: 1.5,
        },
      ]),
  );
});

test("destination text is trimmed and whitespace is normalized", () => {
  assert.equal(
    normalizeDestinationText("  Lusaka    City  "),
    "lusaka city",
  );
});

test("country names are normalized to country codes", () => {
  assert.equal(normalizeCountryCode(" Zambia "), "ZM");
  assert.equal(normalizeCountryCode("zm"), "ZM");
});

test("two-letter country codes are normalized to uppercase", () => {
  assert.equal(normalizeCountryCode("gb"), "GB");
  assert.equal(normalizeCountryCode(" US "), "US");
});

test("unsupported country values are rejected", () => {
  assert.throws(
    () => normalizeCountryCode("Zambia123"),
    /Unsupported country value/,
  );
});

test("province is normalized consistently", () => {
  assert.equal(normalizeProvince("  LUSAKA  "), "lusaka");
});

test("empty province is rejected", () => {
  assert.throws(
    () => normalizeProvince("   "),
    /Province is required/,
  );
});

test("town is normalized consistently", () => {
  assert.equal(normalizeTown("  Lusaka   "), "lusaka");
});

test("empty town is rejected", () => {
  assert.throws(
    () => normalizeTown("   "),
    /Town is required/,
  );
});

test("complete shipping destinations are normalized consistently", () => {
  const result = normalizeShippingDestination({
    country: " Zambia ",
    province: " LUSAKA ",
    town: "  Lusaka  ",
  });

  assert.deepEqual(result, {
    countryCode: "ZM",
    provinceNormalized: "lusaka",
    townNormalized: "lusaka",
  });
});

function createZoneData(
  overrides: Partial<ShippingZoneData> = {},
): ShippingZoneData {
  return {
    courier: {
      id: "courier-1",
      code: "COURIER_A",
      name: "Courier A",
      isActive: true,
    },
    zone: {
      id: "zone-1",
      courierId: "courier-1",
      code: "LUSAKA",
      name: "Lusaka Zone",
      isActive: true,
    },
    location: {
      id: "location-1",
      countryCode: "ZM",
      provinceNormalized: "lusaka",
      townNormalized: "lusaka",
      isActive: true,
    },
    ...overrides,
  };
}

const lusakaDestination = normalizeShippingDestination({
  country: "Zambia",
  province: "Lusaka",
  town: "Lusaka",
});

test("inactive couriers are excluded from zone resolution", () => {
  const result = resolveCourierZones(lusakaDestination, [
    createZoneData({
      courier: {
        id: "courier-1",
        code: "COURIER_A",
        name: "Courier A",
        isActive: false,
      },
    }),
  ]);

  assert.equal(result.status, "NO_MATCH");
  assert.deepEqual(result.matches, []);
});

test("inactive zones are excluded from zone resolution", () => {
  const result = resolveCourierZones(lusakaDestination, [
    createZoneData({
      zone: {
        id: "zone-1",
        courierId: "courier-1",
        code: "LUSAKA",
        name: "Lusaka Zone",
        isActive: false,
      },
    }),
  ]);

  assert.equal(result.status, "NO_MATCH");
  assert.deepEqual(result.matches, []);
});

test("inactive locations are excluded from zone resolution", () => {
  const result = resolveCourierZones(lusakaDestination, [
    createZoneData({
      location: {
        id: "location-1",
        countryCode: "ZM",
        provinceNormalized: "lusaka",
        townNormalized: "lusaka",
        isActive: false,
      },
    }),
  ]);

  assert.equal(result.status, "NO_MATCH");
  assert.deepEqual(result.matches, []);
});

test("matching courier zone is resolved", () => {
  const result = resolveCourierZones(lusakaDestination, [
    createZoneData(),
  ]);

  assert.equal(result.status, "MATCHED");
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].courier.code, "COURIER_A");
  assert.equal(result.matches[0].zone.code, "LUSAKA");
});

test("multiple active couriers can serve the same destination", () => {
  const result = resolveCourierZones(lusakaDestination, [
    createZoneData(),
    createZoneData({
      courier: {
        id: "courier-2",
        code: "COURIER_B",
        name: "Courier B",
        isActive: true,
      },
      zone: {
        id: "zone-2",
        courierId: "courier-2",
        code: "LUSAKA",
        name: "Lusaka Zone",
        isActive: true,
      },
      location: {
        id: "location-1",
        countryCode: "ZM",
        provinceNormalized: "lusaka",
        townNormalized: "lusaka",
        isActive: true,
      },
    }),
  ]);

  assert.equal(result.status, "MATCHED");
  assert.equal(result.matches.length, 2);

  assert.deepEqual(
    result.matches.map((match) => match.courier.code),
    ["COURIER_A", "COURIER_B"],
  );
});

test("destination with no configured zone returns no match", () => {
  const result = resolveCourierZones(
    normalizeShippingDestination({
      country: "Zambia",
      province: "Copperbelt",
      town: "Kitwe",
    }),
    [createZoneData()],
  );

  assert.equal(result.status, "NO_MATCH");
  assert.deepEqual(result.matches, []);
});

test("multiple zones for one courier covering the same destination are ambiguous", () => {
  const result = resolveCourierZones(lusakaDestination, [
    createZoneData(),
    createZoneData({
      zone: {
        id: "zone-2",
        courierId: "courier-1",
        code: "LUSAKA_2",
        name: "Lusaka Zone 2",
        isActive: true,
      },
      location: {
        id: "location-2",
        countryCode: "ZM",
        provinceNormalized: "lusaka",
        townNormalized: "lusaka",
        isActive: true,
      },
    }),
  ]);

  assert.equal(result.status, "AMBIGUOUS");
  assert.equal(result.matches.length, 2);
  assert.match(
    result.reason,
    /multiple active zones.*covering the same destination/i,
  );
});

test("zone belonging to a different courier is ignored", () => {
  const result = resolveCourierZones(lusakaDestination, [
    createZoneData({
      zone: {
        id: "zone-1",
        courierId: "different-courier",
        code: "LUSAKA",
        name: "Lusaka Zone",
        isActive: true,
      },
    }),
  ]);

  assert.equal(result.status, "NO_MATCH");
  assert.deepEqual(result.matches, []);
});

function createTier(
  overrides: Partial<ShippingPackageTier> = {},
): ShippingPackageTier {
  return {
    id: "tier-small",
    courierId: "courier-1",
    code: "SMALL",
    name: "Small",
    minPoints: 1,
    maxPoints: 2,
    isCustom: false,
    isActive: true,
    position: 1,
    ...overrides,
  };
}

const standardTiers: ShippingPackageTier[] = [
  createTier({
    id: "tier-small",
    code: "SMALL",
    name: "Small",
    minPoints: 1,
    maxPoints: 2,
    position: 1,
  }),
  createTier({
    id: "tier-medium",
    code: "MEDIUM",
    name: "Medium",
    minPoints: 3,
    maxPoints: 6,
    position: 2,
  }),
  createTier({
    id: "tier-large",
    code: "LARGE",
    name: "Large",
    minPoints: 7,
    maxPoints: 9,
    position: 3,
  }),
  createTier({
    id: "tier-custom",
    code: "CUSTOM",
    name: "Custom",
    minPoints: null,
    maxPoints: null,
    isCustom: true,
    position: 4,
  }),
];

test("shipping points resolve to the configured small tier", () => {
  const result = resolvePackageTier(
    "courier-1",
    2,
    standardTiers,
  );

  assert.equal(result.status, "MATCHED");

  if (result.status === "MATCHED") {
    assert.equal(result.tier.code, "SMALL");
  }
});

test("shipping points resolve to the configured medium tier", () => {
  const result = resolvePackageTier(
    "courier-1",
    5,
    standardTiers,
  );

  assert.equal(result.status, "MATCHED");

  if (result.status === "MATCHED") {
    assert.equal(result.tier.code, "MEDIUM");
  }
});

test("shipping points resolve to the configured large tier", () => {
  const result = resolvePackageTier(
    "courier-1",
    9,
    standardTiers,
  );

  assert.equal(result.status, "MATCHED");

  if (result.status === "MATCHED") {
    assert.equal(result.tier.code, "LARGE");
  }
});

test("points above the highest standard tier resolve to custom", () => {
  const result = resolvePackageTier(
    "courier-1",
    10,
    standardTiers,
  );

  assert.equal(result.status, "MATCHED");

  if (result.status === "MATCHED") {
    assert.equal(result.tier.code, "CUSTOM");
    assert.equal(result.tier.isCustom, true);
  }
});

test("a point gap does not silently resolve to another tier", () => {
  const tiers = [
    createTier({
      id: "tier-small",
      code: "SMALL",
      minPoints: 1,
      maxPoints: 2,
    }),
    createTier({
      id: "tier-large",
      code: "LARGE",
      minPoints: 5,
      maxPoints: 9,
    }),
    createTier({
      id: "tier-custom",
      code: "CUSTOM",
      minPoints: null,
      maxPoints: null,
      isCustom: true,
    }),
  ];

  const result = resolvePackageTier(
    "courier-1",
    3,
    tiers,
  );

  assert.equal(result.status, "NO_MATCH");
});

test("inactive tiers are ignored", () => {
  const tiers = [
    createTier({
      id: "tier-small",
      code: "SMALL",
      minPoints: 1,
      maxPoints: 2,
      isActive: false,
    }),
    createTier({
      id: "tier-medium",
      code: "MEDIUM",
      minPoints: 3,
      maxPoints: 6,
    }),
  ];

  const result = resolvePackageTier(
    "courier-1",
    2,
    tiers,
  );

  assert.equal(result.status, "NO_MATCH");
});

test("tiers belonging to another courier are ignored", () => {
  const tiers = [
    createTier({
      courierId: "courier-2",
    }),
  ];

  const result = resolvePackageTier(
    "courier-1",
    2,
    tiers,
  );

  assert.equal(result.status, "NO_MATCH");
});

test("overlapping standard tiers are rejected", () => {
  const tiers = [
    createTier({
      id: "tier-small",
      code: "SMALL",
      minPoints: 1,
      maxPoints: 4,
    }),
    createTier({
      id: "tier-medium",
      code: "MEDIUM",
      minPoints: 3,
      maxPoints: 6,
    }),
  ];

  assert.throws(
    () => validatePackageTierConfiguration("courier-1", tiers),
    /overlapping point ranges/,
  );
});

test("invalid tier range is rejected", () => {
  const tiers = [
    createTier({
      minPoints: 6,
      maxPoints: 3,
    }),
  ];

  assert.throws(
    () => validatePackageTierConfiguration("courier-1", tiers),
    /minPoints cannot exceed maxPoints/,
  );
});

test("standard tier without both boundaries is rejected", () => {
  const tiers = [
    createTier({
      minPoints: 1,
      maxPoints: null,
    }),
  ];

  assert.throws(
    () => validatePackageTierConfiguration("courier-1", tiers),
    /must define both minPoints and maxPoints/,
  );
});

test("custom tier cannot define point boundaries", () => {
  const tiers = [
    createTier({
      code: "CUSTOM",
      name: "Custom",
      minPoints: 10,
      maxPoints: null,
      isCustom: true,
    }),
  ];

  assert.throws(
    () => validatePackageTierConfiguration("courier-1", tiers),
    /must not define minPoints or maxPoints/,
  );
});

test("multiple active custom tiers are rejected", () => {
  const tiers = [
    createTier({
      id: "custom-1",
      code: "CUSTOM_1",
      name: "Custom 1",
      minPoints: null,
      maxPoints: null,
      isCustom: true,
    }),
    createTier({
      id: "custom-2",
      code: "CUSTOM_2",
      name: "Custom 2",
      minPoints: null,
      maxPoints: null,
      isCustom: true,
    }),
  ];

  assert.throws(
    () => validatePackageTierConfiguration("courier-1", tiers),
    /multiple active custom package tiers/,
  );
});

test("zero shipping points do not match a standard tier starting at one", () => {
  const result = resolvePackageTier(
    "courier-1",
    0,
    standardTiers,
  );

  assert.equal(result.status, "NO_MATCH");
});

test("negative shipping points are rejected", () => {
  const result = resolvePackageTier(
    "courier-1",
    -1,
    standardTiers,
  );

  assert.equal(result.status, "NO_MATCH");

  if (result.status === "NO_MATCH") {
    assert.match(
      result.reason,
      /non-negative integer/,
    );
  }
});

test("fractional shipping points are rejected", () => {
  const result = resolvePackageTier(
    "courier-1",
    2.5,
    standardTiers,
  );

  assert.equal(result.status, "NO_MATCH");
});

test("courier with only a custom tier resolves to custom", () => {
  const tiers = [
    createTier({
      id: "tier-custom",
      code: "CUSTOM",
      name: "Custom",
      minPoints: null,
      maxPoints: null,
      isCustom: true,
    }),
  ];

  const result = resolvePackageTier(
    "courier-1",
    1,
    tiers,
  );

  assert.equal(result.status, "MATCHED");

  if (result.status === "MATCHED") {
    assert.equal(result.tier.code, "CUSTOM");
  }
});

test("courier with no active tiers returns no match", () => {
  const tiers = [
    createTier({
      isActive: false,
    }),
  ];

  const result = resolvePackageTier(
    "courier-1",
    2,
    tiers,
  );

  assert.equal(result.status, "NO_MATCH");
});

function createRate(
  overrides: Partial<ShippingRate> = {},
): ShippingRate {
  return {
    id: "rate-1",
    deliveryZoneId: "zone-1",
    packageTierId: "tier-small",
    courierCost: 50,
    customerPriceStrategy: "MATCH_COURIER_COST",
    customerPriceValue: null,
    currencyCode: "ZMW",
    isActive: true,
    ...overrides,
  };
}

const rateContext = {
  courierId: "courier-1",
  zoneId: "zone-1",
  tierId: "tier-small",
};

test("matching active shipping rate is resolved", () => {
  const result = resolveShippingRate(rateContext, [
    createRate(),
  ]);

  assert.equal(result.status, "MATCHED");

  if (result.status === "MATCHED") {
    assert.equal(result.rate.id, "rate-1");
    assert.equal(result.rate.courierCost, 50);
  }
});

test("inactive shipping rates are ignored", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      isActive: false,
    }),
  ]);

  assert.equal(result.status, "NO_MATCH");
});

test("rate for a different zone is ignored", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      deliveryZoneId: "zone-2",
    }),
  ]);

  assert.equal(result.status, "NO_MATCH");
});

test("rate for a different tier is ignored", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      packageTierId: "tier-medium",
    }),
  ]);

  assert.equal(result.status, "NO_MATCH");
});

test("missing rate returns no match", () => {
  const result = resolveShippingRate(
    rateContext,
    [],
  );

  assert.equal(result.status, "NO_MATCH");

  if (result.status === "NO_MATCH") {
    assert.match(result.reason, /No active shipping rate/);
  }
});

test("multiple active matching rates are rejected as ambiguous", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      id: "rate-1",
    }),
    createRate({
      id: "rate-2",
    }),
  ]);

  assert.equal(result.status, "AMBIGUOUS");

  if (result.status === "AMBIGUOUS") {
    assert.match(
      result.reason,
      /Multiple active shipping rates/,
    );
  }
});

test("negative courier cost is rejected", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      courierCost: -10,
    }),
  ]);

  assert.equal(result.status, "INVALID_CONFIGURATION");
});

test("fixed amount strategy requires a customer price value", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      customerPriceStrategy: "FIXED_AMOUNT",
      customerPriceValue: null,
    }),
  ]);

  assert.equal(result.status, "INVALID_CONFIGURATION");
});

test("markup amount strategy requires a customer price value", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      customerPriceStrategy: "MARKUP_AMOUNT",
      customerPriceValue: null,
    }),
  ]);

  assert.equal(result.status, "INVALID_CONFIGURATION");
});

test("markup percentage strategy requires a customer price value", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      customerPriceStrategy: "MARKUP_PERCENT",
      customerPriceValue: null,
    }),
  ]);

  assert.equal(result.status, "INVALID_CONFIGURATION");
});

test("subsidy strategy requires a customer price value", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      customerPriceStrategy: "SUBSIDY_AMOUNT",
      customerPriceValue: null,
    }),
  ]);

  assert.equal(result.status, "INVALID_CONFIGURATION");
});

test("match courier cost strategy must not define a customer price value", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      customerPriceStrategy: "MATCH_COURIER_COST",
      customerPriceValue: 50,
    }),
  ]);

  assert.equal(result.status, "INVALID_CONFIGURATION");
});

test("free strategy must not define a customer price value", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      customerPriceStrategy: "FREE",
      customerPriceValue: 0,
    }),
  ]);

  assert.equal(result.status, "INVALID_CONFIGURATION");
});

test("invalid currency code is rejected", () => {
  const result = resolveShippingRate(rateContext, [
    createRate({
      currencyCode: "ZM",
    }),
  ]);

  assert.equal(result.status, "INVALID_CONFIGURATION");
});

test("zone courier ownership is validated", () => {
  assert.throws(
    () =>
      validateShippingRateOwnership(
        createRate(),
        "courier-1",
        "courier-2",
        "courier-1",
      ),
    /Delivery zone belongs to courier courier-2/,
  );
});

test("tier courier ownership is validated", () => {
  assert.throws(
    () =>
      validateShippingRateOwnership(
        createRate(),
        "courier-1",
        "courier-1",
        "courier-2",
      ),
    /Package tier belongs to courier courier-2/,
  );
});

test("valid rate ownership passes validation", () => {
  assert.doesNotThrow(() =>
    validateShippingRateOwnership(
      createRate(),
      "courier-1",
      "courier-1",
      "courier-1",
    ),
  );
});

function calculatePrice(
  courierCost: number,
  strategy: ShippingPriceStrategy,
  value: number | null,
) {
  return calculateCustomerShippingPrice({
    courierCost,
    strategy,
    value,
  });
}

test("match courier cost charges the customer the courier cost", () => {
  const result = calculatePrice(
    50,
    "MATCH_COURIER_COST",
    null,
  );

  assert.equal(result.customerPrice, 50);
  assert.equal(result.courierCost, 50);
});

test("fixed amount charges the configured customer price", () => {
  const result = calculatePrice(
    50,
    "FIXED_AMOUNT",
    75,
  );

  assert.equal(result.customerPrice, 75);
});

test("markup amount adds a fixed amount to courier cost", () => {
  const result = calculatePrice(
    50,
    "MARKUP_AMOUNT",
    20,
  );

  assert.equal(result.customerPrice, 70);
});

test("markup percentage adds the configured percentage", () => {
  const result = calculatePrice(
    100,
    "MARKUP_PERCENT",
    15,
  );

  assert.equal(result.customerPrice, 115);
});

test("markup percentage supports decimal percentages", () => {
  const result = calculatePrice(
    100,
    "MARKUP_PERCENT",
    12.5,
  );

  assert.equal(result.customerPrice, 112.5);
});

test("subsidy amount reduces the customer shipping price", () => {
  const result = calculatePrice(
    100,
    "SUBSIDY_AMOUNT",
    25,
  );

  assert.equal(result.customerPrice, 75);
});

test("subsidy cannot produce a negative customer price", () => {
  const result = calculatePrice(
    50,
    "SUBSIDY_AMOUNT",
    100,
  );

  assert.equal(result.customerPrice, 0);
});

test("free shipping produces zero customer price", () => {
  const result = calculatePrice(
    50,
    "FREE",
    null,
  );

  assert.equal(result.customerPrice, 0);
});

test("courier cost is preserved separately from customer price", () => {
  const result = calculatePrice(
    50,
    "MARKUP_AMOUNT",
    25,
  );

  assert.equal(result.courierCost, 50);
  assert.equal(result.customerPrice, 75);
});

test("monetary calculations are rounded to two decimal places", () => {
  const result = calculatePrice(
    33.33,
    "MARKUP_PERCENT",
    10,
  );

  assert.equal(result.customerPrice, 36.66);
});

test("zero courier cost is valid", () => {
  const result = calculatePrice(
    0,
    "MATCH_COURIER_COST",
    null,
  );

  assert.equal(result.customerPrice, 0);
});

test("negative courier cost is rejected", () => {
  assert.throws(
    () =>
      calculatePrice(
        -1,
        "MATCH_COURIER_COST",
        null,
      ),
    /Courier cost cannot be negative/,
  );
});

test("fixed amount requires a value", () => {
  assert.throws(
    () =>
      calculatePrice(
        50,
        "FIXED_AMOUNT",
        null,
      ),
    /requires a configured value/,
  );
});

test("markup amount requires a value", () => {
  assert.throws(
    () =>
      calculatePrice(
        50,
        "MARKUP_AMOUNT",
        null,
      ),
    /requires a configured value/,
  );
});

test("markup percentage requires a value", () => {
  assert.throws(
    () =>
      calculatePrice(
        50,
        "MARKUP_PERCENT",
        null,
      ),
    /requires a configured value/,
  );
});

test("subsidy amount requires a value", () => {
  assert.throws(
    () =>
      calculatePrice(
        50,
        "SUBSIDY_AMOUNT",
        null,
      ),
    /requires a configured value/,
  );
});

test("match courier cost must not have a value", () => {
  assert.throws(
    () =>
      calculatePrice(
        50,
        "MATCH_COURIER_COST",
        10,
      ),
    /must not have a configured value/,
  );
});

test("free shipping must not have a value", () => {
  assert.throws(
    () =>
      calculatePrice(
        50,
        "FREE",
        0,
      ),
    /must not have a configured value/,
  );
});

test("negative pricing value is rejected", () => {
  assert.throws(
    () =>
      calculatePrice(
        50,
        "MARKUP_AMOUNT",
        -10,
      ),
    /Pricing value cannot be negative/,
  );
});

test("negative fixed shipping price is rejected", () => {
  assert.throws(
    () =>
      calculatePrice(
        50,
        "FIXED_AMOUNT",
        -1,
      ),
    /Pricing value cannot be negative/,
  );
});

test("pricing result preserves strategy and configured value", () => {
  const result = calculatePrice(
    50,
    "MARKUP_AMOUNT",
    15,
  );

  assert.equal(result.strategy, "MARKUP_AMOUNT");
  assert.equal(result.value, 15);
  assert.equal(result.courierCost, 50);
  assert.equal(result.customerPrice, 65);
});

function createAvailabilityInput(
  overrides: Partial<ShippingAvailabilityInput> = {},
): ShippingAvailabilityInput {
  const courier = {
    id: "courier-1",
    code: "COURIER_A",
    name: "Courier A",
    isActive: true,
  };

  const zone = {
    id: "zone-1",
    courierId: "courier-1",
    code: "LUSAKA",
    name: "Lusaka Zone",
    isActive: true,
  };

  const location = {
    id: "location-1",
    countryCode: "ZM",
    provinceNormalized: "lusaka",
    townNormalized: "lusaka",
    isActive: true,
  };

  const tiers: ShippingPackageTier[] = [
    {
      id: "tier-small",
      courierId: "courier-1",
      code: "SMALL",
      name: "Small",
      minPoints: 1,
      maxPoints: 2,
      isCustom: false,
      isActive: true,
      position: 1,
    },
    {
      id: "tier-custom",
      courierId: "courier-1",
      code: "CUSTOM",
      name: "Custom",
      minPoints: null,
      maxPoints: null,
      isCustom: true,
      isActive: true,
      position: 2,
    },
  ];

  const rates: ShippingRate[] = [
    {
      id: "rate-1",
      deliveryZoneId: "zone-1",
      packageTierId: "tier-small",
      courierCost: 50,
      customerPriceStrategy: "MATCH_COURIER_COST",
      customerPriceValue: null,
      currencyCode: "ZMW",
      isActive: true,
    },
  ];

  return {
    destination: lusakaDestination,
    shippingPoints: 2,
    zones: [
      {
        courier,
        zone,
        location,
      },
    ],
    tiers,
    rates,
    ...overrides,
  };
}

test("one available courier is automatically selected", () => {
  const result = resolveShippingAvailability(
    createAvailabilityInput(),
  );

  assert.equal(result.status, "AVAILABLE");
  assert.equal(result.selectionMethod, "AUTO_SELECTED");
  assert.equal(result.options.length, 1);

  assert.equal(
    result.options[0].courierCode,
    "COURIER_A",
  );

  assert.equal(
    result.options[0].customerShippingPrice,
    50,
  );
});

test("two available couriers require customer selection", () => {
  const secondCourier = {
    id: "courier-2",
    code: "COURIER_B",
    name: "Courier B",
    isActive: true,
  };

  const secondZone = {
    id: "zone-2",
    courierId: "courier-2",
    code: "LUSAKA",
    name: "Lusaka Zone",
    isActive: true,
  };

  const secondTier: ShippingPackageTier = {
    id: "tier-2-small",
    courierId: "courier-2",
    code: "SMALL",
    name: "Small",
    minPoints: 1,
    maxPoints: 2,
    isCustom: false,
    isActive: true,
    position: 1,
  };

  const secondRate: ShippingRate = {
    id: "rate-2",
    deliveryZoneId: "zone-2",
    packageTierId: "tier-2-small",
    courierCost: 75,
    customerPriceStrategy: "MATCH_COURIER_COST",
    customerPriceValue: null,
    currencyCode: "ZMW",
    isActive: true,
  };

  const result = resolveShippingAvailability(
    createAvailabilityInput({
      zones: [
        ...createAvailabilityInput().zones,
        {
          courier: secondCourier,
          zone: secondZone,
          location: {
            id: "location-2",
            countryCode: "ZM",
            provinceNormalized: "lusaka",
            townNormalized: "lusaka",
            isActive: true,
          },
        },
      ],
      tiers: [
        ...createAvailabilityInput().tiers,
        secondTier,
      ],
      rates: [
        ...createAvailabilityInput().rates,
        secondRate,
      ],
    }),
  );

  assert.equal(result.status, "AVAILABLE");
  assert.equal(result.selectionMethod, "CUSTOMER_SELECTED");
  assert.equal(result.options.length, 2);

  assert.deepEqual(
    result.options.map((option) => option.courierCode),
    ["COURIER_A", "COURIER_B"],
  );
});

test("courier without an applicable rate is excluded", () => {
  const result = resolveShippingAvailability(
    createAvailabilityInput({
      rates: [],
    }),
  );

  assert.equal(
    result.status,
    "CUSTOM_CONTACT_REQUIRED",
  );

  assert.deepEqual(result.options, []);
});

test("destination without a serving courier requires custom contact", () => {
  const result = resolveShippingAvailability(
    createAvailabilityInput({
      destination: normalizeShippingDestination({
        country: "Zambia",
        province: "Copperbelt",
        town: "Kitwe",
      }),
    }),
  );

  assert.equal(
    result.status,
    "CUSTOM_CONTACT_REQUIRED",
  );

  assert.equal(
    result.selectionMethod,
    "CUSTOM_CONTACT_REQUIRED",
  );

  assert.deepEqual(result.options, []);
});

test("inactive courier does not become an available option", () => {
  const result = resolveShippingAvailability(
    createAvailabilityInput({
      zones: createAvailabilityInput().zones.map(
        (entry) => ({
          ...entry,
          courier: {
            ...entry.courier,
            isActive: false,
          },
        }),
      ),
    }),
  );

  assert.equal(
    result.status,
    "CUSTOM_CONTACT_REQUIRED",
  );

  assert.deepEqual(result.options, []);
});

test("inactive tier makes the courier unavailable", () => {
  const result = resolveShippingAvailability(
    createAvailabilityInput({
      tiers: createAvailabilityInput().tiers.map(
        (tier) => ({
          ...tier,
          isActive: false,
        }),
      ),
    }),
  );

  assert.equal(
    result.status,
    "CUSTOM_CONTACT_REQUIRED",
  );

  assert.deepEqual(result.options, []);
});

test("inactive rate makes the courier unavailable", () => {
  const result = resolveShippingAvailability(
    createAvailabilityInput({
      rates: createAvailabilityInput().rates.map(
        (rate) => ({
          ...rate,
          isActive: false,
        }),
      ),
    }),
  );

  assert.equal(
    result.status,
    "CUSTOM_CONTACT_REQUIRED",
  );

  assert.deepEqual(result.options, []);
});

test("shipping option contains the resolved tier and rate", () => {
  const result = resolveShippingAvailability(
    createAvailabilityInput(),
  );

  assert.equal(result.status, "AVAILABLE");

  if (result.status === "AVAILABLE") {
    const option = result.options[0];

    assert.equal(option.tierCode, "SMALL");
    assert.equal(option.tierMinPoints, 1);
    assert.equal(option.tierMaxPoints, 2);
    assert.equal(option.tierIsCustom, false);

    assert.equal(option.rateId, "rate-1");
    assert.equal(option.courierCost, 50);
    assert.equal(option.customerShippingPrice, 50);
    assert.equal(option.currencyCode, "ZMW");
  }
});

test("custom tier can produce a shipping option when above standard range", () => {
  const input = createAvailabilityInput({
    shippingPoints: 5,
    rates: [
      {
        id: "rate-custom",
        deliveryZoneId: "zone-1",
        packageTierId: "tier-custom",
        courierCost: 150,
        customerPriceStrategy: "MATCH_COURIER_COST",
        customerPriceValue: null,
        currencyCode: "ZMW",
        isActive: true,
      },
    ],
  });

  const result = resolveShippingAvailability(input);

  assert.equal(result.status, "AVAILABLE");

  if (result.status === "AVAILABLE") {
    assert.equal(result.options.length, 1);
    assert.equal(result.options[0].tierCode, "CUSTOM");
    assert.equal(result.options[0].tierIsCustom, true);
    assert.equal(result.options[0].customerShippingPrice, 150);
  }
});

test("pricing strategy is applied to the resolved shipping option", () => {
  const result = resolveShippingAvailability(
    createAvailabilityInput({
      rates: [
        {
          id: "rate-1",
          deliveryZoneId: "zone-1",
          packageTierId: "tier-small",
          courierCost: 50,
          customerPriceStrategy: "MARKUP_AMOUNT",
          customerPriceValue: 25,
          currencyCode: "ZMW",
          isActive: true,
        },
      ],
    }),
  );

  assert.equal(result.status, "AVAILABLE");

  if (result.status === "AVAILABLE") {
    assert.equal(
      result.options[0].customerShippingPrice,
      75,
    );

    assert.equal(
      result.options[0].courierCost,
      50,
    );

    assert.equal(
      result.options[0].pricingStrategy,
      "MARKUP_AMOUNT",
    );

    assert.equal(
      result.options[0].pricingValue,
      25,
    );
  }
});

test("unsupported destination requires custom delivery", () => {
  const result = createCustomDeliveryResult(
    "UNSUPPORTED_DESTINATION",
  );

  assert.equal(result.requiresCustomDelivery, true);
  assert.equal(
    result.selectionMethod,
    "CUSTOM_CONTACT_REQUIRED",
  );
  assert.equal(result.customerShippingPrice, null);
  assert.equal(result.currencyCode, "ZMW");
  assert.equal(
    result.reason,
    "UNSUPPORTED_DESTINATION",
  );
});

test("custom delivery never reports zero as the shipping price", () => {
  const reasons: CustomDeliveryReason[] = [
    "UNSUPPORTED_DESTINATION",
    "NO_AVAILABLE_COURIER",
    "NO_AVAILABLE_RATE",
    "INVALID_SHIPPING_CONFIGURATION",
  ];

  for (const reason of reasons) {
    const result = createCustomDeliveryResult(reason);

    assert.equal(result.customerShippingPrice, null);
    assert.notEqual(result.customerShippingPrice, 0);
  }
});

test("no available courier requires custom delivery", () => {
  const result = createCustomDeliveryResult(
    "NO_AVAILABLE_COURIER",
  );

  assert.equal(result.requiresCustomDelivery, true);
  assert.equal(
    result.selectionMethod,
    "CUSTOM_CONTACT_REQUIRED",
  );
  assert.equal(
    result.reason,
    "NO_AVAILABLE_COURIER",
  );
});

test("no available rate requires custom delivery", () => {
  const result = createCustomDeliveryResult(
    "NO_AVAILABLE_RATE",
  );

  assert.equal(result.requiresCustomDelivery, true);
  assert.equal(
    result.selectionMethod,
    "CUSTOM_CONTACT_REQUIRED",
  );
  assert.equal(
    result.reason,
    "NO_AVAILABLE_RATE",
  );
});

test("invalid shipping configuration requires custom delivery", () => {
  const result = createCustomDeliveryResult(
    "INVALID_SHIPPING_CONFIGURATION",
  );

  assert.equal(result.requiresCustomDelivery, true);
  assert.equal(
    result.selectionMethod,
    "CUSTOM_CONTACT_REQUIRED",
  );
});

test("custom delivery can use a different currency code", () => {
  const result = createCustomDeliveryResult(
    "UNSUPPORTED_DESTINATION",
    "USD",
  );

  assert.equal(result.currencyCode, "USD");
  assert.equal(result.customerShippingPrice, null);
});

test("zero shipping options require custom delivery", () => {
  assert.equal(
    requiresCustomDelivery(0),
    true,
  );
});

test("one or more shipping options do not require custom delivery", () => {
  assert.equal(
    requiresCustomDelivery(1),
    false,
  );

  assert.equal(
    requiresCustomDelivery(2),
    false,
  );
});

test("custom tier with a calculated price is a valid shipping option", () => {
  assert.equal(
    isCustomTierOption(true, 150),
    true,
  );
});

test("custom tier without a calculated price is not a valid shipping option", () => {
  assert.equal(
    isCustomTierOption(true, null),
    false,
  );
});

test("standard tier with a calculated price is not classified as custom tier", () => {
  assert.equal(
    isCustomTierOption(false, 50),
    false,
  );
});

test("full shipping calculator produces an automatically selected quote", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 2,
        shippingPoints: 1,
        shippingPointsOverride: null,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Kitwe",
    },
    zones: [
      {
        courier: {
          id: "courier-1",
          code: "COURIER_A",
          name: "Courier A",
          isActive: true,
        },
        zone: {
          id: "zone-1",
          courierId: "courier-1",
          code: "KITWE",
          name: "Kitwe",
          isActive: true,
        },
        location: {
          id: "location-1",
          countryCode: "ZM",
          provinceNormalized: "copperbelt",
          townNormalized: "kitwe",
          isActive: true,
        },
      },
    ],
    tiers: [
      {
        id: "tier-small",
        courierId: "courier-1",
        code: "SMALL",
        name: "Small",
        minPoints: 1,
        maxPoints: 2,
        isCustom: false,
        isActive: true,
        position: 1,
      },
    ],
    rates: [
      {
        id: "rate-1",
        deliveryZoneId: "zone-1",
        packageTierId: "tier-small",
        courierCost: 50,
        customerPriceStrategy: "MATCH_COURIER_COST",
        customerPriceValue: null,
        currencyCode: "ZMW",
        isActive: true,
      },
    ],
  });

  assert.equal(result.shippingPoints.totalPoints, 2);
  assert.equal(result.destination.countryCode, "ZM");
  assert.equal(result.destination.provinceNormalized, "copperbelt");
  assert.equal(result.destination.townNormalized, "kitwe");

  assert.equal(result.status, "AVAILABLE");
  assert.equal(result.selectionMethod, "AUTO_SELECTED");
  assert.equal(result.requiresCustomDelivery, false);

  assert.equal(result.options.length, 1);
  assert.equal(result.selectedOption?.courierCode, "COURIER_A");
  assert.equal(
    result.selectedOption?.customerShippingPrice,
    50,
  );
});

test("full shipping calculator requires customer selection for multiple couriers", () => {
  const baseDestination = {
    country: "ZM",
    province: "Copperbelt",
    town: "Kitwe",
  };

  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 1,
        shippingPoints: 1,
        shippingPointsOverride: null,
      },
    ],
    destination: baseDestination,
    zones: [
      {
        courier: {
          id: "courier-1",
          code: "COURIER_A",
          name: "Courier A",
          isActive: true,
        },
        zone: {
          id: "zone-1",
          courierId: "courier-1",
          code: "KITWE_A",
          name: "Kitwe",
          isActive: true,
        },
        location: {
          id: "location-1",
          countryCode: "ZM",
          provinceNormalized: "copperbelt",
          townNormalized: "kitwe",
          isActive: true,
        },
      },
      {
        courier: {
          id: "courier-2",
          code: "COURIER_B",
          name: "Courier B",
          isActive: true,
        },
        zone: {
          id: "zone-2",
          courierId: "courier-2",
          code: "KITWE_B",
          name: "Kitwe",
          isActive: true,
        },
        location: {
          id: "location-2",
          countryCode: "ZM",
          provinceNormalized: "copperbelt",
          townNormalized: "kitwe",
          isActive: true,
        },
      },
    ],
    tiers: [
      {
        id: "tier-a",
        courierId: "courier-1",
        code: "SMALL",
        name: "Small",
        minPoints: 1,
        maxPoints: 2,
        isCustom: false,
        isActive: true,
        position: 1,
      },
      {
        id: "tier-b",
        courierId: "courier-2",
        code: "SMALL",
        name: "Small",
        minPoints: 1,
        maxPoints: 2,
        isCustom: false,
        isActive: true,
        position: 1,
      },
    ],
    rates: [
      {
        id: "rate-a",
        deliveryZoneId: "zone-1",
        packageTierId: "tier-a",
        courierCost: 50,
        customerPriceStrategy: "MATCH_COURIER_COST",
        customerPriceValue: null,
        currencyCode: "ZMW",
        isActive: true,
      },
      {
        id: "rate-b",
        deliveryZoneId: "zone-2",
        packageTierId: "tier-b",
        courierCost: 70,
        customerPriceStrategy: "MATCH_COURIER_COST",
        customerPriceValue: null,
        currencyCode: "ZMW",
        isActive: true,
      },
    ],
  });

  assert.equal(result.status, "AVAILABLE");
  assert.equal(
    result.selectionMethod,
    "CUSTOMER_SELECTED",
  );
  assert.equal(result.selectedOption, null);
  assert.equal(result.requiresCustomDelivery, false);
  assert.equal(result.options.length, 2);
});

test("full shipping calculator requires custom delivery for unsupported destination", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 1,
        shippingPoints: 1,
        shippingPointsOverride: null,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Unknown Town",
    },
    zones: [],
    tiers: [],
    rates: [],
  });

  assert.equal(
    result.status,
    "CUSTOM_CONTACT_REQUIRED",
  );
  assert.equal(
    result.selectionMethod,
    "CUSTOM_CONTACT_REQUIRED",
  );
  assert.equal(result.requiresCustomDelivery, true);
  assert.equal(result.options.length, 0);
  assert.equal(result.selectedOption, null);
  assert.equal(
    result.customDeliveryReason,
    "No configured courier serves the selected destination.",
  );
});

test("full shipping calculator preserves custom tier as a normal shipping option", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 10,
        shippingPoints: 1,
        shippingPointsOverride: null,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Kitwe",
    },
    zones: [
      {
        courier: {
          id: "courier-1",
          code: "COURIER_A",
          name: "Courier A",
          isActive: true,
        },
        zone: {
          id: "zone-1",
          courierId: "courier-1",
          code: "KITWE",
          name: "Kitwe",
          isActive: true,
        },
        location: {
          id: "location-1",
          countryCode: "ZM",
          provinceNormalized: "copperbelt",
          townNormalized: "kitwe",
          isActive: true,
        },
      },
    ],
    tiers: [
      {
        id: "tier-small",
        courierId: "courier-1",
        code: "SMALL",
        name: "Small",
        minPoints: 1,
        maxPoints: 2,
        isCustom: false,
        isActive: true,
        position: 1,
      },
      {
        id: "tier-custom",
        courierId: "courier-1",
        code: "CUSTOM",
        name: "Custom",
        minPoints: null,
        maxPoints: null,
        isCustom: true,
        isActive: true,
        position: 2,
      },
    ],
    rates: [
      {
        id: "rate-custom",
        deliveryZoneId: "zone-1",
        packageTierId: "tier-custom",
        courierCost: 200,
        customerPriceStrategy: "MARKUP_AMOUNT",
        customerPriceValue: 50,
        currencyCode: "ZMW",
        isActive: true,
      },
    ],
  });

  assert.equal(result.shippingPoints.totalPoints, 10);
  assert.equal(result.status, "AVAILABLE");
  assert.equal(result.requiresCustomDelivery, false);
  assert.equal(result.options.length, 1);
  assert.equal(result.options[0].tierIsCustom, true);
  assert.equal(
    result.options[0].customerShippingPrice,
    250,
  );
  assert.equal(
    result.selectedOption?.tierIsCustom,
    true,
  );
});

test("full shipping calculator rejects invalid cart quantities", () => {
  assert.throws(
    () =>
      calculateShippingQuote({
        cartLines: [
          {
            variantId: "variant-1",
            productId: "product-1",
            quantity: 0,
            shippingPoints: 1,
            shippingPointsOverride: null,
          },
        ],
        destination: {
          country: "ZM",
          province: "Copperbelt",
          town: "Kitwe",
        },
        zones: [],
        tiers: [],
        rates: [],
      }),
    /Quantity must be a positive integer/,
  );
});

test("full shipping calculator applies variant shipping-point override", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 2,
        shippingPoints: 1,
        shippingPointsOverride: 3,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Kitwe",
    },
    zones: [],
    tiers: [],
    rates: [],
  });

  assert.equal(result.shippingPoints.totalPoints, 6);
  assert.equal(
    result.shippingPoints.lines[0].pointsPerUnit,
    3,
  );
  assert.equal(
    result.shippingPoints.lines[0].pointSource,
    "VARIANT_OVERRIDE",
  );
});

test("zero shipping points remain zero through the full calculator", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-zero",
        productId: "product-zero",
        quantity: 5,
        shippingPoints: 0,
        shippingPointsOverride: null,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Kitwe",
    },
    zones: [],
    tiers: [],
    rates: [],
  });

  assert.equal(result.shippingPoints.totalPoints, 0);
  assert.equal(
    result.shippingPoints.lines[0].pointsPerUnit,
    0,
  );
  assert.equal(
    result.shippingPoints.lines[0].pointSource,
    "PRODUCT_DEFAULT",
  );
});

test("mixed cart lines correctly combine product defaults and variant overrides", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 2,
        shippingPoints: 1,
        shippingPointsOverride: null,
      },
      {
        variantId: "variant-2",
        productId: "product-2",
        quantity: 3,
        shippingPoints: 2,
        shippingPointsOverride: 3,
      },
      {
        variantId: "variant-3",
        productId: "product-3",
        quantity: 1,
        shippingPoints: 4,
        shippingPointsOverride: 0,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Kitwe",
    },
    zones: [],
    tiers: [],
    rates: [],
  });

  assert.equal(result.shippingPoints.totalPoints, 11);

  assert.equal(
    result.shippingPoints.lines[0].totalPoints,
    2,
  );

  assert.equal(
    result.shippingPoints.lines[1].totalPoints,
    9,
  );

  assert.equal(
    result.shippingPoints.lines[2].totalPoints,
    0,
  );
});

test("only couriers with complete usable shipping configuration become options", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 1,
        shippingPoints: 2,
        shippingPointsOverride: null,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Kitwe",
    },
    zones: [
      {
        courier: {
          id: "courier-good",
          code: "GOOD",
          name: "Good Courier",
          isActive: true,
        },
        zone: {
          id: "zone-good",
          courierId: "courier-good",
          code: "KITWE",
          name: "Kitwe",
          isActive: true,
        },
        location: {
          id: "location-good",
          countryCode: "ZM",
          provinceNormalized: "copperbelt",
          townNormalized: "kitwe",
          isActive: true,
        },
      },
      {
        courier: {
          id: "courier-bad",
          code: "BAD",
          name: "Bad Courier",
          isActive: true,
        },
        zone: {
          id: "zone-bad",
          courierId: "courier-bad",
          code: "KITWE",
          name: "Kitwe",
          isActive: true,
        },
        location: {
          id: "location-bad",
          countryCode: "ZM",
          provinceNormalized: "copperbelt",
          townNormalized: "kitwe",
          isActive: true,
        },
      },
    ],
    tiers: [
      {
        id: "tier-good",
        courierId: "courier-good",
        code: "SMALL",
        name: "Small",
        minPoints: 1,
        maxPoints: 2,
        isCustom: false,
        isActive: true,
        position: 1,
      },
      {
        id: "tier-bad",
        courierId: "courier-bad",
        code: "SMALL",
        name: "Small",
        minPoints: 1,
        maxPoints: 2,
        isCustom: false,
        isActive: true,
        position: 1,
      },
    ],
    rates: [
      {
        id: "rate-good",
        deliveryZoneId: "zone-good",
        packageTierId: "tier-good",
        courierCost: 60,
        customerPriceStrategy: "MATCH_COURIER_COST",
        customerPriceValue: null,
        currencyCode: "ZMW",
        isActive: true,
      },
    ],
  });

  assert.equal(result.options.length, 1);
  assert.equal(result.options[0].courierCode, "GOOD");
  assert.equal(result.selectionMethod, "AUTO_SELECTED");
});

test("courier with a custom tier but no custom rate requires custom delivery", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 10,
        shippingPoints: 1,
        shippingPointsOverride: null,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Kitwe",
    },
    zones: [
      {
        courier: {
          id: "courier-1",
          code: "COURIER",
          name: "Courier",
          isActive: true,
        },
        zone: {
          id: "zone-1",
          courierId: "courier-1",
          code: "KITWE",
          name: "Kitwe",
          isActive: true,
        },
        location: {
          id: "location-1",
          countryCode: "ZM",
          provinceNormalized: "copperbelt",
          townNormalized: "kitwe",
          isActive: true,
        },
      },
    ],
    tiers: [
      {
        id: "tier-small",
        courierId: "courier-1",
        code: "SMALL",
        name: "Small",
        minPoints: 1,
        maxPoints: 2,
        isCustom: false,
        isActive: true,
        position: 1,
      },
      {
        id: "tier-custom",
        courierId: "courier-1",
        code: "CUSTOM",
        name: "Custom",
        minPoints: null,
        maxPoints: null,
        isCustom: true,
        isActive: true,
        position: 2,
      },
    ],
    rates: [],
  });

  assert.equal(
    result.status,
    "CUSTOM_CONTACT_REQUIRED",
  );
  assert.equal(result.requiresCustomDelivery, true);
  assert.equal(result.options.length, 0);
});

test("destination normalization is applied before courier resolution", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 1,
        shippingPoints: 1,
        shippingPointsOverride: null,
      },
    ],
    destination: {
      country: "  zambia ",
      province: "  Copperbelt  ",
      town: "  Kitwe  ",
    },
    zones: [
      {
        courier: {
          id: "courier-1",
          code: "COURIER",
          name: "Courier",
          isActive: true,
        },
        zone: {
          id: "zone-1",
          courierId: "courier-1",
          code: "KITWE",
          name: "Kitwe",
          isActive: true,
        },
        location: {
          id: "location-1",
          countryCode: "ZM",
          provinceNormalized: "copperbelt",
          townNormalized: "kitwe",
          isActive: true,
        },
      },
    ],
    tiers: [
      {
        id: "tier-1",
        courierId: "courier-1",
        code: "SMALL",
        name: "Small",
        minPoints: 1,
        maxPoints: 2,
        isCustom: false,
        isActive: true,
        position: 1,
      },
    ],
    rates: [
      {
        id: "rate-1",
        deliveryZoneId: "zone-1",
        packageTierId: "tier-1",
        courierCost: 50,
        customerPriceStrategy: "MATCH_COURIER_COST",
        customerPriceValue: null,
        currencyCode: "ZMW",
        isActive: true,
      },
    ],
  });

  assert.equal(result.status, "AVAILABLE");
  assert.equal(result.destination.countryCode, "ZM");
  assert.equal(
    result.destination.provinceNormalized,
    "copperbelt",
  );
  assert.equal(
    result.destination.townNormalized,
    "kitwe",
  );
});

test("free shipping is explicit rather than caused by missing pricing", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 1,
        shippingPoints: 1,
        shippingPointsOverride: null,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Kitwe",
    },
    zones: [
      {
        courier: {
          id: "courier-1",
          code: "COURIER",
          name: "Courier",
          isActive: true,
        },
        zone: {
          id: "zone-1",
          courierId: "courier-1",
          code: "KITWE",
          name: "Kitwe",
          isActive: true,
        },
        location: {
          id: "location-1",
          countryCode: "ZM",
          provinceNormalized: "copperbelt",
          townNormalized: "kitwe",
          isActive: true,
        },
      },
    ],
    tiers: [
      {
        id: "tier-1",
        courierId: "courier-1",
        code: "SMALL",
        name: "Small",
        minPoints: 1,
        maxPoints: 2,
        isCustom: false,
        isActive: true,
        position: 1,
      },
    ],
    rates: [
      {
        id: "rate-1",
        deliveryZoneId: "zone-1",
        packageTierId: "tier-1",
        courierCost: 50,
        customerPriceStrategy: "FREE",
        customerPriceValue: null,
        currencyCode: "ZMW",
        isActive: true,
      },
    ],
  });

  assert.equal(result.status, "AVAILABLE");
  assert.equal(
    result.options[0].customerShippingPrice,
    0,
  );
  assert.equal(result.requiresCustomDelivery, false);
});

test("customer pricing remains separate from courier cost", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 1,
        shippingPoints: 1,
        shippingPointsOverride: null,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Kitwe",
    },
    zones: [
      {
        courier: {
          id: "courier-1",
          code: "COURIER",
          name: "Courier",
          isActive: true,
        },
        zone: {
          id: "zone-1",
          courierId: "courier-1",
          code: "KITWE",
          name: "Kitwe",
          isActive: true,
        },
        location: {
          id: "location-1",
          countryCode: "ZM",
          provinceNormalized: "copperbelt",
          townNormalized: "kitwe",
          isActive: true,
        },
      },
    ],
    tiers: [
      {
        id: "tier-1",
        courierId: "courier-1",
        code: "SMALL",
        name: "Small",
        minPoints: 1,
        maxPoints: 2,
        isCustom: false,
        isActive: true,
        position: 1,
      },
    ],
    rates: [
      {
        id: "rate-1",
        deliveryZoneId: "zone-1",
        packageTierId: "tier-1",
        courierCost: 100,
        customerPriceStrategy: "MARKUP_AMOUNT",
        customerPriceValue: 25,
        currencyCode: "ZMW",
        isActive: true,
      },
    ],
  });

  assert.equal(result.options[0].courierCost, 100);
  assert.equal(
    result.options[0].customerShippingPrice,
    125,
  );
});

test("no usable courier results in custom contact rather than free shipping", () => {
  const result = calculateShippingQuote({
    cartLines: [
      {
        variantId: "variant-1",
        productId: "product-1",
        quantity: 1,
        shippingPoints: 1,
        shippingPointsOverride: null,
      },
    ],
    destination: {
      country: "ZM",
      province: "Copperbelt",
      town: "Kitwe",
    },
    zones: [],
    tiers: [],
    rates: [],
  });

  assert.equal(result.requiresCustomDelivery, true);
  assert.equal(
    result.selectionMethod,
    "CUSTOM_CONTACT_REQUIRED",
  );
  assert.equal(result.options.length, 0);
  assert.equal(result.selectedOption, null);
});