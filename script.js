/* ═══════════════════════════════════════════════════════════
   Suvashish Chakraborty — Portfolio v4.0
   GSAP + Lenis + Custom Cursor + Glass Interactions
   ═══════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  /* ── Preloader ─────────────────────────────────────────── */
  const preloader = document.getElementById("preloader");
  const plFill    = document.getElementById("plFill");
  const plPct     = document.getElementById("plPct");
  let progress = 0;

  const tick = setInterval(() => {
    progress += Math.random() * 16 + 6;
    if (progress >= 100) { progress = 100; clearInterval(tick); }
    if (plFill) plFill.style.width = progress + "%";
    if (plPct)  plPct.textContent  = Math.round(progress) + "%";
  }, 100);

  window.addEventListener("load", () => {
    if (plFill) plFill.style.width = "100%";
    if (plPct)  plPct.textContent  = "100%";
    setTimeout(() => {
      if (preloader) preloader.classList.add("done");
      setTimeout(initAll, 350);
    }, 400);
  });

  /* ── Boot ──────────────────────────────────────────────── */
  function initAll() {
    initLenis();
    initScrollProgress();
    initNavbar();
    initMobileMenu();
    initCustomCursor();
    initMagnetic();
    initReveal();
    initHeroGSAP();
    initTimelineFill();
    initCountUp();
    initChipAnimation();
    initProcessAnimation();
    initCardLinks();
    initContactForm();
    initBackToTop();
    initSmoothAnchors();
    initThemeToggle();
    initTypewriter();
  }

  /* ── Lenis Smooth Scroll ───────────────────────────────── */
  let lenis;
  function initLenis() {
    if (typeof Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ── Scroll Progress Bar ───────────────────────────────── */
  function initScrollProgress() {
    const bar = document.getElementById("scrollProgress");
    if (!bar) return;
    const update = () => {
      const scrolled = window.scrollY;
      const total    = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ── Navbar ────────────────────────────────────────────── */
  function initNavbar() {
    const nav = document.getElementById("navbar");
    if (!nav) return;

    const links = nav.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("section[id]");

    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 40);

      // Active link tracking
      let current = "";
      sections.forEach((s) => {
        if (window.scrollY >= s.offsetTop - 100) current = s.id;
      });
      links.forEach((l) => {
        l.classList.toggle("active", l.getAttribute("href") === "#" + current);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile Menu ───────────────────────────────────────── */
  function initMobileMenu() {
    const toggle = document.getElementById("navToggle");
    const drawer = document.getElementById("navDrawer");
    if (!toggle || !drawer) return;

    toggle.addEventListener("click", () => {
      const open = drawer.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open);
      drawer.setAttribute("aria-hidden", !open);
    });

    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        drawer.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        drawer.setAttribute("aria-hidden", "true");
      });
    });
  }

  /* ── Custom Cursor ─────────────────────────────────────── */
  function initCustomCursor() {
    const cursor = document.getElementById("cursor");
    if (!cursor || window.matchMedia("(pointer: coarse)").matches) return;

    const dot  = cursor.querySelector(".cur-dot");
    const ring = cursor.querySelector(".cur-ring");
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
    document.addEventListener("mouseleave", () => cursor.classList.add("cursor-hidden"));
    document.addEventListener("mouseenter", () => cursor.classList.remove("cursor-hidden"));

    const interactables = "a, button, [data-magnetic], input, textarea, .cs-card, .social-btn, .nav-cv";
    document.querySelectorAll(interactables).forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("cursor-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("cursor-hover"));
    });

    const lerp = (a, b, n) => (1 - n) * a + n * b;
    const loop = () => {
      rx = lerp(rx, mx, 0.12);
      ry = lerp(ry, my, 0.12);
      if (dot) { dot.style.transform = `translate(${mx}px,${my}px)`; }
      if (ring){ ring.style.transform = `translate(${rx}px,${ry}px)`; }
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ── Magnetic Buttons ──────────────────────────────────── */
  function initMagnetic() {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width  / 2) * 0.25;
        const y = (e.clientY - r.top  - r.height / 2) * 0.25;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0,0)";
      });
    });
  }

  /* ── Scroll Reveal (IntersectionObserver) ──────────────── */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            // Stagger siblings slightly
            const siblings = e.target.parentElement.querySelectorAll(".reveal");
            let delay = 0;
            siblings.forEach((s, idx) => { if (s === e.target) delay = idx * 60; });
            setTimeout(() => e.target.classList.add("visible"), delay);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ── Hero GSAP Animations ──────────────────────────────── */
  function initHeroGSAP() {
    const hero = document.querySelector(".hero");
    if (!hero || typeof gsap === "undefined") {
      // Fallback: just show everything
      document.querySelectorAll(".ha").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    const els = hero.querySelectorAll(".ha");
    gsap.set(els, { opacity: 0, y: 30 });
    gsap.to(els, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: "power3.out",
      delay: 0.1,
    });

    // Hero title individual rows
    const rows = hero.querySelectorAll(".ht-row");
    gsap.from(rows, {
      opacity: 0,
      y: 40,
      rotateX: -12,
      duration: 1,
      stagger: 0.12,
      ease: "power4.out",
      delay: 0.2,
    });
  }

  /* ── Hero Typewriter ───────────────────────────────────── */
  // CSS controls which greeting is visible — JS just animates both.
  // No window.innerWidth checks needed: the right element is already shown by media query.
  // onDone callback lets callers react when typing finishes (e.g. trigger underline)
  function typeIt(container, prefix, name, suffix, onDone) {
    if (!container) return;
    const prefixEl = container.querySelector('.greeting-prefix');
    const nameEl   = container.querySelector('.greeting-name');
    const suffixEl = container.querySelector('.greeting-suffix');
    const cursorEl = container.querySelector('.greeting-cursor');

    const SPEED_PREFIX = 60;
    const SPEED_NAME   = 70;
    const SPEED_SUFFIX = 60;

    let phase = 'prefix';
    let idx   = 0;

    function tick() {
      if (phase === 'prefix') {
        if (idx < prefix.length) {
          prefixEl.textContent += prefix[idx++];
          setTimeout(tick, SPEED_PREFIX);
        } else {
          phase = 'name'; idx = 0;
          setTimeout(tick, SPEED_PREFIX);
        }
      } else if (phase === 'name') {
        if (idx < name.length) {
          nameEl.textContent += name[idx++];
          setTimeout(tick, SPEED_NAME);
        } else {
          phase = 'suffix'; idx = 0;
          setTimeout(tick, SPEED_NAME);
        }
      } else if (phase === 'suffix') {
        if (idx < suffix.length) {
          suffixEl.textContent += suffix[idx++];
          setTimeout(tick, SPEED_SUFFIX);
        } else {
          // Typing complete — fire callback then fade cursor
          if (typeof onDone === 'function') onDone();
          setTimeout(() => {
            cursorEl.style.transition = 'opacity 0.4s ease';
            cursorEl.style.opacity    = '0';
          }, 1800);
        }
      }
    }
    tick();
  }

  function initTypewriter() {
    const webEl      = document.querySelector('.hero-greeting-web');
    const mobEl      = document.querySelector('.hero-greeting-mob');
    const underlineEl = document.querySelector('.ht-underline');

    // Fire after GSAP has faded the greeting elements in (~1.1s)
    setTimeout(() => {
      // Web greeting: trigger underline animation only after last character is typed
      typeIt(webEl, 'Hello, I am\u00A0', 'Suvashish Chakraborty', '', () => {
        if (underlineEl) underlineEl.classList.add('typed');
      });
      typeIt(mobEl, 'Hi,\u00A0', 'Suvashish Chakraborty', '\u00A0here');
    }, 1150);
  }

  /* ── Process Section Animation ────────────────────────── */
  function initProcessAnimation() {
    const steps   = Array.from(document.querySelectorAll('.process-step'));
    const arrows  = Array.from(document.querySelectorAll('.proc-flow, .proc-head'));
    const section = document.getElementById('process');
    if (!steps.length || !section) return;

    /* ── 1. GSAP scroll-triggered stagger entry ── */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      // Start invisible
      gsap.set(steps, { opacity: 0, y: 48, scale: 0.96 });
      gsap.set(arrows, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 68%',
          toggleActions: 'play none none none',
        }
      });

      tl.to(steps, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.72,
        stagger: 0.14,
        ease: 'power3.out',
        onComplete() {
          // Flash icon glow on entry
          steps.forEach((s, i) => {
            setTimeout(() => s.classList.add('ps-entered'), i * 140);
            setTimeout(() => s.classList.remove('ps-entered'), i * 140 + 1000);
          });
        }
      }).to(arrows, {
        opacity: 1,
        duration: 0.35,
        stagger: 0.1,
        ease: 'power2.out'
      }, '<0.25');

    }

    /* ── 3. Active step cycling (lights up 01→02→03→04→loop) ── */
    let activeIdx  = 0;
    let cycleTimer = null;

    function setActive(idx) {
      steps.forEach((s, i) => s.classList.toggle('ps-active', i === idx));
    }

    function startCycle() {
      setActive(activeIdx);
      cycleTimer = setInterval(() => {
        activeIdx = (activeIdx + 1) % steps.length;
        setActive(activeIdx);
      }, 2200);
    }

    // Start cycling 1.6 s after the section enters view (gives stagger time to finish)
    if (typeof IntersectionObserver !== 'undefined') {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !cycleTimer) {
            setTimeout(startCycle, 1600);
          } else if (!e.isIntersecting && cycleTimer) {
            clearInterval(cycleTimer);
            cycleTimer = null;
            activeIdx = 0;
            steps.forEach(s => s.classList.remove('ps-active'));
          }
        });
      }, { threshold: 0.3 });
      obs.observe(section);
    } else {
      setTimeout(startCycle, 1600);
    }
  }

  /* ── Timeline Fill on Scroll ───────────────────────────── */
  function initTimelineFill() {
    const fill = document.getElementById("tlFill");
    if (!fill) return;

    const tl = fill.closest(".timeline");
    if (!tl) return;

    const update = () => {
      const r = tl.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (r.height + window.innerHeight)));
      fill.style.height = (progress * 100) + "%";

      // Activate dots
      tl.querySelectorAll(".tl-dot").forEach((dot) => {
        const dr = dot.getBoundingClientRect();
        dot.classList.toggle("active", dr.top < window.innerHeight * 0.75 || dot.classList.contains("active"));
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ── Count Up Animation ────────────────────────────────── */
  function initCountUp() {
    const nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el     = e.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || "";
        const dur    = 1800;
        const start  = performance.now();
        const step   = (now) => {
          const p    = Math.min(1, (now - start) / dur);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(ease * target).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach((n) => io.observe(n));
  }

  /* ── Photo Stats Chip Animation ────────────────────────── */
  function initChipAnimation() {
    const chips = document.querySelectorAll(".photo-stats .photo-chip");
    if (!chips.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        chips.forEach((chip, i) => {
          setTimeout(() => chip.classList.add("in-view"), i * 150);
        });
        io.disconnect();
      });
    }, { threshold: 0.3 });

    io.observe(chips[0].closest(".photo-wrap") || chips[0]);
  }

  /* ── Contact Form ──────────────────────────────────────── */
  function initContactForm() {
    const form   = document.getElementById("contactForm");
    const status = document.getElementById("formStatus");
    const btn    = document.getElementById("submitBtn");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name    = form.name?.value?.trim();
      const email   = form.email?.value?.trim();
      const message = form.message?.value?.trim();

      if (!name || !email || !message) {
        setStatus("Please fill in all fields.", "error");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus("Please enter a valid email address.", "error");
        return;
      }

      btn.disabled = true;
      btn.querySelector("span").textContent = "Sending…";

      // Web3Forms endpoint — access key tied to suvashish991@gmail.com
      const WEB3FORMS = "https://api.web3forms.com/submit";
      const ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY"; // replace with key from web3forms.com

      try {
        const res = await fetch(WEB3FORMS, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("Message sent! I'll get back to you soon.", "success");
          form.reset();
        } else {
          throw new Error(data.message || "Server error");
        }
      } catch (err) {
        setStatus("Something went wrong. Please email me directly at suvashish991@gmail.com", "error");
        console.error("Form error:", err);
      } finally {
        btn.disabled = false;
        btn.querySelector("span").textContent = "Send Message";
      }
    });

    function setStatus(msg, type) {
      if (!status) return;
      status.textContent = msg;
      status.className   = "form-status " + type;
      setTimeout(() => { status.textContent = ""; status.className = "form-status"; }, 6000);
    }
  }

  /* ── Back to Top ───────────────────────────────────────── */
  /* ── Whole-card click navigation ──────────────────────── */
  function initCardLinks() {
    document.querySelectorAll('.cs-card, .cs-featured').forEach(card => {
      const link = card.querySelector('.cs-link');
      if (!link || !link.href) return;

      card.addEventListener('click', function(e) {
        // Let real <a> and <button> elements handle their own events
        if (e.target.closest('a, button')) return;
        window.location.href = link.href;
      });
    });
  }

  function initBackToTop() {
    const btn = document.getElementById("btt");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      btn.classList.toggle("visible", window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener("click", () => {
      if (lenis) lenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ── Smooth Anchor Links ───────────────────────────────── */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { duration: 1.2, offset: -80 });
        else target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /* ── Theme Toggle ─────────────────────────────────────── */
  function initThemeToggle() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    // Apply saved theme on init (FOUC already handled by inline <head> script)
    const saved = localStorage.getItem("sc-theme");
    if (saved === "light") document.documentElement.setAttribute("data-theme", "light");

    // Sync aria-label to reflect what clicking will do
    function updateAriaLabel() {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      btn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    }
    updateAriaLabel();

    btn.addEventListener("click", () => {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      if (isLight) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("sc-theme", "dark");
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("sc-theme", "light");
      }
      updateAriaLabel();
    });
  }

  /* ── Safety fallback ───────────────────────────────────── */
  setTimeout(() => {
    document.querySelectorAll(".ha, .reveal").forEach((el) => {
      if (parseFloat(window.getComputedStyle(el).opacity) < 0.1) {
        el.style.opacity = "1";
        el.style.transform = "none";
      }
    });
  }, 4500);

})();
