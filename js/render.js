/* ==========================================================================
   BWJ-ART — content renderer
   Fetches data/*.json and populates each page's markup. Falls back to the
   static content already baked into the HTML if a fetch fails, so the site
   still works even if the data files are unreachable.
   ========================================================================== */

window.__bwjRenderPresent = true;

window.BWJRender = (function () {

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  async function fetchJSON(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch ' + path + ' (' + res.status + ')');
    return res.json();
  }

  function tagHTML(tags) {
    return (tags || []).map((t) => `<div class="tag">${escapeHTML(t)}</div>`).join('');
  }

  /* Renders a thumbnail <img>, honoring a per-image "rotation" set in the
     CMS (0/90/180/270 clockwise) for photos that were shot sideways.
     180deg needs no layout help (it doesn't change the image's shape), so
     it's just a plain inline transform. 90/270deg swap the image's visual
     width/height, so those get wrapped in a sized container that script.js
     fits to the correct post-rotation box on load (same problem/fix as
     the lightbox — see fitGridRotations in script.js). */
  function thumbImgHTML(src, alt, rotation) {
    const r = Number(rotation) || 0;
    const imgTag = `<img src="${src}" alt="${escapeHTML(alt)}" loading="lazy"${r === 180 ? ' style="transform:rotate(180deg)"' : ''}>`;
    if (r === 90 || r === 270) {
      return `<div class="thumb-rotate-wrap" data-rotation="${r}">${imgTag}</div>`;
    }
    return imgTag;
  }

  function portfolioItemHTML(item, catMap) {
    const collection = (catMap && catMap[item.category]) || item.category;
    if (item.diptych) {
      const imgs = item.images.map((im) => {
        const meta = `${item.materials} · ${item.dimensions} · Collection: ${collection} — ${im.note || item.description}`;
        const r = Number(im.rotation) || 0;
        return `
          <div data-lightbox data-title="${escapeHTML(item.title)}" data-meta="${escapeHTML(meta)}" data-full="${im.src}" data-rotation="${r}">
            ${thumbImgHTML(im.src, im.alt, r)}
          </div>`;
      }).join('');
      return `
        <div class="masonry-item" data-category="${item.category}">
          <div class="diptych-imgs">${imgs}</div>
          <div class="masonry-caption"><div class="cap-title">${escapeHTML(item.title)}</div><div class="cap-meta">${escapeHTML(item.materials)} · ${escapeHTML(collection)}</div>${tagHTML(item.tags)}</div>
        </div>`;
    }
    const meta = `${item.materials} · ${item.dimensions} · Collection: ${collection} — ${item.description}`;
    const rotation = Number(item.rotation) || 0;
    return `
      <div class="masonry-item" data-category="${item.category}" data-lightbox data-title="${escapeHTML(item.title)}" data-meta="${escapeHTML(meta)}" data-full="${item.image}" data-rotation="${rotation}">
        ${thumbImgHTML(item.image, item.alt, rotation)}
        <div class="masonry-caption"><div class="cap-title">${escapeHTML(item.title)}</div><div class="cap-meta">${escapeHTML(item.materials)} · ${escapeHTML(collection)}</div>${tagHTML(item.tags)}</div>
      </div>`;
  }

  let portfolioCache = null;
  async function getPortfolio() {
    if (!portfolioCache) portfolioCache = await fetchJSON('data/portfolio.json');
    return portfolioCache;
  }

  let collectionsCache = null;
  async function getCollections() {
    if (!collectionsCache) collectionsCache = await fetchJSON('data/collections.json');
    return collectionsCache;
  }

  function collectionMap(collections) {
    const map = {};
    (collections.collections || []).forEach((c) => { map[c.slug] = c.label; });
    return map;
  }

  async function renderSite() {
    const site = await fetchJSON('data/site.json');
    const map = {
      'nav-tagline': site.navTagline,
      'footer-tagline': site.footerTagline,
      'footer-copyright': site.footerCopyright,
      'footer-built-with': site.footerBuiltWith,
      'instagram-handle': site.instagramHandle,
      'email': site.email
    };
    document.querySelectorAll('[data-bind]').forEach((el) => {
      const key = el.getAttribute('data-bind');
      if (map[key] !== undefined) el.textContent = map[key];
    });
    document.querySelectorAll('[data-bind-href="instagram-url"]').forEach((el) => {
      el.setAttribute('href', site.instagramUrl);
    });
    document.querySelectorAll('[data-bind-href="email-mailto"]').forEach((el) => {
      el.setAttribute('href', 'mailto:' + site.email);
    });
  }

  async function renderPortfolio() {
    const root = document.getElementById('masonry-root');
    const filtersRoot = document.querySelector('[data-field="gallery-filters"]');
    if (!root && !filtersRoot) return;

    const [data, collections] = await Promise.all([getPortfolio(), getCollections()]);
    const catMap = collectionMap(collections);

    if (root) {
      root.innerHTML = data.items.map((item) => portfolioItemHTML(item, catMap)).join('\n');
    }

    if (filtersRoot) {
      const buttons = ['<button class="active" data-filter="all">All Work</button>']
        .concat((collections.collections || []).map((c) =>
          `<button data-filter="${escapeHTML(c.slug)}">${escapeHTML(c.label)}</button>`
        ));
      filtersRoot.innerHTML = buttons.join('\n');
    }
  }

  async function renderHome() {
    const root = document.getElementById('home-root');
    if (!root) return;
    const [home, portfolio] = await Promise.all([fetchJSON('data/home.json'), getPortfolio()]);

    const heroHeading = root.querySelector('[data-field="hero-heading"]');
    if (heroHeading) {
      // Line 1 (emphasis word + rest) is a flex row spanning the same width
      // as line 2, so its right edge lines up with line 2's — see
      // .hero-line1 in style.css.
      heroHeading.innerHTML = `<span class="hero-line hero-line1"><span class="hero-accent">${escapeHTML(home.heroHeadingEmphasis)}</span><span>${escapeHTML(home.heroHeadingLine1Rest)}</span></span><span class="hero-line hero-line2">${escapeHTML(home.heroHeadingLine2)}</span>`;
    }

    const heroSub = root.querySelector('[data-field="hero-sub"]');
    if (heroSub) heroSub.textContent = home.heroSub;

    const heroMeta = root.querySelector('[data-field="hero-meta"]');
    if (heroMeta) {
      heroMeta.innerHTML = home.heroMeta.map((m) => `<div>${escapeHTML(m.label)}<strong>${escapeHTML(m.value)}</strong></div>`).join('');
    }

    const stmtHeading = root.querySelector('[data-field="statement-heading"]');
    if (stmtHeading) stmtHeading.innerHTML = `${escapeHTML(home.statementHeadingLine1)}<br>${escapeHTML(home.statementHeadingLine2)}`;

    const stmtQuote = root.querySelector('[data-field="statement-quote"]');
    if (stmtQuote) stmtQuote.textContent = home.statementQuote;

    const featured = root.querySelector('[data-field="featured-work"]');
    if (featured) {
      // "Recent Pieces" is fully automatic: it's always the last N items in
      // portfolio.json, reversed so the newest addition shows first. New
      // pieces added through the CMS get appended to the end of the list,
      // so this needs no manual curation.
      const count = home.featuredCount || 3;
      const items = portfolio.items.slice(-count).reverse();
      featured.innerHTML = items.map((item) => {
        const img = item.diptych ? item.images[0].src : item.image;
        const alt = item.diptych ? item.images[0].alt : item.alt;
        const rotation = Number(item.diptych ? item.images[0].rotation : item.rotation) || 0;
        const tag = (item.tags && item.tags[0]) || '';
        // Feature cards have a fixed-size frame (object-fit: cover), so a
        // plain transform is safe here — no risk of overlapping layout
        // like the variable-height masonry grid or lightbox.
        return `
          <div class="feature-card">
            <img src="${img}" alt="${escapeHTML(alt)}" loading="lazy"${rotation ? ` style="transform:rotate(${rotation}deg)"` : ''}>
            <div class="feature-card-label">
              <h4>${escapeHTML(item.title)}</h4>
              <span>${escapeHTML(item.materials)} · ${escapeHTML(tag)}</span>
            </div>
          </div>`;
      }).join('');
    }

    const processSteps = root.querySelector('[data-field="process-steps"]');
    if (processSteps) {
      processSteps.innerHTML = home.processSteps.map((s) => `
        <div class="process-step">
          <span class="step-num">${escapeHTML(s.num)}</span>
          <h4>${escapeHTML(s.title)}</h4>
          <p>${escapeHTML(s.text)}</p>
        </div>`).join('');
    }
  }

  async function renderAbout() {
    const root = document.getElementById('about-root');
    if (!root) return;
    const about = await fetchJSON('data/about.json');

    const intro = root.querySelector('[data-field="page-intro"]');
    if (intro) intro.textContent = about.pageIntro;

    const portrait = root.querySelector('[data-field="portrait"]');
    if (portrait) portrait.setAttribute('src', about.portrait);

    const bio = root.querySelector('[data-field="bio-paragraphs"]');
    if (bio) bio.innerHTML = about.bioParagraphs.map((p) => `<p>${escapeHTML(p)}</p>`).join('');

    const quote = root.querySelector('[data-field="quote"]');
    if (quote) quote.innerHTML = `${escapeHTML(about.quote)}<cite>${escapeHTML(about.quoteAuthor)}</cite>`;

    const stats = root.querySelector('[data-field="stats"]');
    if (stats) {
      stats.innerHTML = about.stats.map((s) => `<div><strong>${escapeHTML(s.value)}</strong><span>${escapeHTML(s.label)}</span></div>`).join('');
    }

    const timelineIntro = root.querySelector('[data-field="timeline-intro"]');
    if (timelineIntro) timelineIntro.textContent = about.timelineIntro;

    const timeline = root.querySelector('[data-field="timeline"]');
    if (timeline) {
      timeline.innerHTML = about.timeline.map((t) => `
        <div class="timeline-row">
          <div class="year">${escapeHTML(t.year)}</div>
          <div>
            <h4>${escapeHTML(t.title)}</h4>
            <p>${escapeHTML(t.text)}</p>
          </div>
        </div>`).join('');
    }

    const exhibitHeading = root.querySelector('[data-field="exhibit-heading"]');
    if (exhibitHeading) exhibitHeading.textContent = about.exhibitHeading;

    const exhibitNote = root.querySelector('[data-field="exhibit-note"]');
    if (exhibitNote) exhibitNote.textContent = about.exhibitNote;

    const exhibitGallery = root.querySelector('[data-field="exhibit-gallery"]');
    if (exhibitGallery) {
      exhibitGallery.innerHTML = about.exhibitGallery.map((e) => `
        <div class="masonry-item" data-lightbox data-title="${escapeHTML(e.title)}" data-meta="${escapeHTML(e.meta)}" data-full="${e.image}">
          <img src="${e.image}" alt="${escapeHTML(e.alt)}">
        </div>`).join('');
    }
  }

  async function renderContact() {
    const root = document.getElementById('contact-root');
    if (!root) return;
    const contact = await fetchJSON('data/contact.json');

    const intro = root.querySelector('[data-field="page-intro"]');
    if (intro) intro.textContent = contact.pageIntro;

    const infoBlock = root.querySelector('[data-field="info-block"]');
    if (infoBlock) {
      infoBlock.innerHTML = `
        <h3>Email</h3>
        <a href="mailto:${escapeHTML(contact.email)}">${escapeHTML(contact.email)}</a>

        <h3>Based</h3>
        <p>${escapeHTML(contact.basedLine1)}<br>${escapeHTML(contact.basedLine2)}</p>

        <h3>Commissions</h3>
        <p>${escapeHTML(contact.commissions)}</p>

        <h3>Response Time</h3>
        <p>${escapeHTML(contact.responseTime)}</p>

        <h3>Follow</h3>
        <div class="social-row">
          <a href="${contact.instagramUrl}" aria-label="Instagram" target="_blank" rel="noopener">IG</a>
        </div>`;
    }
  }

  async function run() {
    await Promise.allSettled([
      renderSite(),
      renderPortfolio(),
      renderHome(),
      renderAbout(),
      renderContact()
    ]);
  }

  return { run };
})();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await window.BWJRender.run();
  } catch (err) {
    console.error('[BWJ] content render failed — static fallback content will be shown.', err);
  } finally {
    if (window.initSiteInteractions) window.initSiteInteractions();
  }
});
