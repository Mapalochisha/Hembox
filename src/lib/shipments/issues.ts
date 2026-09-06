import "server-only";

import { Prisma, ShipmentStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const SHIPMENT_ISSUE_TYPES = [
  "DELAYED",
  "LOST",
  "DAMAGED",
  "WRONG_ITEM",
  "ADDRESS_PROBLEM",
  "COURIER_PROBLEM",
  "CUSTOMER_UNAVAILABLE",
  "OTHER",
] as const;

export const SHIPMENT_ISSUE_RESPONSIBILITIES = [
  "UNASSIGNED",
  "COURIER",
  "STORE",
  "CUSTOMER",
  "THIRD_PARTY",
] as const;

export const SHIPMENT_ISSUE_STATUSES = [
  "OPEN",
  "INVESTIGATING",
  "RESOLVED",
  "CLOSED",
] as const;

export type ShipmentIssueType = (typeof SHIPMENT_ISSUE_TYPES)[number];
export type ShipmentIssueResponsibility = (typeof SHIPMENT_ISSUE_RESPONSIBILITIES)[number];
export type ShipmentIssueStatus = (typeof SHIPMENT_ISSUE_STATUSES)[number];

export function isShipmentIssueType(value: unknown): value is ShipmentIssueType {
  return typeof value === "string" && SHIPMENT_ISSUE_TYPES.includes(value as ShipmentIssueType);
}

export function isShipmentIssueResponsibility(value: unknown): value is ShipmentIssueResponsibility {
  return typeof value === "string" && SHIPMENT_ISSUE_RESPONSIBILITIES.includes(value as ShipmentIssueResponsibility);
}

export function isShipmentIssueStatus(value: unknown): value is ShipmentIssueStatus {
  return typeof value === "string" && SHIPMENT_ISSUE_STATUSES.includes(value as ShipmentIssueStatus);
}

export function normalizeIssueText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const normalized = value.trim();
  return normalized || null;
}

export function validateIssueUpdate(input: {
  status?: string;
  responsibility?: string;
  description?: string;
  resolution?: string | null;
  note?: string | null;
}): string | null {
  if (input.status !== undefined && !isShipmentIssueStatus(input.status)) return "Invalid issue status";
  if (input.responsibility !== undefined && !isShipmentIssueResponsibility(input.responsibility)) return "Invalid issue responsibility";
  if (input.description !== undefined && !input.description.trim()) return "Issue description cannot be empty";
  if (input.status === "RESOLVED" && !normalizeIssueText(input.resolution)) return "A resolution is required when resolving an issue";
  if (input.status === "CLOSED" && !normalizeIssueText(input.resolution)) return "A resolution is required when closing an issue";
  return null;
}

function id(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export async function listShipmentIssues() {
  return db.$queryRaw<unknown[]>(Prisma.sql`
    SELECT
      i.id,
      i.shipment_id AS "shipmentId",
      i.type,
      i.description,
      i.responsibility,
      i.status,
      i.resolution,
      i.created_by_email AS "createdByEmail",
      i.resolved_by_email AS "resolvedByEmail",
      i.created_at AS "createdAt",
      i.updated_at AS "updatedAt",
      i.resolved_at AS "resolvedAt",
      s.status AS "shipmentStatus",
      s.tracking_number AS "trackingNumber",
      o.order_number AS "orderNumber"
    FROM shipment_issues i
    JOIN shipments s ON s.id = i.shipment_id
    JOIN orders o ON o.id = s.order_id
    ORDER BY i.created_at DESC
  `);
}

export async function getShipmentIssue(issueId: string) {
  const issues = await db.$queryRaw<unknown[]>(Prisma.sql`
    SELECT
      i.id,
      i.shipment_id AS "shipmentId",
      i.type,
      i.description,
      i.responsibility,
      i.status,
      i.resolution,
      i.created_by_email AS "createdByEmail",
      i.resolved_by_email AS "resolvedByEmail",
      i.created_at AS "createdAt",
      i.updated_at AS "updatedAt",
      i.resolved_at AS "resolvedAt",
      s.status AS "shipmentStatus",
      s.tracking_number AS "trackingNumber",
      o.order_number AS "orderNumber"
    FROM shipment_issues i
    JOIN shipments s ON s.id = i.shipment_id
    JOIN orders o ON o.id = s.order_id
    WHERE i.id = ${issueId}
    LIMIT 1
  `);
  return (issues[0] ?? null) as Record<string, unknown> | null;
}

export async function listShipmentIssueEvents(issueId: string) {
  return db.$queryRaw<unknown[]>(Prisma.sql`
    SELECT
      id,
      admin_email AS "adminEmail",
      from_status AS "fromStatus",
      to_status AS "toStatus",
      responsibility,
      note,
      resolution,
      created_at AS "createdAt"
    FROM shipment_issue_events
    WHERE issue_id = ${issueId}
    ORDER BY created_at DESC
  `);
}

export async function createShipmentIssue(input: {
  shipmentId: string;
  type: ShipmentIssueType;
  description: string;
  responsibility?: ShipmentIssueResponsibility;
  note?: string | null;
  adminEmail?: string | null;
}) {
  const description = input.description.trim();
  if (!description) throw new Error("Issue description cannot be empty");

  const shipment = await db.shipment.findUnique({ where: { id: input.shipmentId }, select: { id: true } });
  if (!shipment) throw new Error("Shipment not found");

  const issueId = id();
  const eventId = id();
  const responsibility = input.responsibility ?? "UNASSIGNED";
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO shipment_issues
        (id, shipment_id, type, description, responsibility, status, created_by_email, created_at, updated_at)
      VALUES
        (${issueId}, ${input.shipmentId}, ${Prisma.raw(`'${input.type}'::"ShipmentIssueType"`)}, ${description}, ${Prisma.raw(`'${responsibility}'::"ShipmentIssueResponsibility"`)}, 'OPEN'::"ShipmentIssueStatus", ${input.adminEmail ?? null}, ${now}, ${now})
    `);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO shipment_issue_events
        (id, issue_id, admin_email, to_status, responsibility, note, created_at)
      VALUES
        (${eventId}, ${issueId}, ${input.adminEmail ?? null}, 'OPEN'::"ShipmentIssueStatus", ${Prisma.raw(`'${responsibility}'::"ShipmentIssueResponsibility"`)}, ${normalizeIssueText(input.note)}, ${now})
    `);
  });

  return getShipmentIssue(issueId);
}

export async function updateShipmentIssue(input: {
  issueId: string;
  status?: ShipmentIssueStatus;
  responsibility?: ShipmentIssueResponsibility;
  description?: string;
  resolution?: string | null;
  note?: string | null;
  adminEmail?: string | null;
}) {
  const current = await getShipmentIssue(input.issueId);
  if (!current) throw new Error("Issue not found");

  const error = validateIssueUpdate(input);
  if (error) throw new Error(error);

  const nextStatus = input.status ?? String(current.status) as ShipmentIssueStatus;
  const nextResponsibility = input.responsibility ?? String(current.responsibility) as ShipmentIssueResponsibility;
  const nextDescription = input.description?.trim() ?? String(current.description);
  const nextResolution = input.resolution === undefined ? (current.resolution as string | null) : normalizeIssueText(input.resolution);
  const statusChanged = input.status !== undefined && input.status !== current.status;
  const responsibilityChanged = input.responsibility !== undefined && input.responsibility !== current.responsibility;
  const meaningfulChange = statusChanged || responsibilityChanged || input.description !== undefined || input.resolution !== undefined || input.note !== undefined;

  if (!meaningfulChange) throw new Error("No issue changes were provided");

  const now = new Date();
  const eventId = id();
  const resolved = nextStatus === "RESOLVED" || nextStatus === "CLOSED";

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE shipment_issues
      SET
        description = ${nextDescription},
        responsibility = ${Prisma.raw(`'${nextResponsibility}'::"ShipmentIssueResponsibility"`)},
        status = ${Prisma.raw(`'${nextStatus}'::"ShipmentIssueStatus"`)},
        resolution = ${nextResolution},
        resolved_by_email = CASE WHEN ${resolved} THEN ${input.adminEmail ?? null} ELSE resolved_by_email END,
        resolved_at = CASE WHEN ${resolved} THEN COALESCE(resolved_at, ${now}) ELSE NULL END,
        updated_at = ${now}
      WHERE id = ${input.issueId}
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO shipment_issue_events
        (id, issue_id, admin_email, from_status, to_status, responsibility, note, resolution, created_at)
      VALUES
        (${eventId}, ${input.issueId}, ${input.adminEmail ?? null}, ${Prisma.raw(`'${String(current.status)}'::"ShipmentIssueStatus"`)}, ${Prisma.raw(`'${nextStatus}'::"ShipmentIssueStatus"`)}, ${Prisma.raw(`'${nextResponsibility}'::"ShipmentIssueResponsibility"`)}, ${normalizeIssueText(input.note)}, ${nextResolution}, ${now})
    `);
  });

  return getShipmentIssue(input.issueId);
}

export function shipmentStatusCanHaveIssue(status: ShipmentStatus): boolean {
  return status !== ShipmentStatus.CANCELLED;
}
