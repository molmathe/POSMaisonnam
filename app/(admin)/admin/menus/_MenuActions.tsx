"use client";

import { useState } from "react";
import MenuImportModal from "./_MenuImportModal";

export default function MenuActions() {
  const [showImport, setShowImport] = useState(false);

  function handleExport() {
    window.location.href = "/api/admin/menus/export";
  }

  function handleDone() {
    setShowImport(false);
    window.location.reload();
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 text-sm text-orange-600 hover:bg-orange-50 font-medium transition-colors"
        >
          <span>📥</span> นำเข้า
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
        >
          <span>📤</span> ส่งออก
        </button>
      </div>

      {showImport && (
        <MenuImportModal onClose={() => setShowImport(false)} onDone={handleDone} />
      )}
    </>
  );
}
