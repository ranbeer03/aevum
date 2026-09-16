// Single source of truth for site-wide facts.
// TODO(launch): replace the three CONTACT placeholders below with the
// details from IT/admin, and drop the Web3Forms access key into FORM_KEY.
// Everything else on the site reads from here.

export const site = {
  name: 'Aevum',
  legalName: 'Aevum FZE',
  domain: 'https://aevumfze.com',
  tagline: 'Cement clinker and limestone, traded and delivered across the UAE.',
  description:
    'Aevum FZE trades cement clinker and limestone in the United Arab Emirates, sourcing, financing and delivering cargo from the quarry gate to the grinding mill.',
};

export const contact = {
  email: 'enquiries@aevumfze.com',      // TODO(launch): confirm with IT/admin
  // Phone renders nowhere until a real number lands here. Never ship a fake one.
  phone: '',                            // TODO(launch): e.g. '+971 4 000 0000'
  phoneHref: '',                        // TODO(launch): e.g. 'tel:+97140000000'
  // Renders nowhere until the real FZE address lands. A vague address reads
  // as a placeholder. TODO(launch): e.g. ['Aevum FZE', 'Fujairah Free Zone', 'Fujairah, UAE']
  address: [],
};

// Web3Forms access key. The form falls back to a mailto: draft until it is set.
export const FORM_KEY = '';

// The Enquire pill in the nav already points at /contact, so Contact is not
// repeated here: one primary action, not two links to the same page. The
// footer still lists Contact for anyone scanning the bottom of the page.
export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Who We Are', href: '/about' },
  { label: 'Commodities', href: '/commodities' },
];

// Partner names cleared for publication. Leave empty until Jai confirms
// (expected: Jindal, Star Cement, Fujairah Cement PLC, roughly 2 weeks).
// Adding a name here activates the "Working alongside" strip on Home.
export const partners = [];
