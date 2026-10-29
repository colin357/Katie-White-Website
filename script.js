(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  // ---------- Header border on scroll ----------
  const nav = $("[data-nav]");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  const toggle = $("[data-menu-toggle]");
  const menu = $("[data-menu]");
  const setMenu = (open) => {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  };
  toggle.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && !menu.hidden && setMenu(false));

  // ---------- Fade sections in once ----------
  if ("IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("js");
    const blocks = $$(".block__body");
    blocks.forEach((el) => el.classList.add("fade"));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px" }
    );
    blocks.forEach((el) => io.observe(el));
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
      out("down").textContent = `${downPct}% (${money.format(price * (downPct / 100))})`;
      out("rate").textContent = `${rate.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}%`;
      out("total").textContent = money.format(total);
      out("pi").textContent = money.format(pi);
      out("tax").textContent = money.format(tax);
      out("ins").textContent = money.format(ins);
      out("pmi").textContent = money.format(pmi);

      [["pi", pi], ["tax", tax], ["ins", ins], ["pmi", pmi]].forEach(([key, val]) => {
        $(`[data-seg="${key}"]`).style.width = `${total ? (val / total) * 100 : 0}%`;
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
      setStatus("Sending...");
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        setStatus("Thanks. Katie will be in touch within one business day.", "ok");
      } catch {
        setStatus("Something went wrong sending your message. Please call or email Katie directly.", "err");
      } finally {
        button.disabled = false;
      }
    });
  }
})();
