/* =========================================================
   JP Soluções em Prevenção Contra Incêndio  —  main.js  v1
   ========================================================= */
(function () {
  "use strict";

  var header = document.querySelector(".header");
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));

  /* ---------- Header: sombra ao rolar ---------- */
  var onScroll = function () {
    if (window.scrollY > 12) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      header.classList.remove("nav-open");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Link ativo conforme a seção visível ---------- */
  var sections = navLinks
    .map(function (l) {
      var id = l.getAttribute("href");
      return id && id.charAt(0) === "#" && id.length > 1 ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (l) {
            l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Animação de entrada (fade + leve movimento) ----------
     Varredura própria: cobre rolagem rápida, âncoras do menu e recarregar
     no meio da página — casos em que o IntersectionObserver deixa
     elementos presos em opacity:0. */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var ticking = false;

  var sweep = function () {
    ticking = false;
    var limit = window.innerHeight * 0.92;
    for (var i = reveals.length - 1; i >= 0; i--) {
      var el = reveals[i];
      if (el.classList.contains("is-visible")) { reveals.splice(i, 1); continue; }
      var top = el.getBoundingClientRect().top;
      if (top < limit) { el.classList.add("is-visible"); reveals.splice(i, 1); }
    }
  };
  var requestSweep = function () {
    if (ticking) return;
    ticking = true;
    if (window.requestAnimationFrame) window.requestAnimationFrame(sweep);
    else window.setTimeout(sweep, 16);
  };

  sweep(); // direto: garante conteúdo visível mesmo em aba de fundo (rAF pausado)
  window.addEventListener("scroll", requestSweep, { passive: true });
  window.addEventListener("resize", requestSweep, { passive: true });
  window.addEventListener("load", sweep);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) sweep(); });

  /* ---------- Serviços: carrossel 3D (coverflow) ---------- */
  (function s3d() {
    var root = document.querySelector(".s3d");
    if (!root) return;
    var track = root.querySelector(".s3d__track");
    var cards = Array.prototype.slice.call(track.children);
    var vp = root.querySelector(".s3d__viewport");
    var btnPrev = root.querySelector(".s3d__nav--prev");
    var btnNext = root.querySelector(".s3d__nav--next");
    var nowEl = root.querySelector(".s3d__now");
    var totalEl = root.querySelector(".s3d__total");
    var labelEl = root.querySelector(".s3d__label");
    var dotsWrap = root.querySelector(".s3d__dots");
    var n = cards.length;
    if (totalEl) totalEl.textContent = String(n);
    var active = 0;
    var timer = null;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var PRESET = {
      "0":  { x: "0%",    z: "0px",    ry: "0deg",   sc: 1,    op: 1,    zi: 6, st: "active" },
      "-1": { x: "-58%",  z: "-180px", ry: "26deg",  sc: 0.68, op: 0.45, zi: 3, st: "side" },
      "1":  { x: "60%",   z: "-70px",  ry: "-16deg", sc: 0.86, op: 0.92, zi: 5, st: "side" },
      "-2": { x: "-96%",  z: "-360px", ry: "30deg",  sc: 0.5,  op: 0.14, zi: 1, st: "far" },
      "2":  { x: "100%",  z: "-300px", ry: "-24deg", sc: 0.58, op: 0.26, zi: 2, st: "far" }
    };

    var dots = cards.map(function (c, i) {
      var b = document.createElement("button");
      b.className = "s3d__dot";
      b.type = "button";
      b.setAttribute("aria-label", "Ir para o serviço " + (i + 1));
      b.addEventListener("click", function () { go(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function fit() { vp.style.height = cards[active].offsetHeight + "px"; }

    function render() {
      for (var i = 0; i < n; i++) {
        var d = i - active;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        var p = PRESET[String(d)] || { x: (d < 0 ? "-130%" : "130%"), z: "-520px", ry: "0deg", sc: 0.4, op: 0, zi: 0, st: "far" };
        var el = cards[i];
        el.style.setProperty("--x", p.x);
        el.style.setProperty("--z", p.z);
        el.style.setProperty("--ry", p.ry);
        el.style.setProperty("--sc", p.sc);
        el.style.setProperty("--op", p.op);
        el.style.zIndex = p.zi;
        el.dataset.state = p.st;
        el.setAttribute("aria-hidden", p.st === "active" ? "false" : "true");
      }
      if (nowEl) nowEl.textContent = String(active + 1);
      if (labelEl) labelEl.textContent = cards[active].querySelector("h3").textContent;
      dots.forEach(function (dt, i) { dt.classList.toggle("is-active", i === active); });
      fit();
    }

    function go(i) { active = (i % n + n) % n; render(); }
    function nextC() { go(active + 1); }
    function prevC() { go(active - 1); }

    function start() { if (reduce || timer) return; timer = window.setInterval(nextC, 5000); }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    btnPrev.addEventListener("click", function () { prevC(); restart(); });
    btnNext.addEventListener("click", function () { nextC(); restart(); });
    cards.forEach(function (c, i) {
      c.addEventListener("click", function () { if (i !== active) { go(i); restart(); } });
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { prevC(); restart(); e.preventDefault(); }
      else if (e.key === "ArrowRight") { nextC(); restart(); e.preventDefault(); }
    });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

    var sx = 0, swiping = false;
    vp.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; swiping = true; }, { passive: true });
    vp.addEventListener("touchend", function (e) {
      if (!swiping) return;
      swiping = false;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 44) { (dx < 0 ? nextC : prevC)(); restart(); }
    }, { passive: true });

    window.addEventListener("resize", fit, { passive: true });
    window.addEventListener("load", render);

    render();
    start();
  })();

  /* ---------- Vídeo da galeria: esconde o "play" ao reproduzir ---------- */
  (function galleryVideo() {
    var fig = document.querySelector(".gallery__video");
    if (!fig) return;
    var v = fig.querySelector("video");
    if (!v) return;
    v.addEventListener("play", function () { fig.classList.add("is-playing"); });
    v.addEventListener("pause", function () { fig.classList.remove("is-playing"); });
    v.addEventListener("ended", function () { fig.classList.remove("is-playing"); });
  })();

  /* ---------- Filtro do portfólio ---------- */
  var filters = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var items = Array.prototype.slice.call(document.querySelectorAll(".gallery figure"));
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var cat = btn.getAttribute("data-filter");
      items.forEach(function (fig) {
        var match = cat === "todos" || (fig.getAttribute("data-category") || "").split(" ").indexOf(cat) !== -1;
        fig.classList.toggle("is-hidden", !match);
      });
    });
  });

  /* ---------- Efeitos 3D: parallax, tilt, deck, hero ---------- */
  (function fx() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var players = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    var tilters = Array.prototype.slice.call(document.querySelectorAll("[data-tilt]"));
    var deck = document.querySelector("[data-deck]");
    var hero = document.querySelector(".hero");
    var heroInner = document.querySelector(".hero__inner");
    var heroFlame = document.querySelector(".hero__flame");
    var raf = false;

    function onScroll() {
      if (raf) return;
      raf = true;
      window.requestAnimationFrame(function () {
        raf = false;
        var vh = window.innerHeight;
        players.forEach(function (el) {
          var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
          var host = el.parentElement.getBoundingClientRect();
          if (host.bottom < -200 || host.top > vh + 200) return; // fora de vista
          var offset = host.top + host.height / 2 - vh / 2;
          var y = Math.max(-160, Math.min(160, -offset * speed));
          el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
        });
      });
    }
    if (players.length) {
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
    }

    tilters.forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", (px * 9).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-py * 9).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--rx", "0deg");
      });
    });

    if (deck) {
      var media = deck.parentElement;
      media.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        var r = media.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        deck.style.transform = "rotateY(" + (px * 14).toFixed(2) + "deg) rotateX(" + (-py * 12).toFixed(2) + "deg)";
      });
      media.addEventListener("pointerleave", function () { deck.style.transform = ""; });
    }

    if (hero && heroInner) {
      hero.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        heroInner.style.transform = "translate3d(" + (px * 14).toFixed(1) + "px," + (py * 10).toFixed(1) + "px,0)";
        if (heroFlame) heroFlame.style.transform = "translate3d(" + (px * -42).toFixed(1) + "px," + (py * -26).toFixed(1) + "px,0)";
      });
      hero.addEventListener("pointerleave", function () {
        heroInner.style.transform = "";
        if (heroFlame) heroFlame.style.transform = "";
      });
    }
  })();

  /* ---------- Banner de cookies (LGPD) ---------- */
  var cookie = document.querySelector(".cookie");
  var STORAGE_KEY = "jp_lgpd_consent";
  var decided = null;
  try { decided = window.localStorage.getItem(STORAGE_KEY); } catch (e) {}

  if (cookie && !decided) {
    window.setTimeout(function () { cookie.classList.add("is-visible"); }, 900);
    cookie.addEventListener("click", function (ev) {
      var choice = ev.target && ev.target.getAttribute("data-consent");
      if (!choice) return;
      try { window.localStorage.setItem(STORAGE_KEY, choice); } catch (e) {}
      if (typeof window.gtag === "function") {
        var g = choice === "accepted" ? "granted" : "denied";
        window.gtag("consent", "update", { ad_storage: g, ad_user_data: g, ad_personalization: g, analytics_storage: g });
      }
      cookie.classList.remove("is-visible");
      window.setTimeout(function () { cookie.setAttribute("hidden", ""); }, 450);
    });
  } else if (cookie) {
    cookie.setAttribute("hidden", "");
  }

  /* ---------- Medição: clique em qualquer link de WhatsApp ----------
     Empurra o evento "whatsapp_click" para o dataLayer. As tags (conversão do Google Ads e evento do GA4)
     ficam no GTM-T44GQM7Q, não aqui, para não contar em dobro. */
  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]') : null;
    if (!a) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "whatsapp_click", link_url: a.href, link_text: (a.textContent || "").trim().slice(0, 80) });
  });

  /* ---------- Ano no rodapé ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());
})();
