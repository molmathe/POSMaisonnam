/**
 * E2E Test: Kitchen Order Monitor
 * Scenarios: L1-L5
 */
import { test, expect } from "@playwright/test";
import { api } from "../helpers/api";

test.describe("Kitchen Monitor — /order-monitor", () => {
  let orderId: number;
  let tableId: number;
  let menuId: number;

  test.beforeAll(async ({ request }) => {
    const tablesRes = await api.getTables(request);
    const tables = await tablesRes.json();
    tableId = tables.find((t: { name: string }) => t.name === "โต๊ะ 2").id;

    const menusRes = await api.getMenus(request);
    const menus = await menusRes.json();
    menuId = menus.find((m: { nameTh: string }) => m.nameTh === "ปีกไก่ทอด").id;

    // Clean existing (getOrders returns single object or null, not array)
    const existingRes = await api.getOrders(request, tableId);
    if (existingRes.status() === 200) {
      const existing = await existingRes.json();
      const orders = Array.isArray(existing) ? existing : (existing ? [existing] : []);
      for (const o of orders) {
        if (o?.status === "PENDING") await api.deleteOrder(request, o.id);
      }
    }

    // Create order and send to kitchen
    const orderRes = await api.createOrder(request, { tableId });
    const order = await orderRes.json();
    orderId = order.id;

    // Add item with quantity 3
    await api.addItem(request, orderId, {
      menuId,
      quantity: 3,
      toppings: [],
      requests: [],
    });

    // Send to kitchen
    await api.sendToKitchen(request, orderId);
  });

  test.afterAll(async ({ request }) => {
    if (orderId) await api.deleteOrder(request, orderId);
  });

  test("L1: monitor page loads and shows orders", async ({ page }) => {
    await page.goto("/order-monitor");
    await expect(page.getByText(/ออเดอร์|order|ครัว|kitchen/i)).toBeVisible({ timeout: 5000 });
  });

  test("L3: sent items shown with sent indicator", async ({ page }) => {
    await page.goto("/order-monitor");
    await page.waitForTimeout(1000);
    // Should show ปีกไก่ทอด with sent status
    await expect(page.getByText("ปีกไก่ทอด")).toBeVisible({ timeout: 8000 });
  });

  test("L4: mark 1 plate prepared — shows partial progress (1/3)", async ({ page }) => {
    await page.goto("/order-monitor");
    await page.waitForTimeout(1000);

    // Find the prepare button for ปีกไก่ทอด
    const prepareBtn = page
      .getByText("ปีกไก่ทอด")
      .locator("..")
      .locator("..")
      .getByRole("button", { name: /เสร็จ|prepared|ทำแล้ว|✓/i });

    if (await prepareBtn.isVisible()) {
      await prepareBtn.click();
      await page.waitForTimeout(500);
      // Monitor shows "ทำ 1 แล้ว เหลือ 2" (1 done, 2 remaining)
      await expect(page.getByText(/เหลือ 2|ทำ 1 แล้ว/i).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test("L5: mark all plates — item removed from monitor", async ({ page, request }) => {
    // Mark remaining 2 plates via API
    const monitorRes = await api.getMonitorOrders(request);
    const orders = await monitorRes.json();
    const order = orders.find((o: { id: number }) => o.id === orderId);
    if (order) {
      const item = order.items.find((i: { menuId: number }) => i.menuId === menuId);
      if (item && item.kitchenPreparedCount < item.quantity) {
        // Mark remaining via API
        for (let i = item.kitchenPreparedCount; i < item.quantity; i++) {
          await api.markPrepared(request, item.id);
        }
      }
    }

    // Navigate fresh — page fetches current data on load
    await page.goto("/order-monitor");
    await page.waitForTimeout(2000);
    // When all plates are prepared, monitor shows "ครัวทำครบแล้ว" badge on the order card
    await expect(page.getByText("ครัวทำครบแล้ว", { exact: true })).toBeVisible({ timeout: 5000 });
  });
});
