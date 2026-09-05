import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";

export async function requireShippingAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = (session.user as { role?: unknown }).role;
  if (!isAdminRole(role)) {
    return { session: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (role === "STAFF") {
    return { session: null, response: NextResponse.json({ error: "Shipping configuration requires manager or super-admin access." }, { status: 403 }) };
  }

  return { session, response: null };
}
