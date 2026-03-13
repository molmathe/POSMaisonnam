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

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

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

## License

Private — ไม้ซ่อนน้ำ
