import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminRevision } from "@/lib/admin-revision";

// Never cached at the HTTP layer — the client polls this on an interval.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // Authorize from the signed JWT session (no DB read) so polling never opens a
  // MySQL connection just to check the role.
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const revision = await getAdminRevision();
    return NextResponse.json(revision, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("GET /api/admin/revision failed:", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
