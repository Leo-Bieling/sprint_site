/* blng sprint: small interactions copied from blng.studio.
   1. Cursor: a 20px dot that follows the pointer and turns into a 2px ring over links and
      buttons (blng.studio uses terracotta; here it is the blng sprint green, #7A973F).
      Only on devices with a fine pointer that can hover, and not with prefers-reduced-motion.
      Over form fields the dot hides and the normal system cursor shows.
   2. Scroll reveal: sections fade up 16px as they come into view (0.65s ease), as on blng.studio.
   3. Mobile menu (a <details>): while open the page behind doesn't scroll; Escape closes it.
   4. Client filter (/sprints/, /articles/): shows the chip row the build ships `hidden`, hides tiles whose
      data-clients lacks the chosen category, and keeps ?for=<id> in the URL so a filtered view is linkable.
   5. (v46 paid-guide checkout start: removed in v47, the checkout is no longer embedded.)
   6. "A look inside" zoom (v46): a preview link opens its large page image in a <dialog> (close button, Escape,
      tap outside the page; prev/next buttons, arrow keys and a horizontal swipe; page scroll locked; focus returns
      to the preview). Pinch-zoom still works. Without JavaScript the link opens the image itself.
   Without JavaScript nothing changes: the system cursor stays and all content is visible. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var reduce = mq('(prefers-reduced-motion: reduce)');

  // ── Cursor ──
  if (mq('(hover: hover) and (pointer: fine)') && !reduce) {
    var dot = d.createElement('div');
    dot.id = 'cursor';
    dot.setAttribute('aria-hidden', 'true');
    d.body.appendChild(dot);
    root.classList.add('has-cursor');
    var FIELDS = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
    var TARGETS = 'a, button, summary, label, [role="button"]';
    d.addEventListener('mousemove', function (e) {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      var t = e.target && e.target.closest ? e.target : null;
      dot.classList.toggle('is-visible', !(t && t.closest(FIELDS)));
      dot.classList.toggle('cursor-outline', !!(t && t.closest(TARGETS)));
    }, { passive: true });
    root.addEventListener('mouseleave', function () { dot.classList.remove('is-visible'); });
    window.addEventListener('blur', function () { dot.classList.remove('is-visible'); });
  }

  // ── Mobile menu ──
  var menu = d.querySelector('details.menu');
  if (menu) {
    menu.addEventListener('toggle', function () { root.classList.toggle('menu-open', menu.open); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
    });
  }

  // ── Client filter ──
  Array.prototype.forEach.call(d.querySelectorAll('.tile-filter'), function (bar) {
    var list = bar.nextElementSibling;
    if (!list || !list.matches('.tiles[data-filter-group]')) return;
    var param = bar.getAttribute('data-param') || 'for';
    var btns = Array.prototype.slice.call(bar.querySelectorAll('button[data-filter]'));
    var tiles = Array.prototype.slice.call(list.children);
    var status = bar.querySelector('.filter-status');
    var ids = btns.map(function (b) { return b.getAttribute('data-filter'); });
    function apply(id, fromUser) {
      if (ids.indexOf(id) < 0) id = 'all';
      var shown = 0;
      tiles.forEach(function (t) {
        var cl = (t.getAttribute('data-clients') || '').split(/\s+/);
        var show = id === 'all' || cl.indexOf(id) > -1;
        if (show && t.hidden && fromUser && !reduce) {
          t.classList.remove('filter-in'); void t.offsetWidth; t.classList.add('filter-in');
        }
        t.hidden = !show;
        if (show) shown++;
      });
      var label = 'All';
      btns.forEach(function (b) {
        var on = b.getAttribute('data-filter') === id;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) label = b.textContent;
      });
      if (status && fromUser) {
        var noun = shown === 1 ? bar.getAttribute('data-noun') : bar.getAttribute('data-nouns');
        status.textContent = id === 'all' ? 'Showing all ' + shown + ' ' + noun : 'Showing ' + shown + ' ' + noun + ' for ' + label;
      }
      if (fromUser && window.history && history.replaceState) {
        var u = new URL(window.location.href);
        if (id === 'all') u.searchParams.delete(param); else u.searchParams.set(param, id);
        history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      }
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-filter'), true); });
    });
    var start = 'all';
    try { start = new URLSearchParams(window.location.search).get(param) || 'all'; } catch (e) {}
    apply(start, false);
    bar.hidden = false;
  });

  // ── "A look inside" zoom ──
  var zooms = Array.prototype.slice.call(d.querySelectorAll('a.guide-zoom'));
  if (zooms.length && typeof HTMLDialogElement === 'function') {
    var dlg = d.createElement('dialog');
    dlg.className = 'zoom-dialog';
    dlg.setAttribute('aria-label', 'Workbook page, larger view');
    dlg.innerHTML = '<button type="button" class="zoom-btn zoom-close" aria-label="Close larger view">\u2715</button>' +
      '<div class="zoom-stage"><img alt=""></div>' +
      '<div class="zoom-bar"><button type="button" class="zoom-btn zoom-prev" aria-label="Previous page">\u2190</button>' +
      '<p class="zoom-caption" aria-live="polite"></p>' +
      '<button type="button" class="zoom-btn zoom-next" aria-label="Next page">\u2192</button></div>';
    d.body.appendChild(dlg);
    var zImg = dlg.querySelector('.zoom-stage img'), zCap = dlg.querySelector('.zoom-caption');
    var zPrev = dlg.querySelector('.zoom-prev'), zNext = dlg.querySelector('.zoom-next'), zStage = dlg.querySelector('.zoom-stage');
    var cur = 0, opener = null, padR = '';
    var show = function (i) {
      cur = (i + zooms.length) % zooms.length;
      var a = zooms[cur], th = a.querySelector('img');
      zImg.src = a.getAttribute('href');
      zImg.alt = th ? th.alt : '';
      if (th) { zImg.width = th.getAttribute('width'); zImg.height = th.getAttribute('height'); }
      zCap.textContent = (a.getAttribute('data-caption') || '') + ' (' + (cur + 1) + ' of ' + zooms.length + ')';
      zPrev.hidden = zNext.hidden = zooms.length < 2;
      zStage.scrollTop = 0; zStage.scrollLeft = 0;
    };
    var open = function (i) {
      opener = zooms[i];
      var sb = window.innerWidth - root.clientWidth;      // keep the layout still when the page scroll bar goes
      padR = d.body.style.paddingRight;
      if (sb > 0) d.body.style.paddingRight = sb + 'px';
      root.classList.add('zoom-open');
      show(i);
      dlg.showModal();
      dlg.querySelector('.zoom-close').focus();
    };
    var close = function () { if (dlg.open) dlg.close(); };
    dlg.addEventListener('close', function () {
      root.classList.remove('zoom-open');
      d.body.style.paddingRight = padR;
      if (opener) opener.focus();
    });
    zooms.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;   // new tab etc. stays a plain link
        e.preventDefault(); open(i);
      });
    });
    dlg.querySelector('.zoom-close').addEventListener('click', close);
    zPrev.addEventListener('click', function () { show(cur - 1); });
    zNext.addEventListener('click', function () { show(cur + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target === zStage) close(); });   // tap outside the page
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
    });
    var sx = null, sy = 0;
    zStage.addEventListener('touchstart', function (e) {
      var zoomed = window.visualViewport && window.visualViewport.scale > 1.01;
      sx = (e.touches.length === 1 && !zoomed) ? e.touches[0].clientX : null; sy = e.touches[0].clientY;
    }, { passive: true });
    zStage.addEventListener('touchend', function (e) {
      if (sx === null || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  // ── Scroll reveal ──
  if (!reduce && 'IntersectionObserver' in window) {
    var els = d.querySelectorAll('main > section, .tiles > .tile');
    if (!els.length) return;
    root.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(els, function (el) { el.classList.add('reveal'); io.observe(el); });
  }
})();
