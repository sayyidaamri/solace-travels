/* Solace Travels — interactions & motion. Vanilla JS + GSAP (local copy in assets/vendor). */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var isMobile = function () { return window.innerWidth <= 479; };
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger) && !reduced;
  var mobile = isMobile();
  var header = $(".header");
  var headerH = function () { return header ? header.offsetHeight : 72; };
  var smoother = null;
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------- smooth scrolling ---------------- */
  if (hasGsap) {
    var plugins = [ScrollTrigger];
    if (window.ScrollToPlugin) plugins.push(ScrollToPlugin);
    if (window.SplitText) plugins.push(SplitText);
    if (window.ScrollSmoother && !mobile && $("#smooth-wrapper")) plugins.push(ScrollSmoother);
    gsap.registerPlugin.apply(gsap, plugins);
    if (window.ScrollSmoother && !mobile && $("#smooth-wrapper")) {
      smoother = ScrollSmoother.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 1.2, effects: true });
    }
  }

  function scrollToEl(el, offset, dur) {
    if (!el) return;
    if (smoother) {
      smoother.scrollTo(el, true, "top " + offset + "px");
    } else if (hasGsap && window.ScrollToPlugin) {
      var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
      gsap.to(window, { scrollTo: { y: Math.max(0, y) }, duration: dur || .8, ease: "power2.inOut" });
    } else {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - offset, behavior: reduced ? "auto" : "smooth" });
    }
  }

  /* in-page anchors (#retreats) */
  $$('a[href^="#"]:not([data-target])').forEach(function (a) {
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    a.addEventListener("click", function (e) {
      var t = document.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      closeMenu();
      scrollToEl(t, 40, .8);
      history.replaceState(null, "", id);
    });
  });
  if (location.hash.length > 1) {
    window.addEventListener("load", function () {
      var t = document.getElementById(location.hash.slice(1));
      if (t) setTimeout(function () { scrollToEl(t, 40, .6); }, 150);
    });
  }

  /* ---------------- header ---------------- */
  function onScrollHeader() {
    if (header) header.classList.toggle("is-scrolled", window.pageYOffset > 20);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* current-section highlight for "Retreats" link on the home page */
  var retreatsSec = document.getElementById("retreats");
  var retreatLinks = $$('.nav__link[data-nav="retreats"]');
  if (retreatsSec && retreatLinks.length) {
    var spy = function () {
      var r = retreatsSec.getBoundingClientRect();
      var on = r.top < window.innerHeight * .5 && r.bottom > window.innerHeight * .5;
      retreatLinks.forEach(function (l) { l.classList.toggle("is-current", on); });
    };
    window.addEventListener("scroll", spy, { passive: true });
    if (hasGsap) gsap.ticker.add(spy); else spy();
  }

  /* burger menu */
  var burger = $(".burger"), menu = $(".mobile-menu");
  function closeMenu() {
    if (!burger) return;
    burger.classList.remove("is-active"); burger.setAttribute("aria-expanded", "false");
    if (menu) menu.classList.remove("is-active");
    document.documentElement.classList.remove("menu-open");
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = !burger.classList.contains("is-active");
      burger.classList.toggle("is-active", open); burger.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-active", open);
    });
    $$(".nav__link, .btn-primary", menu).forEach(function (l) { l.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* ---------------- cookie banner ---------------- */
  var cookie = $(".cookie");
  function syncCookiePad() {
    document.body.style.paddingBottom = cookie && cookie.classList.contains("is-active") ? cookie.offsetHeight + "px" : "";
  }
  if (cookie) {
    if (!store.get("solace_cookie")) {
      setTimeout(function () { cookie.classList.add("is-active"); syncCookiePad(); }, 600);
      window.addEventListener("resize", syncCookiePad);
    }
    $$("[data-cookie]", cookie).forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        cookie.classList.remove("is-active");
        store.set("solace_cookie", b.getAttribute("data-cookie"));
        syncCookiePad();
      });
    });
  }

  /* ---------------- sliders (mobile) ---------------- */
  $$("[data-slider]").forEach(function (track) {
    var dotsBox = track.parentElement.querySelector(".retreat-photos__dots");
    var slides = Array.prototype.slice.call(track.children);
    if (dotsBox) {
      slides.forEach(function (s, i) {
        var b = document.createElement("button");
        b.type = "button"; b.setAttribute("aria-label", "Show photo " + (i + 1));
        b.addEventListener("click", function () { track.scrollTo({ left: s.offsetLeft - track.offsetLeft, behavior: "smooth" }); });
        dotsBox.appendChild(b);
      });
    }
    var update = function () {
      if (!dotsBox) return;
      var i = Math.round(track.scrollLeft / (track.clientWidth || 1));
      Array.prototype.forEach.call(dotsBox.children, function (d, k) { d.classList.toggle("is-active", k === i); });
    };
    track.addEventListener("scroll", update, { passive: true });
    update();
    /* desktop-mouse drag support when the slider is active */
    var down = false, sx = 0, sl = 0;
    track.addEventListener("mousedown", function (e) { down = true; sx = e.pageX; sl = track.scrollLeft; track.style.scrollSnapType = "none"; });
    window.addEventListener("mouseup", function () { if (down) { down = false; track.style.scrollSnapType = ""; } });
    track.addEventListener("mousemove", function (e) { if (down) { e.preventDefault(); track.scrollLeft = sl - (e.pageX - sx); } });
  });

  /* coach cards: tap to open details on touch / mobile, Enter key on desktop */
  $$(".coach").forEach(function (c) {
    c.addEventListener("click", function (e) {
      if (!isMobile() && !window.matchMedia("(hover: none)").matches) return;
      if (e.target.closest("a")) return;
      var open = !c.classList.contains("is-open");
      $$(".coach.is-open").forEach(function (o) { o.classList.remove("is-open"); });
      c.classList.toggle("is-open", open);
    });
    c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.classList.toggle("is-open"); } });
    c.addEventListener("focusout", function () { setTimeout(function () { if (!c.contains(document.activeElement)) c.classList.remove("is-open"); }, 0); });
  });

  /* equal heights for coach info heads (desktop) */
  function equalCoachHeads() {
    var heads = $$(".coach-info__head");
    heads.forEach(function (h) { h.style.height = "auto"; });
    if (isMobile()) return;
    var m = 0; heads.forEach(function (h) { m = Math.max(m, h.offsetHeight); });
    heads.forEach(function (h) { h.style.height = m + "px"; });
  }
  equalCoachHeads(); window.addEventListener("resize", equalCoachHeads);

  /* ---------------- retreat page: section nav ---------------- */
  var rLinks = $$("[data-target]");
  var lockSpy = false;
  if (rLinks.length) {
    rLinks.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var id = a.getAttribute("data-target"), t = document.getElementById(id);
        setActive(id); lockSpy = true;
        var off = headerH() + 20;
        if (isMobile()) { var mn = $(".retreat-nav-m"); off += mn ? mn.offsetHeight : 0; }
        scrollToEl(t, off, .8);
        setTimeout(function () { lockSpy = false; }, 950);
      });
    });
    var setActive = function (id) {
      rLinks.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("data-target") === id); });
      var nm = $(".retreat-nav-m"), act = nm && $('a.is-active', nm);
      if (nm && act && isMobile()) nm.scrollLeft = act.offsetLeft - nm.offsetLeft - 20;
    };
    var ids = []; rLinks.forEach(function (l) { var i = l.getAttribute("data-target"); if (ids.indexOf(i) < 0) ids.push(i); });
    var rSpy = function () {
      if (lockSpy) return;
      var off = isMobile() ? ($(".retreat-nav-m") || {}).offsetHeight || 60 : 60;
      var line = off + headerH() + 20, cur = ids[0];
      var docH = document.documentElement.scrollHeight;
      if (window.pageYOffset + window.innerHeight >= docH - 100) cur = ids[ids.length - 1];
      else ids.forEach(function (id) { var el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= line) cur = id; });
      setActive(cur);
    };
    window.addEventListener("scroll", rSpy, { passive: true });
    rSpy();
  }

  /* ---------------- legal page: table of contents ---------------- */
  var legalItems = $(".legal-nav__items");
  var legalHeads = $$("[data-legal-nav]");
  if (legalItems && legalHeads.length) {
    legalItems.innerHTML = "";
    var lLinks = legalHeads.map(function (h, i) {
      var a = document.createElement("a");
      a.href = "#" + (h.id || (h.id = "section-" + (i + 1)));
      a.className = "legal-nav__link"; a.textContent = h.textContent.trim();
      a.addEventListener("click", function (e) { e.preventDefault(); scrollToEl(h, headerH() + 20, .8); });
      var w = document.createElement("div"); w.className = "legal-nav__item"; w.appendChild(a); legalItems.appendChild(w);
      return a;
    });
    var lSpy = function () {
      var k = 0, lim = window.innerHeight * .2;
      legalHeads.forEach(function (h, i) { if (h.getBoundingClientRect().top <= lim) k = i; });
      lLinks.forEach(function (a, i) { a.classList.toggle("is-active", i === k); });
    };
    window.addEventListener("scroll", lSpy, { passive: true }); lSpy();
  }

  /* ---------------- contact form (front-end only, no data is sent) ---------------- */
  $$(".form").forEach(function (form) {
    var validate = function () {
      var ok = true;
      $$(".inp-group", form).forEach(function (g) { g.classList.remove("is-error"); });
      $$("[required]", form).forEach(function (f) {
        var v = f.value.trim();
        var bad = !v || (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
        if (bad) { f.closest(".inp-group").classList.add("is-error"); f.setAttribute("aria-invalid", "true"); ok = false; }
        else f.removeAttribute("aria-invalid");
      });
      return ok;
    };
    var send = function () {
      if (!validate()) { var first = $(".is-error input, .is-error textarea", form); if (first) first.focus(); return; }
      form.classList.add("is-sending");
      setTimeout(function () {
        form.classList.remove("is-sending");
        var box = form.closest(".contact-us__content");
        if (box) box.classList.add("is-sent");
        form.reset();
        var go = box && $(".contact-success .btn-primary", box); if (go) go.focus();
      }, 700);
    };
    form.addEventListener("submit", function (e) { e.preventDefault(); send(); });
    $$(".inp-group__input, .inp-group__textarea", form).forEach(function (f) {
      f.addEventListener("input", function () { f.closest(".inp-group").classList.remove("is-error"); });
    });
  });

  /* ================================================================
     MOTION
     ================================================================ */
  if (!hasGsap) return;
  var hasSplit = !!window.SplitText;
  var E3 = "power3.out", E2 = "power2.inOut";

  /* wrap each line in an overflow-hidden mask and push it down */
  function lines(el, withChars, charClass) {
    if (!el || !hasSplit) return null;
    var lead = (el.innerHTML.match(/^((?:&nbsp;| | )+)/) || [])[0];
    var s = new SplitText(el, { type: withChars ? "lines,chars" : "lines", linesClass: "split-line", charsClass: charClass || "ch" });
    if (lead && s.lines.length) { var sp = document.createElement("span"); sp.innerHTML = lead; s.lines[0].insertBefore(sp, s.lines[0].firstChild); }
    s.lines.forEach(function (l) { var w = document.createElement("div"); w.className = "split-line-wrap"; l.parentNode.insertBefore(w, l); w.appendChild(l); });
    gsap.set(s.lines, { yPercent: 100 });
    if (withChars) gsap.set(s.chars, { color: "rgba(255,255,255,0.4)" });
    return s;
  }
  function chars(el) {
    if (!el || !hasSplit) return null;
    var s = new SplitText(el, { type: "chars", charsClass: "tw-char" });
    gsap.set(s.chars, { opacity: 0 });
    return s;
  }
  function hide(el, vars) { if (el) gsap.set(el, vars); return el; }
  function on(trigger, fn, start) {
    if (!trigger) return;
    ScrollTrigger.create({ trigger: trigger, start: start || "top 88%", once: true, onEnter: fn });
  }
  var typeKF = [{ opacity: .4, duration: .06, ease: "none" }, { opacity: 1, duration: .18, ease: "power1.out" }];
  /* heading text: typewriter on desktop, simple rise on mobile */
  function heading(el) {
    if (!el) return { play: function () {}, dur: 0 };
    if (mobile || !hasSplit) { hide(el, { opacity: 0, y: 30 }); return { play: function (tl, at) { tl.to(el, { opacity: 1, y: 0, duration: .8, ease: E3 }, at + .2); }, dur: .4 }; }
    var s = chars(el);
    return { play: function (tl, at) { tl.to(s.chars, { keyframes: typeKF, stagger: .03 }, at); }, dur: s.chars.length * .03 * .5 };
  }
  /* paragraph: line rise + colour fill on desktop, rise + fill on mobile */
  function paragraph(el) {
    if (!el) return { play: function () {} };
    if (mobile || !hasSplit) {
      var sm = hasSplit ? new SplitText(el, { type: "words,chars", charsClass: "ch" }) : null;
      hide(el, { opacity: 0, y: 30 }); if (sm) gsap.set(sm.chars, { color: "rgba(255,255,255,0.4)" });
      return { play: function (tl, at) { tl.to(el, { opacity: 1, y: 0, duration: .8, ease: E3 }, at); if (sm) tl.to(sm.chars, { color: "#fff", duration: .08, ease: "none", stagger: .008 }, at + .3); } };
    }
    var s = lines(el, true);
    return { play: function (tl, at, cd) { tl.to(s.lines, { yPercent: 0, duration: .8, ease: E3, stagger: .08 }, at); tl.to(s.chars, { color: "#fff", duration: .08, ease: "none", stagger: .008 }, at + (cd || .5)); } };
  }
  function riseLines(el, mobileFade) {
    if (!el) return { play: function () {} };
    if (mobile && mobileFade) { hide(el, { opacity: 0, y: 30 }); return { play: function (tl, at) { tl.to(el, { opacity: 1, y: 0, duration: .8, ease: E3 }, at + .2); } }; }
    var s = lines(el);
    if (!s) return { play: function () {} };
    return { play: function (tl, at, d, st) { tl.to(s.lines, { yPercent: 0, duration: d || .8, ease: E3, stagger: st || .08 }, at); } };
  }

  /* generic data-anim (header items, legal page etc.) */
  var presets = {
    "fade-up": function (d) { return { opacity: 0, y: d }; },
    "fade-down": function (d) { return { opacity: 0, y: -d }; },
    "fade-up-big": function () { return { opacity: 0, y: 200 }; },
    "fade": function () { return { opacity: 0 }; }
  };
  $$("[data-anim]").forEach(function (el) {
    var p = presets[el.getAttribute("data-anim")]; if (!p) return;
    var d = parseFloat(el.getAttribute("data-anim-distance") || 40);
    gsap.set(el, p(d));
    var delay = parseFloat(el.getAttribute("data-anim-delay") || 0);
    on(el, function () { gsap.to(el, { opacity: 1, x: 0, y: 0, duration: .8, delay: delay, ease: E3 }); });
  });

  /* header frame lines */
  if (!mobile) {
    [[".header__dec--1", { scaleX: 0 }, { scaleX: 1, delay: .3 }], [".header__dec--2", { scaleY: 0 }, { scaleY: 1, delay: .4 }], [".header__dec--3", { scaleY: 0 }, { scaleY: 1, delay: .5 }]].forEach(function (c) {
      var el = $(c[0]); if (!el) return; gsap.set(el, c[1]); gsap.to(el, Object.assign({ duration: .5, ease: E2 }, c[2]));
    });
  } else {
    var ib = $(".intro__btn-m"); if (ib) { gsap.set(ib, { opacity: 0, y: 30 }); gsap.to(ib, { opacity: 1, y: 0, duration: .8, delay: .3, ease: E3 }); }
  }

  /* --- home: statistic --- */
  var stat = $(".statistic-section");
  if (stat) (function () {
    var title = hide($("[data-a=title]", stat), { opacity: 0, y: 40 });
    var h = heading($("[data-a=h2]", stat));
    var bt = $(".stat__border--top", stat), bb = $(".stat__border--bottom", stat), br = $$(".stat__border--right", stat);
    gsap.set([bt, bb], { width: "0%" }); gsap.set(br, { height: "0%" });
    var items = $$(".stat-item", stat).map(function (it) {
      return { t: hide($(".stat-item__title", it), { opacity: 0, y: 30 }), s: hide($(".stat-item__sub", it), { opacity: 0, y: 30 }), i: hide($(".stat-item__img", it), { opacity: 0, x: -40 }) };
    });
    on(stat, function () {
      var tl = gsap.timeline();
      tl.to(title, { opacity: 1, y: 0, duration: .8, ease: E3 }, 0);
      h.play(tl, 0);
      var e = h.dur || .4;
      tl.to([bt, bb], { width: "100%", duration: .8, ease: E2 }, e);
      tl.to(br, { height: "calc(100% - 2px)", duration: .8, ease: E2 }, e + .48);
      items.forEach(function (it, k) {
        var o = e + .24 + .3 * k;
        tl.to(it.t, { opacity: 1, y: 0, duration: .6, ease: E3 }, o).to(it.s, { opacity: 1, y: 0, duration: .6, ease: E3 }, o + .1).to(it.i, { opacity: 1, x: 0, duration: .8, ease: E3 }, o + .15);
      });
    });
  })();

  /* --- home: about --- */
  var about = $(".about-section");
  if (about) (function () {
    var title = hide($("[data-a=title]", about), { opacity: 0, y: 40 });
    var h = heading($("[data-a=h2]", about));
    var img = hide($(".about__img", about), { opacity: 0, x: -40 });
    var p = paragraph($("[data-a=lead]", about));
    var heads = $$("[data-a=num]", about).map(function (el) { return riseLines(el); });
    var descs = $$("[data-a=num-desc]", about).map(function (el) { return riseLines(el); });
    var foot = riseLines($("[data-a=foot]", about));
    var logos = $$(".partner", about); gsap.set(logos, { opacity: 0, y: 20 });
    on(about, function () {
      var tl = gsap.timeline();
      tl.to(title, { opacity: 1, y: 0, duration: .8, ease: E3 }, 0);
      h.play(tl, 0);
      var e = h.dur || .4;
      tl.to(img, { opacity: 1, x: 0, duration: .8, ease: E3 }, e);
      p.play(tl, e + .2, .5);
      var a = e + .8;
      heads.forEach(function (x, i) { x.play(tl, a + .3 * i, .7, .06); });
      descs.forEach(function (x, i) { x.play(tl, a + .15 + .3 * i, .7, .06); });
      foot.play(tl, a + .6, .7, .06);
      tl.to(logos, { opacity: 1, y: 0, duration: .5, ease: E3, stagger: .12 }, a + .8);
    });
  })();

  /* --- featured retreats (home + retreat pages) --- */
  $$(".featured-section").forEach(function (sec) {
    var head = riseLines($("[data-a=h2]", sec), true);
    var desc = riseLines($("[data-a=desc]", sec), true);
    var hz = $$(".featured__dec--h", sec), vt = $$(".featured__dec--v", sec);
    gsap.set(hz, { width: "0%" }); gsap.set(vt, { height: "0%" });
    var cards = $$(".featured-item", sec).map(function (c) {
      var o = { el: c, head: riseLines($(".featured-item__title", c)) };
      o.cost = hide($(".featured-item__cost", c), { opacity: 0, y: 20 });
      o.props = $$(".prop", c); gsap.set(o.props, { opacity: 0, y: 20 });
      o.btn = $(".featured-item__btn .btn-secondary", c); if (o.btn) { o.btn.style.transition = "none"; gsap.set(o.btn, { scale: 0, opacity: 0 }); }
      o.img = $$(".featured-item__visual", c).filter(function (v) { return v.offsetParent !== null; }); gsap.set(o.img, { opacity: 0, x: -40 });
      return o;
    });
    function card(o, tl, a) {
      o.head.play(tl, a, .7, .08);
      tl.to(o.cost, { opacity: 1, y: 0, duration: .6, ease: E3 }, a + .1);
      tl.to(o.img, { opacity: 1, x: 0, duration: .8, ease: E3 }, a + .1);
      tl.to(o.props, { opacity: 1, y: 0, duration: .6, ease: E3, stagger: .08 }, a + .2);
      if (o.btn) tl.to(o.btn, { scale: 1, opacity: 1, duration: .5, ease: "power2.out", clearProps: "transition", onComplete: function () { o.btn.style.transition = ""; } }, a + .2 + .08 * o.props.length);
    }
    on(sec, function () {
      var tl = gsap.timeline();
      hz.forEach(function (d, i) { tl.to(d, { width: "100%", duration: .8, ease: E2 }, .1 * i); });
      vt.forEach(function (d, i) { tl.to(d, { height: "calc(100% - 2px)", duration: .8, ease: E2 }, .1 * hz.length + .1 * i); });
      head.play(tl, 0); desc.play(tl, .3);
      if (!mobile) cards.forEach(function (o, i) { card(o, tl, .7 + .15 * i); });
    });
    if (mobile) cards.forEach(function (o) { on(o.el, function () { card(o, gsap.timeline(), 0); }, "top 90%"); });
  });

  /* --- combine --- */
  var comb = $(".combine-section");
  if (comb) (function () {
    var h = riseLines($("[data-a=h2]", comb));
    var items = $$(".combine__item .h3", comb).map(function (e) { return riseLines(e); });
    var lead = paragraph($("[data-a=lead]", comb));
    var hz = $$(".combine__dec", comb); gsap.set(hz, { width: "0%" });
    var vt = $$(".combine-step__dec:not(.combine-step__dec--m)", comb); gsap.set(vt, { height: "0%" });
    var steps = $$(".combine-step:not(.combine-step--lead)", comb).map(function (s) {
      return { h: riseLines($(".combine-step__head", s)), b: riseLines($(".combine-step__body .body-lg", s)) };
    });
    on(comb, function () {
      var tl = gsap.timeline(), e = 0;
      h.play(tl, e, .8, .08);
      items.forEach(function (x, i) { x.play(tl, e + .15 * (i + 1), .7, .08); });
      hz.forEach(function (d, i) { tl.to(d, { width: "100%", duration: .8, ease: E2 }, e + .1 * i); });
      e += .6;
      lead.play(tl, e, .5);
      vt.forEach(function (d, i) { tl.to(d, { height: "100%", duration: .8, ease: E2 }, e + .4 + .1 * i); });
      e += .6;
      steps.forEach(function (s, i) { s.h.play(tl, e + .2 * i, .7, .06); s.b.play(tl, e + .2 * i + .1, .7, .06); });
    });
  })();

  /* --- destination: map dots pop + pulse --- */
  var dest = $(".destination-section");
  if (dest) (function () {
    var title = hide($("[data-a=title]", dest), { opacity: 0, y: 40 });
    var h = heading($("[data-a=h2]", dest));
    var p = paragraph($("[data-a=lead]", dest));
    var dots = $$(".map-dot", dest).map(function (g) {
      var glow = $(".map-dot__glow", g), dot = $(".map-dot__core", g);
      var o = glow.getAttribute("cx") + " " + glow.getAttribute("cy");
      gsap.set([glow, dot], { scale: 0, svgOrigin: o });
      return { glow: glow, dot: dot, o: o };
    });
    on(dest, function () {
      var tl = gsap.timeline();
      tl.to(title, { opacity: 1, y: 0, duration: .8, ease: E3 }, 0);
      h.play(tl, .2);
      p.play(tl, .2 + (h.dur || .4), .5);
    });
    var svg = $(".destination__dots", dest);
    if (svg && dots.length) on(svg, function () {
      var tl = gsap.timeline();
      gsap.utils.shuffle(dots.slice()).forEach(function (d, i) {
        tl.to(d.glow, { scale: .6, opacity: .15, duration: .6, ease: "elastic.out(1, 0.5)" }, .08 * i).to(d.dot, { scale: 1, duration: .6, ease: "elastic.out(1, 0.5)" }, .08 * i);
      });
      tl.call(function () {
        dots.forEach(function (d) {
          var delay = Math.random() * 2, dur = 1 + Math.random() * .8;
          gsap.to(d.dot, { scale: 1.2, duration: dur, ease: "sine.inOut", repeat: -1, yoyo: true, delay: delay, svgOrigin: d.o });
          gsap.to(d.glow, { scale: 1.4, opacity: .1, duration: dur, ease: "sine.inOut", repeat: -1, yoyo: true, delay: delay, svgOrigin: d.o });
        });
      });
    }, "top 90%");
    if (mobile) $$(".dest-m-item", dest).forEach(function (it, i) {
      gsap.set(it, { opacity: 0, y: 30 });
      on(it, function () { gsap.to(it, { opacity: 1, y: 0, duration: .8, delay: .15 * i, ease: E3 }); }, "top 90%");
    });
  })();

  /* --- how it works / values --- */
  $$(".how-works-section").forEach(function (sec) {
    var h = riseLines($("[data-a=h2]", sec), true), d = riseLines($("[data-a=desc]", sec), true);
    var items = $$(".how-item", sec).map(function (it) {
      var o = { head: hide($(".how-item__head", it), { opacity: 0, y: 30 }) };
      var t = $(".how-item__title", it), ds = $(".how-item__desc", it);
      if (mobile) { o.t = hide(t, { opacity: 0, y: 30 }); o.d = hide(ds, { opacity: 0, y: 30 }); }
      else { o.ts = riseLines(t); o.ds = riseLines(ds); }
      return o;
    });
    on(sec, function () {
      var tl = gsap.timeline(), e = 0;
      h.play(tl, e); e += .3; d.play(tl, e); e += .4;
      items.forEach(function (o, i) {
        var a = e + .2 * i;
        tl.to(o.head, { opacity: 1, y: 0, duration: .7, ease: E3 }, a);
        if (mobile) { tl.to(o.t, { opacity: 1, y: 0, duration: .7, ease: E3 }, a + .1).to(o.d, { opacity: 1, y: 0, duration: .7, ease: E3 }, a + .2); }
        else { o.ts.play(tl, a + .1, .7, .06); o.ds.play(tl, a + .2, .7, .06); }
      });
    });
  });

  /* --- practitioners --- */
  var pr = $(".practitioners-section");
  if (pr) (function () {
    var cards = $$(mobile ? ".practitioners__list.m-only .practitioners-person" : ".practitioners__list.d-only .coach", pr).map(function (c) {
      return { v: hide($(".coach__visual, .practitioners-person__visual", c), { opacity: 0, x: -40 }), t: riseLines($(".coach__head .body-lg, .practitioners-person__text .body-lg", c)), d: riseLines($(".coach__head .body-sm, .practitioners-person__text .body-sm", c)) };
    });
    var title = hide($("[data-a=title]", pr), { opacity: 0, y: 40 });
    var h = riseLines($("[data-a=h2]", pr), true);
    var plus = $$(".practitioners-item__icon", pr); gsap.set(plus, { rotation: -180, opacity: 0 });
    var it1 = riseLines($("[data-a=it1]", pr), true), it2 = riseLines($("[data-a=it2]", pr), true);
    var big = mobile ? riseLines($("[data-a=big]", pr), true) : paragraph($("[data-a=big]", pr));
    var decs = mobile ? [] : [[".practitioners__dec--top", "width", 0], [".practitioners__dec--bottom", "width", .1], [".practitioners__list .practitioners__dec--mid", "height", .2], [".practitioners__dec--hz", "width", .3], [".practitioners > .practitioners__dec--mid", "height", .4]].map(function (c) {
      var el = $(c[0], pr); if (el) gsap.set(el, c[1] === "width" ? { width: "0%" } : { height: "0%" }); return [el, c[1], c[2]];
    });
    on(pr, function () {
      var tl = gsap.timeline();
      cards.forEach(function (c, i) { var a = .2 * i; tl.to(c.v, { opacity: 1, x: 0, duration: .8, ease: E3 }, a); c.t.play(tl, a + .15, .7, .06); c.d.play(tl, a + .25, .7, .06); });
      var e = .2 * cards.length + .3;
      tl.to(title, { opacity: 1, y: 0, duration: .8, ease: E3 }, e); e += .2;
      h.play(tl, e); e += .4;
      tl.to(plus[0], { rotation: 0, opacity: 1, duration: .6, ease: E3 }, e);
      it1.play(tl, e + .1, .7, .06); it2.play(tl, e + .2, .7, .06); e += .5;
      tl.to(plus[1], { rotation: 0, opacity: 1, duration: .6, ease: E3 }, e);
      big.play(tl, e + .1, .5);
      decs.forEach(function (d) { if (!d[0]) return; var v = {}; v[d[1]] = d[1] === "width" ? "100%" : "calc(100% - 2px)"; v.duration = .8; v.ease = E2; tl.to(d[0], v, d[2]); });
    });
  })();

  /* --- coaches page --- */
  var cp = $(".coaches-section");
  if (cp) (function () {
    var title = hide($("[data-a=title]", cp), { opacity: 0, y: 40 });
    var h = heading($("[data-a=h2]", cp));
    var p = paragraph($("[data-a=lead]", cp));
    on(cp, function () {
      var tl = gsap.timeline();
      tl.to(title, { opacity: 1, y: 0, duration: .8, ease: E3 }, 0);
      h.play(tl, 0); p.play(tl, h.dur || .4, .5);
    });
    $$(".coach", cp).forEach(function (c, i) {
      var v = hide($(".coach__visual", c), { opacity: 0, x: -40 });
      var t = riseLines($(".coach__head .body-lg", c), true), s = riseLines($(".coach__head .body-sm", c), true);
      var delay = mobile ? .15 : (i % 3) * .15;
      on(c, function () { var tl = gsap.timeline({ delay: delay }); tl.to(v, { opacity: 1, x: 0, duration: .8, ease: E3 }, 0); t.play(tl, .15, .7, .06); s.play(tl, .25, .7, .06); });
    });
  })();

  /* --- contacts page --- */
  var cu = $(".contact-us");
  if (cu) (function () {
    var vis = hide($(".contact-us__visual", cu), { opacity: 0, x: -40 });
    var title = hide($("[data-a=title]", cu), { opacity: 0, y: 40 });
    var h = riseLines($("[data-a=h2]", cu)), d = riseLines($("[data-a=desc]", cu));
    var form = hide($(".form", cu), { opacity: 0, y: 30 });
    var d1 = mobile ? null : $(".contact-us__dec--1", cu), d2 = mobile ? null : $(".contact-us__dec--2", cu);
    if (d1) gsap.set(d1, { height: "0%" }); if (d2) gsap.set(d2, { width: "0%" });
    on(cu, function () {
      var tl = gsap.timeline(), e = 0;
      tl.to(vis, { opacity: 1, x: 0, duration: .8, ease: E3 }, e).to(title, { opacity: 1, y: 0, duration: .8, ease: E3 }, e);
      e += .2; h.play(tl, e); e += .3; d.play(tl, e); e += .3;
      tl.to(form, { opacity: 1, y: 0, duration: .8, ease: E3 }, e);
      if (d1) tl.to(d1, { height: "100%", duration: .8, ease: E2 }, .4);
      if (d2) tl.to(d2, { width: "100%", duration: .8, ease: E2 }, .1);
    });
  })();

  /* --- footer --- */
  var ft = $(".footer");
  if (ft) (function () {
    var vis = hide($(".footer__visual", ft), { opacity: 0, x: -40 });
    var logo = hide($(".footer-logo", ft), { opacity: 0, y: 40 });
    var links = $$(".footer-top__links .h3", ft).map(function (e) { return riseLines(e); });
    var contacts = $$(".footer-top__contacts .body-lg", ft).map(function (e) { return riseLines(e); });
    var copy = riseLines($(".footer__copy .button-sm", ft), true);
    var made = hide($(mobile ? ".made-by--m" : ".made-by--d", ft), { opacity: 0, y: 20 });
    var bl = $$(".footer-bottom__links .button-sm", ft).map(function (e) { return riseLines(e, true); });
    var bd = mobile ? null : $(".footer-bottom__dec", ft), cd = mobile ? null : $(".footer__copy-dec", ft);
    if (bd) gsap.set(bd, { width: "0%" }); if (cd) gsap.set(cd, { height: "0%" });
    on(ft, function () {
      var tl = gsap.timeline(), e = 0;
      tl.to(vis, { opacity: 1, x: 0, duration: .8, ease: E3 }, e); e += .2;
      tl.to(logo, { opacity: 1, y: 0, duration: .7, ease: E3 }, e); e += .2;
      links.forEach(function (x, i) { x.play(tl, e + .1 * i, .7, .06); }); e += .3;
      contacts.forEach(function (x, i) { x.play(tl, e + .1 * i, .7, .06); }); e += .3;
      copy.play(tl, e, .7, .06); e += .1;
      tl.to(made, { opacity: 1, y: 0, duration: .7, ease: E3 }, e); e += .15;
      bl.forEach(function (x, i) { x.play(tl, e + .1 * i, .7, .06); });
      if (bd) tl.to(bd, { width: "100%", duration: .8, ease: E2 }, e + .1);
      if (cd) tl.to(cd, { height: "calc(100% - 2px)", duration: .8, ease: E2 }, e + .2);
    });
  })();

  /* --- retreat page: intro stagger + pinned sidebar --- */
  var dl = 0;
  [".retreat-intro__head .breadcrumbs", ".retreat-intro__head .h2", ".retreat-photos", ".retreat-content__desc"].forEach(function (s) {
    var el = $(s); if (!el) return;
    gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, delay: dl, ease: E3 }); dl += .15;
  });
  var rin = $(".retreat-content__in"), rinfo = $(".retreat-info");
  if (rin && rinfo && !mobile) {
    ScrollTrigger.create({ trigger: rin, pin: rinfo, start: "top " + (headerH() + 32), end: function () { return "+=" + Math.max(0, rin.offsetHeight - rinfo.offsetHeight); }, pinSpacing: false });
  }
  var lnav = $(".legal-nav"), ltext = $(".legal-content__text");
  if (lnav && ltext && !mobile) {
    lnav.style.position = "relative"; lnav.style.top = "0";
    var pt = 24;
    ScrollTrigger.create({ trigger: ltext, pin: lnav, start: "top " + (headerH() + pt), end: function () { return "bottom " + (lnav.offsetHeight + headerH() + pt); }, pinSpacing: false });
  }

  /* --- 404 --- */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
