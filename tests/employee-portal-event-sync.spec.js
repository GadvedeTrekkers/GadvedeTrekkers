import { expect, test } from "@playwright/test";

const SEEDED_EMPLOYEE = {
  username: "rahul.patil",
  password: "rahul001",
  name: "Rahul Patil",
};

const LOCAL_ONLY_EVENT = {
  paymentId: "LOCAL-EVT-001",
  trekName: "Local Only Trek",
  eventDate: "2026-06-01",
  participants: 7,
  status: "COMPLETED",
  config: {
    trekLeaderName: SEEDED_EMPLOYEE.name,
    whatsappGroupLink: "https://chat.whatsapp.com/local-only",
    vendorName: "Shivaji Travels",
  },
  calculations: {},
  payments: [],
};

const LEGACY_LOCAL_COPY_OF_BACKEND_EVENT = {
  paymentId: "LOCAL-EVT-MIGRATION-001",
  trekName: "Kalsubai Trek",
  eventDate: "2026-06-20",
  participants: 24,
  status: "UPCOMING",
  config: {
    trekLeaderName: SEEDED_EMPLOYEE.name,
    whatsappGroupLink: "https://chat.whatsapp.com/local-copy",
    vendorName: "Shivaji Travels",
  },
  calculations: {},
  payments: [],
};

async function ensureBackendEvent(request) {
  const loginResponse = await request.post("http://localhost:10000/api/auth/admin/login", {
    data: { username: "admin", password: "admin123" },
  });
  const loginBody = await loginResponse.json();
  const token = loginBody?.data?.token;

  await request.post("http://localhost:10000/api/trek-payments", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      paymentId: "GT-EVT-VALIDATE",
      trekName: "Kalsubai Trek",
      trekId: "TREK-001",
      eventDate: "2026-06-20",
      participants: 24,
      status: "UPCOMING",
      config: {
        trekLeaderName: SEEDED_EMPLOYEE.name,
        whatsappGroupLink: "https://chat.whatsapp.com/test",
        vendorName: "Shivaji Travels",
      },
      calculations: { leaderFee: 2500 },
      payments: [{ recipientType: "LEADER", amount: 2500 }],
      createdBy: "Admin",
      createdByUsername: "admin",
      createdAt: new Date().toISOString(),
    },
  });
}

async function seedFlags(page, { includeLocalEvent }) {
  await page.addInitScript(({ includeLocalEvent, localEvent }) => {
    localStorage.setItem("gt_feature_backend_event_reads", "true");
    localStorage.setItem("gt_feature_canonical_event_mapper", "true");
    localStorage.setItem("gt_feature_normalized_date_parsing", "true");

    if (includeLocalEvent) {
      localStorage.setItem("gt_trek_payments", JSON.stringify([localEvent]));
    } else {
      localStorage.removeItem("gt_trek_payments");
    }
  }, { includeLocalEvent, localEvent: LOCAL_ONLY_EVENT });
}

async function seedFlagsWithEvents(page, events) {
  await page.addInitScript(({ seededEvents }) => {
    localStorage.setItem("gt_feature_backend_event_reads", "true");
    localStorage.setItem("gt_feature_canonical_event_mapper", "true");
    localStorage.setItem("gt_feature_normalized_date_parsing", "true");
    localStorage.setItem("gt_trek_payments", JSON.stringify(seededEvents));
  }, { seededEvents: events });
}

async function loginToEmployeePortal(page) {
  await page.goto("/employee-login");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.getByPlaceholder("e.g. rahul.patil").fill(SEEDED_EMPLOYEE.username);
  await page.locator('input[type="password"]').fill(SEEDED_EMPLOYEE.password);
  await page.getByRole("button", { name: /Sign In/ }).last().click();
  await page.waitForURL("**/employee/dashboard");
}

async function waitForLeaderTreksResponse(page) {
  const response = await page.waitForResponse(
    (candidate) =>
      candidate.url().includes("/api/notify/leader-treks/") &&
      candidate.request().method() === "GET"
  );
  const body = await response.json();
  return Array.isArray(body?.data) ? body.data : [];
}

test("shows backend trek events on a fresh browser profile", async ({ page, request }) => {
  await ensureBackendEvent(request);
  await seedFlags(page, { includeLocalEvent: false });
  const responsePromise = waitForLeaderTreksResponse(page);
  await loginToEmployeePortal(page);

  const remoteEvents = await responsePromise;
  const myTreksButton = page.locator("aside").getByRole("button", { name: /My Treks/ });
  expect(remoteEvents.some((event) => (event.trekName || event.trek_name) === "Kalsubai Trek")).toBe(true);
  await expect(myTreksButton).toHaveText(new RegExp(`My Treks\\s*${remoteEvents.length}`));
});

test("merges backend trek events with existing local trek payment records", async ({ page, request }) => {
  await ensureBackendEvent(request);
  await seedFlags(page, { includeLocalEvent: true });
  const responsePromise = waitForLeaderTreksResponse(page);
  await loginToEmployeePortal(page);

  const remoteEvents = await responsePromise;
  const myTreksButton = page.locator("aside").getByRole("button", { name: /My Treks/ });
  expect(remoteEvents.some((event) => (event.trekName || event.trek_name) === "Kalsubai Trek")).toBe(true);
  await expect(myTreksButton).toHaveText(new RegExp(`My Treks\\s*${remoteEvents.length + 1}`));
});

test("deduplicates a legacy local copy when the backend has the canonical event", async ({ page, request }) => {
  await ensureBackendEvent(request);
  await seedFlagsWithEvents(page, [LEGACY_LOCAL_COPY_OF_BACKEND_EVENT]);
  const responsePromise = waitForLeaderTreksResponse(page);
  await loginToEmployeePortal(page);

  const remoteEvents = await responsePromise;
  const remoteKalsubaiCount = remoteEvents.filter((event) => (event.trekName || event.trek_name) === "Kalsubai Trek").length;
  const myTreksButton = page.locator("aside").getByRole("button", { name: /My Treks/ });
  expect(remoteKalsubaiCount).toBeGreaterThan(0);
  await expect(myTreksButton).toHaveText(new RegExp(`My Treks\\s*${remoteEvents.length}`));
});
