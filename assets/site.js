/* blng sprint: small interactions copied from blng.studio.
   1. Cursor: a 20px dot that follows the pointer and turns into a 2px ring over links and
      buttons (blng.studio uses terracotta; here it is the blng sprint green, #7A973F).
      Only on devices with a fine pointer that can hover, and not with prefers-reduced-motion.
      Over form fields the dot hides and the normal system cursor shows.
   2. Scroll reveal: sections fade up 16px as they come into view (0.65s ease), as on blng.studio.
   3. Mobile menu (a <details>): while open the page behind doesn't scroll; Escape closes it.
   4. Client filter (/sprints/, /articles/): shows the chip row the build ships `hidden`, hides tiles whose
      data-clients lacks the chosen category, and keeps ?for=<id> in the URL so a filtered view is linkable.
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
