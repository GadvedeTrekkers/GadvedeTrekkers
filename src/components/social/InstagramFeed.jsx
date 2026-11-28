import { useEffect, useRef, useState } from "react";
import { trackEvent } from "../../analytics/tracking";
import "./InstagramFeed.css";
import { CONTACT } from "../../config/contact";

/**
 * "From our Instagram" — latest posts and reels of @gadvede_trekkers.
 * Data: GET {VITE_API_BASE_URL}/api/social/instagram/feed (the backend holds the token and caches ~1 hour).
 * Loads only when the section is about to scroll into view; images are lazy. The whole section stays hidden when the
 * feed isn't configured, the call fails or there are fewer than MIN_ITEMS posts. Nothing personal is tracked:
 * instagram_post_click { media_type, position, placement, page_path } and instagram_follow_click { placement, page_path }.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const PROFILE_URL = () => CONTACT.social.instagram; // Admin → Profile Setup (t129u)
const MIN_ITEMS = 3;
const TYPE_LABEL = { reel: "Reel", video: "Video", carousel: "Album", image: "Photo" };

let feedPromise = null; // one request per page load, shared by every section on the site
function loadInstagramFeed(fetchImpl = globalThis.fetch) {
  if (!API_BASE || !fetchImpl) return Promise.resolve({ items: [] });
  feedPromise ||= fetchImpl(`${API_BASE}/api/social/instagram/feed`)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => ({ items: Array.isArray(j?.data?.items) ? j.data.items : [], profileUrl: j?.data?.profileUrl || PROFILE_URL() }))
    .catch(() => ({ items: [] }));
  return feedPromise;
}

function TypeBadge({ type }) {
  if (type === "image") return null;
  return (
    <span className="ig-type" aria-hidden="true" title={TYPE_LABEL[type]}>
      {type === "carousel" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h11a3 3 0 0 1 3 3v11h-2V6a1 1 0 0 0-1-1H7V3Zm-2 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
      )}
    </span>
  );
}

/**
 * @param {{ placement?: "home"|"trip_page", limit?: number, title?: string, subtitle?: string }} props
 */
export default function InstagramFeed({ placement = "home", limit = 8, title = "From our Instagram", subtitle = "Real trips, real trekkers. Follow us for new batches, reels and trail updates." }) {
  const ref = useRef(null);
  const [feed, setFeed] = useState(null);
  const [broken, setBroken] = useState(() => new Set());

  useEffect(() => {
    const el = ref.current;
    if (!el || !API_BASE) return undefined;
    let alive = true;
    const load = () => loadInstagramFeed().then((f) => { if (alive) setFeed(f); });
    if (typeof IntersectionObserver === "undefined") { load(); return () => { alive = false; }; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); load(); }
    }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => { alive = false; io.disconnect(); };
  }, []);

  const items = (feed?.items || []).filter((it) => !broken.has(it.permalink)).slice(0, limit);
  const visible = items.length >= Math.min(MIN_ITEMS, limit);
  const profileUrl = feed?.profileUrl || PROFILE_URL();

  // Before loading: an empty, zero-height anchor for the observer. After: the section, or nothing at all.
  if (!visible) return <div ref={ref} className="ig-feed-sentinel" aria-hidden="true" />;

  return (
    <section ref={ref} className={`ig-feed ig-feed--${placement}`} aria-labelledby={`ig-feed-title-${placement}`}>
      <div className="container">
        <div className="ig-feed-head">
          <div>
            <h2 className="ig-feed-title" id={`ig-feed-title-${placement}`}>{title}</h2>
            {subtitle && <p className="ig-feed-sub">{subtitle}</p>}
          </div>
          {profileUrl ? <a className="ig-follow" href={profileUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => trackEvent("instagram_follow_click", { placement, page_path: window.location.pathname })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 2c-2.7 0-3 0-4.1.1-1 0-1.8.2-2.4.5-.7.3-1.2.6-1.8 1.2S2.9 5 2.6 5.6c-.3.6-.5 1.4-.5 2.4C2 9 2 9.3 2 12s0 3 .1 4.1c0 1 .2 1.8.5 2.4.3.7.6 1.2 1.2 1.8s1.1.9 1.8 1.2c.6.3 1.4.5 2.4.5 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c1 0 1.8-.2 2.4-.5.7-.3 1.2-.6 1.8-1.2s.9-1.1 1.2-1.8c.3-.6.5-1.4.5-2.4.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c0-1-.2-1.8-.5-2.4-.3-.7-.6-1.2-1.2-1.8S19 2.9 18.4 2.6c-.6-.3-1.4-.5-2.4-.5C15 2 14.7 2 12 2Zm0 1.8c2.7 0 3 0 4 .1.9 0 1.5.2 1.8.3.5.2.8.4 1.1.7.3.3.6.7.7 1.1.1.3.3.9.3 1.8.1 1 .1 1.3.1 4s0 3-.1 4c0 .9-.2 1.5-.3 1.8-.2.5-.4.8-.7 1.1-.3.3-.7.6-1.1.7-.3.1-.9.3-1.8.3-1 .1-1.3.1-4 .1s-3 0-4-.1c-.9 0-1.5-.2-1.8-.3-.5-.2-.8-.4-1.1-.7-.3-.3-.6-.7-.7-1.1-.1-.3-.3-.9-.3-1.8-.1-1-.1-1.3-.1-4s0-3 .1-4c0-.9.2-1.5.3-1.8.2-.5.4-.8.7-1.1.3-.3.7-.6 1.1-.7.3-.1.9-.3 1.8-.3 1-.1 1.3-.1 4-.1Z" /></svg>
            Follow on Instagram
          </a> : null}
        </div>
        <ul className="ig-grid">
          {items.map((it, i) => (
            <li key={it.permalink} className="ig-tile">
              <a href={it.permalink} target="_blank" rel="noopener noreferrer"
                aria-label={`${TYPE_LABEL[it.type] || "Post"} on Instagram${it.caption ? `: ${it.caption}` : ""}`}
                onClick={() => trackEvent("instagram_post_click", { media_type: it.type, position: i + 1, placement, page_path: window.location.pathname })}>
                <img src={it.image} alt="" loading="lazy" decoding="async" width="320" height="320"
                  onError={() => setBroken((b) => new Set(b).add(it.permalink))} />
                <TypeBadge type={it.type} />
                {it.caption && <span className="ig-caption">{it.caption}</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
