import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // หมวดหมู่พื้นฐาน
  const categories = await prisma.category.createMany({
    data: [
      { name: "อาหารจานหลัก" },
      { name: "ทานเล่น" },
      { name: "ของหวาน" },
      { name: "น้ำ" },
      { name: "น้ำอัดลม" },
      { name: "ไวน์" },
      { name: "อิตาเลียนโซดา" },
    ],
    skipDuplicates: true,
  });

  const allCategories = await prisma.category.findMany();
  const mainDish = allCategories.find((c) => c.name === "อาหารจานหลัก");
  const drink = allCategories.find((c) => c.name === "น้ำ");

  if (mainDish) {
    await prisma.menu.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nameTh: "สเต๊กหมูพริกไทยดำ",
        nameEn: "Pork Steak Black Pepper",
        price: 159,
        categoryId: mainDish.id,
      },
    });
  }

  if (drink) {
    await prisma.menu.upsert({
      where: { id: 2 },
      update: {},
      create: {
        nameTh: "โค้ก",
        nameEn: "Coke",
        price: 25,
        categoryId: drink.id,
      },
    });
  }

  // Topping พื้นฐาน
  await prisma.topping.createMany({
    data: [
      { name: "ไข่ดาว", price: 10 },
      { name: "ไข่เจียว", price: 10 },
      { name: "เพิ่มหมู", price: 25 },
      { name: "เพิ่มเนื้อ", price: 35 },
    ],
    skipDuplicates: true,
  });

  // คำขอพิเศษพื้นฐาน
  await prisma.specialRequest.createMany({
    data: [
      { name: "ไม่พริก" },
      { name: "เผ็ดน้อย" },
      { name: "เผ็ดกลาง" },
      { name: "เผ็ดมาก" },
      { name: "ไม่ผัก" },
      { name: "ไม่กุ้ง" },
      { name: "ไม่หมู" },
      { name: "ไม่เนื้อสัตว์" },
    ],
    skipDuplicates: true,
  });

  // โต๊ะตัวอย่าง
  await prisma.table.createMany({
    data: [
      { name: "โต๊ะ 1" },
      { name: "โต๊ะ 2" },
      { name: "โต๊ะ 3" },
      { name: "โซนสวน 1" },
    ],
    skipDuplicates: true,
  });

  // เจ้าของร้านตัวอย่าง
  await prisma.employee.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "เจ้าของร้าน",
      dailyWage: 0,
      role: Role.OWNER,
      pinCode: "9999", // สามารถเปลี่ยนได้ภายหลังจากหลังบ้าน
    },
  });

  // ตั้งค่าระบบพื้นฐาน (ตัวอย่าง key)
  await prisma.systemSetting.createMany({
    data: [
      {
        key: "RECEIPT_WIDTH",
        value: "80mm",
        description: "ความกว้างกระดาษใบเสร็จ",
      },
      {
        key: "RECEIPT_HEADER",
        value: "ไม้ซ่อนน้ำ - ใบเสร็จรับเงิน",
        description: "ข้อความหัวใบเสร็จ",
      },
      {
        key: "RECEIPT_FOOTER",
        value: "ขอบคุณที่ใช้บริการ",
        description: "ข้อความท้ายใบเสร็จ",
      },
      {
        key: "PAYMENT_QR_IMAGE",
        value: "",
        description: "URL หรือ path รูปภาพ QR สำหรับชำระเงิน",
      },
      {
        key: "ENABLE_LINE_NOTI",
        value: "false",
        description: "เปิด/ปิดการแจ้งเตือนผ่าน LINE (ยังไม่ใช้งาน)",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

