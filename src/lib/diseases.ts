import type { Disease } from '@/types';

export interface DiseaseInfo {
  name: Disease;
  slug: 'early-blight' | 'late-blight';
  agent: string;
  agentType: string;
  tagline: string;
  overview: string;
  description: string;
  symptoms: string[];
  leafAppearance: string[];
  causes: string[];
  favorableConditions: string[];
  prevention: string[];
  management: string[];
  image: { src: string; alt: string; credit: string };
}

export const DISEASE_INFO: Record<Disease, DiseaseInfo> = {
  'Early Blight': {
    name: 'Early Blight',
    slug: 'early-blight',
    agent: 'Alternaria solani',
    agentType: 'Fungus',
    tagline: 'Dark, target-like spots that usually begin on older leaves.',
    overview:
      'Early blight is a common foliar disease of potato caused by the fungus Alternaria solani. It typically appears first on older, lower leaves and tends to progress upward, often becoming more noticeable as plants mature or come under stress.',
    description:
      'A fungal leaf disease that produces dark brown lesions, often with concentric rings. Severe infections reduce healthy leaf area and may lower yield.',
    symptoms: [
      'Small dark brown to black spots, commonly starting on older, lower leaves',
      'Lesions that enlarge and develop concentric rings, giving a “target” or “bull’s-eye” look',
      'Yellowing (chlorosis) of leaf tissue surrounding the spots',
      'Lesions that are often angular because they are limited by leaf veins',
      'Premature leaf drying and defoliation when infection is heavy',
    ],
    leafAppearance: [
      'Dry, papery, brown-to-black spots, typically a few millimetres up to about 1–2 cm',
      'Visible concentric rings inside larger spots',
      'A yellow halo around many lesions',
      'Spots scattered across the leaf blade rather than starting only from the edge',
    ],
    causes: [
      'Infection by the fungus Alternaria solani',
      'Spores surviving on infected crop debris, volunteer potatoes, and related host plants',
      'Spread by wind, rain splash, and irrigation water',
      'Plants weakened by nutrient deficiency, drought, age, or other stress are generally more susceptible',
    ],
    favorableConditions: [
      'Warm temperatures, roughly 20–30 °C',
      'Alternating wet and dry periods, heavy dew, or frequent overhead irrigation',
      'Ageing foliage and plants under nutrient (especially nitrogen) or water stress',
      'Infected plant residue left in or near the field',
    ],
    prevention: [
      'Rotate away from potato, tomato, and other solanaceous crops for at least two seasons where possible',
      'Use certified, healthy seed tubers and varieties with better tolerance where available',
      'Maintain balanced plant nutrition and consistent soil moisture to limit plant stress',
      'Remove or bury infected crop debris and control volunteer potatoes and solanaceous weeds',
      'Prefer irrigation timing that lets foliage dry quickly',
    ],
    management: [
      'Scout fields regularly, paying attention to older leaves, and record how quickly spots spread',
      'Confirm the diagnosis with a local extension officer or plant pathologist before treating',
      'If fungicides are considered, follow local agricultural recommendations and product labels, and rotate modes of action',
      'Reduce plant stress with adequate fertilisation and irrigation',
      'Allow tuber skins to set before harvest and avoid wounding tubers to limit storage problems',
    ],
    image: {
      src: '/images/early-blight.jpg',
      alt: 'Potato leaves with scattered dark brown early blight spots',
      credit: 'Photo: Linnea Stridh / Wikimedia Commons (CC BY-SA 4.0)',
    },
  },
  'Late Blight': {
    name: 'Late Blight',
    slug: 'late-blight',
    agent: 'Phytophthora infestans',
    agentType: 'Oomycete (water mould)',
    tagline: 'Fast-spreading, water-soaked lesions that thrive in cool, wet weather.',
    overview:
      'Late blight is caused by Phytophthora infestans, an oomycete (water mould) rather than a true fungus. Under cool, humid conditions it can spread very quickly through a crop and can also infect stems and tubers, which makes early detection and confirmation important.',
    description:
      'A highly destructive disease that produces irregular, water-soaked lesions which turn dark brown or black and can rapidly destroy foliage in cool, wet weather.',
    symptoms: [
      'Pale to dark green, water-soaked spots, often beginning at leaf tips or edges',
      'Lesions that expand quickly into large brown-to-black patches, not limited by leaf veins',
      'A light green or yellowish border around the lesion',
      'White, fuzzy growth on the underside of leaves in humid conditions',
      'Dark lesions on stems and a firm, reddish-brown rot in tubers in advanced cases',
    ],
    leafAppearance: [
      'Irregular, greasy or water-soaked looking patches',
      'Dark brown to purplish-black dead tissue that can cover much of the leaflet',
      'Whitish downy growth at the lesion margin on the leaf underside when humidity is high',
      'Leaves that collapse and shrivel quickly in wet weather',
    ],
    causes: [
      'Infection by the oomycete Phytophthora infestans',
      'Inoculum from infected seed tubers, cull piles, and volunteer potato plants',
      'Airborne sporangia carried by wind, sometimes over long distances',
      'Prolonged leaf wetness from rain, fog, dew, or overhead irrigation',
    ],
    favorableConditions: [
      'Cool to mild temperatures, roughly 10–24 °C',
      'High relative humidity (around 90 % or more) and long periods of leaf wetness',
      'Rainy, foggy, or overcast weather lasting several days',
      'Dense canopies with poor air circulation',
    ],
    prevention: [
      'Plant certified, disease-free seed tubers and consider resistant or tolerant varieties',
      'Destroy cull piles and volunteer potato plants that can harbour the pathogen',
      'Use spacing and row orientation that improve airflow and help foliage dry',
      'Avoid prolonged leaf wetness from overhead irrigation where feasible',
      'Follow local late blight forecasts or warning services during high-risk weather',
    ],
    management: [
      'Inspect the crop frequently during cool, wet weather because the disease can advance within days',
      'Have suspected late blight confirmed promptly by an extension service or diagnostic laboratory',
      'If fungicides are considered, follow local agricultural recommendations and product labels; protectant programmes are generally more effective before the disease is established',
      'Remove and safely dispose of heavily infected plants where practical to reduce spread',
      'Hill soil over tubers, allow vines to die back fully before harvest, and store only sound, dry tubers',
    ],
    image: {
      src: '/images/late-blight.jpg',
      alt: 'Potato leaflet with a grey-brown late blight lesion surrounded by pale growth',
      credit: 'Photo: Björn Andersson (SLU) / Wikimedia Commons (CC BY-SA 4.0)',
    },
  },
};

export const DISEASE_LIST: DiseaseInfo[] = [DISEASE_INFO['Early Blight'], DISEASE_INFO['Late Blight']];

export const COMPARISON_ROWS: { feature: string; early: string; late: string }[] = [
  { feature: 'Causative agent', early: 'Alternaria solani (fungus)', late: 'Phytophthora infestans (oomycete)' },
  { feature: 'Where it usually starts', early: 'Older, lower leaves', late: 'Leaf tips and edges; any leaf age' },
  {
    feature: 'Lesion appearance',
    early: 'Dry, dark brown spots with concentric rings',
    late: 'Water-soaked patches turning brown-black',
  },
  { feature: 'Lesion shape', early: 'Often angular, limited by veins', late: 'Irregular, crosses leaf veins' },
  { feature: 'Halo / margin', early: 'Yellow halo is common', late: 'Pale green to yellowish border' },
  {
    feature: 'Underside of leaf',
    early: 'No white downy growth',
    late: 'White fuzzy growth in humid conditions',
  },
  { feature: 'Favoured weather', early: 'Warm (≈20–30 °C), wet/dry cycles', late: 'Cool (≈10–24 °C), humid and wet' },
  { feature: 'Typical speed', early: 'Gradual, builds through the season', late: 'Can be very rapid in wet weather' },
  { feature: 'Tuber involvement', early: 'Possible; dry, sunken lesions', late: 'Common; firm reddish-brown rot' },
];

export const FARMER_NOTES: { title: string; body: string }[] = [
  {
    title: 'Scout early and often',
    body: 'Walk the field at least weekly, and more often in wet weather. Check lower leaves and low-lying or shaded areas where foliage stays damp.',
  },
  {
    title: 'Confirm before you act',
    body: 'Several leaf problems look alike. Send samples or photos to your local agricultural extension office to confirm what you are seeing.',
  },
  {
    title: 'Keep records',
    body: 'Note dates, weather, and affected areas. A history of observations helps advisors recommend a suitable response for your farm.',
  },
  {
    title: 'Think in seasons',
    body: 'Crop rotation, clean seed, residue management, and variety choice reduce disease pressure over time more reliably than any single action.',
  },
];
