import "server-only";

import {
  OrderStatus,
  ShipmentStatus,
} from "@prisma/client";

import { db } from "@/lib/db";

export interface UpdateShipmentStatusInput {
  shipmentId: string;
  status: ShipmentStatus;
  note?: string | null;
  trackingNumber?: string | null;
  orderStatusOverride?: OrderStatus;
}

const ALLOWED_SHIPMENT_TRANSITIONS: Record<
  ShipmentStatus,
  readonly ShipmentStatus[]
> = {
  PENDING: [
    ShipmentStatus.READY_FOR_COURIER,
    ShipmentStatus.CANCELLED,
  ],

  READY_FOR_COURIER: [
    ShipmentStatus.COLLECTED,
    ShipmentStatus.CANCELLED,
  ],

  COLLECTED: [
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.FAILED_DELIVERY,
    ShipmentStatus.LOST,
    ShipmentStatus.DAMAGED,
  ],

  IN_TRANSIT: [
    ShipmentStatus.DELIVERED,
    ShipmentStatus.FAILED_DELIVERY,
    ShipmentStatus.RETURNED,
    ShipmentStatus.LOST,
    ShipmentStatus.DAMAGED,
  ],

  DELIVERED: [],

  FAILED_DELIVERY: [
    ShipmentStatus.READY_FOR_COURIER,
    ShipmentStatus.RETURNED,
    ShipmentStatus.CANCELLED,
  ],

  RETURNED: [
    ShipmentStatus.READY_FOR_COURIER,
    ShipmentStatus.CANCELLED,
  ],

  CANCELLED: [],

  LOST: [],

  DAMAGED: [],
};

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function validateOrderShipmentTransition(
  orderStatus: OrderStatus,
  shipmentStatus: ShipmentStatus,
): string | null {
  const shipmentHasPhysicalProgress: readonly ShipmentStatus[] = [
    ShipmentStatus.COLLECTED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.DELIVERED,
  ];

  const blockedOrderStatuses: readonly OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
    OrderStatus.ARCHIVED,
  ];

  if (
    shipmentHasPhysicalProgress.includes(shipmentStatus) &&
    blockedOrderStatuses.includes(orderStatus)
  ) {
    return `A shipment cannot be ${shipmentStatus.toLowerCase().replaceAll("_", " ")} while the order is ${orderStatus.toLowerCase().replaceAll("_", " ")}.`;
  }

  return null;
}

export function isValidShipmentTransition(
  fromStatus: ShipmentStatus,
  toStatus: ShipmentStatus,
): boolean {
  return ALLOWED_SHIPMENT_TRANSITIONS[fromStatus].includes(
    toStatus,
  );
}

export function getAllowedShipmentTransitions(
  status: ShipmentStatus,
): readonly ShipmentStatus[] {
  return ALLOWED_SHIPMENT_TRANSITIONS[status];
}

export async function updateShipmentStatus(
  input: UpdateShipmentStatusInput,
) {
  const shipmentId = input.shipmentId.trim();

  if (!shipmentId) {
    throw new Error("Shipment ID is required");
  }

  const note = normalizeOptionalText(input.note);

  const trackingNumber =
    input.trackingNumber === undefined
      ? undefined
      : normalizeOptionalText(input.trackingNumber);

  return db.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: {
        id: shipmentId,
      },
      include: {
        order: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    const fromStatus = shipment.status;
    const toStatus = input.status;

    if (fromStatus === toStatus) {
      throw new Error(`Shipment is already ${toStatus}`);
    }

    if (!isValidShipmentTransition(fromStatus, toStatus)) {
      throw new Error(
        `Invalid shipment status transition: ${fromStatus} → ${toStatus}`,
      );
    }

    const effectiveOrderStatus =
      input.orderStatusOverride ?? shipment.order.status;

    const lifecycleError = validateOrderShipmentTransition(
      effectiveOrderStatus,
      toStatus,
    );

    if (lifecycleError) {
      throw new Error(lifecycleError);
    }

    const now = new Date();

    const nextTrackingNumber =
      trackingNumber !== undefined
        ? trackingNumber
        : shipment.trackingNumber;

    const shipmentUpdateData: {
      status: ShipmentStatus;
      statusChangedAt: Date;
      trackingNumber?: string | null;
      collectedAt?: Date;
      deliveredAt?: Date;
      cancelledAt?: Date;
      events: {
        create: {
          fromStatus: ShipmentStatus;
          toStatus: ShipmentStatus;
          note: string | null;
          trackingNumber: string | null;
          createdAt: Date;
        };
      };
    } = {
      status: toStatus,
      statusChangedAt: now,
      events: {
        create: {
          fromStatus,
          toStatus,
          note,
          trackingNumber: nextTrackingNumber,
          createdAt: now,
        },
      },
    };

    if (trackingNumber !== undefined) {
      shipmentUpdateData.trackingNumber = trackingNumber;
    }

    if (
      toStatus === ShipmentStatus.COLLECTED &&
      shipment.collectedAt === null
    ) {
      shipmentUpdateData.collectedAt = now;
    }

    if (
      toStatus === ShipmentStatus.DELIVERED &&
      shipment.deliveredAt === null
    ) {
      shipmentUpdateData.deliveredAt = now;
    }

    if (
      toStatus === ShipmentStatus.CANCELLED &&
      shipment.cancelledAt === null
    ) {
      shipmentUpdateData.cancelledAt = now;
    }

    return tx.shipment.update({
      where: {
        id: shipmentId,
      },
      data: shipmentUpdateData,
    });
  });
}
