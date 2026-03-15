/**
 * API Test: Full order flow
 * Scenarios: G1-G7, H1-H5, K1-K2
 */
import { test, expect } from "@playwright/test";
import { api } from "../helpers/api";

let tableId: number;
let table2Id: number;
let orderId: number;
let menuId: number;   // menu with toppings (สเต๊กหมูพริกไทยดำ)
let menu2Id: number;  // any other menu
let toppingId: number;
let requestId: number;
let itemId: number;
let item2Id: number;

test.beforeAll(async ({ request }) => {
  const tablesRes = await api.getTables(request);
  const tables = await tablesRes.json();
  const t1 = tables.find((t: { name: string }) => t.name === "โต๊ะ 1");
  const t2 = tables.find((t: { name: string }) => t.name === "โต๊ะ 2");
  tableId = t1.id;
  table2Id = t2.id;

  // Get any available menus
  const menusRes = await api.getMenus(request);
  const menus = await menusRes.json();
  expect(menus.length).toBeGreaterThanOrEqual(2);
  // Prefer สเต๊กหมู which has toppings, fall back to first
  const steak = menus.find((m: { nameTh: string }) => m.nameTh === "สเต๊กหมูพริกไทยดำ") ?? menus[0];
  menuId = steak.id;
  menu2Id = menus.find((m: { id: number }) => m.id !== menuId)?.id ?? menus[1].id;

  // Get toppings
  const toppingsRes = await api.getToppings(request);
  const toppings = await toppingsRes.json();
  toppingId = toppings.find((t: { name: string }) => t.name === "ไข่ดาว")?.id ?? toppings[0].id;

  // Get requests
  const reqsRes = await api.getSpecialRequests(request);
  const reqs = await reqsRes.json();
  requestId = reqs.find((r: { name: string }) => r.name === "ไม่พริก")?.id ?? reqs[0].id;

  // Clean up existing PENDING orders on test tables
  // GET ?tableId=N returns single order object (not array)
  for (const tid of [tableId, table2Id]) {
    const ordersRes = await api.getOrders(request, tid);
    if (ordersRes.status() === 200) {
      const existing = await ordersRes.json();
      const orders = Array.isArray(existing) ? existing : [existing];
      for (const o of orders) {
        if (o?.status === "PENDING") await api.deleteOrder(request, o.id);
      }
    }
  }
});

test.describe("Order Flow — Create & Add Items", () => {
  test("G1: create order on table 1", async ({ request }) => {
    const res = await api.createOrder(request, { tableId });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("PENDING");
    expect(body.tableId).toBe(tableId);
    orderId = body.id;
  });

  test("G1: add plain menu item to order", async ({ request }) => {
    const res = await api.addItem(request, orderId, {
      menuId: menu2Id,
      quantity: 1,
      toppings: [],
      requests: [],
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    item2Id = body.id;
    expect(body.menuId).toBe(menu2Id);
    expect(body.quantity).toBe(1);
  });

  test("G2: add item with topping — price includes topping cost", async ({ request }) => {
    const toppingsRes = await api.getToppings(request);
    const toppings = await toppingsRes.json();
    const topping = toppings.find((t: { id: number }) => t.id === toppingId);
    const menusRes = await api.getMenus(request);
    const menus = await menusRes.json();
    const menu = menus.find((m: { id: number }) => m.id === menuId);
    const expectedPrice = menu.price + topping.price;

    const res = await api.addItem(request, orderId, {
      menuId,
      quantity: 1,
      toppings: [{ id: toppingId, name: topping.name, price: topping.price }],
      requests: [],
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    itemId = body.id;
    expect(body.price).toBe(expectedPrice);
  });

  test("G3: add item with special requests", async ({ request }) => {
    const reqsRes = await api.getSpecialRequests(request);
    const reqs = await reqsRes.json();
    const req = reqs.find((r: { id: number }) => r.id === requestId);

    const res = await api.addItem(request, orderId, {
      menuId: menu2Id,
      quantity: 1,
      toppings: [],
      requests: [{ id: requestId, name: req.name }],
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.requests).toBeTruthy();
    const parsedRequests = typeof body.requests === "string" ? JSON.parse(body.requests) : body.requests;
    expect(Array.isArray(parsedRequests)).toBe(true);
    expect(parsedRequests.length).toBeGreaterThan(0);
  });

  test("G4: add item with note", async ({ request }) => {
    const res = await api.addItem(request, orderId, {
      menuId: menu2Id,
      quantity: 1,
      toppings: [],
      requests: [],
      note: "ขอข้าวน้อย",
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.note).toBe("ขอข้าวน้อย");
  });

  test("G5: update item quantity", async ({ request }) => {
    // Must pass toppings/requests to avoid null.length error in handler
    const res = await api.updateItem(request, item2Id, { quantity: 3, toppings: [], requests: [] });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.quantity).toBe(3);
  });

  test("G6: delete an item from order", async ({ request }) => {
    const addRes = await api.addItem(request, orderId, {
      menuId: menu2Id,
      quantity: 1,
      toppings: [],
      requests: [],
    });
    const added = await addRes.json();
    const delRes = await api.deleteItem(request, added.id);
    expect(delRes.status()).toBe(200);
  });

  test("G7: get order shows all remaining items", async ({ request }) => {
    const res = await api.getOrder(request, orderId);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBeGreaterThanOrEqual(3);
  });
});

test.describe("Kitchen Flow", () => {
  test("H1: send to kitchen — marks unsent items sentToKitchen=true", async ({ request }) => {
    const res = await api.sendToKitchen(request, orderId);
    expect(res.status()).toBe(200);

    const orderRes = await api.getOrder(request, orderId);
    const order = await orderRes.json();
    for (const item of order.items) {
      expect(item.sentToKitchen).toBe(true);
    }
  });

  test("H2: add new item after kitchen send — sentToKitchen=false", async ({ request }) => {
    const res = await api.addItem(request, orderId, {
      menuId: menu2Id,
      quantity: 1,
      toppings: [],
      requests: [],
    });
    const newItem = await res.json();
    expect(newItem.sentToKitchen).toBe(false);
  });

  test("H3: second kitchen send — response includes items array with 1 newly sent item", async ({ request }) => {
    const res = await api.sendToKitchen(request, orderId);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // API returns { order: {...}, items: [...newly sent items] }
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBe(1);
  });

  test("H4: monitor API returns array of PENDING orders", async ({ request }) => {
    const res = await api.getMonitorOrders(request);
    expect(res.status()).toBe(200);
    const orders = await res.json();
    expect(Array.isArray(orders)).toBe(true);
    // Our test order should be in the list (orderId from G1)
    const found = orders.find((o: { id: number }) => o.id === orderId);
    expect(found).toBeDefined();
  });

  test("H5: mark item prepared — response has count=1", async ({ request }) => {
    // itemId was set in G2 (item with topping, sentToKitchen=true after H1)
    const res = await api.markPrepared(request, itemId);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // API returns { ok: true, count: N, quantity: M }
    expect(body.ok).toBe(true);
    expect(body.count).toBe(1);
  });
});

test.describe("Edge Cases — Table Move & Conflict", () => {
  test("K2: move order from table 1 to table 2 (empty)", async ({ request }) => {
    const res = await api.updateOrder(request, orderId, { tableId: table2Id });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.tableId).toBe(table2Id);
  });

  test("K1: cannot MOVE another order to table 2 when it already has PENDING order", async ({ request }) => {
    // Create a temp order on table 1 (now empty since orderId moved to table 2)
    const tempRes = await api.createOrder(request, { tableId });
    const tempOrder = await tempRes.json();
    expect(tempRes.status()).toBe(201);

    // Try to move it to table 2 — should fail (table 2 has our orderId)
    const moveRes = await api.updateOrder(request, tempOrder.id, { tableId: table2Id });
    expect(moveRes.status()).toBe(400);

    // Cleanup temp order
    await api.deleteOrder(request, tempOrder.id);
  });

  test("cleanup: move order back to table 1", async ({ request }) => {
    await api.updateOrder(request, orderId, { tableId });
  });

  test("cleanup: delete test order", async ({ request }) => {
    if (!orderId) test.skip();
    await api.deleteOrder(request, orderId);
  });
});
