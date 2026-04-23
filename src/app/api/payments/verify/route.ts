import { NextResponse } from "next/server";

// TODO: Implement payment verification logic here later
export async function POST(req: Request) {
  return NextResponse.json(
    { error: "Payment verification not yet implemented" },
    { status: 501 }
  );
}
