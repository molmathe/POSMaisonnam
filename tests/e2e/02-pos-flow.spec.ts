/**
 * E2E Test: POS flow — login, ordering, kitchen, payment
 * Scenarios: F1-F4, G1-G7, H1-H4, I1-I3, J1-J2
 */
import { test, expect, Page } from "@playwright/test";
import { api } from "../helpers/api";

async function loginWithPin(page: Page, pin: string) {
  await page.goto("/pos");
  // If already logged in, no PIN screen shown
  const pinInput = page.getByRole("textbox");
  if (await pinInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pinInput.fill(pin);
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await page.waitForTimeout(500);
  }
}

async function selectTable(page: Page, tableName: string) {
  // Click "เลือกโต๊ะ" button to open table picker
  await page.getByRole("button", { name: /เลือกโต๊ะ/i }).click();
  // Pick the table from the modal/dropdown
  await page.getByText(tableName, { exact: true }).click();
  await page.waitForTimeout(300);
}

test.describe("POS — Authentication", () => {
  test("F1: staff PIN 1111 logs in successfully", async ({ page }) => {
    await page.goto("/pos");
    const pinInput = page.getByRole("textbox");
    await pinInput.fill("1111");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    // After login, should see logout button (only visible when logged in)
    await expect(page.getByRole("button", { name: "ออกจากระบบ" })).toBeVisible({ timeout: 5000 });
  });

  test("F2: owner PIN 9999 shows attendance button", async ({ page }) => {
    await page.goto("/pos");
    const pinInput = page.getByRole("textbox");
    await pinInput.fill("9999");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    // OWNER sees "เช็คชื่อ" attendance button
    await expect(page.getByRole("button", { name: "เช็คชื่อ" })).toBeVisible({ timeout: 5000 });
  });

  test("F3: wrong PIN shows error or stays on PIN screen", async ({ page }) => {
    await page.goto("/pos");
    const pinInput = page.getByRole("textbox");
    await pinInput.fill("9876");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await page.waitForTimeout(500);
    // Should stay on PIN screen — "เข้าสู่ระบบ" button still present
    await expect(page.getByRole("button", { name: "เข้าสู่ระบบ" })).toBeVisible({ timeout: 3000 });
  });

  test("F4: fallback PIN 0000 works", async ({ page }) => {
    await page.goto("/pos");
    const pinInput = page.getByRole("textbox");
    await pinInput.fill("0000");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await expect(page.getByRole("button", { name: "ออกจากระบบ" })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("POS — Order Flow", () => {
  test.beforeEach(async ({ page, request }) => {
    // Clean PENDING orders on โต๊ะ 1 before each test
    const tablesRes = await api.getTables(request);
    const tables = await tablesRes.json();
    const t1 = tables.find((t: { name: string }) => t.name === "โต๊ะ 1");
    if (t1) {
      const ordersRes = await api.getOrders(request, t1.id);
      if (ordersRes.status() === 200) {
        const existing = await ordersRes.json();
        const orders = Array.isArray(existing) ? existing : (existing ? [existing] : []);
        for (const o of orders) {
          if (o?.status === "PENDING") await api.deleteOrder(request, o.id);
        }
      }
    }
    await loginWithPin(page, "1111");
  });

  test("G1: select table 1 — opens bill screen", async ({ page }) => {
    await selectTable(page, "โต๊ะ 1");
    // After selecting a table, the bill/order panel should update
    await expect(page.getByText(/บิล|รายการ|order|item|0 รายการ/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("G1-G2: add menu item — shows in bill", async ({ page }) => {
    await selectTable(page, "โต๊ะ 1");

    // Click on a menu item (ข้าวผัดหมู — safe choice without complex modal)
    await page.getByRole("button", { name: /ข้าวผัดหมู/i }).click();

    // Confirm add in modal
    const addBtn = page.getByRole("button", { name: /เพิ่ม|ยืนยัน|confirm/i }).last();
    await addBtn.click();

    // Item should appear in bill as a heading entry
    await expect(page.getByRole("heading", { name: "ข้าวผัดหมู" })).toBeVisible({ timeout: 5000 });
  });

  test("H1: send to kitchen — button sends items", async ({ page }) => {
    await selectTable(page, "โต๊ะ 1");

    // Add โค้ก (no toppings modal)
    await page.getByRole("button", { name: /โค้ก ฿/i }).first().click();
    const addBtn = page.getByRole("button", { name: /เพิ่ม|ยืนยัน|confirm/i }).last();
    await addBtn.click();
    await page.waitForTimeout(300);

    // Send to kitchen
    const kitchenBtn = page.getByRole("button", { name: /ส่งเข้าครัว|ส่งครัว/i });
    await expect(kitchenBtn).toBeVisible({ timeout: 5000 });
    await kitchenBtn.click();
    await page.waitForTimeout(500);
  });
});

test.describe("POS — Receipts History", () => {
  test("N1-N2: receipts page loads with header", async ({ page }) => {
    await loginWithPin(page, "1111");
    await page.goto("/pos/receipts");
    // Receipts page should show heading
    await expect(page.getByText(/ใบเสร็จ|receipt|ประวัติ/i).first()).toBeVisible({ timeout: 5000 });
  });
});
