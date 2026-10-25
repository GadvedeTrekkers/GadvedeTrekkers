import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { catalogApi } from "../../api/catalog.api";
import { CATALOG_HUBS, hubBySlug, inferHubSlug, toPublicTripCard } from "../../data/catalogHubs";
import { productService } from "../../services/product.service";
import { handleImageError, withFallbackImages } from "../../utils/imageFallback";

const KIND_LABEL = {
  city: "City hub",
  region: "Region",
  experience: "Experience",
  seasonal: "Seasonal",
};

function detailPath(trip) {
  const slug = trip.slug || "";
  if (trip.productType === "camping") return `/camping/${slug}`;
  if (trip.productType === "tour") return `/tours/${slug}`;
  return `/treks/${slug}`;
}

function formatBatch(batch) {
  if (!batch?.date) return "";
  const start = new Date(`${batch.date}T00:00:00`);
  const label = Number.isNaN(start.getTime())
    ? batch.date
    : start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return [batch.departureCity, batch.label, label].filter(Boolean).join(" · ");
}

async function loadTripCards(hubSlug) {
  try {
    const remote = await catalogApi.trips(hubSlug ? { hub: hubSlug } : {});
    if (Array.isArray(remote) && remote.length > 0) return remote;
  } catch {
    /* fall through to the per-type catalog sync */
  }

  const [treks, tours, camps] = await Promise.all([
    productService.sync("trek", "gt_treks").catch(() => null),
    productService.sync("tour", "gt_tours").catch(() => null),
    productService.sync("camping", "gt_camping").catch(() => null),
  ]);

  return [...(treks || []), ...(tours || []), ...(camps || [])]
    .filter((item) => item && item.active !== false)
    .map((item) => toPublicTripCard({ ...item, productType: item.productType || item.product_type }))
    .filter((trip) => (hubSlug ? inferHubSlug(trip) === hubSlug : true));
}

export default function Trips() {
  const { hubSlug } = useParams();
  const activeHub = hubBySlug(hubSlug);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = activeHub
      ? `${activeHub.name} trips | Gadvede Trekkers`
      : "Trips | Gadvede Trekkers";
  }, [activeHub]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadTripCards(activeHub ? activeHub.slug : "")
      .then((cards) => {
        if (!cancelled) setTrips(cards);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeHub]);

  const grouped = useMemo(() => {
    if (activeHub) return [{ hub: activeHub, trips }];
    return CATALOG_HUBS.map((hub) => ({
      hub,
      trips: trips.filter((trip) => inferHubSlug(trip) === hub.slug),
    }));
  }, [activeHub, trips]);

  if (hubSlug && !activeHub) {
    return (
      <section className="container py-5">
        <h1 className="h3">That trip hub is not on Gadvede Trekkers.</h1>
        <Link to="/trips" className="btn btn-success mt-3">Browse trip hubs</Link>
      </section>
    );
  }

  return (
    <section className="container py-4 py-md-5">
      <p className="mb-2" style={{ fontSize: "0.8rem" }}>
        <Link to="/" className="text-success text-decoration-none">Home</Link>
        {" / "}
        <Link to="/trips" className="text-success text-decoration-none">Trips</Link>
        {activeHub ? ` / ${activeHub.name}` : ""}
      </p>
      <h1 className="fw-bold mb-2">{activeHub ? activeHub.name : "Gadvede trip hubs"}</h1>
      <p className="text-muted mb-4" style={{ maxWidth: 720 }}>
        {activeHub
          ? activeHub.description
          : "Browse Gadvede Trekkers trips by city, region, camping, backpacking, and seasonal batches. Cards on this page come from the shared catalog."}
      </p>

      <div className="d-flex flex-wrap gap-2 mb-4" role="navigation" aria-label="Trip hubs">
        <Link
          to="/trips"
          className={`btn btn-sm ${activeHub ? "btn-outline-success" : "btn-success"}`}
        >
          All hubs
        </Link>
        {CATALOG_HUBS.map((hub) => (
          <Link
            key={hub.slug}
            to={`/trips/${hub.slug}`}
            className={`btn btn-sm ${activeHub?.slug === hub.slug ? "btn-success" : "btn-outline-success"}`}
          >
            {hub.name}
          </Link>
        ))}
      </div>

      {loading && <p className="text-muted">Loading trips…</p>}

      {!loading && grouped.map(({ hub, trips: hubTrips }) => (
        <section key={hub.slug} className="mb-5" aria-labelledby={`hub-${hub.slug}`}>
          {!activeHub && (
            <div className="d-flex justify-content-between align-items-end gap-3 mb-3">
              <div>
                <div className="text-success fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {KIND_LABEL[hub.kind] || "Hub"}
                </div>
                <h2 id={`hub-${hub.slug}`} className="h4 fw-bold mb-1">{hub.name}</h2>
                <p className="text-muted mb-0">{hub.description}</p>
              </div>
              <Link to={`/trips/${hub.slug}`} className="btn btn-outline-success btn-sm">Open hub</Link>
            </div>
          )}

          {hubTrips.length === 0 ? (
            <div className="border rounded-3 p-4 bg-light text-muted">
              No public trips in {hub.name} yet. Add one in Admin → Treks, Tours, or Camping and choose this hub.
            </div>
          ) : (
            <div className="row g-3">
              {hubTrips.map((trip) => {
                const image = withFallbackImages([trip.image])[0];
                const batchLabel = formatBatch(trip.nextBatch);
                return (
                  <div className="col-md-6 col-lg-4" key={trip.id || trip.slug}>
                    <article className="card h-100 border-0 shadow-sm">
                      <img
                        src={image}
                        alt={trip.name}
                        onError={handleImageError}
                        style={{ height: 180, objectFit: "cover" }}
                      />
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex gap-2 flex-wrap mb-2">
                          {trip.category && <span className="badge text-bg-success">{trip.category}</span>}
                          {trip.difficulty && <span className="badge text-bg-light border">{trip.difficulty}</span>}
                        </div>
                        <h3 className="h5 fw-bold">{trip.name}</h3>
                        <p className="text-muted mb-1">{trip.destination || trip.location}</p>
                        <p className="mb-1">{trip.duration}</p>
                        {trip.price != null && trip.price !== "" && (
                          <p className="fw-bold mb-1">₹{Number(trip.price).toLocaleString("en-IN")} <span className="fw-normal text-muted">per person</span></p>
                        )}
                        {batchLabel && <p className="small text-success mb-3">Next batch: {batchLabel}</p>}
                        <Link to={detailPath(trip)} className="btn btn-success mt-auto">View trip</Link>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </section>
  );
}
