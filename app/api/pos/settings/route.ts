import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: ["POS_PINCODE", "PAYMENT_QR_IMAGE"],
      },
    },
  });
  const owner = await prisma.employee.findFirst({
    where: { role: "OWNER", pinCode: { not: null } },
    select: { pinCode: true },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json({
    posPincode: map.POS_PINCODE || "1234",
    ownerPincode: owner?.pinCode || null,
    paymentQrUrl: map.PAYMENT_QR_IMAGE || "",
  });
}
