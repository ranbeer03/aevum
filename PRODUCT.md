# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Astro + Tailwind CSS + GSAP (ScrollTrigger) + Lenis, static output. Recommended in conversation and approved by the user ("go ahead and create the application"). Deploy target: static hosting (Cloudflare Pages / Vercel), domain aevumfze.com.

## Users

Primary: procurement managers and trading counterparties at cement producers, grinding plants, and construction-materials buyers in the UAE evaluating Aevum as a supplier/trading partner for clinker and limestone. They arrive via referral or a business card / email signature link and are validating legitimacy, capability, and contactability. Secondary: prospective partners (producers, shipowners, logistics providers) checking who Aevum is.

## Product Purpose

Corporate website for Aevum (Aevum FZE, UAE) — a newly established commodities trading company focused on cement clinker and limestone. The site exists to establish credibility, present the two commodities and service capabilities clearly, and convert visits into enquiries by email. Success = a visitor understands what Aevum trades and how to reach them within one minute, and the site *feels* like an established institution despite the company being new.

## Positioning

Focused specialist, not a diversified conglomerate: two commodities (clinker, limestone), deep execution capability across the full chain — trading, supply chain management, full Incoterms range, inland logistics, and vessel chartering — currently operating within the UAE. The claim a neighbor can't copy: singular focus on cement raw materials with end-to-end logistics execution.

## Operating Context

Bulk mineral trading: cargoes move by truck inland and by dry-bulk vessel between UAE ports (Fujairah region is the limestone/clinker heartland). Buyers evaluate on specs (grades, chemistry, sizing), reliability, and logistics capability. Enquiries are relationship-driven; the form is a starting point, not e-commerce.

## Capabilities and Constraints

- Pages: Home, About (Who We Are), Products/Commodities, Contact. Nothing else.
- Commodities: clinker and limestone ONLY. Steel must not be mentioned.
- Services: trading, supply chain management; full Incoterms range; inland logistics; vessel chartering.
- Markets: currently UAE only — copy must not claim global trade flows.
- Enquiry form → email. No CRM, no backend beyond a form endpoint.
- Explicitly excluded: history section, careers, FAQs, testimonials, blog/news, Arabic version, leadership/team page (per client, "no need for this page as of now").
- Deferred content (build slots, keep hidden/placeholder): commodity grades & specs (not yet received), partner names Jindal Co / ABGT (Star Cement) / Fujairah Cement PLC (publishable in ~2 weeks), privacy policy & terms text (coming from Dhanesh), enquiry phone/email/address (pending from IT/admin).
- No published figures — do not invent volumes, tonnage, or years.
- Site owner (Ranbeer) hand-maintains it; adding a product must be trivial (content file, not code surgery).

## Brand Commitments

- Name: always "Aevum" or full spelling — never "A.G"/"AG" abbreviations.
- Palette (client-mandated): Deep Forest Green, White Ivory, Antique Gold.
- Visual reference: Montfort (montfortgroup.com) — modern, minimal, animated — with the explicit correction that Montfort is "too designed; the design gets in the way of the content." Design must guide the reader through content, not perform over it.
- Logo: in progress by Ranbeer; site must work with a wordmark until final logo lands.
- Tone [assumed from brief]: assured, precise, institutional; no startup hype, no exclamation marks.

## Evidence on Hand

- No imagery, no logo, no copy exists. Images will be licensed stock or generated imagery (the image briefs are a deliverable of this build).
- No client names, figures, or testimonials publishable today — future partner strip must not ship visible until names are cleared.
- Contact details not yet provided — use clearly-marked placeholders that are trivial to swap.

## Product Principles

1. Credibility over claims: specificity (correct trade terminology, real commodity knowledge) substitutes for the track record a new company lacks.
2. Content leads, motion follows: every animation reveals or ranks content; decorative set-pieces are out of scope.
3. One primary action everywhere: enquire. Every page ends at contact.
4. Built to grow quietly: products, partners, and specs are data slots that fill over time without redesign.
5. Fast is part of premium: static output, optimized media, no heavy frameworks.
