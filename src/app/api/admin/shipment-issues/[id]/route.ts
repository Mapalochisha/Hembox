import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import {
  getShipmentIssue,
  isShipmentIssueResponsibility,
  isShipmentIssueStatus,
  listShipmentIssueEvents,
  updateShipmentIssue,
} from "@/lib/shipments/issues";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.string().refine(isShipmentIssueStatus, "Invalid issue status").optional(),
  responsibility: z.string().refine(isShipmentIssueResponsibility, "Invalid responsibility").optional(),
  description: z.string().trim().min(1).max(10000).optional(),
  resolution: z.string().trim().max(10000).nullable().optional(),
  note: z.string().trim().max(10000).nullable().optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const role = (session.user as { role?: unknown }).role;
  if (!["SUPER_ADMIN", "MANAGER", "STAFF"].includes(String(role))) return { session: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, response: null };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const id = params.id.trim();
  if (!id) return NextResponse.json({ error: "Issue ID is required" }, { status: 400 });

  try {
    const issue = await getShipmentIssue(id);
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    return NextResponse.json({ ...issue, events: await listShipmentIssueEvents(id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load issue" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

  try {
    const issue = await updateShipmentIssue({
      issueId: params.id.trim(),
      ...parsed.data,
      status: parsed.data.status as never,
      responsibility: parsed.data.responsibility as never,
      adminEmail: auth.session?.user?.email ?? null,
    });
    return NextResponse.json({ ...issue, events: await listShipmentIssueEvents(params.id.trim()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update issue";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
