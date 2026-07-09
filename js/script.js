/* ==========================================================================
   BWJ-ART — site interactions
   ========================================================================== */

window.initSiteInteractions = function () {

  /* ---------- Hamburger / slide-out nav ---------- */
  const hamburger = document.querySelector('.hamburger');
  const navPanel = document.querySelector('.nav-panel');
  const navOverlay = document.querySelector('.nav-overlay');
  const body = document.body;

  function openNav() {
    hamburger.classList.add('active');
    navPanel.classList.add('active');
    navOverlay.classList.add('active');
    body.classList.add('nav-open');
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeNav() {
    hamburger.classList.remove('active');
    navPanel.classList.remove('active');
    navOverlay.classList.remove('active');
    body.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = navPanel.classList.contains('active');
      isOpen ? closeNav() : openNav();
    });
  }

  if (navOverlay) navOverlay.addEventListener('click', closeNav);

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => closeNav());
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNav();
      closeLightbox();
    }
  });

  /* ---------- Smooth scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ---------- Back to top ---------- */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Load-in fade (page load only, static otherwise) ---------- */
  const fadeEls = document.querySelectorAll('.fade-in');
  fadeEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('is-visible'), 80 * i + 60);
  });

  /* ---------- Lightbox gallery ---------- */
  const galleryItems = Array.from(document.querySelectorAll('[data-lightbox]'));
  const lightbox = document.querySelector('.lightbox');

  if (lightbox && galleryItems.length) {
    const lightboxImg = lightbox.querySelector('img');
    const lightboxImgWrap = lightbox.querySelector('.lightbox-img-wrap');
    const capTitle = lightbox.querySelector('.cap-title');
    const capMeta = lightbox.querySelector('.cap-meta');
    const rotateBtn = lightbox.querySelector('.lightbox-rotate');
    const rotateCcwBtn = lightbox.querySelector('.lightbox-rotate-ccw');
    const downloadBtn = lightbox.querySelector('.lightbox-download');
    let currentIndex = 0;
    let currentRotation = 0;

    /* Rotating an <img> with a CSS transform doesn't change the space it
       reserves in the page's layout flow — only how it's rendered. So at
       90/270deg, the image's un-rotated layout box and its visually
       rotated bounding box are different shapes, and without accounting
       for that, the rotated image can visually overflow past its
       reserved space (overlapping the caption below) or leave a gap.
       Fix: size the wrapper to the correct POST-rotation visual box, and
       size the <img> itself (pre-rotation) so that rotating it lands
       exactly on that box. The wrapper's flex centering keeps it
       centered regardless of the mismatch between the two box shapes. */
    function fitRotatedImage() {
      const boxW = Math.min(window.innerWidth * 0.9, 1100);
      const boxH = window.innerHeight * 0.72;
      const w = lightboxImg.naturalWidth;
      const h = lightboxImg.naturalHeight;
      if (!w || !h) return;

      const rotated = currentRotation % 180 !== 0;
      let scale;
      if (!rotated) {
        scale = Math.min(boxW / w, boxH / h, 1);
      } else {
        scale = Math.min(boxW / h, boxH / w, 1);
      }
      const layoutW = w * scale;
      const layoutH = h * scale;

      lightboxImg.style.width = layoutW + 'px';
      lightboxImg.style.height = layoutH + 'px';
      lightboxImg.style.transform = `rotate(${currentRotation}deg)`;

      if (lightboxImgWrap) {
        lightboxImgWrap.style.width = (rotated ? layoutH : layoutW) + 'px';
        lightboxImgWrap.style.height = (rotated ? layoutW : layoutH) + 'px';
      }
    }

    lightboxImg.addEventListener('load', fitRotatedImage);
    window.addEventListener('resize', () => {
      if (lightbox.classList.contains('active')) fitRotatedImage();
    });

    function showImage(index) {
      currentIndex = (index + galleryItems.length) % galleryItems.length;
      const item = galleryItems[currentIndex];
      const fullSrc = item.getAttribute('data-full') || item.querySelector('img').src;
      // Pieces can have a "correct" starting orientation set in the CMS
      // (data-rotation) for photos that were shot sideways; visitors can
      // still rotate further from there with the buttons.
      currentRotation = parseInt(item.getAttribute('data-rotation'), 10) || 0;
      lightboxImg.style.width = '';
      lightboxImg.style.height = '';
      lightboxImg.style.transform = '';
      if (lightboxImgWrap) {
        lightboxImgWrap.style.width = '';
        lightboxImgWrap.style.height = '';
      }
      lightboxImg.src = fullSrc;
      lightboxImg.alt = item.getAttribute('data-title') || '';
      capTitle.textContent = item.getAttribute('data-title') || '';
      capMeta.textContent = item.getAttribute('data-meta') || '';
    }

    function openLightbox(index) {
      showImage(index);
      lightbox.classList.add('active');
      body.classList.add('nav-open');
    }

    window.closeLightbox = function () {
      lightbox.classList.remove('active');
      body.classList.remove('nav-open');
    };

    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => openLightbox(index));
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', window.closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showImage(currentIndex - 1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => showImage(currentIndex + 1));

    if (rotateBtn) {
      // Clockwise: keeps adding +90 each click, wrapping with modulo so it
      // continues all the way around instead of bouncing back to 0.
      rotateBtn.addEventListener('click', () => {
        currentRotation = (currentRotation + 90) % 360;
        fitRotatedImage();
      });
    }

    if (rotateCcwBtn) {
      // Counter-clockwise: its own independent accumulator direction
      // (-90 each click, wrapped into 0-359 with +360 before modulo since
      // JS's % can return negative values for negative operands).
      rotateCcwBtn.addEventListener('click', () => {
        currentRotation = (currentRotation - 90 + 360) % 360;
        fitRotatedImage();
      });
    }

    /* ---------- Watermark-on-download ----------
       The site displays the clean, un-watermarked artwork at all times.
       The watermark is only ever applied to the copy a visitor actually
       takes with them: clicking Download draws the current image (at its
       current rotation) onto an off-screen canvas, stamps "BWJ-ART" onto
       that canvas, and downloads the result. Nothing watermarked ever
       touches the page itself. This can't stop a screenshot, or someone
       bypassing the site to grab the raw file directly — it only covers
       copies made through this button. */
    function buildWatermarkedBlob(callback) {
      const w = lightboxImg.naturalWidth;
      const h = lightboxImg.naturalHeight;
      if (!w || !h) return;
      const rotated = currentRotation % 180 !== 0;

      const canvas = document.createElement('canvas');
      canvas.width = rotated ? h : w;
      canvas.height = rotated ? w : h;
      const ctx = canvas.getContext('2d');

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((currentRotation * Math.PI) / 180);
      ctx.drawImage(lightboxImg, -w / 2, -h / 2, w, h);
      ctx.restore();

      const text = 'BWJ-ART';
      const fontSize = Math.max(18, Math.round(canvas.width / 18));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(1, Math.round(fontSize / 18));

      const positions = [
        [0.18, 0.15], [0.82, 0.28], [0.5, 0.5], [0.18, 0.72], [0.82, 0.85]
      ];
      positions.forEach(([fx, fy]) => {
        ctx.save();
        ctx.translate(canvas.width * fx, canvas.height * fy);
        ctx.rotate((-28 * Math.PI) / 180);
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.strokeText(text, 0, 0);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(text, 0, 0);
        ctx.restore();
      });

      canvas.toBlob((blob) => callback(blob), 'image/jpeg', 0.92);
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        buildWatermarkedBlob((blob) => {
          if (!blob) return;
          const slug = (capTitle.textContent || 'bwj-art')
            .toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-+|-+$)/g, '') || 'bwj-art';
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${slug}-bwj-art-watermarked.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 4000);
        });
      });
    }

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) window.closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'ArrowRight') showImage(currentIndex + 1);
      if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
      if (e.key === 'r' || e.key === 'R') {
        currentRotation = (currentRotation + 90) % 360;
        fitRotatedImage();
      }
    });
  } else {
    window.closeLightbox = function () {};
  }

  /* ---------- Home spotlight (rotating featured image) ----------
     A single highlighted image that cycles through the most recent
     portfolio pieces every 5s. Clicking it opens the same lightbox used
     elsewhere on the site (it's just another [data-lightbox] item), and
     rotation pauses for as long as the lightbox stays open so the image
     doesn't change out from under someone mid-view. */
  const spotlight = document.querySelector('.spotlight');
  if (spotlight) {
    const spotItems = Array.from(spotlight.querySelectorAll('.spotlight-item'));
    const spotDots = Array.from(spotlight.querySelectorAll('.spotlight-dots .dot'));
    let spotActive = 0;
    let spotTimer = null;

    function showSpot(i) {
      spotActive = (i + spotItems.length) % spotItems.length;
      spotItems.forEach((el, idx) => el.classList.toggle('is-active', idx === spotActive));
      spotDots.forEach((d, idx) => d.classList.toggle('is-active', idx === spotActive));
    }

    function startSpot() {
      stopSpot();
      if (spotItems.length > 1) {
        spotTimer = setInterval(() => showSpot(spotActive + 1), 5000);
      }
    }

    function stopSpot() {
      if (spotTimer) clearInterval(spotTimer);
      spotTimer = null;
    }

    spotDots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        showSpot(idx);
        startSpot();
      });
    });

    // Pause while the lightbox this item opens is on screen; resume once
    // it's closed by any of the ways a visitor can close it.
    spotItems.forEach((item) => item.addEventListener('click', stopSpot));
    const spotLightbox = document.querySelector('.lightbox');
    if (spotLightbox) {
      const closeBtn = spotLightbox.querySelector('.lightbox-close');
      if (closeBtn) closeBtn.addEventListener('click', startSpot);
      spotLightbox.addEventListener('click', (e) => {
        if (e.target === spotLightbox) startSpot();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') startSpot();
    });

    startSpot();
  }

  /* ---------- Grid thumbnail rotation (CMS-set, for sideways photos) ----------
     Mirrors the lightbox's rotation fix: a wrapper reserves the correct
     post-rotation visual box (based on the column's actual rendered
     width) so a rotated thumbnail doesn't overlap the caption below it
     or leave a gap. Only runs on images explicitly wrapped by render.js
     (i.e. items with a non-zero rotation set in the CMS). */
  document.querySelectorAll('.thumb-rotate-wrap').forEach((wrap) => {
    const img = wrap.querySelector('img');
    const rotation = parseInt(wrap.getAttribute('data-rotation'), 10) || 0;
    if (!img || !rotation) return;

    function apply() {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const columnWidth = wrap.clientWidth;
      if (!w || !h || !columnWidth) return;
      const visualH = columnWidth * (w / h);
      wrap.style.height = visualH + 'px';
      img.style.width = visualH + 'px';
      img.style.height = columnWidth + 'px';
      img.style.setProperty('--thumb-rotation', rotation + 'deg');
    }

    if (img.complete && img.naturalWidth) apply();
    img.addEventListener('load', apply);
    window.addEventListener('resize', apply);
  });

  /* ---------- Gallery filters (portfolio page) ---------- */
  const filterButtons = document.querySelectorAll('.gallery-filters button');
  const masonryItems = document.querySelectorAll('.masonry-item');

  if (filterButtons.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');

        masonryItems.forEach(item => {
          const category = item.getAttribute('data-category');
          if (filter === 'all' || filter === category) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  /* ---------- Deter casual image saving (right-click / drag) ----------
     Not real protection — screenshots always work, and anyone who views
     page source or the network tab can still fetch the clean file
     directly. This just removes the one-click native "Save Image As" /
     drag-out shortcut, steering casual visitors toward the lightbox's
     Download button instead. */
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  /* ---------- Contact form (submits to Netlify Forms) ---------- */
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const confirmation = document.querySelector('.form-confirmation');
      const errorMsg = document.querySelector('.form-error');
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const data = new URLSearchParams(new FormData(contactForm)).toString();

      if (submitBtn) submitBtn.disabled = true;

      // Post to the current page (rather than a hardcoded "/") so the
      // submission always targets a real, existing static asset — the
      // safest target for Netlify's form-handling middleware to intercept.
      fetch(window.location.pathname || '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data
      })
        .then((res) => {
          if (!res.ok) throw new Error('Form submission failed: ' + res.status + ' ' + res.statusText);
          contactForm.reset();
          if (confirmation) {
            confirmation.classList.add('is-visible');
            setTimeout(() => confirmation.classList.remove('is-visible'), 5000);
          }
        })
        .catch((err) => {
          // Logged with status/text above so this is diagnosable from the
          // browser console if it happens again.
          console.error('[BWJ] contact form submission failed', err);
          if (errorMsg) {
            errorMsg.classList.add('is-visible');
            setTimeout(() => errorMsg.classList.remove('is-visible'), 6000);
          }
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

};

/* render.js calls window.initSiteInteractions() once dynamic content has been
   injected. This fallback only fires if render.js is missing from a page, so
   interactions still work even without it. */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.__bwjRenderPresent) {
    window.initSiteInteractions();
  }
});
