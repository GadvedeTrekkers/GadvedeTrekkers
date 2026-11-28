import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CONTACT } from "../config/contact";

/** A site path ("/treks") uses the router; an https link opens in a new tab. */
export function SmartLink({ to, children, ...rest }) {
  if (!to) return null;
  if (to.startsWith("/")) return <Link to={to} {...rest}>{children}</Link>;
  return <a href={to} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
}

/**
 * Home hero. Slides come from Admin → Settings → Site Content → "Hero slides" (t129u); nothing is built in.
 * No slides → a plain banner with the company name from Profile Setup.
 */
export default function HomeHero({ slides = [] }) {
  const [i, setI] = useState(0);
  const count = slides.length;
  useEffect(() => {
    if (count < 2) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  if (!count) {
    return (
      <div className="d-flex align-items-center justify-content-center text-center position-relative" style={{ minHeight: "40vh", background: "linear-gradient(135deg,#064e3b,#047857)" }} data-testid="home-hero-plain">
        <div className="ht-hero-content px-3">
          <h1 className="ht-hero-headline">{CONTACT.companyName}</h1>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/treks" className="ht-hero-cta">Treks →</Link>
            <Link to="/contact" className="ht-hero-cta-outline">Contact</Link>
          </div>
        </div>
      </div>
    );
  }

  const s = slides[Math.min(i, count - 1)];
  return (
    <div className="position-relative" data-testid="home-hero">
      <div className="d-flex align-items-center justify-content-center text-center position-relative" style={{ height: "90vh", overflow: "hidden", background: "#064e3b" }}>
        {s.image && (
          <div className="ht-hero-bg" style={{ position: "absolute", inset: 0, backgroundImage: `url("${encodeURI(s.image)}")`, backgroundSize: "cover", backgroundPosition: "center" }} />
        )}
        <div className="ht-hero-overlay" />
        <div className="ht-hero-content px-3">
          {s.kicker && <span className="ht-hero-kicker">{s.kicker}</span>}
          <h1 className="ht-hero-headline">
            {s.headline}{s.accent ? <>{" "}<span className="ht-accent">{s.accent}</span></> : null}
          </h1>
          {s.subtitle && <p className="ht-hero-sub">{s.subtitle}</p>}
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            {s.ctaLabel && <SmartLink to={s.ctaLink} className="ht-hero-cta">{s.ctaLabel}</SmartLink>}
            {s.cta2Label && <SmartLink to={s.cta2Link} className="ht-hero-cta-outline">{s.cta2Label}</SmartLink>}
          </div>
        </div>
      </div>
      {count > 1 && (
        <div className="carousel-indicators">
          {slides.map((_, n) => (
            <button key={n} type="button" aria-label={`Slide ${n + 1}`} className={n === i ? "active" : ""} onClick={() => setI(n)} />
          ))}
        </div>
      )}
    </div>
  );
}
