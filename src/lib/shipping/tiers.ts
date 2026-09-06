export interface ShippingPackageTier {
  id: string;
  courierId: string;
  code: string;
  name: string;
  minPoints: number | null;
  maxPoints: number | null;
  isCustom: boolean;
  isActive: boolean;
  position: number;
}

export type PackageTierResolutionResult =
  | {
      status: "MATCHED";
      tier: ShippingPackageTier;
    }
  | {
      status: "NO_MATCH";
      tier: null;
      reason: string;
    }
  | {
      status: "INVALID_CONFIGURATION";
      tier: null;
      reason: string;
    };

function validateTier(tier: ShippingPackageTier): string | null {
  if (!tier.id || !tier.courierId) {
    return "Package tier requires valid IDs.";
  }

  if (!tier.code || !tier.name) {
    return `Package tier ${tier.id} requires a code and name.`;
  }

  if (!Number.isInteger(tier.position)) {
    return `Package tier ${tier.code} has an invalid position.`;
  }

  if (tier.isCustom) {
    if (tier.minPoints !== null || tier.maxPoints !== null) {
      return (
        `Custom package tier ${tier.code} must not define ` +
        "minPoints or maxPoints."
      );
    }

    return null;
  }

  if (tier.minPoints === null || tier.maxPoints === null) {
    return (
      `Standard package tier ${tier.code} must define ` +
      "both minPoints and maxPoints."
    );
  }

  if (!Number.isInteger(tier.minPoints) || !Number.isInteger(tier.maxPoints)) {
    return `Package tier ${tier.code} must use integer point boundaries.`;
  }

  if (tier.minPoints < 0 || tier.maxPoints < 0) {
    return `Package tier ${tier.code} cannot use negative point boundaries.`;
  }

  if (tier.minPoints > tier.maxPoints) {
    return (
      `Package tier ${tier.code} has an invalid range: ` +
      "minPoints cannot exceed maxPoints."
    );
  }

  return null;
}

function standardTiersOverlap(
  first: ShippingPackageTier,
  second: ShippingPackageTier,
): boolean {
  if (
    first.minPoints === null ||
    first.maxPoints === null ||
    second.minPoints === null ||
    second.maxPoints === null
  ) {
    return false;
  }

  return (
    first.minPoints <= second.maxPoints &&
    second.minPoints <= first.maxPoints
  );
}

/**
 * Validates the active package-tier configuration for one courier.
 *
 * Standard tiers must have valid, non-overlapping point ranges.
 * Custom tiers do not participate in standard range matching.
 */
export function validatePackageTierConfiguration(
  courierId: string,
  tiers: ShippingPackageTier[],
): void {
  if (!courierId) {
    throw new Error("Courier ID is required.");
  }

  const activeTiers = tiers.filter(
    (tier) => tier.isActive && tier.courierId === courierId,
  );

  for (const tier of activeTiers) {
    const error = validateTier(tier);

    if (error) {
      throw new Error(error);
    }
  }

  const standardTiers = activeTiers.filter((tier) => !tier.isCustom);
  const customTiers = activeTiers.filter((tier) => tier.isCustom);

  if (customTiers.length > 1) {
    throw new Error(
      `Courier ${courierId} has multiple active custom package tiers.`,
    );
  }

  for (let index = 0; index < standardTiers.length; index += 1) {
    for (
      let comparisonIndex = index + 1;
      comparisonIndex < standardTiers.length;
      comparisonIndex += 1
    ) {
      const first = standardTiers[index];
      const second = standardTiers[comparisonIndex];

      if (standardTiersOverlap(first, second)) {
        throw new Error(
          `Package tiers ${first.code} and ${second.code} have overlapping point ranges.`,
        );
      }
    }
  }
}

/**
 * Resolves the package tier for a courier based on shipping points.
 *
 * Standard tiers are matched by their configured point ranges.
 * If no standard tier matches and a custom tier exists, the custom tier
 * is selected only when the points exceed the highest configured
 * standard tier.
 *
 * A gap between standard tiers does not automatically become Custom.
 */
export function resolvePackageTier(
  courierId: string,
  shippingPoints: number,
  tiers: ShippingPackageTier[],
): PackageTierResolutionResult {
  if (!courierId) {
    return {
      status: "INVALID_CONFIGURATION",
      tier: null,
      reason: "Courier ID is required.",
    };
  }

  if (!Number.isInteger(shippingPoints) || shippingPoints < 0) {
    return {
      status: "NO_MATCH",
      tier: null,
      reason: "Shipping points must be a non-negative integer.",
    };
  }

  try {
    validatePackageTierConfiguration(courierId, tiers);
  } catch (error) {
    return {
      status: "INVALID_CONFIGURATION",
      tier: null,
      reason:
        error instanceof Error
          ? error.message
          : "Invalid package-tier configuration.",
    };
  }

  const activeTiers = tiers.filter(
    (tier) => tier.isActive && tier.courierId === courierId,
  );

  const standardTiers = activeTiers
    .filter((tier) => !tier.isCustom)
    .sort((first, second) => first.position - second.position);

  const customTier = activeTiers.find((tier) => tier.isCustom) ?? null;

  const matchingStandardTier = standardTiers.find(
    (tier) =>
      tier.minPoints !== null &&
      tier.maxPoints !== null &&
      shippingPoints >= tier.minPoints &&
      shippingPoints <= tier.maxPoints,
  );

  if (matchingStandardTier) {
    return {
      status: "MATCHED",
      tier: matchingStandardTier,
    };
  }

  if (standardTiers.length === 0) {
    if (customTier) {
      return {
        status: "MATCHED",
        tier: customTier,
      };
    }

    return {
      status: "NO_MATCH",
      tier: null,
      reason: "No active package tiers are configured for this courier.",
    };
  }

  const highestStandardMaxPoints = Math.max(
    ...standardTiers.map((tier) => tier.maxPoints as number),
  );

  if (shippingPoints > highestStandardMaxPoints && customTier) {
    return {
      status: "MATCHED",
      tier: customTier,
    };
  }

  return {
    status: "NO_MATCH",
    tier: null,
    reason:
      `No package tier matches ${shippingPoints} shipping points ` +
      "for this courier.",
  };
}