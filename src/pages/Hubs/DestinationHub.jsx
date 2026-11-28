import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productsApi } from "../../api/products.api";
import { useSeo } from "../../seo/useSeo";
import { DEFAULT_OG, SITE_ORIGIN, absoluteUrl, faqPageNode, organizationNode } from "../../seo/publicSeo";
import { DESTINATION_HUBS, hubBySlug, hubIsIndexable, hubTrips } from "../../../shared/destinationHubs.js";
import { CONTACT, telHref, whatsappHref } from "../../config/contact";
import { handleImageError } from "../../utils/imageFallback";
import "./DestinationHub.css";
import { upcomingLabel } from "../../utils/upcomingDate";
import { useSiteData } from "../../config/siteContent";

const fmtPrice = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) => {
  const dt = new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const KIND_LABEL = { trek: "Trek", tour: "Tour", camping: "Camping" };

/** Module-level cache so moving between hubs does not refetch. */
let productsPromise = null;
function loadProducts() {
  if (!productsPromise) {
    productsPromise = productsApi.getAll().then((rows) => (Array.isArray(rows) ? rows : [])).catch((e) => {
      productsPromise = null;
      throw e;
    });
  }
  return productsPromise;
}

export default function DestinationHub({ slug }) {
  useSiteData(); // re-render when the admin-managed contact details arrive
  const hub = hubBySlug(slug);
  const [products, setProducts] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadProducts()
      .then((rows) => !cancelled && setProducts(rows))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const trips = useMemo(() => (products ? hubTrips(hub, products) : []), [hub, products]);
  const loaded = products !== null;
  const indexable = !loaded || hubIsIndexable(trips);
  const comingSoon = loaded && !hubIsIndexable(trips);
  const faqs = useMemo(() => (loaded ? hub.faq(trips) : []), [hub, trips, loaded]);
  const canonical = `${SITE_ORIGIN}${hub.path}`;
  const ogImage = trips.find((t) => t.image)?.image || absoluteUrl(DEFAULT_OG.path);

  const jsonLd = useMemo(() => {
    const graph = [
      organizationNode,
      {
        "@type": "CollectionPage",
        "@id": `${canonical}#page`,
        url: canonical,
        name: hub.title,
        description: hub.description,
        isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
        publisher: { "@id": `${SITE_ORIGIN}/#organization` },
        ...(trips.length ? { mainEntity: { "@id": `${canonical}#trips` } } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: hub.name, item: canonical },
        ],
      },
    ];
    if (trips.length) {
      graph.push({
        "@type": "ItemList",
        "@id": `${canonical}#trips`,
        name: hub.name,
        numberOfItems: trips.length,
        itemListElement: trips.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: absoluteUrl(t.path) })),
      });
    }
    const faq = faqPageNode(faqs);
    if (faq) graph.push(faq);
    return { "@context": "https://schema.org", "@graph": graph };
  }, [canonical, hub, trips, faqs]);

  useSeo({
    title: hub.title,
    description: hub.description,
    canonical,
    image: ogImage,
    imageAlt: hub.name,
    jsonLd,
    robots: indexable ? "index, follow" : "noindex, follow",
  });

  const related = (hub.related || []).map(hubBySlug).filter(Boolean);

  return (
    <div className="hub-page">
      <section className="hub-hero">
        <div className="container">
          <nav className="hub-crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link> <span aria-hidden="true">/</span> <span>{hub.name}</span>
          </nav>
          <h1>{hub.h1}</h1>
          <p className="hub-lede">{hub.description}</p>
        </div>
      </section>

      <div className="container hub-body">
        <section aria-labelledby="hub-trips-heading" className="hub-trips">
          <div className="hub-section-head">
            <h2 id="hub-trips-heading">{loaded ? (trips.length ? `Open now (${trips.length})` : "Coming soon") : "Loading trips…"}</h2>
            {loaded && <Link to="/trips" className="hub-all">See all trips</Link>}
          </div>

          {comingSoon && (
            <div className="hub-soon" role="status">
              <strong>More {hub.name.toLowerCase()} coming soon.</strong>{" "}
              New dates are being planned. Message us on{" "}
              <a href={whatsappHref(`Hi Gadvede Trekkers! Please tell me when new ${hub.name} dates open.`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>{" "}
              to hear first.
            </div>
          )}

          {failed && !loaded && (
            <p className="hub-soon">We couldn’t load the trips right now. Please see <Link to="/treks">treks</Link>, <Link to="/tours">tours</Link> or <Link to="/camping">camping</Link>.</p>
          )}

          {!loaded && !failed && (
            <div className="hub-grid" aria-hidden="true">
              {[0, 1, 2].map((i) => <div className="hub-card hub-card--skeleton" key={i} />)}
            </div>
          )}

          {trips.length > 0 && (
            <div className="hub-grid">
              {trips.map((t) => (
                <article className="hub-card" key={t.slug}>
                  <Link to={t.path} className="hub-card-img" aria-label={t.name}>
                    {t.image ? <img src={t.image} alt={`${t.name}`} loading="lazy" onError={handleImageError} /> : <span />}
                    {t.kind && <span className="hub-badge">{KIND_LABEL[t.kind]}</span>}
                  </Link>
                  <div className="hub-card-body">
                    <h3><Link to={t.path}>{t.name}</Link></h3>
                    {t.location && <p className="hub-meta">{t.location}</p>}
                    <p className="hub-meta">{[t.duration, t.difficulty].filter(Boolean).join(" · ")}</p>
                    {t.departureCities.length > 0 && <p className="hub-meta">Departs: {t.departureCities.join(", ")}</p>}
                    <div className="hub-card-foot">
                      {t.fromPrice ? (
                        <span className="hub-price">{fmtPrice(t.fromPrice)} <small>{t.priceCity || "onwards"}</small></span>
                      ) : <span />}
                      {upcomingLabel(t.nextDate) && <span className="hub-next">Next: {fmtDate(t.nextDate)}</span>}
                    </div>
                    <Link to={t.path} className="hub-btn">View trip</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="hub-intro" aria-label={`About ${hub.name}`}>
          {hub.intro.map((p, i) => <p key={i}>{p}</p>)}
        </section>

        {faqs.length > 0 && (
          <section className="hub-faq" aria-labelledby="hub-faq-heading">
            <h2 id="hub-faq-heading">Frequently asked questions</h2>
            {faqs.map((f) => (
              <details key={f.question}>
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </section>
        )}

        <section className="hub-cta">
          <h2>Questions before you book?</h2>
          <p>Call or WhatsApp the Gadvede Trekkers team.</p>
          <div className="hub-cta-row">
            <a className="hub-btn" href={whatsappHref(`Hi Gadvede Trekkers! I'm interested in ${hub.name}.`)} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
            <a className="hub-btn hub-btn--ghost" href={telHref(CONTACT.phones[0])}>Call {CONTACT.phones[0]}</a>
            <Link className="hub-btn hub-btn--ghost" to="/register">Paid by bank / UPI? Register</Link>
          </div>
        </section>

        <nav className="hub-related" aria-label="More trip collections">
          <h2>Explore more</h2>
          <ul>
            {related.map((h) => <li key={h.slug}><Link to={h.path}>{h.name}</Link></li>)}
            {DESTINATION_HUBS.filter((h) => h.slug !== hub.slug && !(hub.related || []).includes(h.slug)).map((h) => (
              <li key={h.slug}><Link to={h.path}>{h.name}</Link></li>
            ))}
            <li><Link to="/treks">All treks</Link></li>
            <li><Link to="/tours">All tours</Link></li>
            <li><Link to="/camping">All camping</Link></li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
