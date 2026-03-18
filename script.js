/* ═══════════════════════════════════════════════════════
   Suvashish Chakraborty — Portfolio v3.0
   GSAP + Lenis + Custom Cursor + Magnetic Effects
   ═══════════════════════════════════════════════════════ */

(() => {
  "use strict";

  let lenis;

  /* ── Preloader ─────────────────────────────────── */
  const preloader = document.getElementById("preloader");
  const preloaderFill = document.getElementById("preloaderFill");
  const preloaderText = document.getElementById("preloaderText");
  let progress = 0;

  const tick = setInterval(() => {
    progress += Math.random() * 18 + 6;
    if (progress >= 100) { progress = 100; clearInterval(tick); }
    if (preloaderFill) preloaderFill.style.width = progress + "%";
    if (preloaderText) preloaderText.textContent = Math.round(progress) + "%";
  }, 100);

  window.addEventListener("load", () => {
    if (preloaderFill) preloaderFill.style.width = "100%";
    if (preloaderText) preloaderText.textContent = "100%";
    setTimeout(() => {
      if (preloader) preloader.classList.add("done");
      setTimeout(initAll, 300);
    }, 400);
  });

  function initAll() {
    initLenis();
    initScrollProgress();
    initNavbar();
    initMobileMenu();
    initCustomCursor();
    initMagnetic();
    initGSAP();
    initSwiper();
    initCaseToggles();
    initCountUp();
    initContactForm();
    initBackToTop();
    initSmoothAnchors();
    initLogoBgDetect();
    initSlideshows();
    initCardTilt();

    // Safety fallback: ensure all content is visible after 4s regardless of animation state
    setTimeout(() => {
      document.querySelectorAll(".gsap-fade,.gsap-slide,.hero-anim,.hero-word,.tool-logo,.cert-card,.skill-tag,.bento-card,.case-slideshow,.section-heading,.section-label,.contact-form,.contact-link-item").forEach(el => {
        const style = window.getComputedStyle(el);
        if (parseFloat(style.opacity) < 0.1) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
    }, 4000);
  }

  /* ── Lenis Smooth Scroll ─────────────────────── */
  function initLenis() {
    if (typeof Lenis === "undefined") return;

    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });

    // Connect Lenis to GSAP ScrollTrigger
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
  }

  /* ── Scroll Progress ───────────────────────────── */
  function initScrollProgress() {
    const bar = document.getElementById("scrollProgress");
    if (!bar) return;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0) bar.style.width = (window.scrollY / h * 100) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ── Navbar ────────────────────────────────────── */
  function initNavbar() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const sections = document.querySelectorAll("section[id]");
    const links = document.querySelectorAll(".nav-link");
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => {
            l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id);
          });
        }
      });
    }, { threshold: 0.2, rootMargin: "-80px 0px -40% 0px" });
    sections.forEach(s => obs.observe(s));
  }

  /* ── Mobile Menu ───────────────────────────────── */
  function initMobileMenu() {
    const toggle = document.getElementById("mobileToggle");
    const menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("active");
      menu.classList.toggle("open");
    });
    document.querySelectorAll(".mobile-link").forEach(l => {
      l.addEventListener("click", () => {
        toggle.classList.remove("active");
        menu.classList.remove("open");
      });
    });
  }

  /* ── Custom Cursor ──────────────────────────────── */
  function initCustomCursor() {
    const cursor = document.getElementById("cursor");
    if (!cursor || window.matchMedia("(pointer: coarse)").matches) {
      if (cursor) cursor.style.display = "none";
      return;
    }

    const dot = cursor.querySelector(".cursor-dot");
    const ring = cursor.querySelector(".cursor-ring");
    let cx = -100, cy = -100;
    let tx = -100, ty = -100;

    document.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });

    // Smooth follow
    function animate() {
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      if (dot) {
        dot.style.transform = `translate(${tx}px, ${ty}px)`;
      }
      if (ring) {
        ring.style.transform = `translate(${cx}px, ${cy}px)`;
      }
      requestAnimationFrame(animate);
    }
    animate();

    // Cursor states
    const interactives = "a, button, .btn-primary, .btn-outline, .nav-btn-cta, .social-icon, .slider-btn, .ss-btn, .ss-dot, .case-toggle, .tool-logo, .tag, .skill-tag, .swiper-slide";

    document.querySelectorAll(interactives).forEach(el => {
      el.addEventListener("mouseenter", () => cursor.classList.add("cursor-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("cursor-hover"));
    });

    // Hide on mouse leave
    document.addEventListener("mouseleave", () => cursor.classList.add("cursor-hidden"));
    document.addEventListener("mouseenter", () => cursor.classList.remove("cursor-hidden"));

    document.body.style.cursor = "none";
    document.querySelectorAll("a, button").forEach(el => el.style.cursor = "none");
  }

  /* ── Magnetic Hover Effect ──────────────────────── */
  function initMagnetic() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    document.querySelectorAll("[data-magnetic]").forEach(el => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
        el.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        setTimeout(() => el.style.transition = "", 500);
      });
    });
  }

  /* ── GSAP Animations ───────────────────────────── */
  function initGSAP() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      document.querySelectorAll(".gsap-fade,.gsap-slide,.hero-anim,.hero-word").forEach(el => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // ── Hero entrance ──
    const heroTl = gsap.timeline({ delay: 0.1 });

    heroTl.to(".hero-word", {
      y: 0, opacity: 1,
      duration: 1.0, stagger: 0.12,
      ease: "power4.out"
    })
    .to(".hero-anim", {
      y: 0, opacity: 1,
      duration: 0.8, stagger: 0.08,
      ease: "power3.out"
    }, "-=0.5");

    // ── Hero parallax — blobs move on scroll ──
    gsap.to(".mesh-blob-1", {
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
      y: -120, opacity: 0.1, ease: "none"
    });
    gsap.to(".mesh-blob-2", {
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
      y: -80, x: 40, ease: "none"
    });

    // ── Hero photo parallax ──
    gsap.to("#heroPhoto", {
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
      y: 80, ease: "none"
    });

    // ── Section headings — reveal ──
    gsap.utils.toArray(".section-heading").forEach(heading => {
      gsap.fromTo(heading,
        { y: 60, opacity: 0 },
        { scrollTrigger: { trigger: heading, start: "top 85%", toggleActions: "play none none none" },
          y: 0, opacity: 1, duration: 1.0, ease: "power4.out" }
      );
    });

    // ── Scroll-triggered fade-in (enhanced) ──
    gsap.utils.toArray(".gsap-fade").forEach((el, i) => {
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
        y: 0, opacity: 1, duration: 0.8,
        delay: i % 3 * 0.05,
        ease: "power3.out"
      });
    });

    // ── Timeline items slide in from left ──
    gsap.utils.toArray(".gsap-slide").forEach((el, i) => {
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
        x: 0, opacity: 1, duration: 0.8, delay: i * 0.06, ease: "power3.out"
      });
    });

    // ── Skill tags stagger in ──
    gsap.utils.toArray(".sg-tags").forEach(group => {
      const tags = group.querySelectorAll(".skill-tag");
      gsap.fromTo(tags,
        { y: 20, opacity: 0 },
        { scrollTrigger: { trigger: group, start: "top 90%", toggleActions: "play none none none" },
          y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: "power3.out" }
      );
    });

    // ── Tools ribbon icons stagger ──
    gsap.fromTo(".tool-logo",
      { scale: 0.5, opacity: 0 },
      { scrollTrigger: { trigger: ".tools-ribbon", start: "top 85%", toggleActions: "play none none none" },
        scale: 1, opacity: 1, duration: 0.5, stagger: 0.04, ease: "back.out(1.7)" }
    );

    // ── Cert cards stagger ──
    gsap.fromTo(".cert-card",
      { y: 30, opacity: 0 },
      { scrollTrigger: { trigger: ".cert-grid", start: "top 85%", toggleActions: "play none none none" },
        y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
    );

    // ── Case study slideshow reveal ──
    gsap.utils.toArray(".case-slideshow").forEach(show => {
      gsap.fromTo(show,
        { scale: 0.95, opacity: 0 },
        { scrollTrigger: { trigger: show, start: "top 85%", toggleActions: "play none none none" },
          scale: 1, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    });

    // ── Bento cards stagger ──
    gsap.fromTo(".bento-card",
      { y: 40, opacity: 0 },
      { scrollTrigger: { trigger: ".bento-grid", start: "top 85%", toggleActions: "play none none none" },
        y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: "power3.out" }
    );

    // ── Section labels slide in ──
    gsap.utils.toArray(".section-label").forEach(label => {
      gsap.fromTo(label,
        { x: -30, opacity: 0 },
        { scrollTrigger: { trigger: label, start: "top 90%", toggleActions: "play none none none" },
          x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );
      const line = label.querySelector(".label-line");
      if (line) {
        gsap.fromTo(line,
          { scaleX: 0 },
          { scrollTrigger: { trigger: label, start: "top 90%", toggleActions: "play none none none" },
            scaleX: 1, duration: 0.8, delay: 0.3, ease: "power3.out", transformOrigin: "left center" }
        );
      }
    });

    // ── Marquee speed change on scroll ──
    gsap.to(".marquee-track", {
      scrollTrigger: { trigger: ".marquee-strip", start: "top bottom", end: "bottom top", scrub: 1 },
      x: -100, ease: "none"
    });

    // ── Timeline fill line + dot activation ──
    const fill = document.getElementById("timelineFill");
    const timelineEl = document.querySelector(".timeline");
    const dots = document.querySelectorAll(".timeline-dot");

    if (fill && timelineEl) {
      ScrollTrigger.create({
        trigger: timelineEl,
        start: "top 75%",
        end: "bottom 40%",
        scrub: 0.3,
        onUpdate: (self) => {
          const progress = self.progress;
          fill.style.height = (progress * 100) + "%";
          const timelineRect = timelineEl.getBoundingClientRect();
          const fillBottomY = timelineRect.top + (timelineRect.height * progress);
          dots.forEach((dot, i) => {
            const dotRect = dot.getBoundingClientRect();
            const dotCenter = dotRect.top + dotRect.height / 2;
            if (fillBottomY >= dotCenter) {
              dot.classList.add("active");
            } else if (i > 0) {
              dot.classList.remove("active");
            }
          });
        }
      });
    }

    // ── Contact form reveal ──
    gsap.fromTo(".contact-form",
      { y: 50, opacity: 0 },
      { scrollTrigger: { trigger: ".contact-form", start: "top 85%", toggleActions: "play none none none" },
        y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );
    gsap.fromTo(".contact-link-item",
      { x: -30, opacity: 0 },
      { scrollTrigger: { trigger: ".contact-links", start: "top 85%", toggleActions: "play none none none" },
        x: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" }
    );
  }

  /* ── Card Tilt Effect ───────────────────────────── */
  function initCardTilt() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    document.querySelectorAll(".bento-card, .timeline-card, .case-card").forEach(card => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotateX = (0.5 - y) * 8;
        const rotateY = (x - 0.5) * 8;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
        card.style.transition = "transform 0.1s ease";

        // Spotlight effect
        card.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(251,191,36,0.04) 0%, var(--glass-bg) 50%)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
        card.style.background = "";
        card.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), background 0.5s ease";
      });
    });
  }

  /* ── Swiper ────────────────────────────────────── */
  function initSwiper() {
    if (typeof Swiper === "undefined") return;

    const caseSwiper = new Swiper(".case-swiper", {
      slidesPerView: 1,
      spaceBetween: 20,
      speed: 600,
      grabCursor: true,
      autoHeight: false,
      pagination: { el: ".case-pagination", clickable: true },
      navigation: { prevEl: "#casePrev", nextEl: "#caseNext" },
      breakpoints: {
        768: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 2, spaceBetween: 28 }
      }
    });
    window._caseSwiper = caseSwiper;
  }

  /* ── Case Toggles ──────────────────────────────── */
  function initCaseToggles() {
    document.querySelectorAll(".case-toggle").forEach(toggle => {
      toggle.addEventListener("click", e => {
        e.stopPropagation();
        const details = document.getElementById(toggle.dataset.target);
        const isOpen = details.classList.contains("open");

        document.querySelectorAll(".case-details.open").forEach(d => d.classList.remove("open"));
        document.querySelectorAll(".case-toggle.active").forEach(t => {
          t.classList.remove("active");
          t.querySelector(".toggle-text").textContent = "Read Case Study";
        });

        if (!isOpen) {
          details.classList.add("open");
          toggle.classList.add("active");
          toggle.querySelector(".toggle-text").textContent = "Hide Details";
        }

        if (window._caseSwiper) {
          const update = () => window._caseSwiper.update();
          setTimeout(update, 50);
          setTimeout(update, 400);
          setTimeout(update, 700);
        }
      });
    });
  }

  /* ── Count Up ──────────────────────────────────── */
  function initCountUp() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const end = parseInt(el.dataset.count);
          const start = performance.now();
          const dur = 2000;
          (function step(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.round(end * eased).toLocaleString();
            if (p < 1) requestAnimationFrame(step);
          })(start);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll("[data-count]").forEach(c => obs.observe(c));
  }

  /* ── Contact Form ──────────────────────────────── */
  function initContactForm() {
    const form = document.getElementById("contactForm");
    const btn = document.getElementById("submitBtn");
    const status = document.getElementById("formStatus");
    if (!form) return;

    form.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const msg = document.getElementById("message").value.trim();

      if (!name || !email || !msg) {
        status.textContent = "Please fill in all fields.";
        status.className = "form-status error";
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = "Please enter a valid email.";
        status.className = "form-status error";
        return;
      }

      btn.querySelector("span").textContent = "Sending...";
      btn.disabled = true;

      const subj = encodeURIComponent("Portfolio Contact from " + name);
      const body = encodeURIComponent("Name: " + name + "\nEmail: " + email + "\n\nMessage:\n" + msg);
      window.location.href = "mailto:suvashish991@gmail.com?subject=" + subj + "&body=" + body;

      setTimeout(() => {
        btn.querySelector("span").textContent = "Message Sent!";
        status.textContent = "Your email client should have opened.";
        status.className = "form-status success";
        setTimeout(() => {
          btn.querySelector("span").textContent = "Send Message";
          btn.disabled = false;
          form.reset();
          status.textContent = "";
        }, 4000);
      }, 500);
    });
  }

  /* ── Back to Top ───────────────────────────────── */
  function initBackToTop() {
    const btn = document.getElementById("backToTop");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      btn.classList.toggle("visible", window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener("click", () => {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.5 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  /* ── Smooth Anchors (Lenis-aware) ───────────────── */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (href === "#") {
          e.preventDefault();
          if (lenis) lenis.scrollTo(0, { duration: 1.5 });
          else window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          if (lenis) {
            lenis.scrollTo(target, { offset: -80, duration: 1.5 });
          } else {
            const y = target.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        }
      });
    });
  }

  /* ── Screenshot Slideshows ────────────────────── */
  function initSlideshows() {
    document.querySelectorAll("[data-slideshow]").forEach((container, idx) => {
      try {
        const slides = container.querySelectorAll(".slideshow-slide");
        const dotsWrap = container.querySelector(".ss-dots");
        const prevBtn = container.querySelector(".ss-prev");
        const nextBtn = container.querySelector(".ss-next");
        if (!slides.length || !dotsWrap || !prevBtn || !nextBtn) return;

        let current = 0;
        let autoTimer = null;

        slides.forEach((_, i) => {
          const dot = document.createElement("button");
          dot.className = "ss-dot" + (i === 0 ? " active" : "");
          dot.setAttribute("aria-label", "Go to slide " + (i + 1));
          dot.addEventListener("click", () => goTo(i));
          dotsWrap.appendChild(dot);
        });

        const dots = dotsWrap.querySelectorAll(".ss-dot");

        function goTo(index) {
          if (slides[current]) slides[current].classList.remove("active");
          if (dots[current]) dots[current].classList.remove("active");
          current = (index + slides.length) % slides.length;
          if (slides[current]) slides[current].classList.add("active");
          if (dots[current]) dots[current].classList.add("active");
          resetAuto();
        }

        function resetAuto() {
          clearInterval(autoTimer);
          autoTimer = setInterval(() => goTo(current + 1), 4000);
        }

        prevBtn.addEventListener("click", () => goTo(current - 1));
        nextBtn.addEventListener("click", () => goTo(current + 1));
        container.addEventListener("mouseenter", () => clearInterval(autoTimer));
        container.addEventListener("mouseleave", resetAuto);
        resetAuto();
      } catch (err) {
        console.warn("Slideshow init error for index " + idx, err);
      }
    });
  }

  /* ── Dynamic Logo Background Detection ──────────── */
  function initLogoBgDetect() {
    const logoSelectors = ".bento-logo, .bento-logo-sm, .case-logo, .tc-logo, .tool-logo, .cert-badge";
    const logos = document.querySelectorAll(logoSelectors);

    logos.forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        analyzeLogoImage(img);
      } else {
        img.addEventListener("load", () => analyzeLogoImage(img));
        img.addEventListener("error", () => img.classList.add("logo-dark-content"));
      }
    });
  }

  function analyzeLogoImage(img) {
    try {
      const canvas = document.createElement("canvas");
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      let totalBrightness = 0;
      let opaquePixels = 0;
      let transparentPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 30) { transparentPixels++; continue; }
        opaquePixels++;
        totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114);
      }

      const totalPixels = size * size;
      const transparencyRatio = transparentPixels / totalPixels;
      const hasOwnBg = transparencyRatio < 0.2;

      if (hasOwnBg) {
        img.classList.add("logo-has-bg");
      } else if (opaquePixels > 0) {
        const avgBrightness = totalBrightness / opaquePixels;
        if (avgBrightness > 160) img.classList.add("logo-light-content");
        else img.classList.add("logo-dark-content");
      }
    } catch (e) {
      img.classList.add("logo-dark-content");
    }
  }
})();
