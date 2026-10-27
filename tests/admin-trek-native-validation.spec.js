import { expect, test } from "@playwright/test";

const ENDURANCE = "Easy\u2013Medium";

const VASOTA = {
  id: "b2200000-0000-4000-8000-000000000001",
  active: true,
  name: "Vasota Fort Trek",
  region: "pune",
  location: "Satara, Maharashtra",
  difficulty: "Moderate",
  enduranceLevel: ENDURANCE,
  duration: "2 Days",
  price: 1800,
  originalPrice: 2200,
  rating: 4.8,
  reviews: 120,
  sortOrder: 1,
  imageGallery: "[]",
  discountCodes: "",
  discountEnabled: false,
  trekDateBatches: JSON.stringify([
    {
      id: "batch-vasota-1",
      date: "2026-11-14",
      endDate: "",
      label: "Weekend",
      departureCity: "Pune",
      price: "1800.5",
      whatsappGroupLink: "",
    },
  ]),
  departurePlans: JSON.stringify({
    Pune: {
      price: "1499.5",
      pickupPoints: [{ time: "07:30 PM", location: "Shivajinagar", mapUrl: "" }],
      itinerary: "Day 1|07:30 PM|Depart from Shivajinagar",
    },
    Mumbai: {
      price: "1699",
      pickupPoints: [{ time: "09:00 PM", location: "Dadar", mapUrl: "" }],
      itinerary: "",
    },
  }),
};

function createFakeJwt() {
  const encode = (value) => btoa(JSON.stringify(value));
  const header = encode({ alg: "none", typ: "JWT" });
  const payload = encode({
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    username: "admin",
    role: "Super Admin",
  });
  return `${header}.${payload}.signature`;
}

async function openVasotaEditor(page) {
  const dialogs = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });

  await page.addInitScript((fakeToken) => {
    const user = JSON.stringify({ name: "Admin", username: "admin", role: "Super Admin" });
    localStorage.setItem("gt_admin", "true");
    localStorage.setItem("gt_admin_token", fakeToken);
    localStorage.setItem("gt_user", user);
    sessionStorage.setItem("gt_admin", "true");
    sessionStorage.setItem("gt_admin_token", fakeToken);
    sessionStorage.setItem("gt_user", user);
  }, createFakeJwt());

  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = request.url();
    let pathname = "";
    try {
      pathname = new URL(url).pathname;
    } catch {
      pathname = "";
    }
    if (!pathname.startsWith("/api/")) {
      await route.continue();
      return;
    }

    if (url.includes("/api/products/admin/list")) {
      const storageKey = new URL(url).searchParams.get("storageKey");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: storageKey === "gt_treks" ? [VASOTA] : [] }),
      });
      return;
    }

    if (request.method() === "POST" && url.includes("/api/products/admin/upsert")) {
      const payload = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: payload?.item || {} }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.goto("/admin/treks", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("1 item")).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit Treks" })).toBeVisible();
  return dialogs;
}

test("updating Vasota keeps Moderate, a decimal rating, and still posts", async ({ page }) => {
  const dialogs = await openVasotaEditor(page);

  const difficulty = page.locator("div.col-md-4", { hasText: "Difficulty" }).locator("select");
  await expect(difficulty).toHaveValue("Moderate");
  await expect(difficulty.locator("option")).toContainText(["Moderate (current value)"]);

  const endurance = page.locator("div.col-md-4", { hasText: "Endurance Level" }).locator("select");
  await expect(endurance).toHaveValue(ENDURANCE);
  await expect(endurance.locator("option")).toContainText([`${ENDURANCE} (current value)`]);

  const rating = page.locator("div.col-md-4", { hasText: "Rating (1-5)" }).locator("input");
  await expect(rating).toHaveAttribute("step", "any");
  await expect(rating).toHaveValue("4.8");

  const cityPrice = page.getByPlaceholder("Enter Pune price");
  await expect(cityPrice).toHaveAttribute("step", "any");
  await expect(cityPrice).toHaveValue("1499.5");

  const batchPrice = page.locator("div.col-md-3", { hasText: "Batch price" }).locator("input");
  await expect(batchPrice).toHaveAttribute("step", "any");
  await expect(batchPrice).toHaveValue("1800.5");

  const upsert = page.waitForRequest((request) => (
    request.method() === "POST" && request.url().includes("/api/products/admin/upsert")
  ));
  await page.getByRole("button", { name: "Update" }).click();
  const request = await upsert;
  const saved = request.postDataJSON()?.item;

  expect(saved.difficulty).toBe("Moderate");
  expect(saved.enduranceLevel).toBe(ENDURANCE);
  expect(Number(saved.rating)).toBe(4.8);
  expect(JSON.parse(saved.departurePlans).Pune.price).toBe("1499.5");
  expect(JSON.parse(saved.trekDateBatches)[0].price).toBe("1800.5");
  await expect(page.getByText("Treks updated successfully.")).toBeVisible();
  expect(dialogs).toEqual([]);
});

test("a native validation failure names the field and does not post", async ({ page }) => {
  await openVasotaEditor(page);

  let upserts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/api/products/admin/upsert")) upserts += 1;
  });

  await page.getByPlaceholder("https://chat.whatsapp.com/...").fill("not-a-url");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText(/WhatsApp Group Link: .+/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Edit Treks" })).toBeVisible();
  expect(upserts).toBe(0);
});
