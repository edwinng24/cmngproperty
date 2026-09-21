/**
 * Marketing copy lives here so the page components stay structural.
 * Rewrite these strings to match how the business actually operates.
 */

export const services = [
  {
    icon: "key",
    outcome: "A vetted tenant, signed and moved in.",
    title: "Tenant placement",
    summary:
      "Marketing, showings, screening and lease signing — we fill the unit with someone who pays and stays.",
    detail: [
      "Rental pricing based on what comparable units actually leased for, not what they were listed at.",
      "Listing photography, syndication to the major rental portals, and scheduled showings.",
      "Credit, income, eviction-history and prior-landlord checks applied the same way to every applicant.",
      "State-compliant lease preparation, e-signature, and deposit handling.",
    ],
  },
  {
    icon: "coin",
    outcome: "Money in your account on a date you can plan around.",
    title: "Rent collection",
    summary:
      "Online payments, automatic reminders, and a clear escalation path when rent is late.",
    detail: [
      "Tenants pay by ACH or card through an online portal; funds are disbursed to owners on a fixed monthly schedule.",
      "Automated reminders before the due date and on the first day late.",
      "Late notices and the legal escalation sequence handled on your behalf, documented at every step.",
      "Monthly owner statements plus a year-end summary your accountant can work from.",
    ],
  },
  {
    icon: "wrench",
    outcome: "Problems fixed before they become expensive ones.",
    title: "Maintenance & repairs",
    summary:
      "Round-the-clock request intake, vetted trades, and a spend limit you set so routine work never stalls waiting on an approval.",
    detail: [
      "Round-the-clock emergency intake for residents, with a defined triage standard.",
      "Licensed, insured contractors — we re-bid recurring work rather than defaulting to one vendor.",
      "You set a per-incident approval threshold; anything above it comes to you with quotes.",
      "Before-and-after documentation attached to every work order.",
    ],
  },
  {
    icon: "clipboard",
    outcome: "A paper trail that holds up when it matters.",
    title: "Inspections & compliance",
    summary:
      "Scheduled condition reports and the paperwork that keeps a tenancy defensible.",
    detail: [
      "Move-in, periodic and move-out inspections with dated photo records.",
      "Smoke alarm, and where applicable, gas and electrical safety checks tracked to their renewal dates.",
      "Security deposit accounting that stands up if a claim is disputed.",
      "Notice periods, entry rules and fair-housing requirements applied consistently.",
    ],
  },
  {
    icon: "chart",
    outcome: "You always know how the asset is doing.",
    title: "Owner reporting",
    summary:
      "You should be able to answer 'how is the property doing?' without emailing anyone.",
    detail: [
      "Monthly income and expense statements with scanned invoices attached.",
      "Occupancy, arrears and maintenance spend tracked over time.",
      "1099s and year-end packets prepared ahead of tax season.",
      "A named point of contact who knows your property — not a queue.",
    ],
  },
  {
    icon: "cycle",
    outcome: "Fewer empty days between tenancies.",
    title: "Turnovers & leasing renewals",
    summary:
      "The gap between tenancies is where returns are lost. We plan for it before notice is given.",
    detail: [
      "Renewal conversations started well before the lease end date.",
      "Make-ready scopes priced and scheduled so marketing starts while the unit is still occupied.",
      "Market-rate review at each renewal, with a recommendation either way.",
      "Vacancy days tracked and reported, because that's the number that matters.",
    ],
  },
] as const;

export const differentiators = [
  {
    title: "One point of contact",
    body: "You get a named manager who knows the property and answers directly. No ticket queue, no re-explaining the history.",
  },
  {
    title: "No markup on maintenance",
    body: "Contractor invoices are passed through at cost. We make money managing the property, not marking up repairs.",
  },
  {
    title: "Month-to-month agreements",
    body: "No multi-year lock-in. If the service stops being worth it, thirty days' notice ends it.",
  },
  {
    title: "Everything documented",
    body: "Inspections, approvals, notices and invoices are recorded and available to you. Good records are what protect an owner in a dispute.",
  },
] as const;

export const process = [
  {
    step: "01",
    title: "Property review",
    body: "We walk the property, look at comparable rents, and tell you what it should achieve and what it would take to get there.",
  },
  {
    step: "02",
    title: "Management agreement",
    body: "A plain-language, month-to-month agreement covering fees, approval limits and what we handle without asking.",
  },
  {
    step: "03",
    title: "Onboarding",
    body: "We take over existing tenancies or market the vacancy, collect keys and records, and set up the owner portal.",
  },
  {
    step: "04",
    title: "Ongoing management",
    body: "Rent lands on schedule, maintenance gets handled, and you get a monthly statement that explains the month.",
  },
] as const;

export const faqs = [
  {
    q: "What do you charge?",
    a: "A percentage of rent collected for ongoing management, plus a one-time leasing fee when we place a new tenant. We quote both in writing after seeing the property — there are no separate admin, renewal or inspection fees on top.",
  },
  {
    q: "What areas do you cover?",
    a: "We manage residential property across the metro area and the immediately surrounding suburbs. If you are just outside it, ask anyway — we will tell you honestly whether we can service it well.",
  },
  {
    q: "Can you take over a property that already has tenants?",
    a: "Yes. We collect the existing lease, deposit records and condition reports, introduce ourselves to the tenants, and pick up from where the previous arrangement left off.",
  },
  {
    q: "How quickly do you handle maintenance?",
    a: "Emergencies — no heat, no water, anything unsafe — are triaged the same day. Routine requests are assigned within one business day and tracked to completion.",
  },
  {
    q: "Am I locked into a contract?",
    a: "No. Our management agreement runs month to month and either side can end it with thirty days' notice.",
  },
  {
    q: "How and when do I get paid?",
    a: "Rent is disbursed by direct deposit on a fixed day each month, with the statement for that period sent at the same time.",
  },
] as const;
