/**
 * Every piece of business-specific copy that changes often lives here, so the
 * pages stay layout-only. Edit this file first when details change.
 */
export const site = {
  name: "CMNG Property",
  tagline: "Property management, handled properly.",
  description:
    "CMNG Property manages residential rentals end to end — tenant placement, rent collection, maintenance and compliance — so owners can hold property without running it day to day.",
  url: "https://cmngproperty.com",

  email: "info@cmngproperty.com",
  hours: "Monday – Friday, 9:00am – 5:30pm",
} as const;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
