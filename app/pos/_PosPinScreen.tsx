"use client";

import { useState, useRef, useEffect } from "react";

type PosSettings = {
  posPincode: string;
  ownerPincode: string | null;
  paymentQrUrl: string;
} | null;

export default function PosPinScreen({
  settings,
  onSuccess,
  onLoadSettings,
}: {
  settings: PosSettings;
  onSuccess: (isOwner: boolean) => void;
  onLoadSettings: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const p = pin.trim();
    if (!p) {
      setError("กรุณาใส่รหัสผ่าน");
      return;
    }
    if (!settings) {
      setError("กำลังโหลด...");
      onLoadSettings();
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (settings.ownerPincode && p === settings.ownerPincode) {
        onSuccess(true);
        return;
      }
      if (p === settings.posPincode) {
        onSuccess(false);
        return;
      }
      setError("รหัสผ่านไม่ถูกต้อง");
      setPin("");
      setLoading(false);
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-xs text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          ไม้ซ่อนน้ำ
        </h1>
        <p className="text-gray-500 text-sm mb-8">ใส่รหัสผ่านเพื่อเข้าใช้งาน POS</p>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={8}
          autoComplete="off"
          className="w-full text-center text-2xl font-mono tracking-[0.5em] rounded-xl border-2 border-gray-200 py-4 px-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all"
          placeholder="••••"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={loading || !pin}
          className="mt-6 w-full py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}
