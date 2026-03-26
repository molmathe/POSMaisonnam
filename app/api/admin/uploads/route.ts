import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "ไม่พบไฟล์ที่อัปโหลด" },
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

    const url = `/uploads/${fileName}`;

    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "อัปโหลดไฟล์ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

