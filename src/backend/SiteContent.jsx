/**
 * Admin → Settings → Site Content (Pratik t129u: "Nothing should be in site code. Everything should get managed
 * from admin. No hard coding.").
 * Edits the home page hero/stats/testimonials/services, site-wide claims and footer text, and the About / FAQ /
 * Terms / Privacy / Cancellation pages. Each section has a DRAFT and a LIVE version: Save draft → Publish.
 * "Hide from site" takes the live version down and keeps the draft. Nothing is shown on the site until published.
 * The forms are rendered from shared/siteContent.js (the same schema the server validates with).
 * Only Super Admin / Admin can open it (the server enforces the same). No delete buttons and no export.
 * Contact number, email, address and social links are edited in Profile Setup, not here.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { siteContentApi } from "../api/siteContent.api";
import { getCurrentAdminUser } from "../data/permissionStorage";
import { SITE_CONTENT_SECTIONS, emptyContent, isFilled, sectionFor, validateContent } from "../../shared/siteContent.js";
import "./ProfileSetup.css";
import "./SiteContent.css";

const roleKey = (r) => String(r || "").toLowerCase().replace(/[\s_-]/g, "");
const canEdit = (u) => u?.username === "admin" || ["superadmin", "admin"].includes(roleKey(u?.role));

const fmtWhen = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
};

/** Merge stored content onto the empty shape so every input is controlled. */
function shapeFor(key, content) {
  const base = emptyContent(key);
  if (!content || typeof content !== "object") return base;
  const s = sectionFor(key);
  const out = { ...base };
  for (const f of s.fields) out[f.name] = content[f.name] ?? "";
  if (s.list) {
    out[s.list.name] = (Array.isArray(content[s.list.name]) ? content[s.list.name] : []).map((it) => {
      const item = {};
      for (const f of s.list.fields) item[f.name] = it?.[f.name] ?? "";
      return item;
    });
  }
  return out;
}

function statusOf(row) {
  if (!row?.published) return row?.draft ? { tone: "draft", text: "Draft only" } : { tone: "off", text: "Not set" };
  return row.hasUnpublishedChanges ? { tone: "changes", text: "Live · unpublished changes" } : { tone: "live", text: "Live" };
}

function Field({ field, value, error, onChange, id }) {
  const common = {
    id, className: `ps-input${field.type === "textarea" ? " ps-textarea" : ""}`, value: value ?? "",
    maxLength: field.max, onChange: (e) => onChange(e.target.value),
  };
  return (
    <label className={`ps-field${field.type === "textarea" ? " ps-field--wide" : ""}`} htmlFor={id}>
      <span className="ps-label">{field.label}{field.required ? <span className="ps-req">*</span> : null}</span>
      {field.type === "textarea" ? <textarea {...common} rows={field.max > 1000 ? 6 : 3} /> : <input {...common} type="text" placeholder={field.type === "url" ? "https://… or /path" : ""} />}
      {error ? <span className="ps-error">{error}</span> : null}
    </label>
  );
}

export default function SiteContent() {
  const user = getCurrentAdminUser();
  const allowed = canEdit(user);
  const [rows, setRows] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [activeKey, setActiveKey] = useState(SITE_CONTENT_SECTIONS[0].key);
  const [form, setForm] = useState(() => emptyContent(SITE_CONTENT_SECTIONS[0].key));
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!allowed) return;
    let live = true;
    siteContentApi.list()
      .then((data) => { if (live) setRows(Object.fromEntries((Array.isArray(data) ? data : []).map((r) => [r.key, r]))); })
      .catch((e) => { if (live) setLoadError(e.message || "Could not load site content"); });
    return () => { live = false; };
  }, [allowed]);

  const section = sectionFor(activeKey);
  const row = rows?.[activeKey];

  useEffect(() => {
    setForm(shapeFor(activeKey, row?.draft ?? row?.published));
    setErrors({});
    setDirty(false);
  }, [activeKey, row]);

  const groups = useMemo(() => {
    const out = [];
    for (const s of SITE_CONTENT_SECTIONS) {
      let g = out.find((x) => x.name === s.group);
      if (!g) { g = { name: s.group, items: [] }; out.push(g); }
      g.items.push(s);
    }
    return out;
  }, []);

  if (!allowed) {
    return (
      <div className="ps-page">
        <h1>Site Content</h1>
        <p className="ps-sub">Only Super Admin or Admin can edit site content.</p>
      </div>
    );
  }

  const pick = (key) => {
    if (dirty && !window.confirm("You have unsaved changes in this section. Leave without saving?")) return;
    setNotice(null);
    setForm(shapeFor(key, rows?.[key]?.draft ?? rows?.[key]?.published));
    setActiveKey(key);
  };
  const setTop = (name, v) => { setForm((f) => ({ ...f, [name]: v })); setDirty(true); };
  const setItem = (i, name, v) => {
    setForm((f) => {
      const list = [...f[section.list.name]];
      list[i] = { ...list[i], [name]: v };
      return { ...f, [section.list.name]: list };
    });
    setDirty(true);
  };
  const addItem = () => {
    setForm((f) => {
      const item = Object.fromEntries(section.list.fields.map((fl) => [fl.name, ""]));
      return { ...f, [section.list.name]: [...f[section.list.name], item] };
    });
    setDirty(true);
  };
  const move = (i, dir) => {
    setForm((f) => {
      const list = [...f[section.list.name]];
      const j = i + dir;
      if (j < 0 || j >= list.length) return f;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...f, [section.list.name]: list };
    });
    setDirty(true);
  };

  const updateRow = (data) => setRows((r) => ({ ...(r || {}), [data.key]: data }));

  const run = async (kind, fn, okText) => {
    setBusy(kind); setNotice(null);
    try {
      const data = await fn();
      updateRow(data);
      setNotice({ tone: "ok", text: okText });
    } catch (e) {
      if (e.errors) setErrors(e.errors);
      setNotice({ tone: "error", text: e.message || "Something went wrong" });
    } finally {
      setBusy("");
    }
  };

  const saveDraft = () => {
    const { errors: errs, content } = validateContent(activeKey, form);
    setErrors(errs);
    if (Object.keys(errs).length) { setNotice({ tone: "error", text: "Please fix the highlighted fields" }); return; }
    run("save", () => siteContentApi.saveDraft(activeKey, content), "Draft saved. It is not on the site until you publish it.");
  };
  const publish = () => {
    if (dirty) { setNotice({ tone: "error", text: "Save the draft first, then publish." }); return; }
    run("publish", () => siteContentApi.publish(activeKey), "Published. The site shows it within about a minute.");
  };
  const hide = () => {
    if (!window.confirm("Take this section off the website? Your draft is kept and you can publish it again.")) return;
    run("hide", () => siteContentApi.hide(activeKey), "Hidden from the site. The draft is kept.");
  };

  const st = statusOf(row);
  const canPublish = Boolean(row?.draft) && isFilled(activeKey, row?.draft) && (!row?.published || row?.hasUnpublishedChanges) && !dirty;
  const list = section.list ? (form?.[section.list.name] || []) : null;

  return (
    <div className="ps-page sc-page">
      <div className="ps-header">
        <div>
          <h1 style={{ margin: 0 }}>Site Content</h1>
          <p className="ps-sub">Text, numbers and pages shown on the website. Nothing appears on the site until you publish it.
            Phone, email, address and social links are in <Link to="/admin/profile-setup">Profile Setup</Link>; trips, tours, rentals and heritage walks are in their own Listings pages.</p>
        </div>
      </div>

      {loadError ? <div className="sc-banner sc-banner--error" role="alert">{loadError}</div> : null}

      <div className="sc-layout">
        <nav className="sc-nav" aria-label="Site content sections">
          {groups.map((g) => (
            <div key={g.name} className="sc-nav-group">
              <div className="sc-nav-title">{g.name}</div>
              {g.items.map((s) => {
                const sst = statusOf(rows?.[s.key]);
                return (
                  <button key={s.key} type="button" className={`sc-nav-item${s.key === activeKey ? " sc-nav-item--on" : ""}`} onClick={() => pick(s.key)}>
                    <span>{s.label}</span>
                    <span className={`sc-pill sc-pill--${sst.tone}`}>{rows ? sst.text : "…"}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <section className="ps-card sc-editor" aria-labelledby="sc-title">
          <div className="sc-editor-head">
            <div>
              <h2 id="sc-title" className="ps-card-title">{section.label} <span className={`sc-pill sc-pill--${st.tone}`}>{rows ? st.text : "Loading…"}</span></h2>
              {section.help ? <p className="ps-note">{section.help}</p> : null}
              <p className="ps-help">
                {row?.updatedAt ? <>Draft saved {fmtWhen(row.updatedAt)}{row.updatedBy ? ` by ${row.updatedBy}` : ""}. </> : null}
                {row?.publishedAt && row?.published ? <>Published {fmtWhen(row.publishedAt)}{row.publishedBy ? ` by ${row.publishedBy}` : ""}. </> : null}
                {section.path && row?.published ? <a href={section.path} target="_blank" rel="noreferrer">View page ↗</a> : null}
              </p>
            </div>
          </div>

          {section.fields.length ? (
            <div className="ps-grid">
              {section.fields.map((f) => (
                <Field key={f.name} id={`sc-${f.name}`} field={f} value={form[f.name]} error={errors[f.name]} onChange={(v) => setTop(f.name, v)} />
              ))}
            </div>
          ) : null}

          {section.list ? (
            <div className="ps-mt">
              <div className="sc-list-head">
                <strong>{section.list.label}</strong>
                <span className="ps-help">{list.length} / {section.list.max}. To drop one, clear its fields; empty {section.list.itemLabel.toLowerCase()}s are not saved.</span>
              </div>
              {errors[section.list.name] ? <div className="ps-error">{errors[section.list.name]}</div> : null}
              {list.length === 0 ? <p className="ps-help">None yet.</p> : null}
              {list.map((item, i) => (
                <fieldset key={i} className="sc-item">
                  <legend>{section.list.itemLabel} {i + 1}</legend>
                  <div className="sc-item-tools">
                    <button type="button" className="ps-btn ps-btn--ghost sc-small" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${section.list.itemLabel} ${i + 1} up`}>↑</button>
                    <button type="button" className="ps-btn ps-btn--ghost sc-small" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Move ${section.list.itemLabel} ${i + 1} down`}>↓</button>
                  </div>
                  <div className="ps-grid">
                    {section.list.fields.map((f) => (
                      <Field key={f.name} id={`sc-${i}-${f.name}`} field={f} value={item[f.name]} error={errors[`${section.list.name}.${i}.${f.name}`]} onChange={(v) => setItem(i, f.name, v)} />
                    ))}
                  </div>
                </fieldset>
              ))}
              {list.length < section.list.max ? (
                <button type="button" className="ps-btn ps-btn--ghost" onClick={addItem}>+ Add {section.list.itemLabel.toLowerCase()}</button>
              ) : null}
            </div>
          ) : null}

          {notice ? <div className={`sc-banner sc-banner--${notice.tone}`} role="status">{notice.text}</div> : null}

          <div className="sc-actions">
            <button type="button" className="ps-btn ps-btn--primary" onClick={saveDraft} disabled={Boolean(busy) || !rows}>{busy === "save" ? "Saving…" : "Save draft"}</button>
            <button type="button" className={`ps-btn ps-btn--ghost${canPublish ? "" : " ps-btn--disabled"}`} onClick={publish} disabled={Boolean(busy) || !canPublish}>{busy === "publish" ? "Publishing…" : "Publish"}</button>
            {row?.published ? (
              <button type="button" className="ps-btn ps-btn--ghost" onClick={hide} disabled={Boolean(busy)}>{busy === "hide" ? "Hiding…" : "Hide from site"}</button>
            ) : null}
            {dirty ? <span className="ps-help">Unsaved changes</span> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
