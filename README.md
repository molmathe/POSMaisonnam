# ไม้ซ่อนน้ำ POS

Point of Sale และระบบจัดการร้านสำหรับ **ไม้ซ่อนน้ำ** — Next.js, Prisma, PostgreSQL

## Tech stack

- **Next.js 16** (App Router)
- **React 19**
- **Prisma** + **PostgreSQL**
- **Tailwind CSS 4**

## Features

- **POS** — รับออเดอร์ เลือกโต๊ะ/ลูกค้า เมนู + Topping + คำขอพิเศษ ชำระเงิน (เงินสด/โอน) พิมพ์ใบเสร็จ
- **Admin** — จัดการเมนู หมวดหมู่ Topping คำขอพิเศษ โต๊ะ ลูกค้า พนักงาน เงินเดือน รายงาน ตั้งค่า ออเดอร์ที่ไม่มีโต๊ะ
- **Order monitor** — จอคิวออเดอร์ส่งครัว ทำแล้ว/เหลือกี่จาน
- **Order QR** — ลูกค้าสแกนดูสถานะออเดอร์ โอนชำระ นับถอยหลัง 24 ชม.
- **Receipts** — ดูและพิมพ์ใบเสร็จ
- **PIN login** — เข้า POS ด้วย PIN (พนักงาน/เจ้าของ)
- **Soft delete เมนู** — ลบเมนูได้แม้มีออเดอร์เก่า (ออเดอร์ยังอ้างอิงชื่อเมนูได้)

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL

### 1. Clone & install

```bash
git clone https://github.com/molmathe/POSMaisonnam.git
cd maisonnam-pos
npm install
```

### 2. Environment

คัดลอกจาก `.env.example` แล้วแก้ค่าใน `.env`:

```bash
cp .env.example .env
```

แก้ใน `.env`:

- **DATABASE_URL** — เชื่อมต่อ PostgreSQL (ต้องมี)
- **NEXT_PUBLIC_APP_URL** — ใน production ใส่ URL จริงที่ลูกค้าเข้าได้ (เช่น `https://pos.yourdomain.com`) เพื่อให้ลิงก์ QR บนใบเสร็จและหน้า Order QR ทำงานถูก

### 3. Database

```bash
npx prisma migrate dev
npm run prisma:seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **POS:** `/pos` (หลังใส่ PIN)
- **Admin:** `/admin`
- **Order monitor:** `/order-monitor`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npx prisma migrate dev` | Run migrations |
| `npm run prisma:seed` | Seed database |

## Production / Real-world use

ฟีเจอร์หลักพร้อมใช้ในร้านจริง (รับออเดอร์ ชำระเงิน ใบเสร็จ ส่งครัว QR ลูกค้า รายงาน) แต่ควรทำดังนี้:

1. **Environment**
   - ตั้ง `NEXT_PUBLIC_APP_URL=https://โดเมนจริง` ใน production เพื่อให้ลิงก์ QR บนใบเสร็จ/ลูกค้าสแกนถูกต้อง
   - คัดลอกจาก `.env.example` ไปเป็น `.env` แล้วใส่ค่าให้ครบ

2. **ความปลอดภัย**
   - **Admin** (`/admin`) ไม่มี login — ควรใช้เฉพาะในเครือข่ายภายในหรือ VPN หรือเพิ่มการยืนยันตัวตน (เช่น middleware / auth) ตามนโยบายร้าน
   - **POS** เข้าด้วย PIN (ตรวจที่ server ที่ `/api/pos/verify-pin`) แต่ API อื่นของ POS ไม่ตรวจ session — เหมาะกับร้านที่ใช้ POS แค่ในร้าน/เครื่องเดียว
   - เปลี่ยนรหัส PIN เริ่มต้น: ไปที่ Admin > ตั้งค่า > POS_PINCODE (และลบค่า default 1234 หลังติดตั้ง)

3. **การพิมพ์**
   - ใบเสร็จและใบสั่งครัวรองรับกระดาษ 58mm / 80mm กำหนดที่ Admin > ตั้งค่า (RECEIPT_WIDTH, ORDER_PAPER_WIDTH)
   - ใบเสร็จใช้ QR จาก api.qrserver.com — ถ้าเน็ตล่มรูป QR อาจไม่โหลด (เนื้อหาใบเสร็จยังพิมพ์ได้)

4. **ข้อมูลและความถูกต้อง**
   - ชำระเงิน: ต้องเลือกวิธีชำระ (เงินสด/โอน) ระบบถึงจะบันทึก
   - หลังชำระจะสร้าง QR ให้ออเดอร์อัตโนมัติ และแสดง/พิมพ์จากค่าที่ server บันทึกแล้ว

## License

Private — ไม้ซ่อนน้ำ
