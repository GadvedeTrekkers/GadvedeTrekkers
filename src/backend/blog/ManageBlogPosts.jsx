import { useCallback, useEffect, useMemo, useState } from "react";
import { blogAdminApi } from "../../api/blog.api";
import { aiApi } from "../../api/ai.api";
import { getCurrentAdminUser } from "../../data/permissionStorage";
import BlogContent from "../../components/blog/BlogContent";
import { BLOG_CATEGORIES, BLOG_LIMITS, emptyPost, publishProblems, slugifyBlog } from "../../../shared/blogPosts.js";
import { headingsOf, wordCount } from "../../../shared/blogContent.js";
import "./blogAdmin.css";

/**
 * Admin → Blog (t-AI): blog + SEO article writer with Google Gemini.
 * - "Write with AI": topic / trip / keywords → Gemini draft (title, meta description, slug, headings, FAQ) fills the form.
 * - Every post is saved as a DRAFT. "Published on website" is OFF by default; only Super Admin / Admin can switch it on.
 * - No delete and no export: unpublish (back to draft) or archive instead.
 */
const STATUS_LABEL = { draft: "Draft", published: "Published", archived: "Archived" };
const canPublishRole = (u) => u?.username === "admin" || ["superadmin", "admin"].includes(String(u?.role || "").toLowerCase().replace(/[\s_-]/g, ""));
const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

function Field({ label, hint, error, wide, count, max, children }) {
  return (
    <label className={`bl-field${wide ? " wide" : ""}${error ? " has-error" : ""}`}>
      <span className="bl-label">{label}{max ? <em className={count > max ? "over" : ""}>{count}/{max}</em> : null}</span>
      {children}
      {hint && !error && <span className="bl-hint">{hint}</span>}
      {error && <span className="bl-error">{error}</span>}
    </label>
  );
}

function AiWriter({ trips, status, onDraft, busy, setBusy }) {
  const [w, setW] = useState({ topic: "", tripSlug: "", keywords: "", audience: "", length: "medium", staffNote: "" });
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const set = (k, v) => setW((x) => ({ ...x, [k]: v }));
  const ready = status?.enabled && status?.keyConfigured;
  const go = async () => {
    setBusy(true); setError(""); setWarnings([]);
    try {
      const d = await aiApi.blogDraft(w);
      setWarnings(d.warnings || []);
      onDraft(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="bl-card bl-ai" aria-label="Write with AI">
      <header className="bl-card-head">
        <div>
          <h3>✨ Write with AI</h3>
          <p>Give a topic or pick a trek. Gemini writes a draft with title, meta description, slug, headings and FAQ. Prices and dates come only from the trip's admin data.</p>
        </div>
      </header>
      {!status ? <div className="bl-banner">Checking AI status…</div>
        : !status.enabled ? <div className="bl-banner bad"><strong>AI is switched off.</strong> The owner can turn it on with <code>AI_ENABLED=true</code>. You can still write posts by hand below.</div>
          : !status.keyConfigured ? <div className="bl-banner bad"><strong>No Gemini key yet.</strong> Add a free key from aistudio.google.com/apikey.</div>
            : <div className="bl-banner ok">Google Gemini · {status.blogModel} · {status.usedToday}/{status.dailyLimit} AI requests used today</div>}
      <div className="bl-grid">
        <Field label="Topic *" wide><input value={w.topic} maxLength={200} placeholder="e.g. Harishchandragad night trek from Pune — complete guide" onChange={(e) => set("topic", e.target.value)} /></Field>
        <Field label="Trek / trip (optional)" hint="Adds its real prices, dates and pickups">
          <select value={w.tripSlug} onChange={(e) => set("tripSlug", e.target.value)}>
            <option value="">— General article —</option>
            {trips.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Keywords" hint="Comma separated"><input value={w.keywords} maxLength={400} placeholder="harishchandragad trek, treks near pune" onChange={(e) => set("keywords", e.target.value)} /></Field>
        <Field label="Audience"><input value={w.audience} maxLength={160} placeholder="Beginners from Pune" onChange={(e) => set("audience", e.target.value)} /></Field>
        <Field label="Length">
          <select value={w.length} onChange={(e) => set("length", e.target.value)}>
            <option value="short">Short (~600 words)</option><option value="medium">Medium (~1000 words)</option><option value="long">Long (~1500 words)</option>
          </select>
        </Field>
        <Field label="Note for the AI (optional)" wide><input value={w.staffNote} maxLength={400} placeholder="e.g. Mention the Konkan Kada sunrise and the night climb" onChange={(e) => set("staffNote", e.target.value)} /></Field>
      </div>
      <div className="bl-row">
        <button type="button" className="bl-btn primary" disabled={!ready || busy || w.topic.trim().length < 4} onClick={go}>{busy ? "Writing… (up to a minute)" : "✨ Generate draft"}</button>
        {error && <span className="bl-error" role="alert">{error}</span>}
      </div>
      {warnings.length > 0 && (
        <ul className="bl-warnings" aria-label="Check before publishing">
          {warnings.map((x) => <li key={x.message}>⚠️ {x.message}</li>)}
        </ul>
      )}
    </section>
  );
}

function Editor({ initial, trips, status, canPublish, onSaved, onClose }) {
  const [post, setPost] = useState(() => ({ ...emptyPost(), ...initial }));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.id));
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const isNew = !post.id;
  const live = post.status === "published";
  const set = (k, v) => { setDirty(true); setPost((p) => ({ ...p, [k]: v, ...(k === "title" && !slugTouched && !live ? { slug: slugifyBlog(v) } : {}) })); };
  const problems = useMemo(() => publishProblems(post), [post]);
  const words = wordCount(post.content);
  const outline = headingsOf(post.content);

  const applyAi = (d) => {
    const hasText = post.title || post.content;
    if (hasText && !window.confirm("Replace the current title, text and FAQ with the AI draft?")) return;
    setDirty(true);
    setPost((p) => ({
      ...p, title: d.title, metaTitle: d.metaTitle || "", metaDescription: d.metaDescription || "", excerpt: d.excerpt || "",
      slug: live ? p.slug : (d.slug || slugifyBlog(d.title)), content: d.content, faq: d.faq || [], keywords: d.keywords || [],
      relatedTripSlug: d.relatedTripSlug || p.relatedTripSlug, aiGenerated: true, aiModel: d.model || "",
    }));
    setSlugTouched(true);
    setMsg("AI draft added below. Read it, fix anything wrong, then Save draft.");
  };

  const save = async () => {
    setBusy(true); setMsg(""); setErrors({});
    try {
      const body = { ...post, keywords: Array.isArray(post.keywords) ? post.keywords : String(post.keywords).split(",") };
      const saved = isNew ? await blogAdminApi.create(body) : await blogAdminApi.update(post.id, body);
      setPost(saved); setDirty(false);
      setMsg(isNew ? "Saved as a draft. It is NOT on the website until it is published." : "Saved.");
      onSaved(saved);
    } catch (e) {
      setErrors(e.errors || {}); setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status) => {
    const ask = {
      published: "Publish this post on gadvede.com/blog now?",
      draft: "Unpublish? The post goes back to Draft and disappears from the website.",
      archived: "Archive this post? It is hidden from the website and kept in Archived (nothing is deleted).",
    }[status];
    if (dirty) { window.alert("Save your changes first."); return; }
    if (!window.confirm(ask)) return;
    setBusy(true); setMsg("");
    try {
      const saved = await blogAdminApi.setStatus(post.id, status);
      setPost(saved);
      setMsg(status === "published" ? "Published ✓ — live at /blog/" + saved.slug : status === "archived" ? "Archived (hidden, kept)." : "Unpublished — back to Draft.");
      onSaved(saved);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const setFaq = (i, k, v) => set("faq", Array.from({ length: Math.max(post.faq.length, i + 1) }, (_, j) => (j === i ? { ...(post.faq[j] || { q: "", a: "" }), [k]: v } : post.faq[j] || { q: "", a: "" })));
  const faqRows = [...post.faq, { q: "", a: "" }].slice(0, BLOG_LIMITS.faq);
  const kw = Array.isArray(post.keywords) ? post.keywords.join(", ") : post.keywords;
  const snippetTitle = post.metaTitle || post.title || "Post title";

  return (
    <div className="bl-editor">
      <div className="bl-editor-top">
        <button type="button" className="bl-btn ghost" onClick={() => (!dirty || window.confirm("Leave without saving?")) && onClose()}>← All posts</button>
        <span className={`bl-status s-${post.status}`}>{STATUS_LABEL[post.status] || "Draft"}</span>
        {post.aiGenerated && <span className="bl-ai-badge">✨ AI draft{post.aiModel ? ` · ${post.aiModel}` : ""}</span>}
      </div>

      {!live && <AiWriter trips={trips} status={status} onDraft={applyAi} busy={aiBusy} setBusy={setAiBusy} />}

      <div className="bl-layout">
        <section className="bl-card" aria-label="Post">
          <div className="bl-grid">
            <Field label="Title *" wide error={errors.title} count={post.title.length} max={BLOG_LIMITS.title}><input value={post.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Link (slug)" error={errors.slug} hint={live ? "Locked while published" : `gadvede.com/blog/${post.slug || "…"}`}>
              <input value={post.slug} disabled={live} onChange={(e) => { setSlugTouched(true); set("slug", slugifyBlog(e.target.value)); }} />
            </Field>
            <Field label="Category">
              <select value={post.category} onChange={(e) => set("category", e.target.value)}>{BLOG_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label="SEO title" hint="Shown in Google; defaults to the title" error={errors.metaTitle} count={post.metaTitle.length} max={BLOG_LIMITS.metaTitle} wide><input value={post.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} /></Field>
            <Field label="Meta description" hint="140–160 characters works best" error={errors.metaDescription} count={post.metaDescription.length} max={BLOG_LIMITS.metaDescription} wide>
              <textarea rows={2} value={post.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
            </Field>
            <Field label="Excerpt" hint="1–2 sentences for the blog list" error={errors.excerpt} wide><textarea rows={2} value={post.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></Field>
            <Field label="Keywords" hint="Comma separated"><input value={kw} onChange={(e) => set("keywords", e.target.value.split(","))} onBlur={(e) => set("keywords", e.target.value.split(",").map((k) => k.trim()).filter(Boolean))} /></Field>
            <Field label="Related trip">
              <select value={post.relatedTripSlug} onChange={(e) => set("relatedTripSlug", e.target.value)}>
                <option value="">— None —</option>
                {trips.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Cover image link" hint="https://… or a site path like /trips/vasota.jpg (no other operators' photos)" error={errors.coverImageUrl}><input value={post.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} /></Field>
            <Field label="Cover image description (alt)"><input value={post.coverImageAlt} maxLength={BLOG_LIMITS.alt} onChange={(e) => set("coverImageAlt", e.target.value)} /></Field>
            <Field label={`Article (${words} words)`} wide error={errors.content} hint="## Heading · ### Sub-heading · - bullet · **bold** · [link text](/treks/kalsubai-peak-trek)">
              <textarea className="bl-content" rows={18} value={post.content} onChange={(e) => set("content", e.target.value)} />
            </Field>
          </div>
          <div className="bl-faq">
            <div className="bl-label">FAQ (clear both boxes to drop a question)</div>
            {faqRows.map((f, i) => (
              <div className="bl-faq-row" key={i}>
                <input placeholder={`Question ${i + 1}`} value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} />
                <textarea rows={2} placeholder="Answer" value={f.a} onChange={(e) => setFaq(i, "a", e.target.value)} />
              </div>
            ))}
          </div>
        </section>

        <aside className="bl-side">
          <section className="bl-card">
            <h3>Publish</h3>
            <label className={`bl-switch${!canPublish || isNew ? " locked" : ""}`}>
              <input type="checkbox" checked={live} disabled={busy || isNew || !canPublish || post.status === "archived"} onChange={(e) => changeStatus(e.target.checked ? "published" : "draft")} />
              <span className="bl-switch-track"><span className="bl-switch-thumb" /></span>
              <span>Published on website</span>
            </label>
            <p className="bl-hint">
              {isNew ? "Off by default. Save the draft first." : !canPublish ? "🔒 Only Super Admin or Admin can publish." : live ? `Live at gadvede.com/blog/${post.slug}` : "Off — only staff can see this draft."}
            </p>
            {!live && problems.length > 0 && !isNew && (
              <ul className="bl-problems">{problems.map((p) => <li key={p}>Needs: {p}</li>)}</ul>
            )}
            <div className="bl-side-actions">
              <button type="button" className="bl-btn primary" disabled={busy || (!dirty && !isNew)} onClick={save}>{busy ? "Saving…" : isNew ? "Save draft" : "Save changes"}</button>
              <button type="button" className="bl-btn ghost" onClick={() => setPreview((p) => !p)}>{preview ? "Hide preview" : "Preview"}</button>
              {!isNew && canPublish && post.status !== "archived" && <button type="button" className="bl-btn ghost" disabled={busy} onClick={() => changeStatus("archived")}>Archive</button>}
              {!isNew && canPublish && post.status === "archived" && <button type="button" className="bl-btn ghost" disabled={busy} onClick={() => changeStatus("draft")}>Restore to draft</button>}
              {live && <a className="bl-btn ghost" href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">View live ↗</a>}
            </div>
            {msg && <div className="bl-msg" role="status">{msg}</div>}
            {!isNew && <div className="bl-meta">Updated {fmtDate(post.updatedAt)}{post.updatedBy ? ` by ${post.updatedBy}` : ""}{post.publishedAt ? ` · first published ${fmtDate(post.publishedAt)}` : ""}</div>}
          </section>
          <section className="bl-card">
            <h3>Google preview</h3>
            <div className="bl-serp">
              <div className="bl-serp-url">www.gadvede.com › blog › {post.slug || "…"}</div>
              <div className="bl-serp-title">{snippetTitle.length > 60 ? `${snippetTitle.slice(0, 57)}…` : snippetTitle}</div>
              <div className="bl-serp-desc">{post.metaDescription || "Add a meta description."}</div>
            </div>
          </section>
          <section className="bl-card">
            <h3>Headings ({outline.length})</h3>
            {outline.length ? <ol className="bl-outline">{outline.map((h, i) => <li key={i} className={`lvl-${h.type}`}>{h.text}</li>)}</ol> : <p className="bl-hint">Use “## ” to add headings.</p>}
          </section>
        </aside>
      </div>

      {preview && (
        <section className="bl-card bl-preview" aria-label="Preview">
          <div className="bl-preview-tag">Preview — {live ? "live" : "not public"}</div>
          <h1>{post.title || "Post title"}</h1>
          {post.excerpt && <p className="bl-lede">{post.excerpt}</p>}
          <BlogContent markdown={post.content} />
          {post.faq.filter((f) => f.q && f.a).length > 0 && (
            <>
              <h2>Frequently asked questions</h2>
              {post.faq.filter((f) => f.q && f.a).map((f, i) => <details key={i} open><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default function ManageBlogPosts() {
  const user = getCurrentAdminUser();
  const canPublish = canPublishRole(user);
  const [posts, setPosts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);   // post | {} (new)
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPosts((await blogAdminApi.list()) || []); setLoadError(""); } catch (e) { setLoadError(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    load();
    aiApi.trips().then((t) => setTrips(t || [])).catch(() => {});
    aiApi.status().then(setStatus).catch(() => setStatus({ enabled: false }));
  }, [load]);

  const counts = useMemo(() => posts.reduce((a, p) => ({ ...a, [p.status]: (a[p.status] || 0) + 1 }), {}), [posts]);
  const shown = posts.filter((p) => !filter || p.status === filter);
  const onSaved = (saved) => setPosts((list) => (list.some((p) => p.id === saved.id) ? list.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...list]));

  if (editing) {
    return (
      <div className="bl-page">
        <Editor key={editing.id || "new"} initial={editing} trips={trips} status={status} canPublish={canPublish} onSaved={onSaved} onClose={() => { setEditing(null); aiApi.status().then(setStatus).catch(() => {}); }} />
      </div>
    );
  }

  return (
    <div className="bl-page">
      <header className="bl-head">
        <div>
          <h1>📝 Blog</h1>
          <p>Write trek guides and SEO articles — by hand or with AI. Drafts are private; only <strong>Published</strong> posts appear on gadvede.com/blog.</p>
        </div>
        <div className="bl-head-actions">
          <button type="button" className="bl-btn primary" onClick={() => setEditing({})}>✨ New post with AI</button>
        </div>
      </header>

      <div className="bl-tabs" role="tablist" aria-label="Filter posts">
        {[["", "All", posts.length], ["draft", "Drafts", counts.draft || 0], ["published", "Published", counts.published || 0], ["archived", "Archived", counts.archived || 0]].map(([id, label, n]) => (
          <button key={id || "all"} type="button" role="tab" aria-selected={filter === id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label} <span>{n}</span></button>
        ))}
      </div>

      {loading && <div className="bl-banner">Loading posts…</div>}
      {loadError && <div className="bl-banner bad" role="alert">{loadError}</div>}
      {!loading && !loadError && shown.length === 0 && (
        <div className="bl-empty">
          <div>No {filter ? STATUS_LABEL[filter].toLowerCase() : ""} posts yet.</div>
          <button type="button" className="bl-btn primary" onClick={() => setEditing({})}>✨ Write the first one with AI</button>
        </div>
      )}

      <div className="bl-list">
        {shown.map((p) => (
          <article key={p.id} className="bl-item">
            <div className="bl-item-main">
              <div className="bl-item-top">
                <span className={`bl-status s-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                {p.aiGenerated && <span className="bl-ai-badge">✨ AI</span>}
                <span className="bl-item-cat">{p.category}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.metaDescription || p.excerpt || "No description yet."}</p>
              <div className="bl-meta">/blog/{p.slug} · {p.wordCount} words · updated {fmtDate(p.updatedAt)}</div>
            </div>
            <div className="bl-item-actions">
              <button type="button" className="bl-btn" onClick={() => setEditing(p)}>Edit</button>
              {p.status === "published" && <a className="bl-btn ghost" href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">View ↗</a>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
