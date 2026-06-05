import { expect, test } from "@playwright/test";

const LOCAL_ONLY_EVENT = {
  paymentId: "LOCAL-EVT-001",
  trekName: "Local Only Trek",
  eventDate: "2026-06-01",
  participants: 7,
  status: "COMPLETED",
  config: { trekLeaderName: "Rahul Patil" },
  calculations: {},
  payments: [],
};

async function login(page) {
  await page.goto("/employee-login");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.getByPlaceholder("e.g. rahul.patil").fill("rahul.patil");
  await page.locator('input[type="password"]').fill("rahul001");
  await page.getByRole("button", { name: /Sign In/ }).last().click();
  await page.waitForURL("**/employee/dashboard");
}

function setFlags(page) {
  return page.addInitScript(() => {
    localStorage.setItem("gt_feature_backend_event_reads", "true");
    localStorage.setItem("gt_feature_canonical_event_mapper", "true");
    localStorage.setItem("gt_feature_normalized_date_parsing", "true");
  });
}

test("falls back to local events when backend read fails", async ({ page }) => {
  await setFlags(page);
  await page.addInitScript((event) => {
    localStorage.setItem("gt_trek_payments", JSON.stringify([event]));
  }, LOCAL_ONLY_EVENT);
  await page.route("http://localhost:10000/api/notify/leader-treks/**", (route) => route.abort());
  await login(page);
  await expect(page.locator("aside").getByRole("button", { name: /My Treks 1/ })).toBeVisible();
});

test("keeps local events when API returns empty list", async ({ page }) => {
  await setFlags(page);
  await page.addInitScript((event) => {
    localStorage.setItem("gt_trek_payments", JSON.stringify([event]));
  }, LOCAL_ONLY_EVENT);
  await page.route("http://localhost:10000/api/notify/leader-treks/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    })
  );
  await login(page);
  await expect(page.locator("aside").getByRole("button", { name: /My Treks 1/ })).toBeVisible();
});

test("corrupted localStorage does not block backend events", async ({ page }) => {
  await setFlags(page);
  await page.addInitScript(() => {
    localStorage.setItem("gt_trek_payments", "{broken-json");
  });
  await page.route("http://localhost:10000/api/notify/leader-treks/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            eventId: "GT-EVT-REMOTE-1",
            paymentId: "GT-EVT-REMOTE-1",
            trekName: "Backend Trek",
            eventDate: "2026-06-20",
            canonicalEvent: true,
            config: { trekLeaderName: "Rahul Patil" },
          },
        ],
      }),
    })
  );
  await login(page);
  await expect(page.locator("aside").getByRole("button", { name: /My Treks 1/ })).toBeVisible();
});

test("invalid backend payloads do not create visible ghost events", async ({ page }) => {
  await setFlags(page);
  await page.addInitScript(() => {
    localStorage.removeItem("gt_trek_payments");
  });
  await page.route("http://localhost:10000/api/notify/leader-treks/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [{ foo: "bar" }, {}] }),
    })
  );
  await login(page);
  await expect(page.locator("aside").getByRole("button", { name: /My Treks/ })).not.toContainText("1");
});

test("slow backend allows local event count first, then merged count later", async ({ page }) => {
  await setFlags(page);
  await page.addInitScript((event) => {
    localStorage.setItem("gt_trek_payments", JSON.stringify([event]));
  }, LOCAL_ONLY_EVENT);
  await page.route("http://localhost:10000/api/notify/leader-treks/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            eventId: "GT-EVT-REMOTE-1",
            paymentId: "GT-EVT-REMOTE-1",
            trekName: "Backend Trek",
            eventDate: "2026-06-20",
            canonicalEvent: true,
            config: { trekLeaderName: "Rahul Patil" },
          },
        ],
      }),
    });
  });
  await login(page);
  await expect(page.locator("aside").getByRole("button", { name: /My Treks 1/ })).toBeVisible();
  await expect(page.locator("aside").getByRole("button", { name: /My Treks 2/ })).toBeVisible({ timeout: 5000 });
});
