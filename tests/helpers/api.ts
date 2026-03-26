/**
 * API helper utilities for Playwright API tests
 */
import { APIRequestContext } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:49951";

export const api = {
  // ===== Auth =====
  async verifyPin(request: APIRequestContext, pin: string) {
    return request.post(`${BASE}/api/pos/verify-pin`, { data: { pin } });
  },

  // ===== Admin: Employees =====
  async getEmployees(request: APIRequestContext) {
    return request.get(`${BASE}/api/admin/employees`);
  },
  async createEmployee(request: APIRequestContext, data: object) {
    return request.post(`${BASE}/api/admin/employees`, { data });
  },

  // ===== Admin: Tables =====
  async getTables(request: APIRequestContext) {
    return request.get(`${BASE}/api/admin/tables`);
  },

  // ===== Admin: Menus =====
  async getMenus(request: APIRequestContext) {
    return request.get(`${BASE}/api/admin/menus`);
  },
  async createMenu(request: APIRequestContext, data: object) {
    return request.post(`${BASE}/api/admin/menus`, { data });
  },
  async deleteMenu(request: APIRequestContext, id: number) {
    return request.delete(`${BASE}/api/admin/menus/${id}`);
  },

  // ===== Admin: Toppings =====
  async getToppings(request: APIRequestContext) {
    return request.get(`${BASE}/api/admin/toppings`);
  },

  // ===== Admin: Requests =====
  async getSpecialRequests(request: APIRequestContext) {
    return request.get(`${BASE}/api/admin/requests`);
  },

  // ===== Admin: Settings =====
  async getSettings(request: APIRequestContext) {
    return request.get(`${BASE}/api/admin/settings`);
  },
  async updateSetting(request: APIRequestContext, key: string, value: string) {
    return request.post(`${BASE}/api/admin/settings`, { data: { key, value } });
  },

  // ===== POS: Orders =====
  async getOrders(request: APIRequestContext, tableId?: number) {
    const url = tableId
      ? `${BASE}/api/pos/orders?tableId=${tableId}`
      : `${BASE}/api/pos/orders`;
    return request.get(url);
  },
  async createOrder(request: APIRequestContext, data: object) {
    return request.post(`${BASE}/api/pos/orders`, { data });
  },
  async getOrder(request: APIRequestContext, id: number) {
    return request.get(`${BASE}/api/pos/orders/${id}`);
  },
  async updateOrder(request: APIRequestContext, id: number, data: object) {
    return request.patch(`${BASE}/api/pos/orders/${id}`, { data });
  },
  async deleteOrder(request: APIRequestContext, id: number) {
    return request.delete(`${BASE}/api/pos/orders/${id}`);
  },

  // ===== POS: Order Items =====
  async addItem(request: APIRequestContext, orderId: number, data: object) {
    return request.post(`${BASE}/api/pos/orders/${orderId}/items`, { data });
  },
  async updateItem(request: APIRequestContext, itemId: number, data: object) {
    return request.patch(`${BASE}/api/pos/orders/items/${itemId}`, { data });
  },
  async deleteItem(request: APIRequestContext, itemId: number) {
    return request.delete(`${BASE}/api/pos/orders/items/${itemId}`);
  },

  // ===== POS: Kitchen =====
  async sendToKitchen(request: APIRequestContext, orderId: number) {
    return request.post(`${BASE}/api/pos/orders/${orderId}/kitchen`);
  },
  async getMonitorOrders(request: APIRequestContext) {
    return request.get(`${BASE}/api/pos/monitor/orders`);
  },
  async markPrepared(request: APIRequestContext, itemId: number) {
    return request.post(`${BASE}/api/pos/monitor/items/${itemId}/prepared`);
  },

  // ===== POS: Payment =====
  async payOrder(request: APIRequestContext, orderId: number, data: object) {
    return request.post(`${BASE}/api/pos/orders/${orderId}/pay`, { data });
  },

  // ===== POS: QR =====
  async generateQr(request: APIRequestContext, orderId: number) {
    return request.post(`${BASE}/api/pos/orders/${orderId}/qr`);
  },
  async getOrderByToken(request: APIRequestContext, token: string) {
    return request.get(`${BASE}/api/order/qr/${token}`);
  },

  // ===== POS: Receipts =====
  async getReceipts(request: APIRequestContext) {
    return request.get(`${BASE}/api/pos/receipts`);
  },

  // ===== POS: Reports =====
  async getDailyReport(request: APIRequestContext, date?: string) {
    const d = date ?? new Date().toISOString().split("T")[0];
    return request.get(`${BASE}/api/pos/reports/daily?date=${d}`);
  },

  // ===== POS: Settings =====
  async getPosSettings(request: APIRequestContext) {
    return request.get(`${BASE}/api/pos/settings`);
  },
};
