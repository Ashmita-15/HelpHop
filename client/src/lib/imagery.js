/**
 * Photography used across HelpHop.
 *
 * Every entry is an Unsplash photo id that has been checked to resolve. URLs
 * are built with explicit crop dimensions so an image can never arrive at an
 * unexpected aspect ratio and push a layout around.
 */

const HOST = 'https://images.unsplash.com/photo-';

/**
 * Build a cropped, compressed URL for one photo.
 * @param {string} id   Unsplash photo id.
 * @param {number} w    Rendered width in CSS pixels (doubled for density).
 * @param {number} ratio Width / height of the crop.
 */
export function photo(id, w = 800, ratio = 3 / 2) {
  const width = Math.round(w * 2);
  const height = Math.round(width / ratio);
  return `${HOST}${id}?auto=format&fit=crop&crop=entropy&w=${width}&h=${height}&q=68`;
}

/** Named photographs used in fixed places (hero, about, auth, stories). */
export const PHOTOS = {
  // Two generations tending a raised bed — the hero.
  heroGarden: '1791318219716-2ce5458c8257',
  // A volunteer with a clipboard organising a park clean-up.
  organising: '1758599667729-a6f0f8bd213b',
  // Neighbours gathered under string lights.
  gathering: '1517457373958-b7bdd4587205',
  // A community garden with raised beds and greenhouses.
  gardenBeds: '1788538812851-9aacd4189fa8',
  // Carrying produce out of the garden.
  harvest: '1781785186628-e1a04569776d',
  // Packing grocery bags under a canopy.
  foodBags: '1628717341663-0007b0ee2597',
  // Older neighbours talking over a cup of tea.
  seniors: '1764173039543-f9f197744e1b',
  // Hands cradling soil and young ferns.
  soil: '1542601906990-b4d3fb778b09',
  // Volunteers clearing litter from woodland.
  cleanup: '1758599668429-121d54188b9c',
  // Three volunteers side by side at an event.
  crew: '1560220604-1985ebfe28b1',
  // Hands stacked together.
  hands: '1582213782179-e0d53f98f2ca',
  // Schoolchildren crowding into frame.
  children: '1524069290683-0457abfe42c3',
};

/**
 * Photographs per cause. Several per cause so two listings in the same
 * category don't show the same picture side by side.
 */
const BY_CATEGORY = {
  environment: ['1542601906990-b4d3fb778b09', '1758599668429-121d54188b9c', '1466692476868-aef1dfb1e735'],
  education: ['1524069290683-0457abfe42c3', '1472162072942-cd5147eb3902', '1529390079861-591de354faf5'],
  health: ['1576765608535-5f04d1e3f289', '1762955911431-4c44c7c3f408'],
  animals: ['1621567390337-1984f38afa7b', '1550121855-61f5555a9282', '1450778869180-41d0601e046e'],
  community: ['1517457373958-b7bdd4587205', '1788538812851-9aacd4189fa8', '1526976668912-1a811878dd37'],
  'food security': ['1628717341663-0007b0ee2597', '1593113598332-cd288d649433', '1781785186628-e1a04569776d'],
  seniors: ['1764173039543-f9f197744e1b', '1567505599350-70d90e03a41b'],
  'disaster relief': ['1787012724048-dccf455a75a4', '1560220604-1985ebfe28b1'],
};

const FALLBACK = ['1560220604-1985ebfe28b1', '1582213782179-e0d53f98f2ca'];

/**
 * Listings describe themselves better than their category does — a dog-walking
 * morning and a cat-shelter shift are both "Animals". Where a title says
 * plainly what the work is, that wins over the category's rota.
 */
const BY_SUBJECT = [
  [/\b(dog|puppy|kennel|walk)/i, '1550121855-61f5555a9282'],
  [/\b(cat|kitten|feline)/i, '1621567390337-1984f38afa7b'],
  [/\b(beach|river|litter|clean[- ]?up|tidy|waste|plastic)/i, '1758599668429-121d54188b9c'],
  [/\b(garden|allotment|plant|tree|sapling|grow|green ?house)/i, '1788538812851-9aacd4189fa8'],
  [/\b(seedling|nursery|compost|soil)/i, '1542601906990-b4d3fb778b09'],
  [/\b(meal|food|pantry|kitchen|grocer|hamper|pack)/i, '1628717341663-0007b0ee2597'],
  [/\b(harvest|produce|market|farm)/i, '1781785186628-e1a04569776d'],
  [/\b(read|tutor|homework|school|classroom|lesson|mentor)/i, '1524069290683-0457abfe42c3'],
  [/\b(senior|elder|older|care home|companion)/i, '1764173039543-f9f197744e1b'],
  [/\b(clinic|health|blood|medical|nurse|checkup)/i, '1576765608535-5f04d1e3f289'],
  [/\b(festival|fair|street party|gathering|neighbour)/i, '1517457373958-b7bdd4587205'],
];

/** Stable small integer from a string, so a listing always gets one picture. */
function hash(value = '') {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * The photo id for one opportunity. Deterministic, so the image doesn't change
 * between renders or between the card and the detail page. `title` is matched
 * against BY_SUBJECT first; failing that the cause's own set is used, picked by
 * the id so two listings in one cause rarely show the same picture.
 */
export function categoryPhoto(category, seed = '', title = '') {
  const subject = BY_SUBJECT.find(([pattern]) => pattern.test(title));
  if (subject) return subject[1];

  const set = BY_CATEGORY[String(category || '').toLowerCase()] || FALLBACK;
  return set[hash(seed || category || '') % set.length];
}

/** Convenience wrapper for anywhere holding a whole opportunity. */
export const opportunityPhoto = (o) => categoryPhoto(o?.category, o?._id, o?.title);

/** The eight causes HelpHop ships with, each with its own picture and words. */
export const CAUSES = [
  {
    name: 'Environment',
    photo: BY_CATEGORY.environment[0],
    blurb: 'Planting, clearing, re-wilding — the slow work of looking after a place.',
  },
  {
    name: 'Food Security',
    photo: BY_CATEGORY['food security'][0],
    blurb: 'Pantries, community kitchens and the weekly rhythm of packing bags.',
  },
  {
    name: 'Education',
    photo: BY_CATEGORY.education[0],
    blurb: 'Reading hours, homework clubs and steady encouragement after school.',
  },
  {
    name: 'Seniors',
    photo: BY_CATEGORY.seniors[0],
    blurb: 'Company, a lift to an appointment, an afternoon that isn’t spent alone.',
  },
  {
    name: 'Animals',
    photo: BY_CATEGORY.animals[0],
    blurb: 'Shelter mornings, fostering, and walking dogs who are waiting for homes.',
  },
  {
    name: 'Community',
    photo: BY_CATEGORY.community[0],
    blurb: 'Street fairs, repair cafés, and the gatherings that make a street a street.',
  },
  {
    name: 'Health',
    photo: BY_CATEGORY.health[0],
    blurb: 'Clinic days, health drives and sitting with people through a long wait.',
  },
  {
    name: 'Disaster Relief',
    photo: BY_CATEGORY['disaster relief'][0],
    blurb: 'Turning out quickly when a neighbourhood needs many hands at once.',
  },
];

/** Portraits for the community stories. */
export const PORTRAITS = {
  mira: '1573497019940-1c28c88b4f3e',
  anya: '1544005313-94ddf0286df2',
  daniel: '1557862921-37829c790f19',
  tomas: '1507003211169-0a1dd7228f2d',
};
