import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { catalogApi } from "../../api/catalog.api";
import BookingCTA from "../../components/BookingCTA";
import { toPublicTripCard } from "../../data/catalogHubs";
import { mergeFeaturedTrips } from "../../data/featuredTrips";
import { selectPublicTrips, tripDetailPath } from "../../data/publicTrips";
import { productService } from "../../services/product.service";
import { handleImageError } from "../../utils/imageFallback";
import { useSeo } from "../../seo/useSeo";
import {
  SITE_ORIGIN,
  TRIPS_DESCRIPTION,
  TRIPS_TITLE,
  listJsonLd,
  ogForSlug,
} from "../../seo/publicSeo";

function formatBatch(batch) {
  if (!batch?.date) return "";
  const start = new Date(`${batch.date}T00:00:00`);
  const label = Number.isNaN(start.getTime())
    ? batch.date
    : start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return [batch.departureCity, batch.label, label].filter(Boolean).join(" · ");
}

async function loadTripCards() {
  try {
    const remote = await catalogApi.trips();
    if (Array.isArray(remote) && remote.length > 0) return selectPublicTrips(remote);
  } catch {
    /* fall through to the per-type catalog sync */
  }

  const [treks, camps] = await Promise.all([
    productService.sync("trek", "gt_treks").catch(() => null),
    productService.sync("camping", "gt_camping").catch(() => null),
  ]);

  return selectPublicTrips(
    [...(treks || []), ...(camps || [])]
      .filter((item) => item && item.active !== false)
      .map((item) => toPublicTripCard({ ...item, productType: item.productType || item.product_type }))
  );
}

export default function Trips() {
  const [trips, setTrips] = useState(() => mergeFeaturedTrips([]));
  const tripsOg = ogForSlug("vasota-fort-trek");
  useSeo({
    title: TRIPS_TITLE,
    description: TRIPS_DESCRIPTION,
    canonical: `${SITE_ORIGIN}/trips`,
    image: tripsOg.url,
    imageWidth: tripsOg.width,
    imageHeight: tripsOg.height,
    imageAlt: tripsOg.alt,
    jsonLd: listJsonLd(
      `${SITE_ORIGIN}/trips`,
      "Open Gadvede Trekkers trips",
      trips.map((trip) => ({ name: trip.name, path: tripDetailPath(trip) }))
    ),
  });

  useEffect(() => {
    let cancelled = false;
    loadTripCards()
      .then((cards) => {
        if (!cancelled) setTrips(mergeFeaturedTrips(cards));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container py-4 py-md-5">
      <p className="mb-2" style={{ fontSize: "0.8rem" }}>
        <Link to="/" className="text-success text-decoration-none">Home</Link>
        {" / "}
        <Link to="/treks" className="text-success text-decoration-none">Treks</Link>
        {" / "}
        <span>Trips</span>
      </p>
      <h1 className="fw-bold mb-2">Open trips</h1>
      <p className="text-muted mb-4" style={{ maxWidth: 720 }}>
        Vasota, Harishchandragad, Kalsubai, and New Year beach camping. Each card has the fee, the departure city, and a WhatsApp booking link.
      </p>

      <div className="row g-3">
        {trips.map((trip) => {
          const batchLabel = formatBatch(trip.nextBatch);
          return (
            <div className="col-md-6 col-lg-3" key={trip.slug}>
              <article className="card h-100 border-0 shadow-sm">
                <img
                  src={trip.image}
                  alt={`${trip.name} cover`}
                  onError={handleImageError}
                  style={{ height: 180, objectFit: "cover" }}
                />
                <div className="card-body d-flex flex-column">
                  {trip.difficulty && <span className="badge text-bg-light border align-self-start mb-2">{trip.difficulty}</span>}
                  <h2 className="h5 fw-bold">{trip.name}</h2>
                  <p className="text-muted mb-1">{trip.destination || trip.location}</p>
                  <p className="mb-1">{trip.duration}</p>
                  {trip.price != null && trip.price !== "" && (
                    <p className="fw-bold mb-1">₹{Number(trip.price).toLocaleString("en-IN")} <span className="fw-normal text-muted">onwards</span></p>
                  )}
                  {batchLabel && <p className="small text-success mb-3">Next batch: {batchLabel}</p>}
                  <div className="d-flex flex-wrap gap-2 mt-auto">
                    <Link
                      to={tripDetailPath(trip)}
                      className="btn btn-success flex-grow-1"
                      style={{ minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >
                      View trip
                    </Link>
                    <BookingCTA
                      trek={{
                        name: trip.name,
                        price: trip.nextBatch?.price ?? trip.price,
                        location: trip.nextBatch?.departureCity || trip.destination || trip.location,
                        productType: trip.productType,
                      }}
                      selectedDate={batchLabel || null}
                      label="Book Now"
                      className="btn btn-outline-success flex-grow-1"
                      style={{ minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    />
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}
