/* 1848 Blooms & Designs: site behaviour. No dependencies. */
(function () {
  'use strict';

  /* ---- Form delivery ------------------------------------------------------
     Set FORM_ENDPOINT to a form service URL (for example a Formspree endpoint
     like "https://formspree.io/f/xxxxxxx") and both forms will send their
     answers there as JSON. While it is empty, the forms run in preview mode:
     nothing is sent, and a notice tells the visitor so. */
  var FORM_ENDPOINT = '';

  var doc = document, root = doc.documentElement, body = doc.body;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Header: hide the top strip once the page scrolls ---- */
  var header = $('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  var toggle = $('.menu-toggle');
  var mnav = $('.mnav');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.textContent = open ? 'Close' : 'Menu';
    if (open) { header.classList.remove('is-scrolled'); }
    else { onScroll(); }
  }
  if (toggle && mnav) {
    toggle.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && body.classList.contains('menu-open')) { setMenu(false); toggle.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1060 && body.classList.contains('menu-open')) setMenu(false); });
  }

  /* ---- Year ---- */
  $$('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* ---- Portfolio filters + lightbox ---- */
  var gallery = $('.gallery');
  if (gallery) {
    var shots = $$('.shot', gallery);
    var fbtns = $$('.filters button');
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        fbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        shots.forEach(function (s) {
          var show = f === 'all' || (s.getAttribute('data-cat') || '').split(' ').indexOf(f) > -1;
          s.hidden = !show;
        });
        if (history.replaceState) history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
      });
    });
    var hash = location.hash.replace('#', '');
    var start = fbtns.filter(function (b) { return b.getAttribute('data-filter') === hash; })[0];
    if (start) start.click();

    var lb = $('#lightbox');
    var lbImg = $('img', lb), lbCap = $('.lb__cap', lb);
    var idx = 0;
    function visible() { return shots.filter(function (s) { return !s.hidden; }); }
    function show(i) {
      var list = visible();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var s = list[idx], im = $('img', s);
      lbImg.src = im.getAttribute('data-full') || im.src;
      lbImg.alt = im.alt;
      lbCap.textContent = im.alt;
    }
    shots.forEach(function (s) {
      s.addEventListener('click', function () {
        var list = visible();
        show(list.indexOf(s));
        if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
      });
    });
    $('.pv', lb).addEventListener('click', function () { show(idx - 1); });
    $('.nx', lb).addEventListener('click', function () { show(idx + 1); });
    $('.x', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__in')) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---- Forms ---- */
  var form = $('form[data-form]');
  if (form) {
    var type = form.getAttribute('data-form'); // inquiry | reservation
    var notice = $('.notice', form);

    // Reservation: preselect from ?experience=
    var qs = new URLSearchParams(location.search);
    var pre = qs.get('experience');
    if (pre) {
      var radio = $('input[name="experience"][value="' + pre + '"]', form);
      if (radio) radio.checked = true;
    }

    function validate() {
      var ok = true, first = null;
      $$('.field', form).forEach(function (f) {
        var inp = $('input,select,textarea', f);
        if (!inp || !inp.required) return;
        var bad = false;
        if (inp.type === 'radio') {
          bad = !$$('input[name="' + inp.name + '"]', f).some(function (r) { return r.checked; });
        } else {
          bad = !inp.value.trim() || (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value));
        }
        f.classList.toggle('invalid', bad);
        if (bad) { ok = false; if (!first) first = inp; }
      });
      if (first) first.focus();
      return ok;
    }

    function go() {
      var name = (form.elements.name && form.elements.name.value || '').trim().split(' ')[0];
      var p = new URLSearchParams({ type: type });
      if (name) p.set('name', name);
      location.href = 'thank-you.html?' + p.toString();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.website && form.elements.website.value) return; // honeypot
      if (!validate()) return;

      if (FORM_ENDPOINT) {
        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });
        delete data.website;
        var btn = $('button[type=submit]', form);
        btn.disabled = true; btn.textContent = 'Sending';
        fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(); go(); })
          .catch(function () {
            btn.disabled = false; btn.textContent = type === 'reservation' ? 'Reserve my spot' : 'Send inquiry';
            notice.textContent = 'Your message did not send. Check your connection and try again, or email us directly.';
            notice.classList.add('on');
          });
      } else {
        notice.innerHTML = 'Preview mode: this form is not connected to email yet, so nothing was sent. ';
        var c = doc.createElement('a');
        c.href = '#'; c.className = 'link'; c.textContent = 'Continue to the thank-you page';
        c.addEventListener('click', function (ev) { ev.preventDefault(); go(); });
        notice.appendChild(c);
        notice.classList.add('on');
        notice.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      }
    });

    $$('input,select,textarea', form).forEach(function (i) {
      i.addEventListener('input', function () { var f = i.closest('.field'); if (f) f.classList.remove('invalid'); });
    });
  }

  /* ---- Thank-you page ---- */
  var ty = $('[data-thanks]');
  if (ty) {
    var q = new URLSearchParams(location.search);
    var name = q.get('name');
    var t = q.get('type') === 'reservation' ? 'reservation' : 'inquiry';
    $('[data-ty-title]', ty).textContent = name ? 'Thank you, ' + name + '.' : 'Thank you.';
    $$('[data-ty]', ty).forEach(function (n) { n.hidden = n.getAttribute('data-ty') !== t; });
  }
})();
