import { expect, test } from "@playwright/test";

function createFakeJwt() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      username: "admin",
      role: "Super Admin",
    })
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}

async function seedAdminSession(page) {
  const token = createFakeJwt();
  await page.addInitScript((fakeToken) => {
    const user = JSON.stringify({ name: "Admin", username: "admin", role: "Super Admin" });
    localStorage.setItem("gt_admin", "true");
    localStorage.setItem("gt_admin_token", fakeToken);
    localStorage.setItem("gt_user", user);
    sessionStorage.setItem("gt_admin", "true");
    sessionStorage.setItem("gt_admin_token", fakeToken);
    sessionStorage.setItem("gt_user", user);
  }, token);
}

async function seedCachedTreks(page, products) {
  await page.addInitScript((items) => {
    localStorage.setItem("gt_treks", JSON.stringify(items));
    localStorage.setItem("gt_treks_syncedAt", Date.now().toString());
  }, products);
}

async function blockTrekCacheWrites(page) {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function patchedSetItem(key, value) {
      if (key === "gt_treks" || key === "gt_treks_syncedAt") {
        throw new DOMException("Simulated Safari storage quota", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
  });
}

function buildTrek({
  id,
  name,
  location,
  difficulty,
  duration,
  altitude,
  price,
  originalPrice,
  nextDate,
  active,
  sortOrder,
}) {
  return {
    id,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    location,
    difficulty,
    duration,
    altitude,
    price,
    originalPrice,
    nextDate,
    rating: 4.6,
    reviews: 100,
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    imageGallery: JSON.stringify([
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
    ]),
    active,
    sortOrder,
  };
}

async function installTrekApiMock(page, tracker) {
  const initialProducts = [
    buildTrek({
      id: "trek-1",
      name: "Rajmachi Trek",
      location: "Lonavala",
      difficulty: "Easy",
      duration: "1 Day",
      altitude: "820m",
      price: 1599,
      originalPrice: 1800,
      nextDate: "12 Jun 2026",
      active: true,
      sortOrder: 1,
    }),
    buildTrek({
      id: "trek-2",
      name: "Harishchandragad Trek",
      location: "Ahmednagar, Maharashtra",
      difficulty: "Medium",
      duration: "1 Night 1 Day",
      altitude: "1424m",
      price: 1449,
      originalPrice: 1899,
      nextDate: "14 Jun 2026",
      active: true,
      sortOrder: 2,
    }),
    buildTrek({
      id: "trek-3",
      name: "Andharban Forest Trail",
      location: "Pimpri, Pune",
      difficulty: "Easy",
      duration: "1 Day",
      altitude: "2500 ft",
      price: 1498,
      originalPrice: 1799,
      nextDate: "20 Jun 2026",
      active: true,
      sortOrder: 3,
    }),
    buildTrek({
      id: "trek-4",
      name: "Kalsubai Peak Trek",
      location: "Akole, Ahmednagar",
      difficulty: "Medium",
      duration: "1 Day",
      altitude: "5400 ft",
      price: 999,
      originalPrice: 1099,
      nextDate: "21 Jun 2026",
      active: false,
      sortOrder: 4,
    }),
  ];
  await seedCachedTreks(page, initialProducts);

  const state = {
    products: initialProducts,
  };

  await page.route("**/api/products**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === "GET" && url.pathname === "/api/products/admin/list") {
      tracker.adminListRequests.push(url.toString());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: state.products }),
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/products/admin/upsert") {
      const payload = request.postDataJSON();
      tracker.upsertRequests.push(payload);

      const nextItem = payload.item;
      state.products = state.products.map((product) =>
        product.id === nextItem.id ? { ...product, ...nextItem } : product
      );
      const updated = state.products.find((product) => product.id === nextItem.id);
      tracker.upsertResponses.push(updated);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: updated }),
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/products") {
      tracker.publicListRequests.push(url.toString());
      const type = url.searchParams.get("type");
      const liveProducts =
        type === "trek"
          ? state.products.filter((product) => product.active !== false)
          : [];

      tracker.publicListResponses.push(liveProducts.map((item) => ({ id: item.id, active: item.active })));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: liveProducts }),
      });
      return;
    }

    await route.fallback();
  });

  return state;
}

async function installTrekApiMockWithAllLive(page, tracker) {
  return installTrekApiMock(page, tracker).then(async (state) => {
    state.products = state.products.map((product) => ({ ...product, active: true }));
    await seedCachedTreks(page, state.products);
    return state;
  });
}

async function goLiveFromAdmin(page, trekName) {
  await page.goto("/admin/treks", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await expect(page.locator("tbody")).toBeVisible();
  await expect(page.getByText(trekName)).toBeVisible({ timeout: 15000 });

  const row = page.locator("tbody tr").filter({ hasText: trekName }).first();
  await expect(row).toBeVisible();
  const offButton = row.getByRole("button", { name: "Off" });
  await expect(offButton).toBeVisible();
  await offButton.scrollIntoViewIfNeeded().catch(() => {});
  await offButton.click();
  await expect(row.getByRole("button", { name: "Live" })).toBeVisible();
}

async function expectPublicTreksVisible(page, trekNames, totalCount) {
  await page.goto("/treks", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[aria-label="Available treks"] [role="listitem"]')).toHaveCount(totalCount);
  await expect(page.locator(".trek-results-meta")).toContainText(`Showing ${totalCount} of`);
  await expect(page.locator(".trek-results-meta")).toContainText(`${totalCount} treks`);

  for (const trekName of trekNames) {
    await expect(page.getByText(trekName, { exact: true })).toBeVisible();
  }
}

test.describe("trek live visibility across devices", () => {
  test.beforeEach(async ({ page }) => {
    await seedAdminSession(page);
  });

  test("admin live toggle sends the correct API payload and makes the trek live", async ({ browserName, page }) => {
    test.slow();

    const tracker = {
      adminListRequests: [],
      upsertRequests: [],
      upsertResponses: [],
      publicListRequests: [],
      publicListResponses: [],
    };

    await installTrekApiMock(page, tracker);
    await goLiveFromAdmin(page, "Kalsubai Peak Trek");

    expect(tracker.upsertRequests).toHaveLength(1);
    expect(tracker.upsertRequests[0]).toMatchObject({
      storageKey: "gt_treks",
      item: expect.objectContaining({
        id: "trek-4",
        name: "Kalsubai Peak Trek",
        active: true,
      }),
    });
    expect(tracker.upsertResponses[0]).toMatchObject({
      id: "trek-4",
      active: true,
    });
  });

  test("live treks are visible on desktop and mobile browsers with matching public API responses", async ({ browserName, page }) => {
    test.slow();

    const tracker = {
      adminListRequests: [],
      upsertRequests: [],
      upsertResponses: [],
      publicListRequests: [],
      publicListResponses: [],
    };

    await installTrekApiMockWithAllLive(page, tracker);
    await expectPublicTreksVisible(
      page,
      [
        "Rajmachi Trek",
        "Harishchandragad Trek",
        "Andharban Forest Trail",
        "Kalsubai Peak Trek",
      ],
      4
    );

    expect(tracker.publicListRequests.some((url) => url.includes("/api/products?type=trek"))).toBe(true);
    expect(
      tracker.publicListResponses.some(
        (response) =>
          Array.isArray(response) &&
          response.length === 4 &&
          response.every((item) => item.active === true)
      )
    ).toBe(true);

    test.info().annotations.push({ type: "browser", description: browserName });
  });

  test("live treks still render when trek cache persistence fails", async ({ browserName, page }) => {
    test.slow();

    const tracker = {
      adminListRequests: [],
      upsertRequests: [],
      upsertResponses: [],
      publicListRequests: [],
      publicListResponses: [],
    };

    await blockTrekCacheWrites(page);
    await installTrekApiMockWithAllLive(page, tracker);
    await expectPublicTreksVisible(
      page,
      [
        "Rajmachi Trek",
        "Harishchandragad Trek",
        "Andharban Forest Trail",
        "Kalsubai Peak Trek",
      ],
      4
    );

    const cacheState = await page.evaluate(() => ({
      gtTreks: localStorage.getItem("gt_treks"),
      syncedAt: localStorage.getItem("gt_treks_syncedAt"),
    }));

    expect(cacheState.gtTreks).toBeNull();
    expect(cacheState.syncedAt).toBeNull();
    expect(tracker.publicListRequests.some((url) => url.includes("/api/products?type=trek"))).toBe(true);

    test.info().annotations.push({ type: "browser", description: browserName });
  });
});
