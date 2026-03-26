import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          // FIX 1d: NEVER include POS_PINCODE or OWNER pin — PINs must not be sent to the client
          in: ["PAYMENT_QR_IMAGE", "RECEIPT_WIDTH", "ORDER_PAPER_WIDTH"],
        },
      },
    });

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const receiptWidth = map.RECEIPT_WIDTH === "58mm" || map.RECEIPT_WIDTH === "80mm" ? map.RECEIPT_WIDTH : "80mm";
    const orderPaperWidth = map.ORDER_PAPER_WIDTH === "58mm" || map.ORDER_PAPER_WIDTH === "80mm" ? map.ORDER_PAPER_WIDTH : "80mm";
    return NextResponse.json({
      paymentQrUrl: map.PAYMENT_QR_IMAGE || "",
      receiptWidth,
      orderPaperWidth,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
