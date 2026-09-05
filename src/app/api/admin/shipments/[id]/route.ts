import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { ShipmentStatus } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getAllowedShipmentTransitions,
  updateShipmentStatus,
} from "@/lib/shipments/service";

export const dynamic = "force-dynamic";

const patchShipmentSchema = z.object({
  status: z.nativeEnum(ShipmentStatus).optional(),
  trackingNumber: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

async function getShipment(id: string) {
  return db.shipment.findUnique({
    where: {
      id,
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          subtotal: true,
          shippingCost: true,
          total: true,
          createdAt: true,
          updatedAt: true,
          guestName: true,
          guestEmail: true,
          shippingAddress: true,
          trackingNumber: true,
          notes: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            select: {
              id: true,
              productId: true,
              variantId: true,
              quantity: true,
              priceAtPurchase: true,
              variantSnapshot: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      courier: true,
      deliveryZone: true,
      packageTier: true,
      events: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function GET(
  _: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const shipmentId = params.id.trim();

  if (!shipmentId) {
    return NextResponse.json(
      { error: "Shipment ID is required" },
      { status: 400 },
    );
  }

  const shipment = await getShipment(shipmentId);

  if (!shipment) {
    return NextResponse.json(
      { error: "Shipment not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ...shipment,
    allowedTransitions:
      getAllowedShipmentTransitions(shipment.status),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const shipmentId = params.id.trim();

  if (!shipmentId) {
    return NextResponse.json(
      { error: "Shipment ID is required" },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const parsed = patchShipmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const {
    status,
    trackingNumber,
    note,
  } = parsed.data;

  if (
    status === undefined &&
    trackingNumber === undefined &&
    note === undefined
  ) {
    return NextResponse.json(
      {
        error:
          "At least one shipment field must be provided",
      },
      { status: 400 },
    );
  }

  const existingShipment = await db.shipment.findUnique({
    where: {
      id: shipmentId,
    },
    select: {
      id: true,
      status: true,
      trackingNumber: true,
    },
  });

  if (!existingShipment) {
    return NextResponse.json(
      { error: "Shipment not found" },
      { status: 404 },
    );
  }

  try {
    /*
     * Status changes must go through the shipment service.
     *
     * This guarantees:
     * - valid status transitions
     * - lifecycle timestamps
     * - ShipmentEvent creation
     * - tracking number snapshotting on the event
     */
    if (status !== undefined) {
      if (status === existingShipment.status) {
        return NextResponse.json(
          {
            error:
              `Shipment is already ${status}`,
          },
          { status: 400 },
        );
      }

      await updateShipmentStatus({
        shipmentId,
        status,
        note,
        trackingNumber,
      });
    } else {
      /*
       * Tracking-only updates are allowed without changing
       * shipment status.
       *
       * Notes require a status change because ShipmentEvent
       * history is currently tied to status transitions.
       */
      if (note !== undefined) {
        return NextResponse.json(
          {
            error:
              "A shipment status is required when adding a shipment note",
          },
          { status: 400 },
        );
      }

      if (trackingNumber !== undefined) {
        const normalizedTrackingNumber =
          trackingNumber === null
            ? null
            : trackingNumber.trim() || null;

        await db.shipment.update({
          where: {
            id: shipmentId,
          },
          data: {
            trackingNumber:
              normalizedTrackingNumber,
          },
        });
      }
    }

    const shipment = await getShipment(shipmentId);

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found after update" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...shipment,
      allowedTransitions:
        getAllowedShipmentTransitions(shipment.status),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update shipment";

    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}