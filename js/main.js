/* ==========================================================================
   SNR BUILDERS — MASTER INTERACTIVITY SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileDrawer();
  initConciergeWidget();
  initInquiryForm();
  initFloorPlanTabs();
  initFaqAccordion();
  initImageLightbox();
  initSmoothScroll();
  initScrollProgress();
  initBackToTop();
  initCopyToClipboard();
  initStatCounters();
  initProjectCarousel();
  initDrawOnView();
  initGallery();
  initDevCard();
});

/* Project carousel (home): arrows, dots, and autoplay while visible.
   Autoplay stops for good once the visitor touches, scrolls, clicks or focuses it. */
function initProjectCarousel() {
  const root = document.querySelector('[data-carousel]');
  if (!root) return;
  const track = root.querySelector('[data-carousel-track]');
  const controls = root.querySelector('[data-carousel-controls]');
  const dotsWrap = root.querySelector('[data-carousel-dots]');
  const slides = [...track.children];
  if (slides.length < 2) return;

  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    const name = slide.querySelector('.tile-title')?.textContent.trim() || `project ${i + 1}`;
    dot.setAttribute('aria-label', `Show ${name}`);
    dot.addEventListener('click', () => { stop(); goTo(i); });
    dotsWrap.appendChild(dot);
    return dot;
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollable = () => track.scrollWidth > track.clientWidth + 4;
  const current = () => {
    const x = track.scrollLeft;
    let best = 0;
    slides.forEach((s, i) => {
      if (Math.abs(s.offsetLeft - track.offsetLeft - x) < Math.abs(slides[best].offsetLeft - track.offsetLeft - x)) best = i;
    });
    return best;
  };
  const goTo = i => {
    const idx = (i + slides.length) % slides.length;
    track.scrollTo({ left: slides[idx].offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft || 0), behavior: reduce ? 'auto' : 'smooth' });
  };
  const sync = () => {
    controls.hidden = !scrollable();
    const i = current();
    dots.forEach((d, n) => d.setAttribute('aria-current', n === i ? 'true' : 'false'));
  };

  let timer = null, stopped = reduce, visible = false;
  const tick = () => { if (!stopped && visible && scrollable()) goTo(current() + 1); };
  const start = () => { if (!stopped && !timer) timer = setInterval(tick, 3500); };
  const pause = () => { clearInterval(timer); timer = null; };
  function stop() { stopped = true; pause(); }

  root.querySelector('[data-carousel-prev]').addEventListener('click', () => { stop(); goTo(current() - 1); });
  root.querySelector('[data-carousel-next]').addEventListener('click', () => { stop(); goTo(current() + 1); });
  ['pointerdown', 'touchstart', 'wheel', 'focusin', 'keydown'].forEach(evt =>
    track.addEventListener(evt, stop, { passive: true }));

  let raf = 0;
  track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
  window.addEventListener('resize', sync);
  sync();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : pause();
    }, { threshold: 0.5 }).observe(track);
  }
}

/* Gallery: tap a photo to open it full screen; arrows, swipe and keyboard move between photos. */
function initGallery() {
  const grid = document.querySelector('[data-gallery]');
  const viewer = document.getElementById('galleryViewer');
  if (!grid || !viewer || typeof viewer.showModal !== 'function') return;
  const items = [...grid.querySelectorAll('.gallery-item')];
  const img = document.getElementById('galleryViewerImg');
  const caption = document.getElementById('galleryViewerCaption');
  const count = document.getElementById('galleryViewerCount');
  let index = 0;
  img.draggable = false; // a native image drag would cancel the swipe

  const show = i => {
    index = (i + items.length) % items.length;
    const item = items[index];
    img.src = item.dataset.full;
    img.alt = item.querySelector('img').alt;
    caption.textContent = item.dataset.caption;
    count.textContent = `${index + 1} / ${items.length}`;
  };

  items.forEach((item, i) => item.addEventListener('click', () => {
    show(i);
    viewer.showModal();
    document.body.style.overflow = 'hidden';
  }));
  viewer.addEventListener('close', () => {
    document.body.style.overflow = '';
    items[index].focus();
  });
  viewer.querySelector('[data-viewer-close]').addEventListener('click', () => viewer.close());
  viewer.querySelector('[data-viewer-prev]').addEventListener('click', () => show(index - 1));
  viewer.querySelector('[data-viewer-next]').addEventListener('click', () => show(index + 1));
  viewer.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  // Tapping the dark area around the photo closes the viewer
  let startX = null, swiped = false;
  viewer.addEventListener('click', e => {
    if (swiped) { swiped = false; return; } // the click that ends a swipe must not close the viewer
    if (e.target === viewer || e.target.classList.contains('gallery-viewer-figure')) viewer.close();
  });
  viewer.addEventListener('pointerdown', e => { startX = e.clientX; swiped = false; });
  viewer.addEventListener('pointercancel', () => { startX = null; });
  viewer.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) { swiped = true; show(index + (dx < 0 ? 1 : -1)); }
  });
}

/* Footer credit: the plaque opens the developer's contact card (it stays a LinkedIn link without JS). */
function initDevCard() {
  const card = document.getElementById('devCard');
  const trigger = document.querySelector('[data-dev-open]');
  if (!card || !trigger || typeof card.showModal !== 'function') return;
  trigger.addEventListener('click', e => {
    e.preventDefault();
    card.showModal();
  });
  card.querySelector('[data-dev-close]').addEventListener('click', () => card.close());
  card.addEventListener('click', e => { // a tap on the dimmed backdrop, outside the card, closes it
    const r = card.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) card.close();
  });
  card.addEventListener('close', () => trigger.focus());
}

/* Line drawings ([data-draw]) trace themselves once when they scroll into view. */
function initDrawOnView() {
  const items = document.querySelectorAll('[data-draw]');
  if (!items.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-drawn');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.35 });
  items.forEach(el => { el.classList.add('draw-ready'); io.observe(el); });
}

/* Stat numbers count up once when the strip scrolls into view.
   The final value is already in the markup, so no-JS and reduced motion show it as is. */
function initStatCounters() {
  const counters = document.querySelectorAll('.stat-count[data-count]');
  if (!counters.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const run = el => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1200;
    const start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      run(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => io.observe(el));
}

/* 1. Header Scroll Effect */
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* 2. Mobile Drawer Navigation */
function initMobileDrawer() {
  const toggleBtn = document.getElementById('mobileToggle');
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileBackdrop');
  const closeBtn = document.getElementById('drawerClose');
  const drawerLinks = document.querySelectorAll('.drawer-nav-item, .drawer-footer a');

  if (!toggleBtn || !drawer || !backdrop) return;

  function openDrawer() {
    drawer.classList.add('is-active');
    backdrop.classList.add('is-active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('is-active');
    backdrop.classList.remove('is-active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* 4. Multi-Action Concierge Widget (WhatsApp & Call) */
function initConciergeWidget() {
  const toggle = document.getElementById('conciergeToggle');
  const popup = document.getElementById('conciergePopup');

  if (!toggle || !popup) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = popup.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && !toggle.contains(e.target)) {
      popup.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* 5. Consultation & Site Visit Inquiry Form */
function initInquiryForm() {
  const form = document.getElementById('inquiryForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const projectSelect = document.getElementById('clientProject');
    const messageInput = document.getElementById('clientMessage');
    const submitBtn = form.querySelector('.submit-inquiry-btn');

    if (!nameInput.value.trim() || !phoneInput.value.trim()) {
      form.reportValidity();
      return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const project = projectSelect.value;
    const message = messageInput.value.trim() || 'Please get in touch.';

    // Encode once, here. Open WhatsApp straight from the tap: browsers block window.open() after a timer.
    const waText = `Hello SNR Builders! My name is ${name} (${phone}). I am interested in: ${project}. Details: ${message}`;
    window.open(`https://wa.me/917012925732?text=${encodeURIComponent(waText)}`, '_blank', 'noopener');

    const originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>✓ Opening WhatsApp…</span>';
    setTimeout(() => {
      form.reset();
      submitBtn.innerHTML = originalHtml;
    }, 1800);
  });
}

/* Respect the user's reduced-motion setting for every scripted scroll */
function scrollBehavior() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/* 6. Smooth Scroll with Header Offset */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.getElementById(targetId.slice(1)); // querySelector throws on ids like #2bhk
      if (targetEl) {
        e.preventDefault();
        const headerHeight = document.getElementById('siteHeader')?.offsetHeight || 70;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({ top: targetPosition, behavior: scrollBehavior() });
      }
    });
  });
}

/* 7. Interactive Floor Plan Tabs */
function initFloorPlanTabs() {
  const tabBtns = document.querySelectorAll('.floorplan-tab-btn');
  const panels = document.querySelectorAll('.floorplan-panel-card');

  if (!tabBtns.length || !panels.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const targetPlan = btn.dataset.plan;

      panels.forEach(panel => {
        if (panel.id === targetPlan) {
          panel.classList.add('is-active');
        } else {
          panel.classList.remove('is-active');
        }
      });
    });
  });
}

/* 8. Interactive FAQ Accordion */
function initFaqAccordion() {
  const triggers = document.querySelectorAll('.faq-trigger-btn');
  if (!triggers.length) return;

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-accordion-item');
      if (!item) return;

      const isOpen = item.classList.contains('is-open');

      // Close all items if desired, or allow multiple open
      // Closing siblings gives cleaner experience on mobile
      document.querySelectorAll('.faq-accordion-item').forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.faq-trigger-btn')?.setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}



/* 10. High-Res Image Lightbox Modal */
function initImageLightbox() {
  const modal = document.getElementById('imageLightboxModal');
  const modalImg = document.getElementById('lightboxModalImg');
  const modalCaption = document.getElementById('lightboxModalCaption');
  const closeBtn = document.getElementById('lightboxCloseBtn');

  if (!modal || !modalImg) return;

  function openLightbox(src, caption) {
    modalImg.src = src;
    if (modalCaption) modalCaption.textContent = caption || '';
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    modal.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.floorplan-image-box img, .lightbox-trigger').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.title = 'Click to enlarge blueprint';
    img.addEventListener('click', () => {
      openLightbox(img.src, img.alt);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('lightbox-content-box')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeLightbox();
    }
  });
}

/* 11. Reading Scroll Progress Bar */
function initScrollProgress() {
  let bar = document.querySelector('.scroll-progress-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'scroll-progress-bar';
    document.body.appendChild(bar);
  }

  const updateProgress = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) {
      bar.style.width = '0%';
      return;
    }
    const percent = Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100));
    bar.style.width = `${percent}%`;
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

/* 12. Floating Back to Top Button */
function initBackToTop() {
  let btn = document.querySelector('.back-to-top-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'back-to-top-btn';
    btn.setAttribute('aria-label', 'Back to top of page');
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg>`;
    document.body.appendChild(btn);
  }

  const onScroll = () => {
    if (window.scrollY > 400) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
  };

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* 13. Copy-to-Clipboard & Toast Feedback */
let toastTimeout = null;

function showToast(message) {
  let toast = document.getElementById('snrToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'snrToast';
    toast.className = 'snr-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.innerHTML = '<svg class="snr-toast-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg><span></span>';
  toast.querySelector('span').textContent = message; // message can contain copied text: never parse it as HTML

  toast.classList.add('is-show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('is-show');
  }, 2600);
}

function initCopyToClipboard() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-copy]');
    if (!trigger) return;

    const textToCopy = trigger.getAttribute('data-copy') || trigger.innerText.trim();
    if (!textToCopy) return;

    const label = trigger.getAttribute('data-copy-label') || 'Copied to clipboard';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`${label}: ${textToCopy}`);
      }).catch(() => {
        fallbackCopy(textToCopy, label);
      });
    } else {
      fallbackCopy(textToCopy, label);
    }
  });

  function fallbackCopy(text, label) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`${label}: ${text}`);
    } catch (err) {
      showToast(`Copy failed: ${text}`);
    }
    document.body.removeChild(textArea);
  }
}


