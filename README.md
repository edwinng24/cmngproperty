# cmngproperty.com

Marketing site for CMNG Property — residential property management.

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript.

## Running it

```bash
npm install
cp .env.local.example .env.local   # optional: add an email delivery key
npm run dev                        # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

## Editing content

Almost everything you will want to change lives in two files — the pages
themselves are layout only.

| File | Holds |
|---|---|
| `src/lib/site.ts` | Company name, tagline, email, hours, nav items |
| `src/lib/content.ts` | Services, differentiators, process steps, FAQs |

Page-specific prose sits in the page it belongs to:

- `src/app/page.tsx` — home
- `src/app/services/page.tsx` — services and FAQ
- `src/app/about/page.tsx` — about, including the three principles
- `src/app/contact/page.tsx` — contact page and sidebar

## Colour

Four ramps, defined once as Tailwind theme tokens in the `@theme` block of
`src/app/globals.css`. Change the hex values there and the whole site follows.

| Ramp | Role |
|---|---|
| `brand-*` | Evergreen. Structure — headers, dark bands, icon tiles, links |
| `accent-*` | Plum. The thing you should look at: primary buttons, step numbers, eyebrows, focus rings |
| `sand-*` | Warm neutral fills for alternating section backgrounds |
| `ink-*` | Body text, as solid values rather than opacity over a tint, so contrast is the same on any background |

Every text/background pairing the site uses clears WCAG AA (4.5:1); the lowest
is 5.2:1 for captions. `/logo-preview/palette` renders the ramps and the
measured ratios as a PNG if you change any value and want to re-check.

The brand green sits at hue 160°, so its true complement is 340°; the accent
ramp lands on 342°. It is named for its job rather than its hue, so
re-colouring is a change to those ten values and nothing else.

Two things are load-bearing if you swap it: `accent-600` must stay dark enough
for white button text (needs ≥4.5:1), and `accent-300` light enough to read on
`brand-950` in the banners and dark panels. `/logo-preview/accents` renders
brass, teal and terracotta alternatives against the green if you want to
compare.

## Logo

The mark is **Roof-C** — one continuous stroke that starts as a pitched roof,
turns at the eaves and runs round as the bowl of a C, with a chimney in the
accent colour. A monogram and a roofline in the same figure.

It is a single stroke of even weight, so it needs no separate small-size cut:
the same geometry serves the header, the footer and the favicon, and it still
reads at 16px.

Candidate marks all live in `src/components/logo-concepts.tsx`; the active one
is chosen by a single import at the top of `src/components/Logo.tsx`.

`/logo-preview` compares them at every size on light, dark and tinted fields.
Three PNG render routes sit alongside it for reviewing outside a browser:
`/logo-preview/sheet` (marks), `/logo-preview/banners` (banner art) and
`/logo-preview/palette` (colour ramps with contrast ratios). All are noindexed
review tools — delete `src/app/logo-preview/` once the design is settled.

Icons use the same geometry: `src/app/icon.svg` (favicon) and
`src/app/apple-icon.tsx` (180×180 PNG rendered at build time, because iOS
ignores SVG touch icons). Update both if the mark changes.

## No phone number, no street address

The site deliberately lists neither. Email and the contact form are the only
channels, including for maintenance emergencies, which are routed to
`info@cmngproperty.com` with URGENT in the subject. No office address or
service area is shown anywhere.

If you add a phone line or a public office later, the places to put them back
are the header CTA, the footer contact block, the `/contact` sidebar, and the
"At a glance" panel on `/about`.

Note that the "What areas do you cover?" FAQ in `src/lib/content.ts` still
describes a service area in prose, since deleting it would leave the question
unanswered. Rewrite or remove that entry if the area should not be stated.

## Rental applications

Each managed property gets its own application form at `/apply/<slug>`, with
that property's address and terms filled in. `/apply` lists everything
currently accepting applications.

The form reproduces the paper original: two applicants, three prior addresses,
present and last employment for each applicant, income, occupants, vehicles,
pets, disclosures and two signatures.

### Setup

On a fresh server, once:

```bash
./release.sh setup
```

That creates the database and user, writes their credentials plus a generated
`APP_ENCRYPTION_KEY` into `.env.local`, applies the schema, and creates an
admin account whose password it prints once. Then sign in at `/admin`, add a
property, and its form is live immediately.

Every ordinary `./release.sh` after that runs `scripts/setup.mjs` without
`--full`: it applies any new migrations and leaves everything else alone. New
schema arrives with a deploy, the way foonhay's `db:push` step works.

Everything is idempotent and nothing is ever overwritten — re-running is safe.
`APP_ENCRYPTION_KEY` in particular is generate-once, because replacing it would
make every stored SSN unreadable.

To do it by hand instead:

```bash
node scripts/migrate.mjs                                  # schema only
node scripts/create-admin.mjs "Your Name" you@example.com # prompts for a password
```

### On submission

The row is written **first**, then the email is attempted. If mail fails the
application is still captured and `email_sent` stays 0 — the admin list flags
those rows in red. Nothing an applicant typed is ever lost to a relay outage.

### Sensitive data

Social Security numbers are encrypted with AES-256-GCM under
`APP_ENCRYPTION_KEY`, which lives outside the database. They are excluded from
every ordinary query, never rendered into the admin page, and never included in
the notification email — an admin has to click *Reveal*, which decrypts on
demand and logs the access against their account.

**Back up `APP_ENCRYPTION_KEY` somewhere other than the database it protects.**
Losing it makes stored SSNs permanently unreadable.

### Notes

- Money is stored in cents throughout; floats cannot represent `2550.00`.
- Applications snapshot the address, rent and fees at submission, because both
  change and an application must show what the applicant agreed to.
- Deleting a property with applications is blocked by a foreign key.
  Deactivate it instead: existing records stay, new submissions stop.
- Admin sessions store only a SHA-256 of the cookie token, so a database dump
  cannot be replayed as a live session.

## Contact form

The form posts to `POST /api/contact` (`src/app/api/contact/route.ts`), which
validates server-side, checks a honeypot field, rate-limits to 5 submissions
per IP per minute, and **emails the enquiry to `info@cmngproperty.com`** with
`Reply-To` set to the sender, so hitting reply answers the enquirer directly.
Set `CONTACT_TO` to send somewhere else.

Delivery is chosen at runtime from whatever is configured, first match wins:

| Configured | Behaviour |
|---|---|
| `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` | Plain SMTP via nodemailer — the same approach the sibling sites on the server use, with Mailtrap as the relay. Any SMTP relay — Mailtrap, Google Workspace, Microsoft 365, Mailgun's SMTP endpoint. Variable names (`SMTP_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`) match the other sites on the server, so config copies across unchanged |
| `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` | The Mailgun HTTP API. Set `MAILGUN_BASE_URL=https://api.eu.mailgun.net` for EU-region accounts |
| `RESEND_API_KEY` | Sends via [Resend](https://resend.com) |
| `FORMSPREE_ID` | Forwards to a [Formspree](https://formspree.io) form |
| none, in development | Logs the enquiry to the server and returns success, so the form works on a fresh clone |
| none, in production | Returns a 502 telling the visitor to email directly |

That last row is deliberate. A contact form that accepts a message, shows
"thanks", and delivers nothing is worse than one that admits it is not wired
up — so production refuses rather than pretending.

Mail goes out as multipart text + HTML.

`SMTP_FROM` must be a real address on a domain verified with the provider.
It is **not** `SMTP_USER` — on Mailtrap's live relay that value is the literal
string `api`, and `From: api` is rejected. The sender resolves
`SMTP_FROM` → `CONTACT_FROM` → `ADMIN_EMAIL` → a fallback built from
`site.email`.

On boot the route logs the relay, user, password length, sender and recipient
it resolved, so a misconfiguration shows up in `pm2 logs cmngproperty` rather
than waiting for someone to submit the form.

## Banner photography

Each page has a full-bleed photograph behind a sheer veil, rendered by
`src/components/PageBanner.tsx`. The veil is `brand-50` — straight off the
brand ramp, so it reads as part of the colour scheme rather than as a grey
wash. It sits flat at **70%** across the text column and clears to almost
nothing by 88%, leaving the right of every photograph at full strength.

The banner is **light with dark text**, not dark with white text.

70% is the measured floor, not a guess. Taking the darkest local background
behind the copy across all four photographs — blurred to model what a glyph
actually sits on — contrast at 70% is:

| Role | Colour | Contrast |
|---|---|---|
| Heading | `ink-900` | 7.6:1 |
| Intro | `ink-700` | 4.9:1 |
| Eyebrow | `accent-800` | 5.5:1 |

At 68% the intro is 4.6:1; at 66% it is 4.3:1 and fails WCAG AA. Going sheerer
means darkening the copy further or accepting text that misses AA on the darker
photographs. The eyebrow uses `accent-800` rather than `accent-600` for exactly
that reason — the darker step is what buys the extra sheerness.

The four images in `public/banners/` are **CC0 / public domain** — free for
commercial use with no attribution required. Sources, and the exact crop
command, are recorded in `public/banners/CREDITS.md`.

| File | Subject |
|---|---|
| `home.jpg` | Neighbourhood rooftops seen from above |
| `services.jpg` | Townhouse block with garages |
| `about.jpg` | Classical apartment facades |
| `contact.jpg` | Aerial view of a residential estate |

To swap one, drop a replacement at the same path. Aim for landscape at least
1600px wide with the interest on the right, since the left third sits under the
heaviest part of the scrim. Because the text is dark, a bright photograph is
the safe case here and a very dark one is the risk — the opposite of a
white-on-dark banner.

`scripts/generate-banners.py` still builds the illustrated set these replaced.
Running it writes SVGs alongside the photographs; they are not referenced by
any page, and using them again would mean re-adding `dangerouslyAllowSVG` to
`next.config.ts`.

## Deploying

Any Next.js host works. Vercel is the least work:

```bash
npx vercel            # preview
npx vercel --prod     # production
```

Then point `cmngproperty.com` at the host and add `RESEND_API_KEY` (or
`FORMSPREE_ID`) to its environment variables.

## Before launch

- [ ] Replace the placeholder email in `src/lib/site.ts`
- [ ] Swap the stock banners in `public/banners/` for photographs of real managed properties
- [ ] Confirm the fee and service-area answers in the FAQ
- [ ] Confirm someone actually monitors the inbox around the clock, since the
      emergency panel promises it
- [ ] Delete `src/app/logo-preview/` once the mark is chosen
- [ ] Set `RESEND_API_KEY` or `FORMSPREE_ID` and send a test submission
- [ ] Add an Equal Housing Opportunity notice and licence number if your
      jurisdiction requires them
- [ ] Add a privacy policy if you collect enquiries from EU/UK/California visitors
