import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const fileName = segments.join("/");

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.resolve(uploadsDir, fileName);
  if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  const buffer = await fs.promises.readFile(filePath);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
