# Katie White — Mortgage Loan Officer

A one-page marketing site for loan officer Katie White. Plain HTML/CSS/JS (no build step) plus one Vercel serverless function for the contact form.

```
index.html        page markup
styles.css        all styles
script.js         nav, scroll reveals, payment calculator, contact form
api/contact.js    POST /api/contact → emails leads via Resend
assets/           favicon (add Katie's photo here)
vercel.json       clean URLs, security + cache headers
```

## Deploy to Vercel

1. In Vercel, **Add New → Project** and import this GitHub repo.
2. Framework preset: **Other**. Leave build command and output directory empty.
3. Add environment variables (Settings → Environment Variables):
   - `RESEND_API_KEY`: API key from [resend.com](https://resend.com)
   - `CONTACT_TO_EMAIL`: where leads go (comma-separate for several)
   - `CONTACT_FROM_EMAIL` (optional): a sender on a domain verified in Resend, e.g. `Katie White <hello@katiewhite.com>`
4. Deploy, then add the custom domain under Settings → Domains.

Until the env vars are set, the form shows a friendly error that tells visitors to email Katie directly.

## Local preview

```bash
npx vercel dev
```

Or for static-only (no contact API): `python3 -m http.server`.

## Before launch: replace placeholders

Search `index.html` for these:

- `NMLS #000000`: Katie's individual NMLS ID and the company's NMLS ID
- `Company Name`: the lender she's with (add the branch office address to the footer if required)
- `(555) 555-5555` / `tel:+15555555555`: her business phone
- `katie@example.com`: her business email
- Optional: an online application link for the "Start my pre-approval" buttons (they currently scroll to the contact form)
- Have the lender's compliance team review the disclosures and loan program copy

Content comes from Katie's onboarding answers: Austin-based branch manager, licensed in TX, MN, WI, FL and CA; her audience, specialties, client pain points and voice.
The "What I want every client to say" section uses her own standards, written as goals rather than attributed reviews.
Once she has real client reviews (Google, Zillow, Experience.com), they can replace or sit alongside it.
Her home shipping address from the intake form is deliberately left off the site.
