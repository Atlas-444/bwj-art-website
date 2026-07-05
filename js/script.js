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
    const capTitle = lightbox.querySelector('.cap-title');
    const capMeta = lightbox.querySelector('.cap-meta');
    const rotateBtn = lightbox.querySelector('.lightbox-rotate');
    const rotateCcwBtn = lightbox.querySelector('.lightbox-rotate-ccw');
    let currentIndex = 0;
    let currentRotation = 0;

    /* Rotating an <img> with CSS transform doesn't swap its bounding box,
       so at 90/270deg we compute an explicit width/height (using the
       image's natural size) that keeps the rotated image fully contained
       within the same viewing area instead of overflowing or clipping. */
    function fitRotatedImage() {
      const boxW = Math.min(window.innerWidth * 0.9, 1100);
      const boxH = window.innerHeight * 0.72;
      const w = lightboxImg.naturalWidth;
      const h = lightboxImg.naturalHeight;
      if (!w || !h) return;

      let scale;
      if (currentRotation % 180 === 0) {
        scale = Math.min(boxW / w, boxH / h, 1);
      } else {
        scale = Math.min(boxW / h, boxH / w, 1);
      }
      lightboxImg.style.width = (w * scale) + 'px';
      lightboxImg.style.height = (h * scale) + 'px';
      lightboxImg.style.transform = `rotate(${currentRotation}deg)`;
    }

    lightboxImg.addEventListener('load', fitRotatedImage);
    window.addEventListener('resize', () => {
      if (lightbox.classList.contains('active')) fitRotatedImage();
    });

    function showImage(index) {
      currentIndex = (index + galleryItems.length) % galleryItems.length;
      const item = galleryItems[currentIndex];
      const fullSrc = item.getAttribute('data-full') || item.querySelector('img').src;
      currentRotation = 0;
      lightboxImg.style.width = '';
      lightboxImg.style.height = '';
      lightboxImg.style.transform = '';
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
     Not real protection — screenshots always work, and nothing
     client-side can stop those. This just removes the one-click native
     "Save Image As" / drag-out shortcut. */
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

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data
      })
        .then((res) => {
          if (!res.ok) throw new Error('Form submission failed: ' + res.status);
          contactForm.reset();
          if (confirmation) {
            confirmation.classList.add('is-visible');
            setTimeout(() => confirmation.classList.remove('is-visible'), 5000);
          }
        })
        .catch((err) => {
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
