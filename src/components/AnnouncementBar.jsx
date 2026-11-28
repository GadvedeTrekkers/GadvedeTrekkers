/** One-line notice from Admin → Site Content → Announcement bar (t129u). Renders nothing unless published. */
import { useSiteContent } from "../config/siteContent";
import { SmartLink } from "./HomeHero";

export default function AnnouncementBar() {
  const a = useSiteContent("site.announcement");
  if (!a?.text) return null;
  return (
    <div role="note" style={{ background: "#064e3b", color: "#fff", fontSize: "0.85rem", padding: "8px 16px", textAlign: "center", lineHeight: 1.4 }}>
      <span>{a.text}</span>
      {a.link && a.linkLabel ? (
        <>
          {" "}
          <SmartLink to={a.link} style={{ color: "#a7f3d0", fontWeight: 700, textDecoration: "underline" }}>{a.linkLabel}</SmartLink>
        </>
      ) : null}
    </div>
  );
}
