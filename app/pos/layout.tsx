import "../globals.css";

export const metadata = {
  title: "POS ไม้ซ่อนน้ำ",
  description: "หน้าบ้านรับออเดอร์",
};

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased" lang="th">
      {children}
    </div>
  );
}
