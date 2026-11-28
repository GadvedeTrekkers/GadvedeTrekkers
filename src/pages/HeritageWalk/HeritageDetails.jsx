import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { syncProductsFromApi } from "../../api/getAll";
import BookingCTA from "../../components/BookingCTA";
import NotFound from "../NotFound";
import { useSeo } from "../../seo/useSeo";
import { SITE_ORIGIN } from "../../seo/publicSeo";
import { upcomingLabel } from "../../utils/upcomingDate";

const slugOf = (item) =>
  item.slug || String(item.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function findWalk(id) {
  const match = getAdminItems("gt_heritage").find((w) => w.active !== false && slugOf(w) === id);
  return match ? normaliseItem(match) : null;
}

/** /heritage/:id: only walks that exist as published records. Unknown ids show the 404 page (never a fake "added soon" page). */
function HeritageDetails() {
  const { id } = useParams();
  const [synced, setSynced] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    syncProductsFromApi("heritage", "gt_heritage")
      .catch(() => {})
      .finally(() => { if (!cancelled) { setSynced(true); setTick((t) => t + 1); } });
    return () => { cancelled = true; };
  }, [id]);

  const walk = findWalk(id);

  useSeo(
    walk
      ? {
          title: `${walk.name} | Gadvede Trekkers`,
          description: `${walk.name} with Gadvede Trekkers. Book on WhatsApp.`,
          canonical: `${SITE_ORIGIN}/heritage/${id}`,
        }
      : { title: "Page not found | Gadvede Trekkers", description: "This page could not be found.", canonical: null, robots: "noindex, nofollow" }
  );

  if (!walk) {
    if (!synced) return <div className="container py-5 text-center text-muted" data-testid="product-loading">Loading…</div>;
    return (
      <NotFound
        title="We couldn’t find that heritage walk"
        message="This walk is not open for booking. Browse our current trips or message us on WhatsApp."
      />
    );
  }

  const next = upcomingLabel(walk.nextDate);
  return (
    <div className="container py-5 text-center">
      <h1 className="fw-bold mb-3 text-success">{walk.name}</h1>
      <p className="text-muted">{[walk.location, walk.duration].filter(Boolean).join(" · ")}</p>
      {walk.price ? <p className="fs-5 fw-bold">From ₹{walk.price} per person</p> : null}
      <p>{next ? `Next batch: ${walk.nextDate}` : "Dates on request. Message us on WhatsApp."}</p>
      <BookingCTA trek={{ ...walk, nextDate: next, productType: "heritage" }} className="btn btn-success btn-lg" />
      <p className="mt-4"><Link to="/heritage">← All heritage walks</Link></p>
    </div>
  );
}

export default HeritageDetails;
