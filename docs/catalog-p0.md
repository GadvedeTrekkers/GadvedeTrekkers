# Catalog P0 — trips, batches, and hubs

Public pages and the admin CRM now share one trip catalog: a `products` row is the trip, `product_batches` rows are its dates, and `catalog_hubs` is the category list.

## What changed

- Hubs (stored in `catalog_hubs`, also listed in `shared/catalogHubs.js`):
  - City: Pune Weekend, Mumbai Weekend
  - Region: Himachal, Uttarakhand, Rajasthan, Kerala & South
  - Experience: Camping, Backpacking
  - Seasonal: Seasonal & New Year
- `products` gained `hub_slug`, `destination`, `category`, and `media`.
- `product_batches` gained `end_date` and `departure_city`. Existing date, label, price, seats, and status columns stay in use.
- Public cards read `GET /api/catalog/trips` and `GET /api/products`. `/trips` and `/trips/:hubSlug` are the hub pages. `/treks` can filter with `?hub=`.
- Admin → Treks, Tours, and Camping can set the hub, destination, category, and batches. Saving still uses `POST /api/products/admin/upsert`, which writes the product and replaces that trip’s batches.
- `supabase/migrations/014_catalog_sample_trips.sql` inserts nine original Gadvede Trekkers sample trips. Re-running it does not overwrite a slug that already exists.

Apply `013_catalog_hubs.sql`, then `014_catalog_sample_trips.sql`, in the Supabase SQL editor before expecting the new columns in production. Until those columns exist, the API still saves the hub on the product’s stored form payload and skips unknown columns instead of failing the save.

## How to add a trip

1. Sign in to the admin panel.
2. Open **Treks**, **Tours**, or **Camping**, depending on the trip.
3. Choose **Add New**.
4. Set the name, price, **Catalog hub**, **Destination**, and at least one batch (start date, optional end date, departure city).
5. Save. The public card appears on `/trips/<hub>` and, for treks, on `/treks?hub=<hub>` after the listing refreshes.
6. Open the card. Trek and tour detail pages load that slug from the API. Camping detail does the same when the campsite is not already in the local camping list.

The image gallery on the form is the media list. Uploaded files are not a separate library yet: paste image URLs, or leave the gallery empty and the site shows the Gadvede placeholder.

## Deferred

- **P1.** Retire the hand-coded trek pages (`/treks/rajmachi-fort-trek` and the other fixed routes) and render every detail page from this catalog.
- **P2.** Tie booking seats to `product_batches.seats_available` so a batch closes when it fills.
- **P3.** A media library (Supabase storage) instead of URL fields.
- **P4.** Per-hub SEO landing pages, and removal of the local listing caches once the API is the only reader.
