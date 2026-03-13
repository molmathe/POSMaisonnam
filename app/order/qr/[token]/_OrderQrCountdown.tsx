"use client";

import { useState, useEffect } from "react";

export default function OrderQrCountdown({ expiresAt }: { expiresAt: string | null }) {
  const [left, setLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setLeft(null);
      return;
    }
    const run = () => {
      const end = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      if (diff <= 0) {
        setLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setLeft({ hours, minutes, seconds });
    };
    run();
    const t = setInterval(run, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (left === null) return null;

  const isExpired = left.hours === 0 && left.minutes === 0 && left.seconds === 0;
  const parts: string[] = [];
  if (left.hours > 0) parts.push(`${left.hours} ชม.`);
  parts.push(`${left.minutes} นาที`);
  parts.push(`${left.seconds} วินาที`);

  return (
    <p className={`text-xs text-center mt-4 ${isExpired ? "text-amber-600 font-medium" : "text-gray-500"}`}>
      {isExpired ? "รหัสหมดอายุแล้ว" : `หมดอายุในอีก ${parts.join(" ")}`}
    </p>
  );
}
