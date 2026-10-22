/* blng sprint: small interactions copied from blng.studio.
   1. Cursor: a 20px dot that follows the pointer and turns into a 2px ring over links and
      buttons (blng.studio uses terracotta; here it is the blng sprint green, #7A973F).
      Only on devices with a fine pointer that can hover, and not with prefers-reduced-motion.
      Over form fields the dot hides and the normal system cursor shows.
   2. Scroll reveal: sections fade up 16px as they come into view (0.65s ease), as on blng.studio.
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
