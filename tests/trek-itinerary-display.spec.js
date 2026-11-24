import { expect, test } from "@playwright/test";

const PUNE_ITINERARY = `Day 1|09:00 PM|Report to the Gadvede trek leaders at Fergusson College Main Gate, FC Road, Pune (https://goo.gl/maps/53XNsyDPwcSVReZW9) for attendance.
Day 1|09:30 PM|Pick-up from Nashik Phata.

Keep your ID ready
Day 2|03:30 AM|Arrive at Bari base village.
Day 2||Rest before the climb
Day 2|05:00 AM|Start the climb <script>alert(1)</script>
Day 1|10:15 PM|Late joiners meet the leader`;

const MUMBAI_ITINERARY = `Day 1|08:30 PM|Report at Teen Hath Naka, Thane (https://goo.gl/maps/w5xCKv9A7GTXm3Ju9).
Day 1|09:45 PM|Pick-up from Kalyan Bypass.
Day 2|06:00 AM|Reach the Kalsubai summit.`;

const HARISH_LEGACY = `Pune|Day 1|07:30 PM|Depart from Shivajinagar
Keep the group together
Pune|Day 2|06:00 AM|Start the climb toward the caves
Pune|Day 1|08:15 PM|Pickup at Kothrud (https://maps.google.com/maps?q=kothrud)
Mumbai|Day 1|08:00 PM|Report at Dadar

Mumbai|Day 2|07:00 AM|Breakfast at the base`;

function trekProduct({ slug, name, departurePlans, itinerary, description }) {
  return {
    id: slug,
    slug,
    name,
    productType: "trek",
    location: "Maharashtra",
    difficulty: "Medium",
    duration: "1 Night / 1 Day",
    altitude: "1,646 m",
    price: 1399,
    originalPrice: 1599,
    description,
    about: description,
    image: "https://www.gadvede.com/trips/kalsubai.jpg",
    imageGallery: JSON.stringify(["https://www.gadvede.com/trips/kalsubai.jpg"]),
    active: true,
    rating: 4.8,
    reviews: 120,
    departurePlans,
    itinerary,
    trekDateBatches: "[]",
  };
}

const products = {
  "kalsubai-peak-trek": trekProduct({
    slug: "kalsubai-peak-trek",
    name: "Kalsubai Peak Trek",
    description: "Night trek to the highest peak in Maharashtra.",
    departurePlans: JSON.stringify({
      Mumbai: { price: 1399, pickupPoints: [], itinerary: MUMBAI_ITINERARY },
      Pune: { price: 1399, pickupPoints: [], itinerary: PUNE_ITINERARY },
    }),
    itinerary: "Pune|Day 1|01:00 AM|LEGACY SHOULD NOT SHOW",
  }),
  "harishchandragad-trek": trekProduct({
    slug: "harishchandragad-trek",
    name: "Harishchandragad Trek",
    description: "A fort trek above the Malshej ghat.",
    departurePlans: JSON.stringify({
      Pune: { price: 1449, pickupPoints: [], itinerary: "" },
    }),
    itinerary: HARISH_LEGACY,
  }),
};

function isProductApi(url) {
  const path = new URL(url).pathname;
  return path === "/api/products" || path.startsWith("/api/products/");
}

async function installProductRoutes(page) {
  await page.route(isProductApi, async (route) => {
    const request = route.request();
    if (request.method() !== "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: null }),
      });
      return;
    }
    const url = new URL(request.url());
    const slug = url.pathname.split("/").filter(Boolean).pop();
    const product = url.pathname.includes("/api/products/") ? products[slug] : null;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: product || Object.values(products) }),
    });
  });
}

test.describe("public trek itinerary", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", () => {
      throw new Error("Itinerary text opened a script dialog");
    });
    await installProductRoutes(page);
  });

  test("groups each day once and linkifies map URLs on the departure picker", async ({ page }) => {
    await page.goto("/treks/kalsubai-peak-trek", { waitUntil: "domcontentloaded" });
    await page.getByRole("tab", { name: "Itinerary" }).click();
    await expect(page.getByText("Report at Teen Hath Naka, Thane")).toBeVisible();

    await page.locator(".td-itinerary-option", { hasText: "From Pune" }).click();
    await expect(page.getByText("Fergusson College Main Gate")).toBeVisible();
    await expect(page.getByText("LEGACY SHOULD NOT SHOW")).toHaveCount(0);

    const titles = page.locator(".td-timeline-day-title");
    await expect(titles).toHaveText(["Day 1", "Day 2"]);

    const timeline = page.locator(".td-timeline");
    const text = await timeline.innerText();
    expect(text.indexOf("Late joiners meet the leader")).toBeLessThan(text.indexOf("Day 2"));
    expect(text.indexOf("Day 2")).toBeLessThan(text.indexOf("Rest before the climb"));
    expect(text.indexOf("Rest before the climb")).toBeLessThan(text.indexOf("Start the climb"));
    await expect(timeline).toContainText("Keep your ID ready");
    await expect(timeline).toContainText("alert(1)");

    const html = await timeline.innerHTML();
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");

    const mapLink = timeline.getByRole("link", { name: /View on map/ });
    await expect(mapLink).toHaveCount(1);
    await expect(mapLink).toHaveAttribute("href", "https://goo.gl/maps/53XNsyDPwcSVReZW9");
    await expect(mapLink).toHaveAttribute("target", "_blank");
    await expect(mapLink).toHaveAttribute("rel", "noopener noreferrer");

    await page.locator(".td-itinerary-option", { hasText: "From Mumbai" }).click();
    await expect(titles).toHaveText(["Day 1", "Day 2"]);
    await expect(page.getByText("Pick-up from Kalyan Bypass.")).toBeVisible();
    await expect(page.getByText("Fergusson College Main Gate")).toHaveCount(0);
  });

  test("reads the legacy combined itinerary when a departure plan has no text", async ({ page }) => {
    await page.goto("/treks/harishchandragad-trek", { waitUntil: "domcontentloaded" });
    await page.getByRole("tab", { name: "Itinerary" }).click();
    await expect(page.getByText("Depart from Shivajinagar")).toBeVisible();

    const titles = page.locator(".td-timeline-day-title");
    await expect(titles).toHaveText(["Day 1", "Day 2"]);
    const text = await page.locator(".td-timeline").innerText();
    expect(text.indexOf("Keep the group together")).toBeLessThan(text.indexOf("Pickup at Kothrud"));
    expect(text.indexOf("Pickup at Kothrud")).toBeLessThan(text.indexOf("Day 2"));

    const mapLink = page.locator(".td-timeline").getByRole("link", { name: /View on map/ });
    await expect(mapLink).toHaveAttribute("href", "https://maps.google.com/maps?q=kothrud");
    await expect(mapLink).toHaveAttribute("target", "_blank");
    await expect(mapLink).toHaveAttribute("rel", "noopener noreferrer");

    await page.locator(".td-itinerary-option", { hasText: "From Mumbai" }).click();
    await expect(titles).toHaveText(["Day 1", "Day 2"]);
    await expect(page.getByText("Report at Dadar")).toBeVisible();
    await expect(page.getByText("Breakfast at the base")).toBeVisible();
    await expect(page.getByText("Depart from Shivajinagar")).toHaveCount(0);
  });
});
