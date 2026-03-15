/**
 * E2E Test: Customer QR order view
 * Scenarios: M1-M4
 */
import { test, expect } from "@playwright/test";
import { api } from "../helpers/api";

test.describe("Customer QR View — /order/qr/[token]", () => {
  let orderId: number;
  let qrToken: string;
  let tableId: number;
  let menuId: number;

  test.beforeAll(async ({ request }) => {
    const tablesRes = await api.getTables(request);
    const tables = await tablesRes.json();
    tableId = tables.find((t: { name: string }) => t.name === "โต๊ะ 3").id;

    const menusRes = await api.getMenus(request);
    const menus = await menusRes.json();
    menuId = menus.find((m: { nameTh: string }) => m.nameTh === "น้ำเปล่า").id;

    // Clean existing (single object response)
    const existingRes = await api.getOrders(request, tableId);
    if (existingRes.status() === 200) {
      const existing = await existingRes.json();
      const orders = Array.isArray(existing) ? existing : (existing ? [existing] : []);
      for (const o of orders) {
        if (o?.status === "PENDING") await api.deleteOrder(request, o.id);
      }
    }

    // Create order, add item, generate QR token
    const orderRes = await api.createOrder(request, { tableId });
    const order = await orderRes.json();
    orderId = order.id;

    await api.addItem(request, orderId, {
      menuId,
      quantity: 2,
      toppings: [],
      requests: [],
    });

    const qrRes = await api.generateQr(request, orderId);
    const qrData = await qrRes.json();
    // QR endpoint returns { token, url, fullUrl, expiresAt, isNew }
    qrToken = qrData.token;
  });

  test.afterAll(async ({ request }) => {
    if (orderId) await api.deleteOrder(request, orderId);
  });

  test("M1: valid QR link shows order items and total", async ({ page }) => {
    await page.goto(`/order/qr/${qrToken}`);
    await expect(page.getByText("น้ำเปล่า")).toBeVisible({ timeout: 5000 });
    // Total price (฿) should be visible somewhere on the page
    await expect(page.getByText(/฿/).first()).toBeVisible({ timeout: 3000 });
  });

  test("M3: invalid token shows error page", async ({ page }) => {
    await page.goto("/order/qr/this-token-does-not-exist-xyz");
    // Should show 404 or error message
    // Next.js renders a 404 page with heading "404"
    await expect(page.getByRole("heading", { name: /404|ไม่พบ|not found/i })).toBeVisible({ timeout: 5000 });
  });
});
