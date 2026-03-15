/**
 * API Test: Authentication (PIN verification)
 * Scenarios: F1-F4
 */
import { test, expect } from "@playwright/test";
import { api } from "../helpers/api";

test.describe("Authentication — PIN verification", () => {
  test("F1: valid STAFF PIN returns employee with role STAFF", async ({ request }) => {
    const res = await api.verifyPin(request, "1111");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("STAFF");
    expect(body.name).toBeTruthy();
  });

  test("F2: valid OWNER PIN returns employee with role OWNER", async ({ request }) => {
    const res = await api.verifyPin(request, "9999");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("OWNER");
  });

  test("F3: wrong PIN returns 401", async ({ request }) => {
    const res = await api.verifyPin(request, "0000");
    // POS_PINCODE is 0000 (seed), so this should return 200 as fallback
    // If you want to test truly wrong PIN, use something else
    const res2 = await api.verifyPin(request, "9876");
    expect(res2.status()).toBe(401);
    void res;
  });

  test("F4: POS_PINCODE fallback (0000) returns 200", async ({ request }) => {
    const res = await api.verifyPin(request, "0000");
    expect(res.status()).toBe(200);
  });
});
