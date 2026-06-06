import { expect, test } from "@playwright/test";

function createFakeJwt() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    username: "admin",
    role: "Super Admin",
  })).toString("base64url");
  return `${header}.${payload}.signature`;
}

function seedAdminSession(page) {
  const token = createFakeJwt();
  return page.addInitScript((fakeToken) => {
    const user = JSON.stringify({ name: "Admin", username: "admin", role: "Super Admin" });
    localStorage.setItem("gt_admin", "true");
    localStorage.setItem("gt_admin_token", fakeToken);
    localStorage.setItem("gt_user", user);
    sessionStorage.setItem("gt_admin", "true");
    sessionStorage.setItem("gt_admin_token", fakeToken);
    sessionStorage.setItem("gt_user", user);
  }, token);
}

async function installListingApiMock(page) {
  const state = {
    event: [],
    property: [],
    campsite: [],
  };

  await page.route("**/api/listings/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const parts = url.pathname.split("/").filter(Boolean);

    if (method === "POST" && parts[0] === "api" && parts[1] === "listings" && parts[2]) {
      const type = parts[2];
      const payload = request.postDataJSON();
      const row = {
        id: payload.id || `${type}-${Date.now()}`,
        ...payload,
        submitted_at: payload.submitted_at || payload.submittedAt || new Date().toISOString(),
      };
      state[type].unshift(row);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(row) });
      return;
    }

    if (method === "GET" && parts[0] === "api" && parts[1] === "listings" && parts[2] === "admin" && parts[3] === "list") {
      const type = url.searchParams.get("type");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(Array.isArray(state[type]) ? state[type] : []),
      });
      return;
    }

    if (method === "PATCH" && parts[0] === "api" && parts[1] === "listings" && parts[2] === "admin" && parts[3]) {
      const id = parts[3];
      const payload = request.postDataJSON();
      const type = payload.submission_type;
      state[type] = state[type].map((item) => (item.id === id ? { ...item, ...payload, id } : item));
      const updated = state[type].find((item) => item.id === id) || { id, ...payload };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(updated) });
      return;
    }

    if (method === "DELETE" && parts[0] === "api" && parts[1] === "listings" && parts[2] === "admin" && parts[3]) {
      const id = parts[3];
      Object.keys(state).forEach((type) => {
        state[type] = state[type].filter((item) => item.id !== id);
      });
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      return;
    }

    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "Unhandled listing mock route" }) });
  });
}

test.describe.parallel("listing flows", () => {
  test.beforeEach(async ({ page }) => {
    await seedAdminSession(page);
    await installListingApiMock(page);
  });

  test("property listing submits and moves through admin review", async ({ page }) => {
    await page.goto("/list-property", { waitUntil: "domcontentloaded" });

    await page.getByPlaceholder(/Sahyadri Homestay/i).fill("Sahyadri Homestay");
    await page.getByPlaceholder(/Your name/i).fill("Mira Patil");
    await page.getByPlaceholder(/10-digit mobile/i).fill("9876543210");
    await page.getByPlaceholder(/Village \/ Town, District, State/i).fill("Mulshi, Pune, Maharashtra");
    await page.getByPlaceholder(/3500/i).fill("3500");
    await page.getByRole("button", { name: /Submit Listing/i }).click();

    await expect(page.getByRole("heading", { name: /Listing Submitted!/i })).toBeVisible();

    await page.goto("/admin/property-listings");
    await expect(page.getByText("Sahyadri Homestay")).toBeVisible();

    await page.getByRole("button", { name: "✓" }).click();
    await page.getByRole("button", { name: /Yes, Continue/i }).click();
    await expect(page.locator("tbody").getByText("Approved").first()).toBeVisible();

    await page.getByRole("button", { name: "🚀" }).click();
    await page.getByRole("button", { name: /Yes, Continue/i }).click();
    await expect(page.locator("tbody").getByText("Live").first()).toBeVisible();
  });

  test("campsite listing submits and moves through admin review", async ({ page }) => {
    await page.goto("/list-campsite", { waitUntil: "domcontentloaded" });

    await page.getByPlaceholder(/Bhimashankar Camp/i).fill("Bhimashankar Camp");
    await page.getByPlaceholder(/Village \/ Town, District, State/i).fill("Bhimashankar, Pune, Maharashtra");
    await page.getByPlaceholder(/Your name/i).fill("Rohit Shinde");
    await page.getByPlaceholder(/10-digit mobile/i).fill("9988776655");
    await page.getByPlaceholder(/Rajmachi Trek, Bhimashankar/i).fill("Bhimashankar Trek");
    await page.getByRole("button", { name: /Submit Campsite/i }).click();

    await expect(page.getByRole("heading", { name: /Campsite Submitted!/i })).toBeVisible();

    await page.goto("/admin/campsite-listings");
    await expect(page.getByText("Bhimashankar Camp")).toBeVisible();

    await page.getByRole("button", { name: "✓" }).click();
    await page.getByRole("button", { name: /Yes, Continue/i }).click();
    await expect(page.locator("tbody").getByText("Approved").first()).toBeVisible();

    await page.getByRole("button", { name: "🚀" }).click();
    await page.getByRole("button", { name: /Yes, Continue/i }).click();
    await expect(page.locator("tbody").getByText("Live").first()).toBeVisible();
  });

  test("event listing submits and moves through admin edit and publish", async ({ page }) => {
    await page.goto("/list-event", { waitUntil: "domcontentloaded" });

    await page.getByPlaceholder(/Rahul Desai or Nature Walks Club/i).fill("Rahul Pandey");
    await page.getByPlaceholder(/9876543210/i).fill("9833001003");
    await page.getByPlaceholder(/Bhimashankar Sunrise Trek 2026/i).fill("Pawna Monsoon Camping");
    await page.getByPlaceholder(/Bhimashankar, Pune District, Maharashtra/i).fill("Pawna Lake, Pune");
    await page.getByPlaceholder(/Describe your event here/i).fill("A monsoon camping event with lakeside tents, dinner, and morning activities.");
    await page.getByRole("button", { name: /Submit Event/i }).click();

    await expect(page.getByRole("heading", { name: /Event Submitted!/i })).toBeVisible();

    await page.goto("/admin/events");
    await expect(page.getByText("Pawna Monsoon Camping")).toBeVisible();

    await page.getByRole("button", { name: /Approve/i }).click();
    await expect(page.locator("tbody").getByText("Approved").first()).toBeVisible();

    await page.getByRole("button", { name: /Go Live/i }).click();
    await expect(page.locator("tbody").getByText("Live").first()).toBeVisible();
  });
});
