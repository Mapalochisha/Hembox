export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Delete related records first
    await db.wishlistItem.deleteMany({ where: { customerId: params.id } });
    await db.review.deleteMany({ where: { customerId: params.id } });
    await db.address.deleteMany({ where: { customerId: params.id } });
    await db.cart.deleteMany({ where: { customerId: params.id } });

    // Nullify orders instead of deleting them — preserve order history
    await db.order.updateMany({
      where: { customerId: params.id },
      data: { customerId: null },
    });

    await db.customer.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete customer." }, { status: 500 });
  }
}