"use client";

import { useState, useEffect, useCallback } from "react";
import PosPinScreen from "./_PosPinScreen";
import PosMain from "./_PosMain";
import PosBill from "./_PosBill";
import PosOwnerAttendance from "./_PosOwnerAttendance";

type PosSettings = {
  posPincode: string;
  ownerPincode: string | null;
  paymentQrUrl: string;
};

export default function PosPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [settings, setSettings] = useState<PosSettings | null>(null);
  const [view, setView] = useState<"main" | "bill" | "attendance">("main");
  const [billTableId, setBillTableId] = useState<number | null>(null);
  const [billOrderId, setBillOrderId] = useState<number | null>(null);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/pos/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
    } else {
      setSettings({
        posPincode: "1234",
        ownerPincode: null,
        paymentQrUrl: "",
      });
    }
  }, []);

  useEffect(() => {
    loadSettings();
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("pos_unlocked") : null;
    if (stored === "1") {
      setUnlocked(true);
      const owner = sessionStorage.getItem("pos_owner") === "1";
      setIsOwner(owner);
    }
  }, [loadSettings]);

  const handlePinSuccess = (owner: boolean) => {
    setUnlocked(true);
    setIsOwner(owner);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pos_unlocked", "1");
      sessionStorage.setItem("pos_owner", owner ? "1" : "0");
    }
  };

  const handleLogout = () => {
    setUnlocked(false);
    setIsOwner(false);
    setView("main");
    setBillTableId(null);
    setBillOrderId(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("pos_unlocked");
      sessionStorage.removeItem("pos_owner");
    }
  };

  const openBill = (tableId: number, orderId: number) => {
    setBillTableId(tableId);
    setBillOrderId(orderId);
    setView("bill");
  };

  const closeBill = () => {
    setBillTableId(null);
    setBillOrderId(null);
    setView("main");
  };

  if (!unlocked || !settings) {
    return (
      <PosPinScreen
        settings={settings}
        onSuccess={handlePinSuccess}
        onLoadSettings={loadSettings}
      />
    );
  }

  if (view === "attendance") {
    return (
      <PosOwnerAttendance
        onBack={() => setView("main")}
        onLogout={handleLogout}
      />
    );
  }

  if (view === "bill" && billOrderId !== null) {
    return (
      <PosBill
        orderId={billOrderId}
        paymentQrUrl={settings.paymentQrUrl}
        onClose={closeBill}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <PosMain
      isOwner={isOwner}
      onOpenBill={openBill}
      onOpenAttendance={() => setView("attendance")}
      onLogout={handleLogout}
    />
  );
}
