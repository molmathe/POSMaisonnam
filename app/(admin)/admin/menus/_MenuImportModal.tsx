"use client";

import { useRef, useState, useCallback } from "react";

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

interface Props {
  onClose: () => void;
  onDone: () => void;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = (values[i] ?? "").trim(); });
    return row;
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { result.push(cur); cur = ""; }
      else { cur += ch; }
    }
  }
  result.push(cur);
  return result;
}

export default function MenuImportModal({ onClose, onDone }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const header = "nameTh,nameEn,price,cost,category,imageUrl,toppings,specialRequests";
    const example = "ข้าวผัดกุ้ง,Fried Rice with Shrimp,120,45,จานหลัก,,ไข่ดาว|เพิ่มหมู,ไม่พริก|เผ็ดน้อย";
    const csv = `${header}\n${example}`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "menu-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(f, "utf-8");
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) handleFile(f);
    else setError("กรุณาอัปโหลดไฟล์ .csv เท่านั้น");
  }, [handleFile]);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      // Convert numeric fields
      const payload = rows.map((r) => ({
        nameTh: r.nameTh,
        nameEn: r.nameEn || undefined,
        price: Number(r.price),
        cost: r.cost ? Number(r.cost) : undefined,
        category: r.category,
        imageUrl: r.imageUrl || undefined,
        toppings: r.toppings || undefined,
        specialRequests: r.specialRequests || undefined,
      }));

      const res = await fetch("/api/admin/menus/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "เกิดข้อผิดพลาด"); return; }
      setResult(data);
    } catch {
      setError("ไม่สามารถอ่านไฟล์ได้");
    } finally {
      setLoading(false);
    }
  }

  const COLUMNS = ["nameTh", "nameEn", "price", "category", "toppings", "specialRequests"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">นำเข้าเมนู (Import)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Download template */}
          <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-orange-800">ดาวน์โหลด Template</p>
              <p className="text-xs text-orange-600 mt-0.5">ใช้ไฟล์นี้เป็นตัวอย่างโครงสร้าง CSV สำหรับนำเข้า</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              ดาวน์โหลด
            </button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none ${
              dragging ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <div className="text-4xl mb-2">📂</div>
            {file ? (
              <p className="text-sm font-medium text-gray-700">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-600">ลากไฟล์ CSV มาวางที่นี่</p>
                <p className="text-xs text-gray-400 mt-1">หรือคลิกเพื่อเลือกไฟล์</p>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && !result && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">ตัวอย่างข้อมูล (5 แถวแรก)</p>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="text-xs w-full">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      {COLUMNS.map((c) => (
                        <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {COLUMNS.map((c) => (
                          <td key={c} className="px-3 py-2 text-gray-700 max-w-[120px] truncate" title={row[c]}>
                            {row[c] || <span className="text-gray-300">-</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.created}</p>
                  <p className="text-xs text-green-700 mt-0.5">เมนูที่นำเข้าสำเร็จ</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{result.skipped}</p>
                  <p className="text-xs text-red-600 mt-0.5">แถวที่ข้าม</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-xs font-medium text-yellow-800 mb-1">รายละเอียด</p>
                  <ul className="space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-yellow-700">• {e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          {result ? (
            <button
              onClick={onDone}
              className="px-5 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              เสร็จสิ้น — รีเฟรชรายการ
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700">
                ยกเลิก
              </button>
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="px-5 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "กำลังนำเข้า..." : "นำเข้าเมนู"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
