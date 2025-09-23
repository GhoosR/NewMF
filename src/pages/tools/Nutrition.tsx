import React, { useState } from 'react';
import { Search, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Meta } from '../../components/Meta';

interface NutrientInfo {
  name: string;
  type: 'vitamin' | 'mineral';
  benefits: string[];
  deficiency: string[];
  toxicity: string[];
  sources: string[];
  rda?: string;
  absorption: string[];
  notes?: string;
}

const nutrients: NutrientInfo[] = [
  {
    "name": "Vitamin A",
    "type": "vitamin",
    "benefits": [
      "Essential for vision",
      "Supports immune system",
      "Maintains healthy skin",
      "Promotes cell growth"
    ],
    "deficiency": [
      "Night blindness",
      "Dry eyes",
      "Weakened immune system",
      "Poor skin health"
    ],
    "toxicity": [
      "Nausea",
      "Blurred vision",
      "Bone pain",
      "Skin irritation"
    ],
    "sources": [
      "Sweet potatoes",
      "Carrots",
      "Spinach",
      "Eggs",
      "Liver"
    ],
    "absorption": [
      "Consume with healthy fats (oils, nuts, avocado)",
      "Pair with vitamin D-rich foods",
      "Cook orange/yellow vegetables to enhance absorption",
      "Avoid excessive alcohol which impairs absorption"
    ],
    "rda": "900 mcg (men), 700 mcg (women)"
  },
  {
    "name": "Vitamin B1 (Thiamine)",
    "type": "vitamin",
    "benefits": [
      "Converts food into energy",
      "Supports nerve function",
      "Promotes heart health"
    ],
    "deficiency": [
      "Fatigue",
      "Muscle weakness",
      "Nerve damage",
      "Beriberi"
    ],
    "toxicity": [
      "Headaches",
      "Insomnia",
      "Allergic reactions"
    ],
    "sources": [
      "Whole grains",
      "Pork",
      "Beans",
      "Nuts",
      "Seeds"
    ],
    "absorption": [
      "Consume with other B vitamins",
      "Avoid excessive alcohol"
    ],
    "rda": "1.2 mg (men), 1.1 mg (women)"
  },
  {
    "name": "Vitamin B2 (Riboflavin)",
    "type": "vitamin",
    "benefits": [
      "Energy production",
      "Skin health",
      "Antioxidant protection"
    ],
    "deficiency": [
      "Cracked lips",
      "Sore throat",
      "Skin disorders",
      "Anemia"
    ],
    "toxicity": [
      "Itching",
      "Numbness"
    ],
    "sources": [
      "Dairy products",
      "Eggs",
      "Lean meats",
      "Green leafy vegetables"
    ],
    "absorption": [
      "Consume with other B vitamins",
      "Avoid exposure to light (destroys riboflavin)"
    ],
    "rda": "1.3 mg (men), 1.1 mg (women)"
  },
  {
    "name": "Vitamin B3 (Niacin)",
    "type": "vitamin",
    "benefits": [
      "Supports digestion",
      "Skin health",
      "Nervous system function"
    ],
    "deficiency": [
      "Pellagra (diarrhea, dermatitis, dementia)",
      "Fatigue",
      "Depression"
    ],
    "toxicity": [
      "Flushing",
      "Liver damage",
      "High blood sugar"
    ],
    "sources": [
      "Chicken",
      "Tuna",
      "Peanuts",
      "Whole grains",
      "Mushrooms"
    ],
    "absorption": [
      "Take with food to reduce flushing",
      "Avoid excessive alcohol"
    ],
    "rda": "16 mg (men), 14 mg (women)"
  },
  {
    "name": "Vitamin B5 (Pantothenic Acid)",
    "type": "vitamin",
    "benefits": [
      "Energy production",
      "Hormone synthesis",
      "Skin health"
    ],
    "deficiency": [
      "Fatigue",
      "Insomnia",
      "Numbness",
      "Digestive issues"
    ],
    "toxicity": [
      "Diarrhea"
    ],
    "sources": [
      "Meat",
      "Whole grains",
      "Avocados",
      "Broccoli",
      "Mushrooms"
    ],
    "absorption": [
      "Consume with other B vitamins",
      "Avoid overcooking foods"
    ],
    "rda": "5 mg (adults)"
  },
  {
    "name": "Vitamin B6 (Pyridoxine)",
    "type": "vitamin",
    "benefits": [
      "Brain development",
      "Immune function",
      "Hemoglobin production"
    ],
    "deficiency": [
      "Anemia",
      "Depression",
      "Weakened immune system",
      "Skin rashes"
    ],
    "toxicity": [
      "Nerve damage",
      "Numbness",
      "Difficulty walking"
    ],
    "sources": [
      "Chickpeas",
      "Salmon",
      "Potatoes",
      "Bananas",
      "Poultry"
    ],
    "absorption": [
      "Consume with magnesium",
      "Avoid excessive supplementation"
    ],
    "rda": "1.3–1.7 mg (adults)"
  },
  {
    "name": "Vitamin B7 (Biotin)",
    "type": "vitamin",
    "benefits": [
      "Hair, skin, and nail health",
      "Metabolism support"
    ],
    "deficiency": [
      "Hair loss",
      "Skin rashes",
      "Brittle nails",
      "Fatigue"
    ],
    "toxicity": [
      "Acne",
      "Allergic reactions"
    ],
    "sources": [
      "Eggs",
      "Almonds",
      "Sweet potatoes",
      "Spinach",
      "Salmon"
    ],
    "absorption": [
      "Consume with other B vitamins",
      "Avoid raw egg whites (inhibit absorption)"
    ],
    "rda": "30 mcg (adults)"
  },
  {
    "name": "Vitamin B9 (Folate/Folic Acid)",
    "type": "vitamin",
    "benefits": [
      "DNA synthesis",
      "Red blood cell formation",
      "Fetal development"
    ],
    "deficiency": [
      "Anemia",
      "Birth defects",
      "Fatigue",
      "Poor growth"
    ],
    "toxicity": [
      "May mask vitamin B12 deficiency",
      "Nausea"
    ],
    "sources": [
      "Leafy greens",
      "Legumes",
      "Citrus fruits",
      "Fortified grains"
    ],
    "absorption": [
      "Consume with vitamin B12",
      "Avoid excessive alcohol"
    ],
    "rda": "400 mcg (adults), 600 mcg (pregnant women)"
  },
  {
    "name": "Vitamin B12 (Cobalamin)",
    "type": "vitamin",
    "benefits": [
      "Nerve function",
      "Red blood cell production",
      "DNA synthesis"
    ],
    "deficiency": [
      "Anemia",
      "Fatigue",
      "Nerve damage",
      "Memory loss"
    ],
    "toxicity": [
      "Acne",
      "Allergic reactions"
    ],
    "sources": [
      "Meat",
      "Fish",
      "Dairy",
      "Eggs",
      "Fortified cereals"
    ],
    "absorption": [
      "Consume with folate",
      "Avoid antacids (reduce absorption)"
    ],
    "rda": "2.4 mcg (adults)"
  },
  {
    "name": "Vitamin C",
    "type": "vitamin",
    "benefits": [
      "Antioxidant protection",
      "Collagen production",
      "Immune system support",
      "Iron absorption"
    ],
    "deficiency": [
      "Weakened immune system",
      "Slow wound healing",
      "Bleeding gums",
      "Fatigue"
    ],
    "toxicity": [
      "Diarrhea",
      "Nausea",
      "Abdominal cramps",
      "Kidney stones"
    ],
    "sources": [
      "Citrus fruits",
      "Bell peppers",
      "Strawberries",
      "Broccoli",
      "Kiwi"
    ],
    "absorption": [
      "Consume raw or minimally cooked foods",
      "Take on an empty stomach",
      "Avoid consuming with caffeine",
      "Space out doses throughout the day"
    ],
    "rda": "90 mg (men), 75 mg (women)"
  },
  {
    "name": "Vitamin D",
    "type": "vitamin",
    "benefits": [
      "Bone health",
      "Immune function",
      "Calcium absorption"
    ],
    "deficiency": [
      "Weak bones",
      "Rickets",
      "Fatigue",
      "Depression"
    ],
    "toxicity": [
      "Hypercalcemia (high calcium levels)",
      "Kidney damage"
    ],
    "sources": [
      "Sunlight",
      "Fatty fish",
      "Fortified milk",
      "Egg yolks"
    ],
    "absorption": [
      "Consume with healthy fats",
      "Get sunlight exposure"
    ],
    "rda": "600–800 IU (adults)"
  },
  {
    "name": "Vitamin E",
    "type": "vitamin",
    "benefits": [
      "Antioxidant protection",
      "Skin health",
      "Immune support"
    ],
    "deficiency": [
      "Nerve damage",
      "Muscle weakness",
      "Vision problems"
    ],
    "toxicity": [
      "Bleeding",
      "Nausea",
      "Diarrhea"
    ],
    "sources": [
      "Nuts",
      "Seeds",
      "Spinach",
      "Vegetable oils",
      "Avocados"
    ],
    "absorption": [
      "Consume with healthy fats",
      "Avoid high doses"
    ],
    "rda": "15 mg (adults)"
  },
  {
    "name": "Vitamin K",
    "type": "vitamin",
    "benefits": [
      "Blood clotting",
      "Bone health",
      "Heart health"
    ],
    "deficiency": [
      "Excessive bleeding",
      "Weak bones",
      "Bruising"
    ],
    "toxicity": [
      "May interfere with blood thinners"
    ],
    "sources": [
      "Leafy greens",
      "Broccoli",
      "Brussels sprouts",
      "Fish",
      "Meat"
    ],
    "absorption": [
      "Consume with healthy fats",
      "Avoid excessive vitamin A"
    ],
    "rda": "120 mcg (men), 90 mcg (women)"
  },
  {
    "name": "Calcium",
    "type": "mineral",
    "benefits": [
      "Bone health",
      "Muscle function",
      "Nerve signaling"
    ],
    "deficiency": [
      "Weak bones",
      "Osteoporosis",
      "Muscle cramps"
    ],
    "toxicity": [
      "Kidney stones",
      "Constipation",
      "Impaired iron absorption"
    ],
    "sources": [
      "Dairy products",
      "Leafy greens",
      "Fortified plant-based milk",
      "Almonds"
    ],
    "absorption": [
      "Consume with vitamin D",
      "Avoid excessive phosphorus"
    ],
    "rda": "1000–1200 mg (adults)"
  },
  {
    "name": "Iron",
    "type": "mineral",
    "benefits": [
      "Oxygen transport",
      "Energy production",
      "Immune function"
    ],
    "deficiency": [
      "Fatigue",
      "Weakness",
      "Pale skin",
      "Shortness of breath"
    ],
    "toxicity": [
      "Stomach pain",
      "Constipation",
      "Organ damage"
    ],
    "sources": [
      "Red meat",
      "Spinach",
      "Lentils",
      "Oysters",
      "Quinoa"
    ],
    "absorption": [
      "Pair with vitamin C-rich foods",
      "Avoid coffee/tea within 1 hour of iron-rich meals",
      "Cook in cast iron cookware",
      "Take on an empty stomach if supplementing"
    ],
    "rda": "8 mg (men), 18 mg (women)"
  },
  {
    "name": "Magnesium",
    "type": "mineral",
    "benefits": [
      "Muscle function",
      "Nerve function",
      "Bone health",
      "Energy production"
    ],
    "deficiency": [
      "Muscle cramps",
      "Fatigue",
      "Anxiety",
      "Irregular heartbeat"
    ],
    "toxicity": [
      "Diarrhea",
      "Nausea",
      "Low blood pressure"
    ],
    "sources": [
      "Almonds",
      "Spinach",
      "Black beans",
      "Avocado",
      "Dark chocolate"
    ],
    "absorption": [
      "Take with vitamin D and B6",
      "Consume with healthy fats",
      "Avoid with high-calcium foods",
      "Best absorbed in smaller doses throughout the day"
    ],
    "rda": "400–420 mg (men), 310–320 mg (women)"
  },
  {
    "name": "Zinc",
    "type": "mineral",
    "benefits": [
      "Immune function",
      "Wound healing",
      "DNA synthesis"
    ],
    "deficiency": [
      "Weak immune system",
      "Hair loss",
      "Slow wound healing"
    ],
    "toxicity": [
      "Nausea",
      "Vomiting",
      "Weakened immune function"
    ],
    "sources": [
      "Meat",
      "Shellfish",
      "Legumes",
      "Seeds",
      "Nuts"
    ],
    "absorption": [
      "Consume with protein",
      "Avoid high doses"
    ],
    "rda": "11 mg (men), 8 mg (women)"
  },
  {
    "name": "Potassium",
    "type": "mineral",
    "benefits": [
      "Muscle function",
      "Nerve signaling",
      "Blood pressure regulation"
    ],
    "deficiency": [
      "Muscle weakness",
      "Cramps",
      "Irregular heartbeat"
    ],
    "toxicity": [
      "Heart arrhythmias",
      "Muscle weakness"
    ],
    "sources": [
      "Bananas",
      "Potatoes",
      "Spinach",
      "Avocados",
      "Beans"
    ],
    "absorption": [
      "Consume with magnesium",
      "Avoid excessive sodium"
    ],
    "rda": "3400 mg (men), 2600 mg (women)"
  },
  {
    "name": "Sodium",
    "type": "mineral",
    "benefits": [
      "Fluid balance",
      "Nerve signaling",
      "Muscle function"
    ],
    "deficiency": [
      "Hyponatremia (low sodium)",
      "Headaches",
      "Fatigue"
    ],
    "toxicity": [
      "High blood pressure",
      "Heart disease",
      "Kidney damage"
    ],
    "sources": [
      "Table salt",
      "Processed foods",
      "Canned soups"
    ],
    "absorption": [
      "Balance with potassium",
      "Avoid excessive intake"
    ],
    "rda": "<2300 mg (adults)"
  },
  {
    "name": "Phosphorus",
    "type": "mineral",
    "benefits": [
      "Bone health",
      "Energy production",
      "DNA synthesis"
    ],
    "deficiency": [
      "Weak bones",
      "Fatigue",
      "Loss of appetite"
    ],
    "toxicity": [
      "Kidney damage",
      "Calcium imbalance"
    ],
    "sources": [
      "Dairy products",
      "Meat",
      "Fish",
      "Nuts",
      "Seeds"
    ],
    "absorption": [
      "Consume with calcium",
      "Avoid excessive intake"
    ],
    "rda": "700 mg (adults)"
  },
  {
    "name": "Selenium",
    "type": "mineral",
    "benefits": [
      "Antioxidant protection",
      "Thyroid function",
      "Immune support"
    ],
    "deficiency": [
      "Weak immune system",
      "Hair loss",
      "Fatigue"
    ],
    "toxicity": [
      "Hair loss",
      "Nausea",
      "Nerve damage"
    ],
    "sources": [
      "Brazil nuts",
      "Seafood",
      "Meat",
      "Eggs",
      "Whole grains"
    ],
    "absorption": [
      "Consume with vitamin E",
      "Avoid high doses"
    ],
    "rda": "55 mcg (adults)"
  },
  {
    "name": "Iodine",
    "type": "mineral",
    "benefits": [
      "Thyroid function",
      "Metabolism regulation"
    ],
    "deficiency": [
      "Goiter",
      "Hypothyroidism",
      "Fatigue"
    ],
    "toxicity": [
      "Thyroid dysfunction",
      "Nausea",
      "Vomiting"
    ],
    "sources": [
      "Iodized salt",
      "Seafood",
      "Dairy products",
      "Seaweed"
    ],
    "absorption": [
      "Consume with selenium",
      "Avoid excessive intake"
    ],
    "rda": "150 mcg (adults)"
  },
  {
    "name": "Copper",
    "type": "mineral",
    "benefits": [
      "Iron metabolism",
      "Nerve function",
      "Antioxidant protection"
    ],
    "deficiency": [
      "Anemia",
      "Weak bones",
      "Fatigue"
    ],
    "toxicity": [
      "Nausea",
      "Liver damage",
      "Neurological issues"
    ],
    "sources": [
      "Shellfish",
      "Nuts",
      "Seeds",
      "Whole grains",
      "Dark chocolate"
    ],
    "absorption": [
      "Consume with zinc",
      "Avoid excessive supplementation"
    ],
    "rda": "900 mcg (adults)"
  },
  {
    "name": "Manganese",
    "type": "mineral",
    "benefits": [
      "Bone health",
      "Metabolism",
      "Antioxidant protection"
    ],
    "deficiency": [
      "Weak bones",
      "Poor growth",
      "Skin rashes"
    ],
    "toxicity": [
      "Neurological issues",
      "Muscle pain"
    ],
    "sources": [
      "Nuts",
      "Whole grains",
      "Leafy greens",
      "Tea"
    ],
    "absorption": [
      "Consume with iron",
      "Avoid high doses"
    ],
    "rda": "2.3 mg (men), 1.8 mg (women)"
  },
  {
    "name": "Chromium",
    "type": "mineral",
    "benefits": [
      "Blood sugar regulation",
      "Metabolism support"
    ],
    "deficiency": [
      "Impaired glucose tolerance",
      "Fatigue"
    ],
    "toxicity": [
      "Stomach issues"
    ],
    "sources": [
      "Broccoli",
      "Whole grains",
      "Nuts",
      "Meat"
    ],
    "absorption": [
      "Consume with vitamin C",
      "Avoid refined sugars"
    ],
    "rda": "35 mcg (men), 25 mcg (women)"
  },
  {
    "name": "Fluoride",
    "type": "mineral",
    "benefits": [
      "Dental health",
      "Bone strength"
    ],
    "deficiency": [
      "Tooth decay",
      "Weak bones"
    ],
    "toxicity": [
      "Dental fluorosis",
      "Bone fractures"
    ],
    "sources": [
      "Fluoridated water",
      "Tea",
      "Seafood"
    ],
    "absorption": [
      "Consume with calcium",
      "Avoid excessive intake"
    ],
    "rda": "3–4 mg (adults)"
  }
];

export function Nutrition() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'vitamin' | 'mineral'>('all');

  const filteredNutrients = nutrients.filter(nutrient => {
    const matchesSearch = nutrient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || nutrient.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Meta 
        title="Nutrition Information | Mindful Family"
        description="Comprehensive guide to vitamins and minerals, their benefits, and food sources."
      />

      <h1 className="text-2xl font-bold text-content mb-2">Nutrition Information</h1>
      <p className="text-content/60 mb-8">
        Comprehensive guide to vitamins and minerals, their benefits, and food sources.
      </p>

      {/* Warning Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Medical Disclaimer</p>
            <p>
              🚨 The information provided should not be used for diagnosing or treating a health problem or disease, and those seeking personal medical advice should consult with a licensed physician or Nutritionist.
            </p>
            <Link 
              to="/practitioners?category=Nutrition"
              className="mt-2 inline-flex items-center text-accent-text hover:text-accent-text/80 font-medium"
            >
              Find a Verified Nutritionist
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search nutrients..."
            className="w-full pl-10 pr-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg ${
              selectedType === 'all'
                ? 'bg-accent-text text-white'
                : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedType('vitamin')}
            className={`px-4 py-2 rounded-lg ${
              selectedType === 'vitamin'
                ? 'bg-accent-text text-white'
                : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
            }`}
          >
            Vitamins
          </button>
          <button
            onClick={() => setSelectedType('mineral')}
            className={`px-4 py-2 rounded-lg ${
              selectedType === 'mineral'
                ? 'bg-accent-text text-white'
                : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
            }`}
          >
            Minerals
          </button>
        </div>
      </div>

      {/* Nutrients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredNutrients.map((nutrient) => (
          <div
            key={nutrient.name}
            className="bg-white rounded-lg shadow-sm border border-accent-text/10 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-content">{nutrient.name}</h2>
                <span className="px-3 py-1 text-sm font-medium bg-accent-base/20 text-accent-text rounded-full capitalize">
                  {nutrient.type}
                </span>
              </div>

              {nutrient.rda && (
                <div className="mb-4 text-sm">
                  <span className="font-medium text-content">Recommended Daily Allowance: </span>
                  <span className="text-content/80">{nutrient.rda}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-content mb-2">Functions and Benefits</h3>
                  <ul className="list-disc list-inside text-sm text-content/80 space-y-1">
                    {nutrient.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-content mb-2">Signs of Deficiency</h3>
                  <ul className="list-disc list-inside text-sm text-content/80 space-y-1">
                    {nutrient.deficiency.map((sign, index) => (
                      <li key={index}>{sign}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-content mb-2">Signs of Toxicity</h3>
                  <ul className="list-disc list-inside text-sm text-content/80 space-y-1">
                    {nutrient.toxicity.map((sign, index) => (
                      <li key={index}>{sign}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-content mb-2">Optimal Absorption</h3>
                  <ul className="list-disc list-inside text-sm text-content/80 space-y-1">
                    {nutrient.absorption.map((method, index) => (
                      <li key={index}>{method}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-content mb-2">Food Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {nutrient.sources.map((source, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-accent-base/20 text-accent-text rounded-full"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>

                {nutrient.notes && (
                  <div className="text-sm text-content/60 italic">
                    Note: {nutrient.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}