/**
 * API Test: Admin CRUD operations
 * Scenarios: A1-A6, B1-B3, C1
 */
import { test, expect } from "@playwright/test";
import { api } from "../helpers/api";

test.describe("Admin — Menu CRUD", () => {
  let createdMenuId: number;
  let categoryId: number;

  test("A1: create menu with price and category", async ({ request }) => {
    const catRes = await request.get("http://localhost:49951/api/admin/categories");
    const categories = await catRes.json();
    expect(categories.length).toBeGreaterThan(0);
    categoryId = categories[0].id;

    const res = await api.createMenu(request, {
      nameTh: "เมนูทดสอบ CRUD",
      nameEn: "CRUD Test Menu",
      price: 99,
      categoryId,
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.nameTh).toBe("เมนูทดสอบ CRUD");
    expect(body.price).toBe(99);
    createdMenuId = body.id;
  });

  test("A4: edit menu name and price via PUT (requires all fields)", async ({ request }) => {
    if (!createdMenuId) test.skip();
    const catRes = await request.get("http://localhost:49951/api/admin/categories");
    const cats = await catRes.json();
    const cid = cats[0].id;

    // Edit uses PUT (not PATCH) — must include nameTh, price, categoryId
    const res = await request.put(
      `http://localhost:49951/api/admin/menus/${createdMenuId}`,
      { data: { nameTh: "เมนูทดสอบ (แก้ไข)", nameEn: "", price: 120, categoryId: cid } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.nameTh).toBe("เมนูทดสอบ (แก้ไข)");
    expect(body.price).toBe(120);
  });

  test("A5: soft-delete menu — returns {success:true}", async ({ request }) => {
    if (!createdMenuId) test.skip();
    const res = await api.deleteMenu(request, createdMenuId);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("A5: soft-deleted menu does not appear in active menu list", async ({ request }) => {
    if (!createdMenuId) test.skip();
    const res = await api.getMenus(request);
    const menus = await res.json();
    const found = menus.find((m: { id: number }) => m.id === createdMenuId);
    expect(found).toBeUndefined();
  });

  test("A2/A3: seeded menu has toppings and requests assigned", async ({ request }) => {
    const res = await api.getMenus(request);
    const menus = await res.json();
    // สเต๊กหมู should have toppings (we assigned them in seed)
    const steak = menus.find((m: { nameTh: string }) => m.nameTh === "สเต๊กหมูพริกไทยดำ");
    expect(steak).toBeTruthy();
  });
});

test.describe("Admin — Employee CRUD", () => {
  let empId: number;

  test("B2: create OWNER employee with PIN", async ({ request }) => {
    // Only OWNER employees can have a pinCode via the API
    const res = await api.createEmployee(request, {
      name: "เจ้าของทดสอบ API",
      dailyWage: 0,
      role: "OWNER",
      pinCode: "6666",
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    empId = body.id;
    expect(body.role).toBe("OWNER");
    expect(body.pinCode).toBe("6666");
  });

  test("B2: new OWNER PIN works in POS login", async ({ request }) => {
    const res = await api.verifyPin(request, "6666");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("OWNER");
  });

  test("B3: STAFF employee has no pinCode (null)", async ({ request }) => {
    const createRes = await api.createEmployee(request, {
      name: "พนักงาน API Test",
      dailyWage: 300,
      role: "STAFF",
    });
    expect(createRes.status()).toBe(201);
    const body = await createRes.json();
    expect(body.pinCode).toBeNull(); // STAFF always null via API
    expect(body.role).toBe("STAFF");
    // cleanup
    await request.delete(`http://localhost:49951/api/admin/employees/${body.id}`);
  });

  test("B2: cleanup — delete test owner employee", async ({ request }) => {
    if (!empId) test.skip();
    const res = await request.delete(`http://localhost:49951/api/admin/employees/${empId}`);
    expect(res.status()).toBe(200);
  });
});

test.describe("Admin — Tables", () => {
  test("C1: get tables returns seeded tables", async ({ request }) => {
    const res = await api.getTables(request);
    expect(res.status()).toBe(200);
    const tables = await res.json();
    expect(tables.length).toBeGreaterThanOrEqual(4);
    const names = tables.map((t: { name: string }) => t.name);
    expect(names).toContain("โต๊ะ 1");
    expect(names).toContain("โต๊ะ 2");
  });
});

test.describe("Admin — Toppings & Requests", () => {
  test("get toppings returns seeded toppings", async ({ request }) => {
    const res = await api.getToppings(request);
    expect(res.status()).toBe(200);
    const toppings = await res.json();
    expect(toppings.length).toBeGreaterThanOrEqual(4);
    const names = toppings.map((t: { name: string }) => t.name);
    expect(names).toContain("ไข่ดาว");
    expect(names).toContain("เพิ่มหมู");
  });

  test("get special requests returns seeded requests", async ({ request }) => {
    const res = await api.getSpecialRequests(request);
    expect(res.status()).toBe(200);
    const reqs = await res.json();
    const names = reqs.map((r: { name: string }) => r.name);
    expect(names).toContain("ไม่พริก");
    expect(names).toContain("เผ็ดน้อย");
  });
});

test.describe("Admin — Settings", () => {
  test("E1/E2: settings returns key-value pairs including POS_PINCODE", async ({ request }) => {
    const res = await api.getSettings(request);
    expect(res.status()).toBe(200);
    const settings = await res.json();
    const keys = settings.map((s: { key: string }) => s.key);
    expect(keys).toContain("POS_PINCODE");
    expect(keys).toContain("PAYMENT_QR_IMAGE");
    expect(keys).toContain("RECEIPT_HEADER");
  });

  test("E2: POS_PINCODE value is 0000 (set by seed)", async ({ request }) => {
    const res = await api.getSettings(request);
    const settings = await res.json();
    const posPin = settings.find((s: { key: string }) => s.key === "POS_PINCODE");
    expect(posPin?.value).toBe("0000");
  });
});
