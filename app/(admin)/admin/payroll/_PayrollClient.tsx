"use client";

import { useState, useMemo } from "react";

type Attendance = {
  id: number;
  date: string;
  extraPay: number;
};

type Employee = {
  id: number;
  name: string;
  dailyWage: number;
  role: "STAFF" | "OWNER";
  attendances: Attendance[];
};

interface Props {
  initialEmployees: Employee[];
}

function getThaiMonth(date: Date) {
  return date.toLocaleString("th-TH", { month: "long", year: "numeric" });
}

function isoToDate(iso: string) {
  return new Date(iso);
}

export default function PayrollClient({ initialEmployees }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [extraPayInputs, setExtraPayInputs] = useState<
    Record<string, string>
  >({});
  const [loadingAttend, setLoadingAttend] = useState<number | null>(null);
  const [loadingExtra, setLoadingExtra] = useState<number | null>(null);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  // filter attendances ของเดือนที่เลือก
  function getMonthAttendances(emp: Employee) {
    return emp.attendances.filter((a) => {
      const d = isoToDate(a.date);
      return (
        d.getFullYear() === year && d.getMonth() + 1 === month
      );
    });
  }

  // วันนี้เช้างานแล้วหรือยัง
  function todayKey() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }

  function isCheckedToday(emp: Employee) {
    const tk = todayKey();
    return emp.attendances.some((a) => {
      const d = isoToDate(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return key === tk;
    });
  }

  async function toggleTodayAttendance(emp: Employee) {
    setLoadingAttend(emp.id);
    try {
      if (isCheckedToday(emp)) {
        // ลบการเช็คชื่อวันนี้
        const tk = todayKey();
        const attend = emp.attendances.find((a) => {
          const d = isoToDate(a.date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return key === tk;
        });
        if (!attend) return;
        await fetch(`/api/admin/attendance/${attend.id}`, {
          method: "DELETE",
        });
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === emp.id
              ? {
                  ...e,
                  attendances: e.attendances.filter((a) => a.id !== attend.id),
                }
              : e
          )
        );
      } else {
        // เพิ่มการเช็คชื่อวันนี้
        const res = await fetch("/api/admin/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: emp.id }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === emp.id
              ? { ...e, attendances: [data, ...e.attendances] }
              : e
          )
        );
      }
    } catch {
      alert("ไม่สามารถบันทึกการเข้างานได้");
    } finally {
      setLoadingAttend(null);
    }
  }

  async function addExtraPay(emp: Employee) {
    const key = `${emp.id}`;
    const amount = Number(extraPayInputs[key] ?? 0);
    if (Number.isNaN(amount) || amount <= 0) {
      alert("กรุณากรอกจำนวนเงินพิเศษให้ถูกต้อง");
      return;
    }
    setLoadingExtra(emp.id);
    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: emp.id,
          extraPay: amount,
          isExtraOnly: true,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === emp.id
            ? { ...e, attendances: [data, ...e.attendances] }
            : e
        )
      );
      setExtraPayInputs((p) => ({ ...p, [key]: "" }));
    } catch {
      alert("ไม่สามารถบันทึกเงินพิเศษได้");
    } finally {
      setLoadingExtra(null);
    }
  }

  // คำนวณสรุปรายเดือน
  const summaries = useMemo(() => {
    return employees.map((emp) => {
      const atts = getMonthAttendances(emp);
      const workDays = atts.filter((a) => !("isExtraOnly" in a)).length;
      const totalExtra = atts.reduce((sum, a) => sum + (a.extraPay ?? 0), 0);
      const totalWage = workDays * emp.dailyWage + totalExtra;
      return { emp, atts, workDays, totalExtra, totalWage };
    });
  }, [employees, year, month]);

  function exportCSV() {
    const rows = [
      ["ชื่อพนักงาน", "วันทำงาน", "ค่าแรงรายวัน", "รวมค่าแรง", "เงินพิเศษ", "รวมทั้งสิ้น"],
      ...summaries.map(({ emp, workDays, totalExtra, totalWage }) => [
        emp.name,
        workDays,
        emp.dailyWage,
        workDays * emp.dailyWage,
        totalExtra,
        totalWage,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `เงินเดือน_${monthKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const thMonths = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
  ];

  return (
    <div className="space-y-6">
      {/* ตัวเลือกเดือน/ปี + ส่วนเช็คชื่อวันนี้ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">เดือน</label>
            <select
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-800"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {thMonths.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">ปี</label>
            <select
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-800"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(
                (y) => (
                  <option key={y} value={y}>
                    {y + 543}
                  </option>
                )
              )}
            </select>
          </div>
          <button
            onClick={exportCSV}
            className="ml-auto px-4 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 shadow-sm transition-colors"
          >
            Export CSV
          </button>
        </div>

        {/* เช็คชื่อวันนี้ */}
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          เช็คชื่อเข้างานวันนี้ (
          {new Date().toLocaleDateString("th-TH", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          )
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {employees.map((emp) => {
            const checked = isCheckedToday(emp);
            return (
              <button
                key={emp.id}
                disabled={loadingAttend === emp.id}
                onClick={() => toggleTodayAttendance(emp)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  checked
                    ? "border-green-400 bg-green-50 shadow-sm"
                    : "border-gray-100 bg-white hover:border-orange-200 hover:shadow-md shadow-sm"
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {emp.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ฿{emp.dailyWage.toFixed(0)} / วัน
                  </div>
                </div>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    checked
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {checked ? "✓" : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* สรุปรายเดือน */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            สรุปเงินเดือน {thMonths[month - 1]} {year + 543}
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {summaries.map(({ emp, atts, workDays, totalExtra, totalWage }) => (
            <div key={emp.id} className="px-4 md:px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm md:text-base">
                      {emp.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        emp.role === "OWNER"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {emp.role === "OWNER" ? "เจ้าของร้าน" : "พนักงาน"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>วันทำงาน {workDays} วัน</span>
                    <span>ค่าแรง ฿{(workDays * emp.dailyWage).toFixed(0)}</span>
                    <span>เงินพิเศษ ฿{totalExtra.toFixed(0)}</span>
                    <span className="font-semibold text-gray-800">
                      รวม ฿{totalWage.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* เพิ่มเงินพิเศษ */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step="1"
                    placeholder="เงินพิเศษ ฿"
                    className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-800"
                    value={extraPayInputs[String(emp.id)] ?? ""}
                    onChange={(e) =>
                      setExtraPayInputs((p) => ({
                        ...p,
                        [String(emp.id)]: e.target.value,
                      }))
                    }
                  />
                  <button
                    disabled={loadingExtra === emp.id}
                    onClick={() => addExtraPay(emp)}
                    className="px-2 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white text-xs disabled:opacity-60 shadow-sm"
                  >
                    + เพิ่ม
                  </button>
                </div>
              </div>

              {/* รายการเข้างานในเดือน */}
              {atts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {atts.map((a) => (
                    <span
                      key={a.id}
                      className="text-[11px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600"
                    >
                      {new Date(a.date).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                      })}
                      {a.extraPay > 0 && (
                        <span className="text-green-600 ml-1">
                          +฿{a.extraPay.toFixed(0)}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ยอดรวมทั้งร้าน */}
        <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            รวมทั้งร้าน
          </span>
          <span className="text-base font-bold text-gray-900">
            ฿
            {summaries
              .reduce((sum, s) => sum + s.totalWage, 0)
              .toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}
