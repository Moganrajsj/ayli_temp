import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { saveUploadedImage, validateImageFile } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "You are not authorized to upload images." },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read the upload." }, { status: 400 });
  }

  const entries = formData.getAll("files").filter((v): v is File => v instanceof File);
  if (entries.length === 0) {
    return NextResponse.json({ ok: false, error: "No image files provided." }, { status: 400 });
  }

  const files: Array<{ url: string }> = [];
  const errors: string[] = [];

  for (const file of entries) {
    const validationError = validateImageFile(file);
    if (validationError) {
      errors.push(`${file.name}: ${validationError}`);
      continue;
    }
    try {
      const saved = await saveUploadedImage(file);
      files.push({ url: saved.url });
    } catch {
      errors.push(`${file.name}: could not save the image.`);
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: errors.join(" ") }, { status: 400 });
  }

  return NextResponse.json({ ok: true, files, ...(errors.length ? { errors } : {}) });
}