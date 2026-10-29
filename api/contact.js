// Vercel Serverless Function: POST /api/contact
// Sends contact-form submissions by email via Resend (https://resend.com).
//
// Required environment variables (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY     – API key from Resend
//   CONTACT_TO_EMAIL   – where leads should be delivered (e.g. katie@yourcompany.com)
// Optional:
//   CONTACT_FROM_EMAIL – verified sender, defaults to "Website <onboarding@resend.dev>"

const escape = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const name = String(body.name || "").trim().slice(0, 200);
  const email = String(body.email || "").trim().slice(0, 200);
  const phone = String(body.phone || "").trim().slice(0, 50);
  const goal = String(body.goal || "").trim().slice(0, 100);
  const message = String(body.message || "").trim().slice(0, 5000);

  // Honeypot: bots fill hidden fields. Pretend success.
  if (body.company) return res.status(200).json({ ok: true });

  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Name and a valid email are required." });
  }

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) {
    console.error("Contact form is not configured: set RESEND_API_KEY and CONTACT_TO_EMAIL.");
    return res.status(503).json({ error: "Contact form is not configured yet." });
  }

  const html = `
    <h2>New website inquiry</h2>
    <p><strong>Name:</strong> ${escape(name)}</p>
    <p><strong>Email:</strong> ${escape(email)}</p>
    <p><strong>Phone:</strong> ${escape(phone) || "—"}</p>
    <p><strong>Looking to:</strong> ${escape(goal) || "—"}</p>
    <p><strong>Message:</strong><br>${escape(message).replace(/\n/g, "<br>") || "—"}</p>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL || "Website <onboarding@resend.dev>",
        to: CONTACT_TO_EMAIL.split(",").map((s) => s.trim()),
        reply_to: email,
        subject: `New lead: ${name}${goal ? ` — ${goal}` : ""}`,
        html,
      }),
    });
    if (!r.ok) {
      console.error("Resend error", r.status, await r.text());
      return res.status(502).json({ error: "Could not send message." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact form failure", err);
    return res.status(500).json({ error: "Could not send message." });
  }
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
