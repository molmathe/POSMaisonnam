"use client";

import { useState, useEffect, useCallback } from "react";
import PosPinScreen from "./_PosPinScreen";
import PosMain from "./_PosMain";
import PosBill from "./_PosBill";
import PosOwnerAttendance from "./_PosOwnerAttendance";
import PosOrders from "./_PosOrders";
import PosReceiptsTab from "./_PosReceiptsTab";

type PosSettings = { paymentQrUrl: string; receiptWidth?: string; orderPaperWidth?: string };
type Tab = "menu" | "orders" | "receipts";

export default function PosPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [paymentQrUrl, setPaymentQrUrl] = useState("");
  const [receiptWidth, setReceiptWidth] = useState<"58mm" | "80mm">("80mm");
  const [orderPaperWidth, setOrderPaperWidth] = useState<"58mm" | "80mm">("80mm");
  const [view, setView] = useState<"main" | "bill" | "attendance">("main");
  const [tab, setTab] = useState<Tab>("menu");
  const [billOrderId, setBillOrderId] = useState<number | null>(null);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/pos/settings");
    if (res.ok) {
      const d: PosSettings = await res.json();
      setPaymentQrUrl(d.paymentQrUrl ?? "");
      setReceiptWidth((d.receiptWidth === "58mm" || d.receiptWidth === "80mm") ? d.receiptWidth : "80mm");
      setOrderPaperWidth((d.orderPaperWidth === "58mm" || d.orderPaperWidth === "80mm") ? d.orderPaperWidth : "80mm");
    }
  }, []);

  useEffect(() => {
    loadSettings();
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("pos_unlocked") === "1") {
        setUnlocked(true);
        setIsOwner(sessionStorage.getItem("pos_owner") === "1");
        setEmployeeName(sessionStorage.getItem("pos_employee") || null);
      }
    }
  }, [loadSettings]);

  const handlePinSuccess = (owner: boolean, name: string | null) => {
    setUnlocked(true);
    setIsOwner(owner);
    setEmployeeName(name);
    loadSettings();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pos_unlocked", "1");
      sessionStorage.setItem("pos_owner", owner ? "1" : "0");
      sessionStorage.setItem("pos_employee", name ?? "");
    }
  };

  const handleLogout = () => {
    setUnlocked(false);
    setIsOwner(false);
    setEmployeeName(null);
    setView("main");
    setTab("menu");
    setBillOrderId(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("pos_unlocked");
      sessionStorage.removeItem("pos_owner");
      sessionStorage.removeItem("pos_employee");
    }
  };

  const openBill = (_tableId: number, orderId: number) => {
    setBillOrderId(orderId);
    setView("bill");
  };

  const closeBill = () => {
    setBillOrderId(null);
    setView("main");
  };

  if (!unlocked) {
    return <PosPinScreen onSuccess={handlePinSuccess} />;
  }

  if (view === "attendance") {
    return <PosOwnerAttendance onBack={() => setView("main")} onLogout={handleLogout} />;
  }

  if (view === "bill" && billOrderId !== null) {
    return (
      <PosBill
        orderId={billOrderId}
        paymentQrUrl={paymentQrUrl}
        employeeName={employeeName}
        receiptWidth={receiptWidth}
        orderPaperWidth={orderPaperWidth}
        onClose={closeBill}
        onLogout={handleLogout}
      />
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "menu", label: "เมนู", icon: "🍽" },
    { key: "orders", label: "ออเดอร์", icon: "📋" },
    { key: "receipts", label: "บิล", icon: "🧾" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col pb-16 overflow-hidden">
        {tab === "menu" && (
          <PosMain
            isOwner={isOwner}
            employeeName={employeeName}
            onOpenBill={openBill}
            onOpenAttendance={() => setView("attendance")}
            onLogout={handleLogout}
          />
        )}
        {tab === "orders" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900">ออเดอร์ที่เปิดอยู่</span>
                {employeeName && <span className="ml-2 text-sm text-orange-500">{employeeName}</span>}
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <button type="button" onClick={() => setView("attendance")}
                    className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-sm font-medium">
                    เช็คชื่อ
                  </button>
                )}
                <button type="button" onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-100 text-sm font-medium">
                  ออก
                </button>
              </div>
            </header>
            <PosOrders onOpenBill={openBill} />
          </div>
        )}
        {tab === "receipts" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900">ประวัติบิล</span>
                {employeeName && <span className="ml-2 text-sm text-orange-500">{employeeName}</span>}
              </div>
              <button type="button" onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-100 text-sm font-medium">
                ออก
              </button>
            </header>
            <PosReceiptsTab receiptWidth={receiptWidth} />
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex h-16">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
              tab === t.key ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
            }`}>
            <span className="text-xl leading-none">{t.icon}</span>
            <span className="text-[11px] font-medium">{t.label}</span>
            {tab === t.key && <span className="absolute bottom-0 w-12 h-0.5 bg-orange-500 rounded-full" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
