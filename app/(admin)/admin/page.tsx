export default function AdminDashboard() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          ยินดีต้อนรับสู่ระบบหลังบ้าน
        </h2>
        <p className="text-gray-500 mt-1">
          ภาพรวมยอดขายและการจัดการร้าน "ไม้ซ่อนน้ำ"
        </p>
      </header>

      {/* กล่องข้อมูลสรุปแบบมินิมอล */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-green-200 transition-colors">
          <h3 className="text-sm font-medium text-gray-500">ยอดขายวันนี้</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">฿0.00</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-orange-200 transition-colors">
          <h3 className="text-sm font-medium text-gray-500">ออเดอร์ทั้งหมด</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-gray-300 transition-colors">
          <h3 className="text-sm font-medium text-gray-500">โต๊ะที่ว่าง</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">-</p>
        </div>
      </div>
    </div>
  );
}

