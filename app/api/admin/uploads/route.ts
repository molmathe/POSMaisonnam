import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth";

// FIX 4: Allowlist and size limit
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "ไม่พบไฟล์ที่อัปโหลด" },
        { status: 400 }
      );
    }

    // FIX 4: Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "ไฟล์ต้องเป็นรูปภาพเท่านั้น (JPEG, PNG, GIF, WEBP)" },
        { status: 400 }
      );
    }

    // FIX 4: Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "ไฟล์ขนาดใหญ่เกิน 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.promises.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${fileName}` });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "อัปโหลดไฟล์ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
