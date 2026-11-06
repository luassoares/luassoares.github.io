/* ==========================================================
   Research website — shared script
   Renders nav, footer and page content from the /data files.
   You normally don't need to edit this file.
   ========================================================== */
(function () {
  "use strict";

  /* ---------- Icons ---------- */
  const ICONS = {
    scholar: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3zm-6.8 9.2V16c0 2.2 3 4 6.8 4s6.8-1.8 6.8-4v-3.8L12 16l-6.8-3.8z"/></svg>',
    orcid: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8.3 17H6.7V9.4h1.6V17zM7.5 8.3a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM10 9.4h3.4c3 0 4.6 2 4.6 3.8 0 2-1.6 3.8-4.6 3.8H10V9.4zm1.6 1.4v4.8h1.7c2 0 3-1.2 3-2.4 0-1.3-1-2.4-3-2.4h-1.7z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 2H3.6C2.7 2 2 2.7 2 3.6v16.8c0 .9.7 1.6 1.6 1.6h16.8c.9 0 1.6-.7 1.6-1.6V3.6c0-.9-.7-1.6-1.6-1.6zM8 19H5V9.5h3V19zM6.5 8.2a1.7 1.7 0 1 1 0-3.5 1.7 1.7 0 0 1 0 3.5zM19 19h-3v-4.6c0-1.1 0-2.5-1.5-2.5S12.7 13 12.7 14.3V19h-3V9.5h2.8v1.3h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.6 2 3.6 4.7V19z"/></svg>',
    lattes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m6 6-6-6 6-6"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };

  /* ---------- Helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const getJSON = (path) => fetch(path, { cache: "no-cache" }).then((r) => {
    if (!r.ok) throw new Error(path + " → " + r.status);
    return r.json();
  });
  const fmtDate = (iso) => {
    if (!iso) return "";
    if (/^\d{4}$/.test(iso)) return iso;
    const d = new Date(iso.length === 7 ? iso + "-01" : iso);
    return isNaN(d) ? iso : d.toLocaleDateString("en-GB", iso.length === 7 ? { month: "short", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" });
  };

  /* ---------- Theme ---------- */
  function storedTheme() { try { return localStorage.getItem("theme"); } catch (e) { return null; } }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    const b = $("#theme-btn"); if (b) b.innerHTML = t === "dark" ? ICONS.sun : ICONS.moon;
  }
  const initialTheme = storedTheme() || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", initialTheme);

  /* ---------- Layout: nav + footer ---------- */
  const PAGES = [
    ["index.html", "About"],
    ["publications.html", "Publications"],
    ["tutorials.html", "Tutorials & Pipelines"],
    ["cv.html", "CV"]
  ];

  function renderLayout(profile) {
    const page = document.body.dataset.page;
    const nav = document.createElement("header");
    nav.className = "nav";
    nav.innerHTML = `
      <div class="container">
        <a class="brand" href="index.html"><span class="brand-dot"></span>${esc(profile.name)}</a>
        <button class="icon-btn menu-btn" id="menu-btn" aria-label="Menu">${ICONS.menu}</button>
        <nav class="nav-links" id="nav-links">
          ${PAGES.map(([href, label]) => {
            const key = page === "home" ? "index" : page === "tutorial" ? "tutorials" : page;
            return `<a href="${href}" class="${href === key + ".html" ? "active" : ""}">${label}</a>`;
          }).join("")}
          <button class="icon-btn" id="theme-btn" aria-label="Toggle dark mode"></button>
        </nav>
      </div>`;
    document.body.prepend(nav);
    applyTheme(document.documentElement.getAttribute("data-theme"));
    $("#theme-btn").onclick = () => {
      const t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(t); try { localStorage.setItem("theme", t); } catch (e) {}
    };
    $("#menu-btn").onclick = () => $("#nav-links").classList.toggle("open");

    const foot = document.createElement("footer");
    foot.innerHTML = `
      <div class="container">
        <div>© ${new Date().getFullYear()} ${esc(profile.name)} · ${esc(profile.affiliation)}</div>
        <div class="social">${socialLinks(profile)}</div>
      </div>`;
    document.body.append(foot);
  }

  function socialLinks(p) {
    const links = (p.links || []).map((l) =>
      `<a href="${esc(l.url)}" target="_blank" rel="noopener" title="${esc(l.label)}" aria-label="${esc(l.label)}">${ICONS[l.icon] || ICONS.arrow}</a>`);
    if (p.email) links.unshift(`<a href="mailto:${esc(p.email)}" title="Email" aria-label="Email">${ICONS.mail}</a>`);
    return links.join("");
  }

  /* ---------- Publication rendering ---------- */
  // Your name variants to highlight in author lists:
  const ME = ["Luana Soares", "Soares LS", "Soares L", "L. S. Soares", "Luana Sousa Soares", "Luana S. Soares"];
  let SITE_EMAIL = "";
  function highlightMe(authors) {
    let out = esc(authors);
    ME.forEach((n) => { out = out.split(esc(n)).join(`<span class="me">${esc(n)}</span>`); });
    return out;
  }
  function pubHTML(p) {
    const links = [];
    const doiUrl = p.doi ? "https://doi.org/" + p.doi : "";
    if (doiUrl) links.push(`<a href="${esc(doiUrl)}" target="_blank" rel="noopener">DOI</a>`);
    if (p.url) links.push(`<a href="${esc(p.url)}" target="_blank" rel="noopener">Link</a>`);
    if (p.pdf) links.push(`<a href="${esc(p.pdf)}" target="_blank" rel="noopener">PDF</a>`);
    if (p.request && !p.pdf && SITE_EMAIL) links.push(`<a href="mailto:${esc(SITE_EMAIL)}?subject=${encodeURIComponent("PDF request: " + p.title.replace(/<[^>]+>/g, ""))}">Request PDF</a>`);
    if (p.code) links.push(`<a href="${esc(p.code)}" target="_blank" rel="noopener">Code</a>`);
    if (p.data) links.push(`<a href="${esc(p.data)}" target="_blank" rel="noopener">Data</a>`);
    const badge = p.type && p.type !== "article" ? `<span class="badge ${esc(p.type)}">${esc(p.type)}</span>` : "";
    return `
      <div class="pub">
        <div class="t">${p.title}${badge}</div>
        <div class="a">${highlightMe(p.authors)}</div>
        <div class="v">${esc(p.venue)}${p.year ? ", " + esc(p.year) : ""}</div>
        ${p.note ? `<p class="n">${esc(p.note)}</p>` : ""}
        ${links.length ? `<div class="links">${links.join("")}</div>` : ""}
      </div>`;
  }

  function tutorialCard(t) {
    return `
      <a class="card" href="tutorial.html?t=${encodeURIComponent(t.slug)}">
        <span class="kind ${esc(t.kind)}">${esc(t.kind)}</span>
        <h3>${esc(t.title)}</h3>
        <p class="summary">${esc(t.summary)}</p>
        <div class="foot">
          <div class="chips">${(t.tags || []).map((g) => `<span class="chip">${esc(g)}</span>`).join("")}</div>
          <span>${fmtDate(t.updated)}</span>
        </div>
      </a>`;
  }

  /* ---------- Pages ---------- */
  const pages = {
    async home(profile) {
      $("#hero").innerHTML = `
        <div class="hero-grid">
          <div class="reveal">
            <span class="eyebrow">${esc(profile.title)}</span>
            <h1><span class="name-grad">${esc(profile.name)}</span>${profile.pronouns ? ` <span class="pronouns">(${esc(profile.pronouns)})</span>` : ""}</h1>
            <p class="tagline">${esc(profile.tagline)}</p>
            <div class="meta-row">
              <span>${ICONS.building}${esc(profile.affiliation)}</span>
              <span>${ICONS.pin}${esc(profile.location)}</span>
            </div>
            <div class="btn-row">
              <a class="btn primary" href="publications.html">Publications ${ICONS.arrow}</a>
              <a class="btn" href="tutorials.html">Tutorials & pipelines</a>
              <a class="btn" href="cv.html">CV</a>
            </div>
          </div>
          <div class="photo-col reveal" style="animation-delay:.12s">
            <div class="photo-wrap"><img src="${esc(profile.photo)}" alt="Photo of ${esc(profile.name)}"></div>
            <div class="social">${socialLinks(profile)}</div>
          </div>
        </div>`;

      $("#about").innerHTML = `
        <div>
          <h2>About me</h2>
          ${(profile.bio || []).map((p) => `<p>${p}</p>`).join("")}
          ${(profile.current_projects || []).map((cp) => `<div class="card project-card">
            <span class="eyebrow" style="margin-bottom:.7rem">${esc(cp.label || "Current project")}</span>
            <h3>${cp.title}</h3>
            <p class="muted" style="font-size:.88rem;margin:.1rem 0 .6rem">${esc(cp.funder)}</p>
            <p style="margin:0;font-size:.95rem">${cp.summary}</p>
          </div>`).join("")}
          <h3 style="margin-top:1.6rem">Research interests</h3>
          <div class="chips">${(profile.interests || []).map((i) => `<span class="chip">${esc(i)}</span>`).join("")}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:1.2rem">
        <div class="card"><h2 style="font-size:1.3rem">Contact</h2>
          ${(profile.affiliations || []).map((a) => `<div style="margin-bottom:1rem">
            <div>${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.department)}</a>` : esc(a.department)}</div>
            <div style="font-weight:600">${esc(a.institution)}</div>
            ${(a.address || []).length ? `<div class="muted" style="font-size:.92rem">${a.address.map(esc).join("<br>")}</div>` : ""}
          </div>`).join("")}
          ${profile.email ? `<p style="margin:0"><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a></p>` : ""}
          ${profile.email_alt ? `<p style="margin:.2rem 0 0"><a href="mailto:${esc(profile.email_alt)}">${esc(profile.email_alt)}</a></p>` : ""}
        </div>
        <div class="card"><h2 style="font-size:1.3rem">Latest news</h2><ul class="news" id="news"></ul></div>
        </div>`;

      const [news, pubs, tuts] = await Promise.all([
        getJSON("data/news.json").catch(() => []),
        getJSON("data/publications.json").catch(() => []),
        getJSON("data/tutorials.json").catch(() => [])
      ]);
      $("#news").innerHTML = news.slice(0, 5).map((n) => `<li><span class="date">${esc(fmtDate(n.date))}</span><span>${n.text}</span></li>`).join("") || '<li class="muted">No news yet.</li>';
      const featured = pubs.filter((p) => p.featured).slice(0, 3);
      $("#featured-pubs").innerHTML = (featured.length ? featured : pubs.slice(0, 3)).map(pubHTML).join("");
      $("#latest-tuts").innerHTML = tuts.slice().sort((a, b) => (b.updated || "").localeCompare(a.updated || "")).slice(0, 3).map(tutorialCard).join("");
    },

    async publications() {
      const pubs = await getJSON("data/publications.json");
      const types = ["all", ...new Set(pubs.map((p) => p.type || "article"))];
      let current = "all", query = "";
      $("#filters").innerHTML = types.map((t) => `<button class="filter ${t === "all" ? "on" : ""}" data-type="${esc(t)}">${t === "all" ? "All" : esc(({ article: "Articles", preprint: "Preprints", conference: "Conferences", thesis: "Theses", chapter: "Book chapters", talk: "Talks" })[t] || t[0].toUpperCase() + t.slice(1))}</button>`).join("");
      $("#count").textContent = `${pubs.length} items`;

      function draw() {
        const q = query.toLowerCase();
        const list = pubs
          .filter((p) => current === "all" || (p.type || "article") === current)
          .filter((p) => !q || [p.title, p.authors, p.venue, p.year].join(" ").toLowerCase().includes(q))
          .sort((a, b) => (b.year || 0) - (a.year || 0));
        const years = [...new Set(list.map((p) => p.year))];
        $("#pub-list").innerHTML = years.map((y) => `
          <div class="year-group"><div class="year-label">${esc(y)}</div>${list.filter((p) => p.year === y).map(pubHTML).join("")}</div>`).join("")
          || '<p class="empty">No publications match your search.</p>';
      }
      $("#filters").onclick = (e) => {
        const b = e.target.closest(".filter"); if (!b) return;
        current = b.dataset.type;
        document.querySelectorAll(".filter").forEach((x) => x.classList.toggle("on", x === b));
        draw();
      };
      $("#search").oninput = (e) => { query = e.target.value; draw(); };
      draw();
    },

    async tutorials() {
      const tuts = await getJSON("data/tutorials.json");
      let current = "all", query = "";
      function draw() {
        const q = query.toLowerCase();
        const list = tuts
          .filter((t) => current === "all" || t.kind === current)
          .filter((t) => !q || [t.title, t.summary, (t.tags || []).join(" ")].join(" ").toLowerCase().includes(q));
        $("#tut-list").innerHTML = list.map(tutorialCard).join("") || '<p class="empty">Nothing here yet.</p>';
      }
      $("#filters").onclick = (e) => {
        const b = e.target.closest(".filter"); if (!b) return;
        current = b.dataset.type;
        document.querySelectorAll(".filter").forEach((x) => x.classList.toggle("on", x === b));
        draw();
      };
      $("#search").oninput = (e) => { query = e.target.value; draw(); };
      draw();
    },

    async tutorial() {
      const slug = new URLSearchParams(location.search).get("t");
      const tuts = await getJSON("data/tutorials.json");
      const meta = tuts.find((t) => t.slug === slug);
      if (!meta) { $("#article").innerHTML = '<h1>Not found</h1><p>This tutorial does not exist. <a href="tutorials.html">See all tutorials</a>.</p>'; return; }
      document.title = meta.title + " · " + document.title;
      const md = await fetch(`tutorials/${encodeURIComponent(slug)}.md`, { cache: "no-cache" }).then((r) => r.text());
      const html = window.marked ? window.marked.parse(md) : `<pre>${esc(md)}</pre>`;
      $("#article").innerHTML = html;
      const h1 = $("#article h1");
      const metaRow = document.createElement("div");
      metaRow.className = "article-meta";
      metaRow.innerHTML = `<span class="kind ${esc(meta.kind)}" style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.2rem .6rem;border-radius:6px">${esc(meta.kind)}</span>
        <span>Updated ${fmtDate(meta.updated)}</span>
        ${(meta.tags || []).map((g) => `<span class="chip">${esc(g)}</span>`).join("")}
        ${meta.repo ? `<a class="btn" style="padding:.3rem .8rem;font-size:.85rem" href="${esc(meta.repo)}" target="_blank" rel="noopener">${ICONS.github} Repository</a>` : ""}`;
      if (h1) h1.after(metaRow); else $("#article").prepend(metaRow);

      // Syntax highlighting + copy buttons
      document.querySelectorAll("#article pre code").forEach((block) => {
        if (window.hljs) window.hljs.highlightElement(block);
        const btn = document.createElement("button");
        btn.className = "copy-btn"; btn.textContent = "Copy";
        btn.onclick = () => navigator.clipboard.writeText(block.innerText).then(() => { btn.textContent = "Copied!"; setTimeout(() => (btn.textContent = "Copy"), 1400); });
        block.parentElement.appendChild(btn);
      });

      // Table of contents
      const heads = [...document.querySelectorAll("#article h2")];
      heads.forEach((h, i) => (h.id = h.id || "s" + i + "-" + h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-")));
      $("#toc").innerHTML = heads.length ? "<strong>On this page</strong>" + heads.map((h) => `<a href="#${h.id}">${esc(h.textContent)}</a>`).join("") : "";
    },

    async cv(profile) {
      const cv = await getJSON("data/cv.json");
      const upd = (() => { const d = new Date((cv.updated || "").slice(0, 7) + "-01"); return isNaN(d) ? cv.updated : d.toLocaleDateString("en-GB", { month: "short" }).slice(0, 3) + "/" + d.getFullYear(); })();
      $("#cv-updated").textContent = upd;
      const dl = $("#cv-download");
      dl.href = profile.cv_pdf;
      fetch(profile.cv_pdf, { method: "HEAD" }).then((r) => { if (!r.ok) dl.style.display = "none"; }).catch(() => (dl.style.display = "none"));
      const pubs = await getJSON("data/publications.json").catch(() => []);
      const linkTxt = (l) => l.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const head = `
        <div class="print-only cv-print-head">
          <h1>${esc(profile.name)}</h1>
          <div class="cv-print-top"><p class="sub">${esc(profile.title)}${profile.pronouns ? " · " + esc(profile.pronouns) : ""}</p><span class="cv-upd">${esc(upd)}</span></div>
          <div class="contact">
            ${(profile.affiliations || []).slice(0, 1).map((a) => `${esc(a.department)}, ${esc(a.institution)} · ${(a.address || []).map(esc).join(", ")}`).join("")}<br>
            ${[profile.email, profile.email_alt].filter(Boolean).map(esc).join(" · ")} · ${esc((profile.website || "").replace(/^https?:\/\//, ""))}<br>
            ${(profile.links || []).map((l) => `${esc(l.label)}: ${esc(linkTxt(l))}`).join(" · ")}
          </div>
        </div>`;
      const cite = (p) => `${highlightMe(p.authors)} (${esc(p.year)}). ${p.title}${/[?!.]$/.test(p.title.replace(/<[^>]+>/g, "")) ? "" : "."} <em>${esc(p.venue)}</em>.${p.doi ? " https://doi.org/" + esc(p.doi) : ""}`;
      const group = (title, list) => list.length ? `<div class="cv-sub">${title}</div><ol class="cv-pubs-list">${list.map((p) => `<li>${cite(p)}</li>`).join("")}</ol>` : "";
      const byYear = (a, b) => (b.year || 0) - (a.year || 0);
      const pubSection = `
        <div class="cv-section print-only cv-pubs">
          <h2>Publications</h2>
          ${group("Peer-reviewed articles", pubs.filter((p) => (p.type || "article") === "article").sort(byYear))}
          ${group("Preprints &amp; manuscripts in revision", pubs.filter((p) => p.type === "preprint").sort(byYear))}
          ${group("Theses", pubs.filter((p) => p.type === "thesis").sort(byYear))}
          ${group("Conference presentations", pubs.filter((p) => p.type === "conference").sort(byYear).map((p) => ({ ...p, authors: p.authors + (p.note ? " [" + p.note + "]" : "") })))}
        </div>`;
      $("#cv-body").innerHTML = head + cv.sections.map((s) => `
        <div class="cv-section">
          <h2>${esc(s.title)}</h2>
          ${s.items.map((it) => `
            <div class="cv-item">
              <div class="when">${esc(it.when || "")}</div>
              <div>
                <div><span class="what">${it.what}</span>${it.where ? ` <span class="where">· ${it.where}</span>` : ""}</div>
                ${it.details ? `<div class="details">${it.details}</div>` : ""}
              </div>
            </div>`).join("")}
        </div>`).join("") + pubSection;
    }
  };

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", async () => {
    let profile;
    try { profile = await getJSON("data/profile.json"); }
    catch (e) {
      document.body.innerHTML = `<div class="container" style="padding:4rem 0"><h1>Can't load site data</h1>
        <p>If you opened this file directly from your computer, run a local server instead:<br>
        <code>python3 -m http.server</code> in the site folder, then open <a href="http://localhost:8000">http://localhost:8000</a>.</p></div>`;
      return;
    }
    SITE_EMAIL = profile.email || "";
    renderLayout(profile);
    const fn = pages[document.body.dataset.page];
    if (fn) fn(profile).catch((e) => console.error(e));
  });
})();
