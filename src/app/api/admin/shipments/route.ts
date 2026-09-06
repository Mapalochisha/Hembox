import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { ShipmentStatus } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateShipmentStatus } from "@/lib/shipments/service";

export const dynamic = "force-dynamic";

const shipmentQuerySchema = z.object({
  status: z.nativeEnum(ShipmentStatus).optional(),
  courierId: z.string().trim().min(1).optional(),
  search: z.string().trim().optional(),
});

const patchShipmentSchema = z.object({
  status: z.nativeEnum(ShipmentStatus).optional(),
  trackingNumber: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);

  const parsed = shipmentQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    courierId: searchParams.get("courierId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { status, courierId, search } = parsed.data;

  const shipments = await db.shipment.findMany({
    where: {
      ...(status && {
        status,
      }),

      ...(courierId && {
        courierId,
      }),

      ...(search
        ? {
            OR: [
              {
                trackingNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                order: {
                  orderNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                order: {
                  guestName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                order: {
                  guestEmail: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },

    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          guestName: true,
          guestEmail: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
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

    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(shipments);
}

export async function PATCH(req: Request) {
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

  const shipmentId = req.headers.get("x-shipment-id")?.trim();

  if (!shipmentId) {
    return NextResponse.json(
      {
        error:
          "Shipment ID is required in the x-shipment-id header",
      },
      { status: 400 },
    );
  }

  if (status === undefined) {
    return NextResponse.json(
      {
        error:
          "Shipment status is required",
      },
      { status: 400 },
    );
  }

  try {
    const shipment = await db.shipment.findUnique({
      where: {
        id: shipmentId,
      },
    });

    if (!shipment) {
      return NextResponse.json(
        {
          error: "Shipment not found",
        },
        { status: 404 },
      );
    }

    const updatedShipment =
      await updateShipmentStatus({
        shipmentId,
        status,
        note,
        trackingNumber,
      });

    return NextResponse.json(
      updatedShipment,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update shipment";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    );
  }
}