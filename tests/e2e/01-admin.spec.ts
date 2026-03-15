/**
 * E2E Test: Admin panel — menu, employee, settings management
 * Scenarios: A1-A6, B1-B3, C1, E1-E2
 */
import { test, expect } from "@playwright/test";

test.describe("Admin — Dashboard", () => {
  test("loads admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "ยินดีต้อนรับสู่ระบบหลังบ้าน" })).toBeVisible();
    await expect(page.getByText("ยอดขายวันนี้")).toBeVisible();
  });
});

test.describe("Admin — Menu Management", () => {
  test("A1: menu list page loads with seeded menus", async ({ page }) => {
    await page.goto("/admin/menus");
    await expect(page.getByText("สเต๊กหมูพริกไทยดำ")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("ข้าวผัดหมู")).toBeVisible();
    // Use exact match to avoid strict-mode collision with "โค้ก (ขวด)"
    await expect(page.getByText("โค้ก", { exact: true })).toBeVisible();
  });

  test("A5: soft-deleted menu (ไอศกรีมวานิลลา) not shown in active list", async ({ page }) => {
    await page.goto("/admin/menus");
    await expect(page.getByText("ไอศกรีมวานิลลา")).not.toBeVisible();
  });

  test("A1: add new menu via form", async ({ page }) => {
    await page.goto("/admin/menus");
    await page.getByPlaceholder("เช่น สเต๊กหมูพริกไทยดำ").fill("ผัดกะเพราทดสอบ");
    await page.getByPlaceholder("เช่น 159").fill("79");
    await page.locator("select").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "บันทึกเมนู" }).click();
    await expect(page.getByText("ผัดกะเพราทดสอบ").first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Admin — Employee Management", () => {
  test("B1-B3: employee list shows seeded employees with roles", async ({ page }) => {
    await page.goto("/admin/employees");
    await expect(page.getByText("เจ้าของร้าน (ทดสอบ)")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("พนักงานทดสอบ PIN1111")).toBeVisible();
  });
});

test.describe("Admin — Tables", () => {
  test("C1: tables list shows seeded tables", async ({ page }) => {
    await page.goto("/admin/tables");
    // Use exact match to avoid matching description text like "เช่น โต๊ะ 1 โต๊ะ 2"
    await expect(page.getByText("โต๊ะ 1", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("โต๊ะ 2", { exact: true })).toBeVisible();
    await expect(page.getByText("โต๊ะ 3", { exact: true })).toBeVisible();
  });
});

test.describe("Admin — Settings", () => {
  test("E2: settings page shows PIN entry field", async ({ page }) => {
    await page.goto("/admin/settings");
    // Use heading to avoid strict-mode violation with multiple PIN-related elements
    await expect(page.getByRole("heading", { name: /PIN เข้าหน้า POS/i })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Admin — Reports", () => {
  test("D1: reports page loads with daily summary", async ({ page }) => {
    await page.goto("/admin/reports");
    // Use the page's main heading — "สรุปยอดรายวัน"
    await expect(page.getByRole("heading", { name: "สรุปยอดรายวัน" })).toBeVisible({ timeout: 5000 });
  });
});
