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
   reachable by hover alone, on keyboard too (Enter/Space on the portrait).
   The split only exists at >=1120px; narrower, styles.css shows the panel
   permanently, so the portrait stops being a toggle and its button
   semantics are removed to match (and restored if the window widens). */
const leaderSplit = window.matchMedia('(min-width:1120px)');
const leaderRows = document.querySelectorAll('.leader-row');
function syncLeaderMode() {
  leaderRows.forEach(row => {
    const trigger = row.querySelector('.leader-portrait');
    if (!trigger) return;
    if (leaderSplit.matches) {
      trigger.setAttribute('role', 'button');
      trigger.tabIndex = 0;
      trigger.setAttribute('aria-expanded', row.classList.contains('leader-open') ? 'true' : 'false');
    } else {
      row.classList.remove('leader-open');
      trigger.removeAttribute('role');
      trigger.removeAttribute('tabindex');
      trigger.removeAttribute('aria-expanded');
    }
  });
}
leaderRows.forEach(row => {
  const trigger = row.querySelector('.leader-portrait');
  if (!trigger) return;
  function toggle() {
    if (!leaderSplit.matches) return;
    const open = row.classList.toggle('leader-open');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  /* Bound to the portrait rather than the whole row so that tapping the
     open panel to read it doesn't collapse the thing you're reading. */
  trigger.addEventListener('click', toggle);
  trigger.addEventListener('keydown', (e) => {
    if (leaderSplit.matches && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();   // stop Space from scrolling the page
      toggle();
    }
  });
});
syncLeaderMode();
leaderSplit.addEventListener('change', syncLeaderMode);

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

/* ===================== Pegboard range (brand pages) ===================== */
/* Play-type filters, paging by whole rows, packs that drop onto their pegs as
   they scroll into view and swing when hovered, a shared <dialog> viewer and
   a Lucky dip — all layered over the static <li> markup, which stays the
   single source of truth (number, caption, aisle, image path).
   Guarded: only pages with a pegboard range have #pegWall. */
const pegWall = document.getElementById('pegWall');
if (pegWall) {
  const pegSection = pegWall.closest('.peg-range');
  const brandName = (pegSection && pegSection.dataset.brand) || '';
  const pegItems = Array.from(pegWall.querySelectorAll('.peg-item'));
  const pegChips = Array.from(document.querySelectorAll('.peg-chip'));
  const pegMore = document.getElementById('pegMore');
  const pegCount = document.getElementById('pegCount');
  const pegDip = document.getElementById('pegDip');
  const aisleName = {};
  pegChips.forEach(c => { aisleName[c.dataset.filter] = c.querySelector('.peg-chip-label').textContent; });

  let aisle = 'all';
  let matches = pegItems;   // packs in the current aisle, in wall order
  let shown = 0;

  const pegColumns = () => getComputedStyle(pegWall).gridTemplateColumns.split(' ').length;
  // Whole rows only: 4 rows on wider walls, 6 once cards are 2–3 across
  const pegPage = () => { const c = pegColumns(); return c * (c >= 4 ? 4 : 6); };

  // Packs drop onto their pegs as they enter view, staggered within each batch
  const hangObserver = reduceMotion ? null : new IntersectionObserver((entries) => {
    entries
      .filter(e => e.isIntersecting)
      .map(e => e.target)
      .sort((a, b) => pegItems.indexOf(a) - pegItems.indexOf(b))
      .forEach((el, i) => {
        el.style.setProperty('--hang-delay', (Math.min(i, 10) * 55) + 'ms');
        el.classList.add('is-hung');
        hangObserver.unobserve(el);
      });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  function hang(el) {
    el.classList.remove('is-hung', 'is-settled');
    if (hangObserver) hangObserver.observe(el);
    else el.classList.add('is-hung', 'is-settled');
  }

  function renderWall(count, rehang) {
    shown = Math.min(count, matches.length);
    const visible = new Set(matches.slice(0, shown));
    pegItems.forEach(el => {
      const wasHidden = el.hidden;
      el.hidden = !visible.has(el);
      if (!el.hidden && (wasHidden || rehang)) hang(el);
    });
    pegCount.innerHTML = `Showing <b>${shown}</b> of <b>${matches.length}</b> packs`;
    pegMore.hidden = shown >= matches.length;
  }

  pegWall.classList.add('is-ready');
  renderWall(pegPage(), true);

  pegChips.forEach(chip => chip.addEventListener('click', () => {
    if (chip.dataset.filter === aisle) return;
    aisle = chip.dataset.filter;
    pegChips.forEach(c => {
      const on = c === chip;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    matches = aisle === 'all' ? pegItems : pegItems.filter(el => el.dataset.cat === aisle);
    renderWall(pegPage(), true);
  }));

  pegMore.addEventListener('click', () => renderWall(shown + pegPage(), false));

  // Column count changes across breakpoints — top up to a full last row
  let pegRAF;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(pegRAF);
    pegRAF = requestAnimationFrame(() => {
      const c = pegColumns();
      const full = Math.min(Math.ceil(shown / c) * c, matches.length);
      if (full !== shown) renderWall(full, false);
    });
  });

  // Hover swing. A class removed on animationend (not a :hover animation),
  // so moving off mid-swing lets the pack come to rest instead of snapping.
  pegWall.addEventListener('animationend', (e) => {
    if (e.animationName === 'peg-hang') e.target.parentElement.classList.add('is-settled');
    if (e.animationName === 'peg-swing') e.target.classList.remove('is-swinging');
  });
  if (!reduceMotion) {
    pegWall.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const card = e.target.closest('.peg-card');
      if (!card || card.contains(e.relatedTarget)) return;
      if (card.parentElement.classList.contains('is-settled')) card.classList.add('is-swinging');
    });
  }

  /* ---------- Viewer ---------- */
  const viewer = document.getElementById('pegViewer');
  if (viewer && typeof viewer.showModal === 'function') {
    const vCard = viewer.querySelector('.pv-card');
    const vImg = document.getElementById('pvImg');
    const vStage = document.getElementById('pvStage');
    const vCat = document.getElementById('pvCat');
    const vNo = document.getElementById('pvNo');
    const vName = document.getElementById('pvName');
    const vPos = document.getElementById('pvPos');
    const vEnquire = document.getElementById('pvEnquire');
    let current = 0;    // index into matches
    let openedBy = null;
    let loadToken = 0;

    const packAt = (i) => {
      const el = matches[i];
      const thumb = el.querySelector('img').getAttribute('src');
      return {
        no: el.querySelector('.peg-no').textContent,
        name: el.querySelector('.peg-name').textContent,
        aisle: aisleName[el.dataset.cat] || '',
        thumb,
        full: thumb.replace('/thumb/', '/full/'),
      };
    };
    const wrap = (i) => (i + matches.length) % matches.length;

    function showPack(i, dir) {
      current = wrap(i);
      const p = packAt(current);
      vCat.textContent = p.aisle;
      vNo.textContent = p.no;
      vName.textContent = p.name;
      vPos.textContent = `${current + 1} / ${matches.length}`;
      const ask = `Hello, I'd like to know more about stocking ${brandName ? brandName + ' ' : ''}pack No. ${p.no} (${p.name}).`;
      vEnquire.href = 'index.html?enquiry=' + encodeURIComponent(ask) + '#contact';
      // The wall thumbnail is already cached — show it at once, then swap in
      // the full-size shot when it arrives (if the viewer is still on it).
      vImg.alt = p.name;
      vImg.src = p.thumb;
      const token = ++loadToken;
      const full = new Image();
      full.onload = () => { if (token === loadToken) vImg.src = p.full; };
      full.src = p.full;
      [current + 1, current - 1].forEach(n => { new Image().src = packAt(wrap(n)).full; });
      if (!reduceMotion) {
        vCard.classList.remove('swing-in', 'swap-next', 'swap-prev');
        void vCard.offsetWidth;   // restart the animation
        vCard.classList.add(dir > 0 ? 'swap-next' : dir < 0 ? 'swap-prev' : 'swing-in');
      }
    }

    function openViewer(i, source) {
      openedBy = source;
      showPack(i, 0);
      document.documentElement.classList.add('pv-lock');
      viewer.showModal();
    }

    viewer.addEventListener('close', () => {
      document.documentElement.classList.remove('pv-lock');
      // Opened from the wall: land on the pack you finished on (if it's
      // shown), so paging through the viewer moves your place on the wall.
      // Opened by Lucky dip: straight back to the dice.
      const el = matches[current];
      const target = openedBy !== pegDip && el && !el.hidden ? el.querySelector('.peg-card') : openedBy;
      if (!target) return;
      const r = target.getBoundingClientRect();
      if (r.top < 90 || r.bottom > window.innerHeight) {
        target.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      target.focus({ preventScroll: true });
    });

    pegWall.addEventListener('click', (e) => {
      const card = e.target.closest('.peg-card');
      if (card) openViewer(matches.indexOf(card.parentElement), card);
    });
    document.getElementById('pvPrev').addEventListener('click', () => showPack(current - 1, -1));
    document.getElementById('pvNext').addEventListener('click', () => showPack(current + 1, 1));
    document.getElementById('pvClose').addEventListener('click', () => viewer.close());
    // A click on the ::backdrop targets the <dialog> itself
    viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
    viewer.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); showPack(current + 1, 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); showPack(current - 1, -1); }
    });
    // Swipe between packs on the stage (touch-action:pan-y keeps vertical scroll)
    let swipeX = null, swipeY = 0;
    vStage.addEventListener('pointerdown', (e) => { swipeX = e.clientX; swipeY = e.clientY; });
    vStage.addEventListener('pointercancel', () => { swipeX = null; });
    vStage.addEventListener('pointerup', (e) => {
      if (swipeX === null) return;
      const dx = e.clientX - swipeX, dy = e.clientY - swipeY;
      swipeX = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        const dir = dx < 0 ? 1 : -1;
        showPack(current + dir, dir);
      }
    });

    // Lucky dip — a random pack from the current aisle (the dice gets a beat
    // to roll before the viewer opens over it)
    if (pegDip) {
      pegDip.addEventListener('click', () => {
        if (!matches.length) return;
        const pick = Math.floor(Math.random() * matches.length);
        if (reduceMotion) { openViewer(pick, pegDip); return; }
        pegDip.classList.remove('is-rolling');
        void pegDip.offsetWidth;
        pegDip.classList.add('is-rolling');
        setTimeout(() => openViewer(pick, pegDip), 380);
      });
    }
  }
}

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

  /* Brand-page pack viewers link here as index.html?enquiry=…#contact — drop
     that text into the message box so the buyer doesn't have to retype which
     pack they meant. */
  const enquiry = new URLSearchParams(window.location.search).get('enquiry');
  const messageField = form.querySelector('#message');
  if (enquiry && messageField && !messageField.value) messageField.value = enquiry.slice(0, 500);
}

/* ===================== Mobile nav menu ===================== */
/* Under 980px the links collapse behind .nav-toggle into a dropdown panel
   (styles.css: header.nav.menu-open). The nav's Contact button is hidden at
   that width, so it's cloned into the panel — the menu keeps a route to
   Contact without editing the nav markup duplicated across all fourteen
   pages. Closes on a link tap, Escape, a tap outside, or widening past the
   breakpoint. Runs before the anchor-scroll block below so the cloned link
   picks up the same fixed-nav offset as the others. */
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  const navCta = document.querySelector('.nav-cta .btn');
  if (navCta) {
    const menuCta = navCta.cloneNode(true);
    menuCta.classList.add('nav-menu-cta');
    navLinks.appendChild(menuCta);
  }
  if (!navLinks.id) navLinks.id = 'primaryNav';
  const icon = navToggle.querySelector('path');
  const bars = icon ? icon.getAttribute('d') : '';
  function setMenu(open) {
    nav.classList.toggle('menu-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (icon) icon.setAttribute('d', open ? 'M6 6l12 12M18 6L6 18' : bars);
  }
  navToggle.setAttribute('aria-controls', navLinks.id);
  setMenu(false);
  navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('menu-open') && !nav.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('menu-open')) {
      setMenu(false);
      navToggle.focus();
    }
  });
  window.matchMedia('(min-width:981px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
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
