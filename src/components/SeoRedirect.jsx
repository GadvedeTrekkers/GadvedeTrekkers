import { Navigate } from "react-router-dom";
import { useSeo } from "../seo/useSeo";
import { SITE_ORIGIN } from "../seo/publicSeo";

/** Client-side replacement for a duplicate URL: canonical points at the target, page is noindexed. */
export default function SeoRedirect({ to }) {
  useSeo({
    title: "Redirecting… | Gadvede Trekkers",
    description: "This page has moved.",
    canonical: `${SITE_ORIGIN}${to}`,
    robots: "noindex, follow",
  });
  return <Navigate to={to} replace />;
}
