import { expect, test } from "@playwright/test";

const SEEDED_EMPLOYEE = {
  username: "rahul.patil",
  password: "rahul001",
  name: "Rahul Patil",
};

async function getAdminToken(request) {
  const loginResponse = await request.post("http://localhost:10000/api/auth/admin/login", {
    data: { username: "admin", password: "admin123" },
  });
  const loginBody = await loginResponse.json();
  return loginBody?.data?.token;
}

async function createAndUpdateCanonicalEvent(request) {
  const token = await getAdminToken(request);
  const baseLink = "https://chat.whatsapp.com/write-sync-original";
  const updatedLink = "https://chat.whatsapp.com/write-sync-updated";

  const createResponse = await request.post("http://localhost:10000/api/trek-payments", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      paymentId: "GT-EVT-WRITE-SYNC",
      trekName: "Write Sync Trek",
      trekId: "TREK-WRITE-001",
      eventDate: "2026-06-25",
      participants: 22,
      status: "PENDING",
      config: {
        trekLeaderName: SEEDED_EMPLOYEE.name,
        whatsappGroupLink: baseLink,
      },
      calculations: { totalCost: 5200, leaderFee: 2500 },
      payments: [{ recipientType: "LEADER", amount: 2500, status: "PENDING" }],
      lifecycle: {
        currentStage: "BOOKING_OPEN",
        stageHistory: [{ stage: "CREATED" }, { stage: "BOOKING_OPEN" }],
        tasks: [{ taskKey: "assign_leader", status: "DONE" }],
        notes: "Created from sync test",
      },
      createdBy: "Admin",
      createdByUsername: "admin",
      createdAt: new Date().toISOString(),
    },
  });
  expect(createResponse.ok()).toBeTruthy();

  const updateResponse = await request.patch("http://localhost:10000/api/trek-payments/GT-EVT-WRITE-SYNC", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      config: {
        whatsappGroupLink: updatedLink,
      },
      lifecycle: {
        currentStage: "DEPARTURE",
        notes: "Updated from sync test",
      },
      payments: [{ recipientType: "LEADER", amount: 2500, status: "COMPLETED", method: "UPI", reference: "SYNC123" }],
      status: "IN_PROGRESS",
    },
  });
  expect(updateResponse.ok()).toBeTruthy();

  return updatedLink;
}

async function seedFlags(page) {
  await page.addInitScript(() => {
    localStorage.setItem("gt_feature_backend_event_reads", "true");
    localStorage.setItem("gt_feature_backend_event_writes", "true");
    localStorage.setItem("gt_feature_canonical_event_mapper", "true");
    localStorage.setItem("gt_feature_normalized_date_parsing", "true");
    localStorage.removeItem("gt_trek_payments");
  });
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

function getWhatsAppGroupLink(event) {
  return event?.config?.whatsappGroupLink || event?.config?.paymentConfig?.whatsappGroupLink || "";
}

test("fresh devices see canonical backend event writes and updated WhatsApp links", async ({ page, request }) => {
  const updatedLink = await createAndUpdateCanonicalEvent(request);
  await seedFlags(page);
  const responsePromise = waitForLeaderTreksResponse(page);
  await loginToEmployeePortal(page);

  const remoteEvents = await responsePromise;
  const syncedEvent = remoteEvents.find((event) => (event.trekName || event.trek_name) === "Write Sync Trek");
  const myTreksButton = page.locator("aside").getByRole("button", { name: /My Treks/ });

  expect(syncedEvent).toBeTruthy();
  expect(getWhatsAppGroupLink(syncedEvent)).toBe(updatedLink);
  await expect(myTreksButton).toContainText("My Treks");
});
