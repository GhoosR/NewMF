import type { CropInfo } from '../types/crops';

// Define planting zones by country
const countryZones: Record<string, string> = {
  'gb': 'temperate_maritime',
  'ie': 'temperate_maritime',
  'fr': 'mediterranean',
  'es': 'mediterranean',
  'it': 'mediterranean',
  'gr': 'mediterranean',
  'de': 'continental',
  'pl': 'continental',
  'nl': 'temperate_maritime',
  'be': 'temperate_maritime',
  'dk': 'nordic',
  'se': 'nordic',
  'no': 'nordic',
  'fi': 'nordic',
  'us': 'mixed', // Example for the US, which has multiple zones
  'ca': 'mixed', // Example for Canada
  'au': 'mixed', // Example for Australia
  'nz': 'temperate_maritime',
  'jp': 'temperate',
  'cn': 'mixed'
};

// Define planting times by zone
const zonePlantingTimes: Record<string, Record<string, { indoor?: string; outdoor: string }>> = {
  temperate_maritime: {
    tomatoes: { indoor: 'March-April', outdoor: 'May-June' },
    carrots: { outdoor: 'March-July' },
    basil: { indoor: 'March-April', outdoor: 'May-June' },
    rosemary: { outdoor: 'April-May' },
    apples: { outdoor: 'November-March' },
    strawberries: { outdoor: 'March-April' },
    potatoes: { outdoor: 'March-May' },
    lettuce: { indoor: 'February-March', outdoor: 'March-September' },
    cucumbers: { indoor: 'April', outdoor: 'May-June' },
    blueberries: { outdoor: 'October-March' },
    mint: { outdoor: 'April-May' },
    lavender: { outdoor: 'April-May' },
    oranges: { outdoor: 'March-April' },
    lemons: { outdoor: 'March-April' },
    peaches: { outdoor: 'November-March' },
    pears: { outdoor: 'November-March' },
    cherries: { outdoor: 'November-March' },
    walnuts: { outdoor: 'November-March' },
    olives: { outdoor: 'March-April' },
    grapes: { outdoor: 'March-April' },
    kale: { outdoor: 'March-June' },
    broccoli: { indoor: 'March-May', outdoor: 'April-June' },
    garlic: { outdoor: 'September-November' },
    onions: { outdoor: 'March-April' },
    thyme: { outdoor: 'March-May' },
    oregano: { outdoor: 'April-June' },
    parsley: { outdoor: 'March-August' },
    chives: { outdoor: 'March-May' },
    cilantro: { outdoor: 'March-May' },
    spinach: { outdoor: 'March-May' },
    bell_peppers: { indoor: 'February-April', outdoor: 'May-June' },
    pumpkin: { indoor: 'April', outdoor: 'May-June' },
    zucchini: { indoor: 'April', outdoor: 'May-June' },
    watermelon: { indoor: 'April', outdoor: 'May-June' },
    sunflowers: { outdoor: 'April-May' },
    tulips: { outdoor: 'September-November' },
    daffodils: { outdoor: 'September-November' },
    crocuses: { outdoor: 'September-November' },
    hyacinths: { outdoor: 'September-November' },
    peas: { outdoor: 'February-May' },
    beans: { outdoor: 'April-July' },
    corn: { outdoor: 'May-June' },
    cabbage: { indoor: 'February-March', outdoor: 'April-June' },
    cauliflower: { indoor: 'February-April', outdoor: 'March-June' }
  },
  mediterranean: {
    tomatoes: { indoor: 'January-February', outdoor: 'March-May' },
    carrots: { outdoor: 'February-September' },
    basil: { indoor: 'February-March', outdoor: 'April-May' },
    rosemary: { outdoor: 'March-April' },
    apples: { outdoor: 'November-February' },
    strawberries: { outdoor: 'February-March' },
    potatoes: { outdoor: 'February-April' },
    lettuce: { indoor: 'January-February', outdoor: 'February-October' },
    cucumbers: { indoor: 'March', outdoor: 'April-May' },
    blueberries: { outdoor: 'October-February' },
    mint: { outdoor: 'March-April' },
    lavender: { outdoor: 'March-April' },
    oranges: { outdoor: 'February-March' },
    lemons: { outdoor: 'February-March' },
    peaches: { outdoor: 'November-February' },
    pears: { outdoor: 'November-February' },
    cherries: { outdoor: 'November-February' },
    walnuts: { outdoor: 'November-February' },
    olives: { outdoor: 'February-March' },
    grapes: { outdoor: 'February-March' },
    kale: { outdoor: 'February-April' },
    broccoli: { indoor: 'January-March', outdoor: 'February-April' },
    garlic: { outdoor: 'October-November' },
    onions: { outdoor: 'October-December' },
    thyme: { outdoor: 'February-April' },
    oregano: { outdoor: 'March-May' },
    parsley: { outdoor: 'February-October' },
    chives: { outdoor: 'February-April' },
    cilantro: { outdoor: 'October-November' },
    spinach: { outdoor: 'September-March' },
    bell_peppers: { indoor: 'January-March', outdoor: 'April-May' },
    pumpkin: { indoor: 'March', outdoor: 'April-May' },
    zucchini: { indoor: 'March', outdoor: 'April-May' },
    watermelon: { indoor: 'March', outdoor: 'April-May' },
    sunflowers: { outdoor: 'March-April' },
    tulips: { outdoor: 'October-December' },
    daffodils: { outdoor: 'October-December' },
    crocuses: { outdoor: 'October-December' },
    hyacinths: { outdoor: 'October-December' },
    peas: { outdoor: 'October-March' },
    beans: { outdoor: 'February-June' },
    corn: { outdoor: 'April-May' },
    cabbage: { indoor: 'January-March', outdoor: 'February-April' },
    cauliflower: { indoor: 'January-March', outdoor: 'February-April' }
  },
  continental: {
    tomatoes: { indoor: 'March-April', outdoor: 'May-June' },
    carrots: { outdoor: 'April-July' },
    basil: { indoor: 'March-April', outdoor: 'May-June' },
    rosemary: { outdoor: 'April-May' },
    apples: { outdoor: 'November-March' },
    strawberries: { outdoor: 'March-April' },
    potatoes: { outdoor: 'April-May' },
    lettuce: { indoor: 'February-March', outdoor: 'March-September' },
    cucumbers: { indoor: 'April', outdoor: 'May-June' },
    blueberries: { outdoor: 'October-March' },
    mint: { outdoor: 'April-May' },
    lavender: { outdoor: 'April-May' },
    oranges: { outdoor: 'March-April' },
    lemons: { outdoor: 'March-April' },
    peaches: { outdoor: 'November-March' },
    pears: { outdoor: 'November-March' },
    cherries: { outdoor: 'November-March' },
    walnuts: { outdoor: 'November-March' },
    olives: { outdoor: 'March-April' },
    grapes: { outdoor: 'March-April' },
    kale: { outdoor: 'April-July' },
    broccoli: { indoor: 'March-May', outdoor: 'April-June' },
    garlic: { outdoor: 'September-October' },
    onions: { outdoor: 'March-April' },
    thyme: { outdoor: 'April-June' },
    oregano: { outdoor: 'April-June' },
    parsley: { outdoor: 'March-August' },
    chives: { outdoor: 'April-June' },
    cilantro: { outdoor: 'April-June' },
    spinach: { outdoor: 'April-July' },
    bell_peppers: { indoor: 'March-April', outdoor: 'May-June' },
    pumpkin: { indoor: 'April', outdoor: 'May-June' },
    zucchini: { indoor: 'April', outdoor: 'May-June' },
    watermelon: { indoor: 'April', outdoor: 'May-June' },
    sunflowers: { outdoor: 'April-June' },
    tulips: { outdoor: 'September-November' },
    daffodils: { outdoor: 'September-November' },
    crocuses: { outdoor: 'September-November' },
    hyacinths: { outdoor: 'September-November' },
    peas: { outdoor: 'March-May' },
    beans: { outdoor: 'May-July' },
    corn: { outdoor: 'May-June' },
    cabbage: { indoor: 'March-April', outdoor: 'May-June' },
    cauliflower: { indoor: 'March-May', outdoor: 'April-June' }
  },
  nordic: {
    tomatoes: { indoor: 'February-March', outdoor: 'June' },
    carrots: { outdoor: 'April-June' },
    basil: { indoor: 'March-April', outdoor: 'May-June' },
    rosemary: { outdoor: 'May-June' },
    apples: { outdoor: 'October-April' },
    strawberries: { outdoor: 'April-May' },
    potatoes: { outdoor: 'May-June' },
    lettuce: { indoor: 'March-April', outdoor: 'April-September' },
    cucumbers: { indoor: 'April', outdoor: 'June' },
    blueberries: { outdoor: 'October-April' },
    mint: { outdoor: 'May-June' },
    lavender: { outdoor: 'May-June' },
    oranges: { outdoor: 'March-April' },
    lemons: { outdoor: 'March-April' },
    peaches: { outdoor: 'October-April' },
    pears: { outdoor: 'October-April' },
    cherries: { outdoor: 'October-April' },
    walnuts: { outdoor: 'October-April' },
    olives: { outdoor: 'March-April' },
    grapes: { outdoor: 'March-April' },
    kale: { outdoor: 'May-July' },
    broccoli: { indoor: 'April-June', outdoor: 'May-July' },
    garlic: { outdoor: 'September-October' },
    onions: { outdoor: 'April-June' },
    thyme: { outdoor: 'May-July' },
    oregano: { outdoor: 'May-July' },
    parsley: { outdoor: 'April-August' },
    chives: { outdoor: 'May-July' },
    cilantro: { outdoor: 'May-July' },
    spinach: { outdoor: 'April-June' },
    bell_peppers: { indoor: 'March-May', outdoor: 'June' },
    pumpkin: { indoor: 'May', outdoor: 'June' },
    zucchini: { indoor: 'May', outdoor: 'June' },
    watermelon: { indoor: 'May', outdoor: 'June' },
    sunflowers: { outdoor: 'May-June' },
    tulips: { outdoor: 'September-October' },
    daffodils: { outdoor: 'September-October' },
    crocuses: { outdoor: 'September-October' },
    hyacinths: { outdoor: 'September-October' },
    peas: { outdoor: 'April-June' },
    beans: { outdoor: 'May-July' },
    corn: { outdoor: 'June' },
    cabbage: { indoor: 'April-June', outdoor: 'May-July' },
    cauliflower: { indoor: 'April-June', outdoor: 'May-July' }
  }
};

// Define crop information
export const crops: Record<string, CropInfo> = {
  tomatoes: {
    name: "Tomatoes",
    description: "A versatile fruit commonly grown as a vegetable, tomatoes come in many varieties.",
    sowingTime: { indoor: "February-March", outdoor: "May-June" },
    harvestTime: "90-120",
    spacing: "45-60cm apart",
    soil: "Rich, well-draining soil with pH 6.0-6.8",
    sunlight: "Full sun, 6-8 hours daily",
    watering: "Regular, consistent watering",
    companions: ["Basil", "Marigolds", "Carrots"],
    pests: ["Tomato hornworm", "Aphids", "Whiteflies"],
    diseases: ["Blight", "Fusarium wilt"],
    tips: [
      "Support with stakes or cages",
      "Remove suckers for indeterminate varieties",
      "Water at base to prevent leaf diseases"
    ]
  },
  carrots: {
    name: "Carrots",
    description: "Root vegetable available in multiple colors and varieties.",
    sowingTime: { outdoor: "March-July" },
    harvestTime: "70-80",
    spacing: "5-10cm apart",
    soil: "Light, stone-free soil with pH 6.0-7.0",
    sunlight: "Full sun to partial shade",
    watering: "Keep soil moist but not waterlogged",
    companions: ["Onions", "Leeks", "Rosemary"],
    pests: ["Carrot fly", "Slugs"],
    diseases: ["Carrot rust fly", "Alternaria leaf blight"],
    tips: [
      "Thin seedlings to prevent overcrowding",
      "Avoid high nitrogen fertilizers",
      "Cover crops with fleece to protect from carrot fly"
    ]
  },
  basil: {
    name: "Basil",
    description: "A fragrant herb used in cooking, especially in Mediterranean cuisine.",
    sowingTime: { indoor: "March-April", outdoor: "May-June" },
    harvestTime: "60-90",
    spacing: "20-30cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.5",
    sunlight: "Full sun to partial shade",
    watering: "Keep soil moist",
    companions: ["Tomatoes", "Peppers", "Oregano"],
    pests: ["Aphids", "Whiteflies"],
    diseases: ["Fusarium wilt", "Downy mildew"],
    tips: [
      "Pinch off flowers to encourage leaf growth",
      "Harvest leaves regularly to promote bushiness"
    ]
  },
  rosemary: {
    name: "Rosemary",
    description: "A woody, perennial herb with fragrant, evergreen leaves.",
    sowingTime: { outdoor: "April-May" },
    harvestTime: "90-365",
    spacing: "60-90cm apart",
    soil: "Well-draining, sandy soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Drought-tolerant; water sparingly",
    companions: ["Sage", "Thyme", "Lavender"],
    pests: ["Spider mites", "Aphids"],
    diseases: ["Root rot", "Powdery mildew"],
    tips: [
      "Prune regularly to maintain shape",
      "Avoid overwatering to prevent root rot"
    ]
  },
  apples: {
    name: "Apples",
    description: "A popular fruit tree with many varieties for eating and cooking.",
    sowingTime: { outdoor: "November-March" },
    harvestTime: "1095-1460",
    spacing: "4-6m apart",
    soil: "Well-draining, loamy soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Regular watering, especially during dry spells",
    companions: ["Chives", "Nasturtiums", "Marigolds"],
    pests: ["Apple maggot", "Codling moth"],
    diseases: ["Apple scab", "Fire blight"],
    tips: [
      "Prune annually to improve air circulation",
      "Thin fruit to improve size and quality"
    ]
  },
  strawberries: {
    name: "Strawberries",
    description: "A sweet, red fruit that grows on low plants.",
    sowingTime: { outdoor: "March-April" },
    harvestTime: "60-90",
    spacing: "30-45cm apart",
    soil: "Well-draining, fertile soil with pH 5.5-6.5",
    sunlight: "Full sun",
    watering: "Keep soil consistently moist",
    companions: ["Lettuce", "Spinach", "Borage"],
    pests: ["Slugs", "Birds"],
    diseases: ["Gray mold", "Powdery mildew"],
    tips: [
      "Use straw mulch to keep fruit clean",
      "Replace plants every 3-4 years for best yields"
    ]
  },
  potatoes: {
    name: "Potatoes",
    description: "A starchy tuber that is a staple food in many cuisines.",
    sowingTime: { outdoor: "March-May" },
    harvestTime: "70-120",
    spacing: "30-40cm apart",
    soil: "Well-draining, loose soil with pH 5.0-6.0",
    sunlight: "Full sun",
    watering: "Keep soil moist but not waterlogged",
    companions: ["Beans", "Corn", "Cabbage"],
    pests: ["Colorado potato beetle", "Aphids"],
    diseases: ["Late blight", "Scab"],
    tips: [
      "Hill soil around plants to prevent tubers from being exposed to light",
      "Rotate crops to prevent disease buildup"
    ]
  },
  lettuce: {
    name: "Lettuce",
    description: "A leafy green vegetable used in salads and sandwiches.",
    sowingTime: { indoor: "February-March", outdoor: "March-September" },
    harvestTime: "45-65",
    spacing: "15-30cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.0",
    sunlight: "Partial shade to full sun",
    watering: "Keep soil consistently moist",
    companions: ["Carrots", "Radishes", "Strawberries"],
    pests: ["Slugs", "Aphids"],
    diseases: ["Downy mildew", "Lettuce mosaic virus"],
    tips: [
      "Harvest outer leaves to allow continued growth",
      "Provide shade in hot weather to prevent bolting"
    ]
  },
  cucumbers: {
    name: "Cucumbers",
    description: "A refreshing, green fruit often used in salads and pickling.",
    sowingTime: { indoor: "April", outdoor: "May-June" },
    harvestTime: "50-70",
    spacing: "30-60cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Keep soil consistently moist",
    companions: ["Beans", "Corn", "Radishes"],
    pests: ["Cucumber beetles", "Aphids"],
    diseases: ["Powdery mildew", "Downy mildew"],
    tips: [
      "Provide trellises for vertical growth",
      "Harvest regularly to encourage more fruit"
    ]
  },
  blueberries: {
    name: "Blueberries",
    description: "A sweet, antioxidant-rich fruit that grows on shrubs.",
    sowingTime: { outdoor: "October-March" },
    harvestTime: "730-1095",
    spacing: "1.5-2m apart",
    soil: "Acidic, well-draining soil with pH 4.5-5.5",
    sunlight: "Full sun to partial shade",
    watering: "Keep soil consistently moist",
    companions: ["Azaleas", "Rhododendrons", "Pine trees"],
    pests: ["Birds", "Spotted wing drosophila"],
    diseases: ["Mummy berry", "Anthracnose"],
    tips: [
      "Mulch with pine needles to maintain soil acidity",
      "Prune old canes to encourage new growth"
    ]
  },
  mint: {
    name: "Mint",
    description: "A fragrant herb used in teas, desserts, and savory dishes.",
    sowingTime: { outdoor: "April-May" },
    harvestTime: "60-90",
    spacing: "30-45cm apart",
    soil: "Moist, well-draining soil with pH 6.0-7.0",
    sunlight: "Partial shade to full sun",
    watering: "Keep soil consistently moist",
    companions: ["Cabbage", "Tomatoes", "Peas"],
    pests: ["Spider mites", "Aphids"],
    diseases: ["Rust", "Powdery mildew"],
    tips: [
      "Plant in containers to prevent spreading",
      "Harvest leaves regularly to promote growth"
    ]
  },
  lavender: {
    name: "Lavender",
    description: "A fragrant herb known for its calming scent and purple flowers.",
    sowingTime: { outdoor: "April-May" },
    harvestTime: "90-120",
    spacing: "60-90cm apart",
    soil: "Well-draining, sandy soil with pH 6.5-7.5",
    sunlight: "Full sun",
    watering: "Drought-tolerant; water sparingly",
    companions: ["Rosemary", "Sage", "Thyme"],
    pests: ["Spider mites", "Aphids"],
    diseases: ["Root rot", "Fungal infections"],
    tips: [
      "Prune after flowering to maintain shape",
      "Avoid overwatering to prevent root rot"
    ]
  },
  oranges: {
    name: "Oranges",
    description: "A citrus fruit known for its sweet, juicy flavor.",
    sowingTime: { outdoor: "March-April" },
    harvestTime: "365-730",
    spacing: "4-6m apart",
    soil: "Well-draining, loamy soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Regular watering, especially during dry spells",
    companions: ["Lavender", "Marigolds", "Basil"],
    pests: ["Citrus leafminer", "Aphids"],
    diseases: ["Citrus canker", "Root rot"],
    tips: [
      "Fertilize regularly during the growing season",
      "Protect from frost in colder climates"
    ]
  },
  lemons: {
    name: "Lemons",
    description: "A tart citrus fruit used in cooking, baking, and beverages.",
    sowingTime: { outdoor: "March-April" },
    harvestTime: "365-730",
    spacing: "4-6m apart",
    soil: "Well-draining, loamy soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Regular watering, especially during dry spells",
    companions: ["Lavender", "Marigolds", "Basil"],
    pests: ["Citrus leafminer", "Aphids"],
    diseases: ["Citrus canker", "Root rot"],
    tips: [
      "Fertilize regularly during the growing season",
      "Protect from frost in colder climates"
    ]
  },
  peaches: {
    name: "Peaches",
    description: "A sweet, juicy fruit with a soft, fuzzy skin.",
    sowingTime: { outdoor: "November-March" },
    harvestTime: "1095-1460",
    spacing: "4-6m apart",
    soil: "Well-draining, loamy soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Regular watering, especially during dry spells",
    companions: ["Garlic", "Onions", "Marigolds"],
    pests: ["Peach tree borer", "Aphids"],
    diseases: ["Peach leaf curl", "Brown rot"],
    tips: [
      "Prune annually to improve air circulation",
      "Thin fruit to improve size and quality"
    ]
  },
  pears: {
    name: "Pears",
    description: "A sweet, juicy fruit that grows on trees.",
    sowingTime: { outdoor: "November-March" },
    harvestTime: "1095-1460",
    spacing: "4-6m apart",
    soil: "Well-draining, loamy soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Regular watering, especially during dry spells",
    companions: ["Chives", "Nasturtiums", "Marigolds"],
    pests: ["Pear psylla", "Codling moth"],
    diseases: ["Fire blight", "Pear scab"],
    tips: [
      "Prune annually to improve air circulation",
      "Thin fruit to improve size and quality"
    ]
  },
  cherries: {
    name: "Cherries",
    description: "A small, sweet fruit that grows on trees.",
    sowingTime: { outdoor: "November-March" },
    harvestTime: "1095-1460",
    spacing: "4-6m apart",
    soil: "Well-draining, loamy soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Regular watering, especially during dry spells",
    companions: ["Garlic", "Onions", "Marigolds"],
    pests: ["Cherry fruit fly", "Aphids"],
    diseases: ["Brown rot", "Cherry leaf spot"],
    tips: [
      "Prune annually to improve air circulation",
      "Protect fruit from birds with netting"
    ]
  },
  walnuts: {
    name: "Walnuts",
    description: "A nut-bearing tree with edible seeds.",
    sowingTime: { outdoor: "November-March" },
    harvestTime: "2190-2555",
    spacing: "10-15m apart",
    soil: "Well-draining, deep soil with pH 6.0-7.5",
    sunlight: "Full sun",
    watering: "Regular watering, especially during dry spells",
    companions: ["Comfrey", "Clover", "Marigolds"],
    pests: ["Walnut husk fly", "Aphids"],
    diseases: ["Walnut blight", "Root rot"],
    tips: [
      "Plant in a large area to accommodate root growth",
      "Harvest nuts when the husks split open"
    ]
  },
  olives: {
    name: "Olives",
    description: "A fruit used for oil and table consumption.",
    sowingTime: { outdoor: "March-April" },
    harvestTime: "1095-1825",
    spacing: "6-8m apart",
    soil: "Well-draining, sandy soil with pH 6.0-8.0",
    sunlight: "Full sun",
    watering: "Drought-tolerant; water sparingly",
    companions: ["Lavender", "Rosemary", "Sage"],
    pests: ["Olive fruit fly", "Scale insects"],
    diseases: ["Olive knot", "Verticillium wilt"],
    tips: [
      "Prune annually to maintain shape and productivity",
      "Harvest olives when they change color"
    ]
  },
  grapes: {
    name: "Grapes",
    description: "A fruit used for wine, juice, and fresh consumption.",
    sowingTime: { outdoor: "March-April" },
    harvestTime: "1095-1460",
    spacing: "2-3m apart",
    soil: "Well-draining, loamy soil with pH 5.5-7.0",
    sunlight: "Full sun",
    watering: "Regular watering, especially during dry spells",
    companions: ["Basil", "Oregano", "Marigolds"],
    pests: ["Grapevine moth", "Aphids"],
    diseases: ["Powdery mildew", "Downy mildew"],
    tips: [
      "Train vines on trellises or arbors",
      "Prune annually to improve air circulation"
    ]
  },
  kale: {
    name: "Kale",
    description: "A leafy green vegetable, known for being nutrient-rich.",
    sowingTime: { outdoor: "March-June" },
    harvestTime: "55-75",
    spacing: "30-45cm apart",
    soil: "Rich, well-draining soil with pH 6.0-7.0",
    sunlight: "Full sun to partial shade",
    watering: "Keep soil consistently moist",
    companions: ["Beets", "Cucumbers", "Mint"],
    pests: ["Aphids", "Cabbage worms"],
    diseases: ["Downy mildew", "Clubroot"],
    tips: [
      "Harvest outer leaves first to allow continued growth",
      "Protect from frost to improve flavor"
    ]
  },
  broccoli: {
    name: "Broccoli",
    description: "A cool-season vegetable with edible flower heads.",
    sowingTime: { indoor: "March-May", outdoor: "April-June" },
    harvestTime: "60-90",
    spacing: "45-60cm apart",
    soil: "Rich, well-draining soil with pH 6.0-7.0",
    sunlight: "Full sun, 6-8 hours daily",
    watering: "Keep soil consistently moist",
    companions: ["Rosemary", "Dill", "Sage"],
    pests: ["Cabbage worms", "Aphids"],
    diseases: ["Clubroot", "Black rot"],
    tips: [
      "Harvest the central head when it's firm and before flowers open",
      "Side shoots will often grow after the main head is harvested"
    ]
  },
  garlic: {
    name: "Garlic",
    description: "A bulb vegetable with a strong, pungent flavor.",
    sowingTime: { outdoor: "September-November" },
    harvestTime: "240-270",
    spacing: "10-15cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Water regularly in spring, reduce as summer approaches",
    companions: ["Roses", "Fruit trees", "Carrots"],
    pests: ["Onion thrips", "Nematodes"],
    diseases: ["White rot", "Rust"],
    tips: [
      "Plant cloves with the pointed end up",
      "Harvest when leaves begin to yellow and fall over"
    ]
  },
  onions: {
    name: "Onions",
    description: "A bulb vegetable used as a staple in many dishes.",
    sowingTime: { outdoor: "March-April" },
    harvestTime: "100-120",
    spacing: "10-15cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Keep soil moist, especially during bulb formation",
    companions: ["Carrots", "Beets", "Lettuce"],
    pests: ["Onion fly", "Thrips"],
    diseases: ["Downy mildew", "White rot"],
    tips: [
      "Harvest when the tops begin to yellow and fall over",
      "Allow bulbs to dry in the sun before storing"
    ]
  },
  thyme: {
    name: "Thyme",
    description: "A versatile herb with small, fragrant leaves.",
    sowingTime: { outdoor: "March-May" },
    harvestTime: "90-120",
    spacing: "20-30cm apart",
    soil: "Well-draining, sandy soil with pH 6.0-8.0",
    sunlight: "Full sun",
    watering: "Drought-tolerant; water sparingly",
    companions: ["Rosemary", "Sage", "Lavender"],
    pests: ["Spider mites", "Aphids"],
    diseases: ["Root rot", "Fungal leaf spot"],
    tips: [
      "Harvest sprigs regularly to encourage bushy growth",
      "Can be grown in containers"
    ]
  },
  oregano: {
    name: "Oregano",
    description: "A pungent herb widely used in Mediterranean and Mexican cooking.",
    sowingTime: { outdoor: "April-June" },
    harvestTime: "75-90",
    spacing: "30-45cm apart",
    soil: "Well-draining, sandy soil with pH 6.0-8.0",
    sunlight: "Full sun",
    watering: "Drought-tolerant once established",
    companions: ["Basil", "Cucumbers", "Cabbage"],
    pests: ["Aphids", "Spider mites"],
    diseases: ["Root rot", "Stem rot"],
    tips: [
      "Prune regularly to prevent it from becoming woody",
      "Drying the leaves intensifies their flavor"
    ]
  },
  parsley: {
    name: "Parsley",
    description: "A popular herb used as a garnish and flavoring.",
    sowingTime: { outdoor: "March-August" },
    harvestTime: "70-90",
    spacing: "15-20cm apart",
    soil: "Moist, fertile soil with pH 6.0-7.0",
    sunlight: "Full sun to partial shade",
    watering: "Keep soil consistently moist",
    companions: ["Asparagus", "Corn", "Tomatoes"],
    pests: ["Aphids", "Carrot rust fly"],
    diseases: ["Leaf spot", "Downy mildew"],
    tips: [
      "Soak seeds overnight to improve germination",
      "Harvest outer leaves first"
    ]
  },
  chives: {
    name: "Chives",
    description: "A perennial herb with a mild onion flavor.",
    sowingTime: { outdoor: "March-May" },
    harvestTime: "90-120",
    spacing: "20-30cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.0",
    sunlight: "Full sun to partial shade",
    watering: "Keep soil moist",
    companions: ["Carrots", "Tomatoes", "Apples"],
    pests: ["Aphids", "Thrips"],
    diseases: ["Onion rust"],
    tips: [
      "Trim regularly to promote new growth",
      "Divide clumps every few years to rejuvenate plants"
    ]
  },
  cilantro: {
    name: "Cilantro",
    description: "An herb with a strong, fresh flavor, also known as coriander.",
    sowingTime: { outdoor: "March-May" },
    harvestTime: "45-60",
    spacing: "15-20cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.0",
    sunlight: "Full sun to partial shade",
    watering: "Keep soil consistently moist",
    companions: ["Anise", "Cabbage", "Potatoes"],
    pests: ["Aphids", "Cilantro worm"],
    diseases: ["Bacterial leaf spot", "Powdery mildew"],
    tips: [
      "Sow seeds every few weeks for a continuous harvest",
      "Bolt quickly in hot weather, so plant in cooler seasons"
    ]
  },
  spinach: {
    name: "Spinach",
    description: "A leafy green vegetable known for its iron content.",
    sowingTime: { outdoor: "March-May" },
    harvestTime: "30-50",
    spacing: "10-15cm apart",
    soil: "Rich, well-draining soil with pH 6.0-7.5",
    sunlight: "Partial shade to full sun",
    watering: "Keep soil consistently moist",
    companions: ["Strawberries", "Cabbage", "Radishes"],
    pests: ["Slugs", "Aphids"],
    diseases: ["Downy mildew", "Fusarium wilt"],
    tips: [
      "Harvest outer leaves to prolong the harvest",
      "Bolts quickly in warm weather"
    ]
  },
  bell_peppers: {
    name: "Bell Peppers",
    description: "A mild, sweet pepper available in a variety of colors.",
    sowingTime: { indoor: "February-April", outdoor: "May-June" },
    harvestTime: "60-90",
    spacing: "45-60cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-6.8",
    sunlight: "Full sun, 6-8 hours daily",
    watering: "Keep soil consistently moist",
    companions: ["Basil", "Carrots", "Geraniums"],
    pests: ["Aphids", "Flea beetles"],
    diseases: ["Bacterial spot", "Blossom end rot"],
    tips: [
      "Support plants with stakes",
      "Harvest when peppers are firm and reach desired color"
    ]
  },
  pumpkin: {
    name: "Pumpkin",
    description: "A large, orange squash, often grown for carving or baking.",
    sowingTime: { indoor: "April", outdoor: "May-June" },
    harvestTime: "90-120",
    spacing: "1-2m apart",
    soil: "Rich, well-draining soil with pH 6.0-6.8",
    sunlight: "Full sun",
    watering: "Regular, deep watering",
    companions: ["Corn", "Beans", "Marigolds"],
    pests: ["Squash vine borer", "Cucumber beetles"],
    diseases: ["Powdery mildew", "Fusarium wilt"],
    tips: [
      "Give vines plenty of room to spread",
      "Harvest when the rind is hard and the stem begins to dry"
    ]
  },
  zucchini: {
    name: "Zucchini",
    description: "A summer squash that is easy to grow and highly productive.",
    sowingTime: { indoor: "April", outdoor: "May-June" },
    harvestTime: "45-60",
    spacing: "60-90cm apart",
    soil: "Rich, well-draining soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Keep soil consistently moist",
    companions: ["Mint", "Radishes", "Corn"],
    pests: ["Squash vine borer", "Aphids"],
    diseases: ["Powdery mildew", "Cucumber mosaic virus"],
    tips: [
      "Harvest young and often to encourage more fruit",
      "Water at the base of the plant to prevent mildew"
    ]
  },
  watermelon: {
    name: "Watermelon",
    description: "A large, sweet fruit with a high water content.",
    sowingTime: { indoor: "April", outdoor: "May-June" },
    harvestTime: "80-100",
    spacing: "1.5-2m apart",
    soil: "Well-draining, sandy loam soil with pH 6.0-6.8",
    sunlight: "Full sun",
    watering: "Regular, deep watering, especially during fruiting",
    companions: ["Radishes", "Corn", "Marigolds"],
    pests: ["Cucumber beetles", "Aphids"],
    diseases: ["Fusarium wilt", "Anthracnose"],
    tips: [
      "Allow vines plenty of space to grow",
      "The underside of the fruit will turn a creamy yellow when ripe"
    ]
  },
  sunflowers: {
    name: "Sunflowers",
    description: "A tall, beautiful flower known for its large head and seeds.",
    sowingTime: { outdoor: "April-May" },
    harvestTime: "75-120",
    spacing: "30-45cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.5",
    sunlight: "Full sun",
    watering: "Water deeply, but infrequently",
    companions: ["Corn", "Squash", "Pole beans"],
    pests: ["Birds", "Slugs"],
    diseases: ["Rust", "Powdery mildew"],
    tips: [
      "Support tall varieties with stakes",
      "Protect from birds when seeds are ripening"
    ]
  },
  tulips: {
    name: "Tulips",
    description: "A beautiful, spring-blooming bulb flower.",
    sowingTime: { outdoor: "September-November" },
    harvestTime: "180-240",
    spacing: "10-15cm apart",
    soil: "Well-draining soil with pH 6.0-7.0",
    sunlight: "Full sun to partial shade",
    watering: "Water when planting, then sparingly until spring",
    companions: ["Daffodils", "Crocuses", "Hyacinths"],
    pests: ["Slugs", "Aphids"],
    diseases: ["Tulip fire", "Gray bulb rot"],
    tips: [
      "Plant bulbs at a depth of 15-20cm",
      "Remove spent flowers to encourage bulb health for next year"
    ]
  },
  daffodils: {
    name: "Daffodils",
    description: "A hardy, perennial bulb flower that blooms in early spring.",
    sowingTime: { outdoor: "September-November" },
    harvestTime: "180-240",
    spacing: "10-15cm apart",
    soil: "Well-draining soil with pH 6.0-7.0",
    sunlight: "Full sun to partial shade",
    watering: "Water well after planting, then sparingly",
    companions: ["Tulips", "Crocuses", "Hyacinths"],
    pests: ["Narcissus bulb fly", "Slugs"],
    diseases: ["Basal rot", "Fusarium rot"],
    tips: [
      "Plant bulbs at a depth of 15-20cm",
      "Do not cut back foliage until it has yellowed and died naturally"
    ]
  },
  crocuses: {
    name: "Crocuses",
    description: "A small, early-blooming bulb flower, often one of the first signs of spring.",
    sowingTime: { outdoor: "September-November" },
    harvestTime: "180-240",
    spacing: "5-10cm apart",
    soil: "Well-draining soil with pH 6.0-7.0",
    sunlight: "Full sun to partial shade",
    watering: "Water well after planting, then sparingly",
    companions: ["Daffodils", "Tulips", "Hyacinths"],
    pests: ["Squirrels", "Mice"],
    diseases: ["Crocus virus", "Fungal rot"],
    tips: [
      "Plant corms at a depth of 5-8cm",
      "Naturalize in lawns for a beautiful spring display"
    ]
  },
  hyacinths: {
    name: "Hyacinths",
    description: "A highly fragrant bulb flower with dense clusters of florets.",
    sowingTime: { outdoor: "September-November" },
    harvestTime: "180-240",
    spacing: "10-15cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.0",
    sunlight: "Full sun to partial shade",
    watering: "Keep soil moist, but not waterlogged",
    companions: ["Daffodils", "Tulips", "Crocuses"],
    pests: ["Slugs", "Bulb mites"],
    diseases: ["Yellows disease", "Botrytis rot"],
    tips: [
      "Plant bulbs at a depth of 10-15cm",
      "Plant near a walkway or window to enjoy the fragrance"
    ]
  },
  peas: {
    name: "Peas",
    description: "A legume with edible seeds, great for cool-season planting.",
    sowingTime: { outdoor: "February-May" },
    harvestTime: "60-70",
    spacing: "5-10cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.5",
    sunlight: "Full sun",
    watering: "Keep soil consistently moist",
    companions: ["Carrots", "Turnips", "Mint"],
    pests: ["Aphids", "Pea weevils"],
    diseases: ["Powdery mildew", "Fusarium wilt"],
    tips: [
      "Provide a trellis or support for climbing varieties",
      "Harvest regularly to encourage more pods"
    ]
  },
  beans: {
    name: "Beans",
    description: "A versatile legume, available in bush and pole varieties.",
    sowingTime: { outdoor: "April-July" },
    harvestTime: "50-60",
    spacing: "10-15cm apart",
    soil: "Well-draining, fertile soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Regular, consistent watering",
    companions: ["Corn", "Zucchini", "Cucumbers"],
    pests: ["Bean beetles", "Aphids"],
    diseases: ["Rust", "Powdery mildew"],
    tips: [
      "Avoid watering the leaves to prevent disease",
      "Harvest pods when they are young and tender"
    ]
  },
  corn: {
    name: "Corn",
    description: "A tall cereal crop with sweet, edible kernels.",
    sowingTime: { outdoor: "May-June" },
    harvestTime: "60-100",
    spacing: "30-45cm apart",
    soil: "Rich, well-draining soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Requires regular, deep watering, especially during pollination",
    companions: ["Beans", "Pumpkin", "Squash"],
    pests: ["Corn earworm", "Aphids"],
    diseases: ["Rust", "Smut"],
    tips: [
      "Plant in a block or grid for better pollination",
      "Harvest when the silks are brown and dry"
    ]
  },
  cabbage: {
    name: "Cabbage",
    description: "A leafy vegetable with a dense head, a member of the brassica family.",
    sowingTime: { indoor: "February-March", outdoor: "April-June" },
    harvestTime: "60-100",
    spacing: "45-60cm apart",
    soil: "Rich, well-draining soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Keep soil consistently moist",
    companions: ["Dill", "Mint", "Sage"],
    pests: ["Cabbage worms", "Slugs"],
    diseases: ["Clubroot", "Black rot"],
    tips: [
      "Harvest when the head is firm and solid",
      "Rotate crops to prevent disease buildup"
    ]
  },
  cauliflower: {
    name: "Cauliflower",
    description: "A cool-season vegetable with a large, white head of florets.",
    sowingTime: { indoor: "February-April", outdoor: "March-June" },
    harvestTime: "75-120",
    spacing: "45-60cm apart",
    soil: "Rich, well-draining soil with pH 6.0-7.0",
    sunlight: "Full sun",
    watering: "Keep soil consistently moist",
    companions: ["Celery", "Dill", "Thyme"],
    pests: ["Cabbage worms", "Aphids"],
    diseases: ["Clubroot", "Downy mildew"],
    tips: [
      "Tie the outer leaves over the head to keep it white (blanching)",
      "Harvest when the head is firm and compact"
    ]
  }
};

// Helper function to get planting times for a specific country
export function getPlantingTimesForCountry(countryCode: string, cropKey: string): { indoor?: string; outdoor: string } {
  const zone = countryZones[countryCode.toLowerCase()];
  if (!zone || !zonePlantingTimes[zone] || !zonePlantingTimes[zone][cropKey]) {
    return crops[cropKey].sowingTime; // Fallback to default times
  }
  return zonePlantingTimes[zone][cropKey];
}