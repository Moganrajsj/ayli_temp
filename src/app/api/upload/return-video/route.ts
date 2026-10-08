import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const UPLOADS_VIDEO_DIR = path.join(process.cwd(), "public", "uploads", "videos");
const UPLOADS_VIDEO_PREFIX = "/uploads/videos";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to upload your unboxing video." },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read uploaded video." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No video file provided." }, { status: 400 });
  }

  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: "Only MP4, WebM or MOV video formats are supported." },
      { status: 400 }
    );
  }

  if (file.size <= 0) {
    return NextResponse.json({ ok: false, error: "The uploaded video file is empty." }, { status: 400 });
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ ok: false, error: "Video file must be 50 MB or smaller." }, { status: 400 });
  }

  try {
    await mkdir(UPLOADS_VIDEO_DIR, { recursive: true });
    const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOADS_VIDEO_DIR, filename), bytes);

    return NextResponse.json({
      ok: true,
      url: `${UPLOADS_VIDEO_PREFIX}/${filename}`,
      size: bytes.length,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save the video file." }, { status: 500 });
  }
}
