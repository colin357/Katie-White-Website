(() => {
  document.documentElement.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Footer year
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  // ---------- Nav: shadow on scroll, hide on scroll down ----------
  const nav = $("[data-nav]");
  let lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 20);
      nav.classList.toggle("is-hidden", y > lastY && y > 400 && !menuOpen());
      lastY = y;
    },
    { passive: true }
  );

  // ---------- Mobile menu ----------
  const toggle = $("[data-menu-toggle]");
  const menu = $("[data-menu]");
  const menuOpen = () => !menu.hidden;
  const setMenu = (open) => {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setMenu(!menuOpen()));
  menu.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && menuOpen() && setMenu(false));

  // ---------- Reveal on scroll ----------
  const reveals = $$(".reveal");
  // Stagger siblings that reveal together
  reveals.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // ---------- Count-up stats ----------
  const counters = $$("[data-count]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const end = Number(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / 1400, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(end * eased) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        co.unobserve(el);
      })
    );
    counters.forEach((el) => co.observe(el));
  }

  // ---------- Hero card tilt ----------
  const stack = $("[data-tilt]");
  if (stack && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    const area = stack.parentElement;
    area.addEventListener("pointermove", (e) => {
      const r = area.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      stack.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });
    area.addEventListener("pointerleave", () => (stack.style.transform = ""));
  }

  // ---------- Mortgage calculator ----------
  const calc = $("[data-calc]");
  if (calc) {
    const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    const out = (name) => $(`[data-out="${name}"]`);
    const TAX_RATE = 0.011; // annual, of home price
    const INSURANCE_RATE = 0.0035; // annual, of home price
    const PMI_RATE = 0.005; // annual, of loan amount, when < 20% down

    const fillRange = (input) => {
      const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
      input.style.setProperty("--fill", `${pct}%`);
    };

    const update = () => {
      const f = new FormData(calc);
      const price = Number(f.get("price"));
      const downPct = Number(f.get("down"));
      const rate = Number(f.get("rate"));
      const years = Number(f.get("term"));

      const loan = price * (1 - downPct / 100);
      const r = rate / 100 / 12;
      const n = years * 12;
      const pi = r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
      const tax = (price * TAX_RATE) / 12;
      const ins = (price * INSURANCE_RATE) / 12;
      const pmi = downPct < 20 ? (loan * PMI_RATE) / 12 : 0;
      const total = pi + tax + ins + pmi;

      out("price").textContent = money.format(price);
      out("down").textContent = `${downPct}% · ${money.format(price * (downPct / 100))}`;
      out("rate").textContent = `${rate.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}%`;
      out("total").textContent = money.format(total);
      out("pi").textContent = money.format(pi);
      out("tax").textContent = money.format(tax);
      out("ins").textContent = money.format(ins);
      out("pmi").textContent = money.format(pmi);

      // Donut segments (circumference normalised to 100)
      let offset = 0;
      [["pi", pi], ["tax", tax], ["ins", ins], ["pmi", pmi]].forEach(([key, val]) => {
        const seg = $(`[data-seg="${key}"]`);
        const len = total ? (val / total) * 100 : 0;
        seg.style.strokeDasharray = `${len} ${100 - len}`;
        seg.style.strokeDashoffset = String(-offset);
        offset += len;
      });

      $$('input[type="range"]', calc).forEach(fillRange);
    };

    calc.addEventListener("input", update);
    update();
  }

  // ---------- Contact form ----------
  const form = $("[data-contact]");
  if (form) {
    const status = $("[data-status]", form);
    const button = $("button[type=submit]", form);
    const setStatus = (msg, kind) => {
      status.textContent = msg;
      status.className = `form__status ${kind ? `is-${kind}` : ""}`;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));

      let valid = true;
      [["name", (v) => v.trim().length > 1], ["email", (v) => /^\S+@\S+\.\S+$/.test(v)]].forEach(([name, test]) => {
        const input = form.elements[name];
        const ok = test(input.value);
        input.setAttribute("aria-invalid", String(!ok));
        if (!ok && valid) input.focus();
        valid = valid && ok;
      });
      if (!valid) return setStatus("Please add your name and a valid email.", "err");

      button.disabled = true;
      setStatus("Sending…");
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        setStatus("Thanks! Katie will be in touch within one business day. 🎉", "ok");
      } catch {
        const mail = $('.contact__direct a[href^="mailto:"]');
        setStatus(`Something went wrong sending your message. Please email ${mail ? mail.textContent : "Katie"} directly.`, "err");
      } finally {
        button.disabled = false;
      }
    });
  }
})();
