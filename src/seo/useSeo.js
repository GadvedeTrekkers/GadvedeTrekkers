import { useEffect } from "react";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_ORIGIN,
  DEFAULT_OG,
  absoluteUrl,
  homeJsonLd,
} from "./publicSeo";

const JSONLD_ID = "gadvede-jsonld";

const DEFAULTS = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  canonical: `${SITE_ORIGIN}/`,
  image: absoluteUrl(DEFAULT_OG.path),
  imageWidth: DEFAULT_OG.width,
  imageHeight: DEFAULT_OG.height,
  imageAlt: DEFAULT_OG.alt,
  type: "website",
  jsonLd: homeJsonLd,
};

function upsertMeta(attr, key, content) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (content == null || content === "") {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", String(content));
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

function writeJsonLd(data) {
  let el = document.getElementById(JSONLD_ID);
  if (!el) {
    el = document.createElement("script");
    el.id = JSONLD_ID;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function applyHead(seo) {
  document.title = seo.title;
  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "robots", "index, follow");
  upsertMeta("property", "og:title", seo.title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:url", seo.canonical);
  upsertMeta("property", "og:type", seo.type || "website");
  upsertMeta("property", "og:image", seo.image);
  upsertMeta("property", "og:image:width", seo.imageWidth);
  upsertMeta("property", "og:image:height", seo.imageHeight);
  upsertMeta("property", "og:image:alt", seo.imageAlt);
  upsertMeta("property", "og:site_name", "Gadvede Trekkers");
  upsertMeta("property", "og:locale", "en_IN");
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", seo.title);
  upsertMeta("name", "twitter:description", seo.description);
  upsertMeta("name", "twitter:image", seo.image);
  upsertMeta("name", "twitter:image:alt", seo.imageAlt);
  upsertCanonical(seo.canonical);
  if (seo.jsonLd) writeJsonLd(seo.jsonLd);
}

/**
 * Updates document head the same way the rest of the SPA already does.
 * react-helmet is not a dependency, so this writes the tags directly.
 */
export function useSeo({
  title,
  description,
  canonical,
  image,
  imageWidth,
  imageHeight,
  imageAlt,
  type = "website",
  jsonLd,
}) {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    applyHead({
      title,
      description,
      canonical,
      image,
      imageWidth,
      imageHeight,
      imageAlt,
      type,
      jsonLd: jsonLdText ? JSON.parse(jsonLdText) : null,
    });
    return () => applyHead(DEFAULTS);
  }, [title, description, canonical, image, imageWidth, imageHeight, imageAlt, type, jsonLdText]);
}
