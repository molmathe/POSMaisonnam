import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans p-6">
      <main className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-center">
        <div className="p-8 border-b border-gray-100 bg-orange-50">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            ไม้ซ่อนน้ำ
          </h1>
          <p className="mt-2 text-gray-600 font-medium">
            ระบบจัดการร้านอาหารและจุดขาย (POS)
          </p>
        </div>
        
        <div className="p-8 space-y-4">
          <Link
            href="/pos"
            className="flex items-center justify-center w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 transition-colors text-white font-medium text-lg shadow-sm"
          >
            เข้าสู่ระบบ POS
          </Link>
          
          <Link
            href="/admin"
            className="flex items-center justify-center w-full py-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-orange-300 hover:text-orange-600 transition-all text-gray-700 font-medium text-lg"
          >
            ระบบจัดการหลังบ้าน
          </Link>
        </div>
      </main>
    </div>
  );
}
