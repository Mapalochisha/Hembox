import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import {
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
} from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateShipmentStatus } from "@/lib/shipments/service";

export const dynamic = "force-dynamic";

const patchOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  trackingNumber: z.string().nullable().optional(),
  shipmentStatus: z.nativeEnum(ShipmentStatus).optional(),
  shipmentNote: z.string().nullable().optional(),
});

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

  const order = await db.order.findUnique({
    where: {
      id: params.id,
    },
    include: {
      customer: true,
      address: true,
      items: true,
      shipment: {
        include: {
          courier: true,
          deliveryZone: true,
          packageTier: true,
          events: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(order);
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

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const parsed = patchOrderSchema.safeParse(body);

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
    paymentStatus,
    trackingNumber,
    shipmentStatus,
    shipmentNote,
  } = parsed.data;

  try {
    const existingOrder = await db.order.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        shipment: {
          select: {
            id: true,
            trackingNumber: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    /*
     * Shipment updates go through the shipment service so that:
     *
     * 1. Status transitions are validated.
     * 2. Shipment timestamps are maintained.
     * 3. ShipmentEvent history is created.
     * 4. Tracking changes are recorded against the shipment.
     */
    if (shipmentStatus !== undefined) {
      if (!existingOrder.shipment) {
        return NextResponse.json(
          {
            error:
              "This order does not have a shipment record",
          },
          { status: 409 },
        );
      }

      await updateShipmentStatus({
        shipmentId: existingOrder.shipment.id,
        status: shipmentStatus,
        note: shipmentNote,
        trackingNumber,
      });
    } else if (shipmentNote !== undefined) {
      return NextResponse.json(
        {
          error:
            "A shipment status is required when adding a shipment note",
        },
        { status: 400 },
      );
    } else if (trackingNumber !== undefined) {
      /*
       * Preserve the existing admin behaviour where the order-level
       * tracking number can be edited without changing shipment status.
       *
       * If a shipment exists, keep its tracking number synchronized.
       */
      if (existingOrder.shipment) {
        await db.shipment.update({
          where: {
            id: existingOrder.shipment.id,
          },
          data: {
            trackingNumber,
          },
        });
      }
    }

    /*
     * Keep the existing order-level fields working.
     *
     * Shipping lifecycle is intentionally separate from commercial
     * order status and payment status.
     */
    const order = await db.order.update({
      where: {
        id: params.id,
      },
      data: {
        ...(status !== undefined && {
          status,
        }),

        ...(paymentStatus !== undefined && {
          paymentStatus,
        }),

        ...(trackingNumber !== undefined && {
          trackingNumber,
        }),
      },
      include: {
        customer: true,
        address: true,
        items: true,
        shipment: {
          include: {
            courier: true,
            deliveryZone: true,
            packageTier: true,
            events: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update order";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    );
  }
}