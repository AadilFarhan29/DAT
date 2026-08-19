const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===================== Nav scroll state ===================== */
const nav = document.getElementById('nav');
let lastY = 0;
function onScroll(){
  const y = window.scrollY;
  if (y > 30) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
  lastY = y;
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ===================== Hero load animation ===================== */
/* Guarded: this script is shared with pages that have no hero
   (leadership.html), where querySelector returns null. */
const hero = document.querySelector('.hero');
if (hero) {
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      hero.classList.add('loaded');
    });
  });
  // Fallback in case load fires before script
  setTimeout(() => {
    hero.classList.add('loaded');
  }, 200);
}

/* ===================== IntersectionObserver: generic reveal ===================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ===================== Leadership cards reveal (staggered) ===================== */
const leaderObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      leaderObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-leader]').forEach(el => leaderObserver.observe(el));

/* ===================== Leadership slide-apart rows ===================== */
/* Pointer devices open on :hover via CSS. We also toggle a .leader-open class
   so the rows work on touch — and, since the bio and quote are otherwise
   reachable by hover alone, on keyboard too (Enter/Space on the portrait). */
document.querySelectorAll('.leader-row').forEach(row => {
  const trigger = row.querySelector('.leader-portrait');
  if (!trigger) return;
  function toggle() {
    const open = row.classList.toggle('leader-open');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  /* Bound to the portrait rather than the whole row so that tapping the
     open panel to read it doesn't collapse the thing you're reading. */
  trigger.addEventListener('click', toggle);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();   // stop Space from scrolling the page
      toggle();
    }
  });
});

/* ===================== Brand hover/tap callouts ===================== */
/* Pointer devices reveal the callout on :hover via CSS. For touch, tapping
   a card toggles .pop-open (same dual-trigger idea as the founder cards),
   closing any other open callout; a tap elsewhere dismisses it. */
const brandCards = document.querySelectorAll('.brand-card');
/* Visual position is driven by data-order (grid items respect the CSS
   `order` property), so reordering the directory later is a one-line
   attribute edit on the affected card, not a rebuild of the grid markup. */
brandCards.forEach(card => { card.style.order = card.dataset.order; });
brandCards.forEach(card => {
  card.addEventListener('click', () => {
    const isOpen = card.classList.contains('pop-open');
    brandCards.forEach(c => c.classList.remove('pop-open'));
    if (!isOpen) card.classList.add('pop-open');
  });
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.brand-card')) {
    brandCards.forEach(c => c.classList.remove('pop-open'));
  }
});

/* Auto-flip: cards in the first row (whichever count the current breakpoint
   shows) would open their callout up into the section heading, so flip them
   to open downward instead. Recomputed on resize as the column count changes. */
function markBrandTopRow() {
  if (!brandCards.length) return;
  let minTop = Infinity;
  brandCards.forEach(c => { minTop = Math.min(minTop, c.offsetTop); });
  brandCards.forEach(c => c.classList.toggle('pop-below', c.offsetTop <= minTop + 1));
}
markBrandTopRow();
let brandRowRAF;
window.addEventListener('resize', () => {
  cancelAnimationFrame(brandRowRAF);
  brandRowRAF = requestAnimationFrame(markBrandTopRow);
});

/* ===================== Staggered group reveal ===================== */
/* When a [data-stagger] container enters view, its .stagger-item children
   cascade in one after another for a deliberate, springy sequence. */
const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const items = entry.target.querySelectorAll('.stagger-item');
      items.forEach((item, i) => {
        item.style.transitionDelay = (i * 75) + 'ms';
        item.classList.add('revealed');
      });
      staggerObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('[data-stagger]').forEach(el => staggerObserver.observe(el));

/* ===================== Hero parallax ===================== */
/* The decorative hero shapes drift slower than the scroll, so the hero
   visual appears to lag behind the content leaving the viewport. */
const heroBg = document.querySelector('.hero-bg');
if (heroBg && !reduceMotion) {
  let heroTicking = false;
  function updateParallax() {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroBg.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
    }
    heroTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!heroTicking) {
      requestAnimationFrame(updateParallax);
      heroTicking = true;
    }
  }, { passive: true });
  updateParallax();
}

/* ===================== Magnetic primary buttons ===================== */
/* Primary CTAs pull gently toward the cursor and lift, then spring back. */
if (!reduceMotion) {
  document.querySelectorAll('.btn-primary').forEach(btn => {
    const strength = 0.28;
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${mx * strength}px, ${my * strength - 2}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ===================== Count-up animation (requestAnimationFrame) ===================== */
function animateCount(el, target, duration = 1800) {
  const start = performance.now();
  const isLarge = target >= 1000;
  function tick(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.floor(target * eased);
    el.textContent = isLarge ? val.toLocaleString() : val;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = isLarge ? target.toLocaleString() : target;
    }
  }
  requestAnimationFrame(tick);
}

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      animateCount(el, target);
      countObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

/* ===================== Form submission (toast feedback) ===================== */
const form = document.getElementById('partnerForm');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

function showToast(message) {
  if (!toast || !toastMsg) return;
  toastMsg.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3800);
}

/* Guarded: the contact form only exists on index.html. */
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const type = fd.get('type');
    const name = fd.get('fname');
    if (!name || !fd.get('email') || !type) {
      showToast('Please complete the required fields.');
      return;
    }
    const typeLabel = type === 'supplier' ? 'supplier' : type === 'retailer' ? 'retailer' : 'partner';
    showToast(`Thank you, ${name.split(' ')[0]} — our ${typeLabel} team will be in touch within one business day.`);
    form.reset();
  });
}

/* ===================== Smooth anchor scroll offset ===================== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  });
});

/* ===================== Mobile nav toggle (simple dropdown) ===================== */
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    if (navLinks.style.display === 'flex') {
      navLinks.style.display = '';
    } else {
      navLinks.style.display = 'flex';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '60px';
      navLinks.style.right = '20px';
      navLinks.style.flexDirection = 'column';
      navLinks.style.padding = '12px';
      navLinks.style.background = '#fff';
      navLinks.style.border = '1px solid var(--line)';
      navLinks.style.borderRadius = '14px';
      navLinks.style.boxShadow = 'var(--shadow-md)';
    }
  });
}
