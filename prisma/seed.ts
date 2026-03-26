import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertMenuByName(data: {
  nameTh: string;
  nameEn?: string;
  price: number;
  categoryId: number;
  deletedAt?: Date;
}) {
  const existing = await prisma.menu.findFirst({ where: { nameTh: data.nameTh } });
  if (existing) return existing;
  return prisma.menu.create({ data });
}

async function main() {
  console.log("🌱 Seeding database...");

  // ========== หมวดหมู่ ==========
  await prisma.category.createMany({
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
  const catMap = Object.fromEntries(allCategories.map((c) => [c.name, c.id]));

  // ========== Toppings ==========
  await prisma.topping.createMany({
    data: [
      { name: "ไข่ดาว", price: 10, group: "ไข่" },
      { name: "ไข่เจียว", price: 10, group: "ไข่" },
      { name: "เพิ่มหมู", price: 25 },
      { name: "เพิ่มเนื้อ", price: 35 },
      { name: "พิเศษ", price: 20 },
    ],
    skipDuplicates: true,
  });

  const allToppings = await prisma.topping.findMany();
  const toppingMap = Object.fromEntries(allToppings.map((t) => [t.name, t.id]));

  // ========== Special Requests ==========
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

  const allRequests = await prisma.specialRequest.findMany();
  const requestMap = Object.fromEntries(allRequests.map((r) => [r.name, r.id]));

  // ========== Menus — upsert by nameTh ==========
  const categoryId = catMap["อาหารจานหลัก"];
  const drinkCatId = catMap["น้ำ"] ?? catMap["น้ำอัดลม"] ?? categoryId;
  const snackCatId = catMap["ทานเล่น"] ?? categoryId;
  const dessertCatId = catMap["ของหวาน"] ?? categoryId;

  const steak = await upsertMenuByName({ nameTh: "สเต๊กหมูพริกไทยดำ", nameEn: "Pork Steak Black Pepper", price: 159, categoryId });
  const friedRice = await upsertMenuByName({ nameTh: "ข้าวผัดหมู", nameEn: "Fried Rice Pork", price: 69, categoryId });
  const wings = await upsertMenuByName({ nameTh: "ปีกไก่ทอด", nameEn: "Fried Chicken Wings", price: 89, categoryId: snackCatId });
  const coke = await upsertMenuByName({ nameTh: "โค้ก", nameEn: "Coke", price: 25, categoryId: catMap["น้ำอัดลม"] ?? drinkCatId });
  const water = await upsertMenuByName({ nameTh: "น้ำเปล่า", nameEn: "Water", price: 15, categoryId: drinkCatId });
  void dessertCatId; // reserved for future use

  // ========== Menu-Topping associations ==========
  await prisma.menuTopping.createMany({
    data: [
      { menuId: steak.id, toppingId: toppingMap["ไข่ดาว"] },
      { menuId: steak.id, toppingId: toppingMap["ไข่เจียว"] },
      { menuId: steak.id, toppingId: toppingMap["เพิ่มหมู"] },
      { menuId: steak.id, toppingId: toppingMap["พิเศษ"] },
      { menuId: friedRice.id, toppingId: toppingMap["ไข่ดาว"] },
      { menuId: friedRice.id, toppingId: toppingMap["เพิ่มหมู"] },
    ],
    skipDuplicates: true,
  });

  // ========== Menu-Request associations ==========
  await prisma.menuSpecialRequest.createMany({
    data: [
      { menuId: steak.id, specialRequestId: requestMap["ไม่พริก"] },
      { menuId: steak.id, specialRequestId: requestMap["เผ็ดน้อย"] },
      { menuId: steak.id, specialRequestId: requestMap["เผ็ดมาก"] },
      { menuId: friedRice.id, specialRequestId: requestMap["ไม่พริก"] },
      { menuId: friedRice.id, specialRequestId: requestMap["เผ็ดน้อย"] },
      { menuId: friedRice.id, specialRequestId: requestMap["ไม่ผัก"] },
      { menuId: wings.id, specialRequestId: requestMap["ไม่พริก"] },
    ],
    skipDuplicates: true,
  });

  // ========== Tables ==========
  await prisma.table.createMany({
    data: [
      { name: "โต๊ะ 1" },
      { name: "โต๊ะ 2" },
      { name: "โต๊ะ 3" },
      { name: "โซนสวน 1" },
    ],
    skipDuplicates: true,
  });

  // ========== Customers ==========
  await prisma.customer.createMany({
    data: [
      { name: "ลูกค้าทั่วไป" },
      { name: "คุณสมชาย" },
      { name: "คุณสมหญิง" },
    ],
    skipDuplicates: true,
  });

  // ========== Employees — upsert by pinCode (unique field) ==========
  // เจ้าของร้านทดสอบ PIN: 9999
  await prisma.employee.upsert({
    where: { pinCode: "9999" },
    update: { name: "เจ้าของร้าน (ทดสอบ)", role: Role.OWNER },
    create: { name: "เจ้าของร้าน (ทดสอบ)", dailyWage: 0, role: Role.OWNER, pinCode: "9999" },
  });

  // พนักงานทดสอบ PIN: 1111 — set via Prisma directly (bypasses API restriction)
  await prisma.employee.upsert({
    where: { pinCode: "1111" },
    update: { name: "พนักงานทดสอบ PIN1111" },
    create: { name: "พนักงานทดสอบ PIN1111", dailyWage: 350, role: Role.STAFF, pinCode: "1111" },
  });

  // ========== System Settings ==========
  await prisma.systemSetting.createMany({
    data: [
      { key: "RECEIPT_WIDTH", value: "80mm", description: "ความกว้างกระดาษใบเสร็จ" },
      { key: "RECEIPT_HEADER", value: "ไม้ซ่อนน้ำ - ใบเสร็จรับเงิน", description: "ข้อความหัวใบเสร็จ" },
      { key: "RECEIPT_FOOTER", value: "ขอบคุณที่ใช้บริการ", description: "ข้อความท้ายใบเสร็จ" },
      { key: "PAYMENT_QR_IMAGE", value: "", description: "URL หรือ path รูปภาพ QR สำหรับชำระเงิน" },
      { key: "ENABLE_LINE_NOTI", value: "false", description: "เปิด/ปิดการแจ้งเตือนผ่าน LINE" },
      { key: "POS_PINCODE", value: "0000", description: "รหัส PIN สำรองสำหรับเข้าใช้ POS" },
    ],
    skipDuplicates: true,
  });

  // Ensure POS_PINCODE is 0000
  await prisma.systemSetting.upsert({
    where: { key: "POS_PINCODE" },
    update: { value: "0000" },
    create: { key: "POS_PINCODE", value: "0000", description: "รหัส PIN สำรองสำหรับเข้าใช้ POS" },
  });

  console.log("✅ Seed complete!");
  console.log(`   Menus: สเต๊กหมู(id=${steak.id}), ข้าวผัดหมู(id=${friedRice.id}), ปีกไก่ทอด(id=${wings.id}), โค้ก(id=${coke.id}), น้ำเปล่า(id=${water.id})`);
  console.log("   PINs: เจ้าของร้าน(ทดสอบ)=9999 | พนักงานทดสอบ=1111 | POS fallback=0000");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
