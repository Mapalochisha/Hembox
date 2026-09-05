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

function validateOrderShipmentConsistency(
  orderStatus: OrderStatus,
  shipmentStatus: ShipmentStatus | null,
): string | null {
  if (!shipmentStatus) {
    return null;
  }

  if (
    orderStatus === OrderStatus.DELIVERED &&
    shipmentStatus !== ShipmentStatus.DELIVERED
  ) {
    return "An order cannot be marked as delivered until its shipment is marked as delivered.";
  }

  if (
    orderStatus === OrderStatus.SHIPPED &&
    ![
      ShipmentStatus.COLLECTED,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.DELIVERED,
    ].includes(shipmentStatus)
  ) {
    return "An order cannot be marked as shipped while its shipment is still pending, ready for courier, cancelled, returned, lost, damaged, or failed delivery.";
  }

  if (
    orderStatus === OrderStatus.PENDING &&
    [
      ShipmentStatus.COLLECTED,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.DELIVERED,
    ].includes(shipmentStatus)
  ) {
    return "An order cannot remain pending while its shipment has already been collected, is in transit, or has been delivered.";
  }

  if (
    orderStatus === OrderStatus.CANCELLED &&
    shipmentStatus === ShipmentStatus.DELIVERED
  ) {
    return "A delivered shipment cannot belong to a cancelled order.";
  }

  return null;
}

async function getOrder(id: string) {
  return db.order.findUnique({
    where: {
      id,
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

  const order = await getOrder(params.id);

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
        status: true,
        paymentStatus: true,
        shipment: {
          select: {
            id: true,
            status: true,
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

    const effectiveOrderStatus =
      status ?? existingOrder.status;
    const effectiveShipmentStatus =
      shipmentStatus ?? existingOrder.shipment?.status ?? null;

    if (status !== undefined || shipmentStatus !== undefined) {
      const consistencyError =
        validateOrderShipmentConsistency(
          effectiveOrderStatus,
          effectiveShipmentStatus,
        );

      if (consistencyError) {
        return NextResponse.json(
          {
            error: consistencyError,
            code: "ORDER_SHIPMENT_STATUS_CONFLICT",
            orderStatus: effectiveOrderStatus,
            shipmentStatus: effectiveShipmentStatus,
          },
          { status: 409 },
        );
      }
    }

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
        orderStatusOverride: effectiveOrderStatus,
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
