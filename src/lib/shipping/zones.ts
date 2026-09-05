import type { NormalizedShippingDestination } from "./destination";

export interface ShippingCourier {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ShippingZone {
  id: string;
  courierId: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ShippingLocationAssignment {
  zoneId: string;
  locationId: string;
}

export interface ShippingLocation {
  id: string;
  countryCode: string;
  provinceNormalized: string;
  townNormalized: string;
  isActive: boolean;
}

export interface ShippingZoneData {
  courier: ShippingCourier;
  zone: ShippingZone;
  location: ShippingLocation;
}

export interface CourierZoneMatch {
  courier: ShippingCourier;
  zone: ShippingZone;
}

export type ZoneResolutionResult =
  | {
      status: "MATCHED";
      matches: CourierZoneMatch[];
    }
  | {
      status: "NO_MATCH";
      matches: [];
    }
  | {
      status: "AMBIGUOUS";
      matches: CourierZoneMatch[];
      reason: string;
    };

function locationMatchesDestination(
  location: ShippingLocation,
  destination: NormalizedShippingDestination,
): boolean {
  return (
    location.isActive &&
    location.countryCode === destination.countryCode &&
    location.provinceNormalized === destination.provinceNormalized &&
    location.townNormalized === destination.townNormalized
  );
}

/**
 * Resolves which active courier zones serve a destination.
 *
 * This function is intentionally pure. Database records are supplied
 * by the caller so that database access remains outside the shipping
 * calculation domain.
 */
export function resolveCourierZones(
  destination: NormalizedShippingDestination,
  zones: ShippingZoneData[],
): ZoneResolutionResult {
  const matches: CourierZoneMatch[] = [];

  for (const entry of zones) {
    if (!entry.courier.isActive) {
      continue;
    }

    if (!entry.zone.isActive) {
      continue;
    }

    if (entry.zone.courierId !== entry.courier.id) {
      continue;
    }

    if (!locationMatchesDestination(entry.location, destination)) {
      continue;
    }

    matches.push({
      courier: entry.courier,
      zone: entry.zone,
    });
  }

  if (matches.length === 0) {
    return {
      status: "NO_MATCH",
      matches: [],
    };
  }

  /**
   * A courier should normally resolve to one zone for a destination.
   * Multiple zones belonging to the same courier would make rate
   * selection ambiguous, so reject that configuration rather than
   * silently choosing one.
   */
  const courierIds = new Set<string>();

  for (const match of matches) {
    if (courierIds.has(match.courier.id)) {
      return {
        status: "AMBIGUOUS",
        matches,
        reason:
          `Courier ${match.courier.code} has multiple active zones ` +
          "covering the same destination.",
      };
    }

    courierIds.add(match.courier.id);
  }

  return {
    status: "MATCHED",
    matches,
  };
}