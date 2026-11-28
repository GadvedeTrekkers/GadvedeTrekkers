import { describe, it, expect, vi, beforeEach } from "vitest";

const apiRequest = vi.fn(() => Promise.resolve({}));
let adminSignedIn = false;

vi.mock("../api/backendClient", () => ({ apiRequest: (...a) => apiRequest(...a) }));
vi.mock("./authStorage", () => ({ isAdminAuthenticated: () => adminSignedIn }));

const { syncCustomer, findOrCreateCustomer } = await import("./customerStorage.js");

describe("customer upsert is staff-only", () => {
  beforeEach(() => { apiRequest.mockClear(); adminSignedIn = false; });

  it("makes no network call for an anonymous visitor", async () => {
    expect(await syncCustomer({ name: "Test", phone: "0000000000" })).toBe(false);
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("importing the module (page load) makes no network call", () => {
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("posts with the admin token for a signed-in staff member", async () => {
    adminSignedIn = true;
    expect(await syncCustomer({ name: "Test", phone: "0000000000" })).toBe(true);
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(apiRequest.mock.calls[0][0]).toBe("/api/customers/upsert");
    expect(apiRequest.mock.calls[0][1]).toMatchObject({ method: "POST", admin: true });
  });

  it("a visitor-side findOrCreateCustomer never reaches the endpoint", () => {
    findOrCreateCustomer({ name: "Visitor", phone: "0000000001", email: "v@example.com" });
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
