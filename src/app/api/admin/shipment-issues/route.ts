import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import {
  createShipmentIssue,
  isShipmentIssueResponsibility,
  isShipmentIssueType,
  listShipmentIssues,
} from "@/lib/shipments/issues";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  shipmentId: z.string().trim().min(1),
  type: z.string().refine(isShipmentIssueType, "Invalid issue type"),
  description: z.string().trim().min(1).max(10000),
  responsibility: z.string().refine(isShipmentIssueResponsibility, "Invalid responsibility").optional(),
  note: z.string().trim().max(10000).nullable().optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const role = (session.user as { role?: unknown }).role;
  if (!["SUPER_ADMIN", "MANAGER", "STAFF"].includes(String(role))) {
    return { session: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, response: null };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    return NextResponse.json(await listShipmentIssues());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load shipment issues" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const issue = await createShipmentIssue({
      ...parsed.data,
      type: parsed.data.type as never,
      responsibility: parsed.data.responsibility as never,
      adminEmail: auth.session?.user?.email ?? null,
    });
    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create shipment issue" }, { status: 400 });
  }
}
