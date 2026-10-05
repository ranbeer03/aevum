// Commodity catalogue. Adding a commodity means adding an object here and
// dropping its image in /public/media/. The page renders them in order.
//
// `specs` values stay null until the confirmed grade sheets arrive. Never
// invent numbers here. Replace null with the real figure (for example
// '>= 62%') as each one is confirmed; the row appears automatically.

export const commodities = [
  {
    slug: 'clinker',
    name: 'Cement Clinker',
    image: '/media/clinker-macro.jpg',
    imageAlt: 'Grey cement clinker nodules in close detail, lit by warm side light',
    panelImage: '/media/clinker-panel.jpg',
    panelImageAlt: 'Stockpile of cement clinker under dramatic dusk light',
    intro:
      'Clinker is the intermediate product of cement making: limestone and clay fired in a rotary kiln at around 1,450 °C into dense grey nodules. It travels dry and stores without setting, so clinker, not finished cement, is what moves in bulk between plants.',
    body:
      'We supply Ordinary Portland clinker from established UAE producers, with low-alkali and sulphate-resistant grades against buyer specification. Every cargo is sold on a defined chemistry and independently inspected at handover.',
    specsNote:
      'Full grade sheets and certificates of analysis are available on request. Cargo is shipped dry, to contract specification. Typical parameters specified per contract:',
    specs: [
      { param: 'C₃S (alite) content', value: null },
      { param: 'Free lime (CaO)', value: null },
      { param: 'Alkali content (Na₂O eq.)', value: null },
      { param: 'MgO', value: null },
      { param: 'Lime saturation factor', value: null },
      { param: 'Moisture', value: null },
    ],
    applications: [
      'Cement grinding plants',
      'Integrated plants covering kiln outages',
      'Low-alkali concrete applications',
      'Sulphate-resistant cement production',
    ],
    logistics:
      'Delivered by covered tipper from plant gate to grinding mill or port stockyard, as spot cargoes or term offtake.',
  },
  {
    slug: 'limestone',
    name: 'Limestone',
    image: '/media/limestone-macro.jpg',
    imageAlt: 'Layered ivory limestone strata in close detail',
    panelImage: '/media/limestone-panel.jpg',
    panelImageAlt: 'Terraced limestone quarry face in the Hajar mountains at first light',
    intro:
      'The Hajar mountains of Fujairah and Ras Al Khaimah hold some of the region’s richest limestone reserves. Aevum trades the stone at its source.',
    body:
      'Cement-grade and high-calcium limestone from established Hajar-range quarries, crushed and screened to the fraction you specify, from fine cuts to graded lump. Chemistry is defined per contract and verified by independent analysis where required.',
    specsNote:
      'Full grade sheets and certificates of analysis are available on request. Granulometry is cut to customer-specified fractions. Typical parameters specified per contract:',
    specs: [
      { param: 'CaCO₃ content', value: null },
      { param: 'SiO₂ (silica)', value: null },
      { param: 'MgO', value: null },
      { param: 'Moisture', value: null },
      { param: 'Granulometry', value: null },
    ],
    applications: [
      'Cement raw meal',
      'Construction aggregates and roadbase',
      'Chemical and industrial applications',
      'Water treatment',
    ],
    logistics:
      'Ex-quarry collection or delivery by road across the Emirates, with screening, stockpiling and port delivery coordinated under one contract.',
  },
];
