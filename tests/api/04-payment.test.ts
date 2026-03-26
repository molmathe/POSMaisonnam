/**
 * API Test: Payment flows (cash and QR) + receipts + reports
 * Scenarios: I1-I4, J1-J3, N1-N4, D1-D3
 */
import { test, expect } from "@playwright/test";
import { api } from "../helpers/api";

const BASE = process.env.BASE_URL ?? "http://localhost:49951";

let cashOrderId: number;
let qrOrderId: number;
let tableId: number;
let table3Id: number;
let menuId: number;
let menuPrice: number;
let qrToken: string;

test.beforeAll(async ({ request }) => {
  const tablesRes = await api.getTables(request);
  const tables = await tablesRes.json();
  tableId = tables.find((t: { name: string }) => t.name === "โต๊ะ 1").id;
  table3Id = tables.find((t: { name: string }) => t.name === "โต๊ะ 3").id;

  // Get any available menu (prefer cheapest for predictable totals)
  const menusRes = await api.getMenus(request);
  const menus = await menusRes.json();
  const cheapest = menus.reduce((a: { price: number }, b: { price: number }) => a.price < b.price ? a : b);
  menuId = cheapest.id;
  menuPrice = cheapest.price;

  // Clean any existing PENDING on test tables (GET?tableId returns single object, not array)
  for (const tid of [tableId, table3Id]) {
    const res = await api.getOrders(request, tid);
    if (res.status() === 200) {
      const existing = await res.json();
      const orders = Array.isArray(existing) ? existing : [existing];
      for (const o of orders) {
        if (o?.status === "PENDING") await api.deleteOrder(request, o.id);
      }
    }
  }

  // Create cash order on table 1 with qty=2
  const cashRes = await api.createOrder(request, { tableId });
  const cashOrder = await cashRes.json();
  cashOrderId = cashOrder.id;
  await api.addItem(request, cashOrderId, { menuId, quantity: 2, toppings: [], requests: [] });

  // Create QR order on table 3 with qty=1
  const qrRes = await api.createOrder(request, { tableId: table3Id });
  const qrOrder = await qrRes.json();
  qrOrderId = qrOrder.id;
  await api.addItem(request, qrOrderId, { menuId, quantity: 1, toppings: [], requests: [] });
});

test.describe("Payment — Cash", () => {
  test("I1: apply discount — totalPrice = (menuPrice*2) - discount", async ({ request }) => {
    const subtotal = menuPrice * 2;
    const discount = 10;
    const expectedTotal = subtotal - discount;
    const cashReceived = Math.ceil(expectedTotal / 10) * 10; // round up to nearest 10
    const changeAmount = cashReceived - expectedTotal;

    const res = await api.payOrder(request, cashOrderId, {
      payMethod: "CASH",
      discount,
      cashReceived,
      changeAmount,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("PAID");
    expect(body.discount).toBe(discount);
    expect(body.totalPrice).toBe(expectedTotal);
    expect(body.payMethod).toBe("CASH");
  });

  test("I2: cashReceived and changeAmount stored on order", async ({ request }) => {
    const res = await api.getOrder(request, cashOrderId);
    const body = await res.json();
    expect(body.cashReceived).toBeGreaterThan(0);
    expect(typeof body.changeAmount).toBe("number");
    expect(body.paidAt).not.toBeNull();
  });

  test("I3: paid order appears in today's receipts", async ({ request }) => {
    const res = await api.getReceipts(request);
    expect(res.status()).toBe(200);
    // Receipts API returns { orders: [...], summary: {...} }
    const body = await res.json();
    const receipts = body.orders ?? body;
    const found = receipts.find((r: { id: number }) => r.id === cashOrderId);
    expect(found).toBeTruthy();
    expect(found.status).toBe("PAID");
  });
});

test.describe("Payment — QR", () => {
  test("J1: generate QR token — returns token and expiry", async ({ request }) => {
    const res = await api.generateQr(request, qrOrderId);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // QR route returns { token, url, fullUrl, expiresAt, isNew }
    expect(body.token).toBeTruthy();
    expect(body.expiresAt).toBeTruthy();
    qrToken = body.token;
  });

  test("J3: customer QR link returns order details — items and totalPrice", async ({ request }) => {
    const res = await api.getOrderByToken(request, qrToken);
    expect(res.status()).toBe(200);
    // QR view returns { tableName, items, totalPrice, expiresAt } — NOT order.status
    const body = await res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.totalPrice).toBeGreaterThan(0);
    expect(body.tableName).toBeTruthy();
  });

  test("J2: pay with QR method", async ({ request }) => {
    const res = await api.payOrder(request, qrOrderId, {
      payMethod: "QR",
      discount: 0,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("PAID");
    expect(body.payMethod).toBe("QR");
  });

  test("M2: QR link still accessible after payment (24h token valid)", async ({ request }) => {
    // QR view works even after payment — token stays valid for 24h
    const res = await api.getOrderByToken(request, qrToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Still shows items and totalPrice (no status in QR view response)
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.totalPrice).toBeGreaterThan(0);
  });

  test("M3: invalid QR token returns 404", async ({ request }) => {
    const res = await api.getOrderByToken(request, "invalid-token-xyz-99999");
    expect(res.status()).toBe(404);
  });
});

test.describe("Receipts — History & Cancellation", () => {
  let cancelOrderId: number;

  test("N1: receipts list shows today's PAID orders", async ({ request }) => {
    const res = await api.getReceipts(request);
    expect(res.status()).toBe(200);
    // Receipts returns { orders: [...PAID...], summary: {...} }
    const body = await res.json();
    const receipts = body.orders ?? body;
    expect(receipts.length).toBeGreaterThanOrEqual(1);
    for (const r of receipts) {
      expect(r.status).toBe("PAID");
    }
  });

  test("N3: cancel a receipt — status becomes CANCELLED", async ({ request }) => {
    const tablesRes = await api.getTables(request);
    const tables = await tablesRes.json();
    const t = tables.find((x: { name: string }) => x.name === "โซนสวน 1");
    const menusRes = await api.getMenus(request);
    const menus = await menusRes.json();
    const m = menus[0];

    // Clean existing PENDING on this table
    const ordersRes = await api.getOrders(request, t.id);
    if (ordersRes.status() === 200) {
      const existing = await ordersRes.json();
      const orders = Array.isArray(existing) ? existing : (existing ? [existing] : []);
      for (const o of orders) {
        if (o?.status === "PENDING") await api.deleteOrder(request, o.id);
      }
    }

    // Create, add item, pay
    const createRes = await api.createOrder(request, { tableId: t.id });
    const created = await createRes.json();
    cancelOrderId = created.id;
    await api.addItem(request, cancelOrderId, { menuId: m.id, quantity: 1, toppings: [], requests: [] });
    await api.payOrder(request, cancelOrderId, {
      payMethod: "CASH",
      discount: 0,
      cashReceived: m.price,
      changeAmount: 0,
    });

    // Cancel via DELETE /api/pos/receipts/{id} — sets status to CANCELLED
    const cancelRes = await request.delete(`${BASE}/api/pos/receipts/${cancelOrderId}`);
    expect(cancelRes.status()).toBe(200);
    const body = await cancelRes.json();
    expect(body.status).toBe("CANCELLED");
  });

  test("N4: cancelled receipt no longer in active receipts list", async ({ request }) => {
    const res = await api.getReceipts(request);
    const body = await res.json();
    const receipts = body.orders ?? body;
    const found = receipts.find((r: { id: number }) => r.id === cancelOrderId);
    expect(found).toBeUndefined();
  });
});

test.describe("Daily Reports", () => {
  test("D1: daily report for today returns { orders, summary } with sumTotal etc.", async ({ request }) => {
    const res = await api.getDailyReport(request);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // API returns { orders: [...], summary: { sumTotal, sumDiscount, sumCash, sumQr } }
    expect(body).toHaveProperty("orders");
    expect(body).toHaveProperty("summary");
    expect(body.summary).toHaveProperty("sumTotal");
    expect(body.summary).toHaveProperty("sumCash");
    expect(body.summary).toHaveProperty("sumQr");
  });

  test("D2: sumCash + sumQr = sumTotal", async ({ request }) => {
    const res = await api.getDailyReport(request);
    const body = await res.json();
    const computed = body.summary.sumCash + body.summary.sumQr;
    expect(Math.abs(computed - body.summary.sumTotal)).toBeLessThan(0.01);
  });

  test("D3: orders in report include discount field", async ({ request }) => {
    const res = await api.getDailyReport(request);
    const body = await res.json();
    if (body.orders.length > 0) {
      expect(body.orders[0]).toHaveProperty("discount");
    }
  });
});
