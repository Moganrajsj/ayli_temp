import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerCartCount } from "@/lib/cart";

export async function GET() {
  const session = await auth();
  const count = session?.user?.id ? await getServerCartCount(session.user.id) : 0;
  return NextResponse.json({ count });
}