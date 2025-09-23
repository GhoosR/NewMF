import React, { useState } from 'react';
import { Apple, Carrot, Trees as Tree, Leaf, Sun, Droplets, Ruler, Heart, AlertTriangle, Sprout, Flower2, XCircle, LogIn, CheckCircle, Clock, Info } from 'lucide-react';
import { getPlantingTimesForCountry, crops } from '../../lib/constants/crops';

interface PlantInformationProps {
  country: string;
}

interface CategoryTab {
  id: 'fruits' | 'vegetables' | 'trees' | 'herbs' | 'flowers';
  label: string;
  icon: React.ComponentType<any>;
}

const TABS: CategoryTab[] = [
  { id: 'fruits', label: 'Fruits', icon: Apple },
  { id: 'vegetables', label: 'Vegetables', icon: Carrot },
  { id: 'trees', label: 'Trees', icon: Tree },
  { id: 'herbs', label: 'Herbs', icon: Leaf },
  { id: 'flowers', label: 'Flowers', icon: Flower2 }
];

const CATEGORIES = {
  fruits: ['strawberries', 'blueberries', 'grapes', 'watermelon'],
  vegetables: ['tomatoes', 'carrots', 'potatoes', 'lettuce', 'cucumbers', 'kale', 'broccoli', 'garlic', 'onions', 'spinach', 'bell_peppers', 'pumpkin', 'zucchini', 'peas', 'beans', 'corn', 'cabbage', 'cauliflower'],
  trees: ['apples', 'peaches', 'pears', 'cherries', 'walnuts', 'olives', 'oranges', 'lemons'],
  herbs: ['basil', 'rosemary', 'mint', 'lavender', 'thyme', 'oregano', 'parsley', 'chives', 'cilantro'],
  flowers: ['sunflowers', 'tulips', 'daffodils', 'crocuses', 'hyacinths']
};

function PlantInformation({ country }: PlantInformationProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab['id']>('fruits');
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  const handleCropClick = (cropName: string) => {
    setSelectedCrop(cropName === selectedCrop ? null : cropName);
  };

  const renderCropInfo = (cropName: string) => {
    const crop = crops[cropName];
    if (!crop) return null;

    const plantingTimes = getPlantingTimesForCountry(country, cropName);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-accent-text/10 p-4 sm:p-6 mt-6">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="p-3 bg-accent-base/10 rounded-full flex-shrink-0">
            {activeTab === 'fruits' && <Apple className="h-6 w-6 text-accent-text" />}
            {activeTab === 'vegetables' && <Carrot className="h-6 w-6 text-accent-text" />}
            {activeTab === 'trees' && <Tree className="h-6 w-6 text-accent-text" />}
            {activeTab === 'herbs' && <Leaf className="h-6 w-6 text-accent-text" />}
          </div>
          <h3 className="text-xl font-semibold text-content break-words min-w-[100px]">
            {crop.name}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="bg-accent-base/5 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-content mb-2 flex items-center flex-wrap">
                <Info className="h-4 w-4 mr-2 text-accent-text flex-shrink-0" />
                Description
              </h4>
              <p className="text-content/80">{crop.description}</p>
            </div>

            <div className="bg-accent-base/5 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-content mb-2 flex items-center flex-wrap">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                Plant Health
              </h4>
              <div className="space-y-2">
                <div className="flex items-start text-content/80">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                  <span>
                    {crop.name} is generally healthy when:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Leaves are vibrant and firm</li>
                      <li>Growth is consistent</li>
                      <li>No discoloration or spots</li>
                    </ul>
                  </span>
                </div>
                <div className="flex items-start text-content/80 mt-3">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                  <span>
                    Watch for signs of problems:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Wilting or yellowing leaves</li>
                      <li>Stunted growth</li>
                      <li>Pest infestations</li>
                    </ul>
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-accent-base/5 rounded-lg p-4">
              <h4 className="font-medium text-content mb-2 flex items-center flex-wrap">
                <Clock className="h-4 w-4 mr-2 text-accent-text flex-shrink-0" />
                Planting Time
              </h4>
              <div className="space-y-2">
                {plantingTimes.indoor && (
                  <div className="flex items-center text-content/80">
                    <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-2 flex-shrink-0" />
                    Indoor: {plantingTimes.indoor}
                  </div>
                )}
                <div className="flex items-center text-content/80">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-2 flex-shrink-0" />
                  Outdoor: {plantingTimes.outdoor}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-accent-base/5 rounded-lg p-4">
              <h4 className="font-medium text-content mb-3 flex items-center flex-wrap">
                <Sprout className="h-4 w-4 mr-2 text-accent-text flex-shrink-0" />
                Growing Conditions
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-start text-content/80">
                  <span className="w-8 flex-shrink-0">
                    <Leaf className="h-4 w-4 text-accent-text" />
                  </span>
                  Soil: {crop.soil}
                </div>
                <div className="flex items-start text-content/80">
                  <span className="w-8 flex-shrink-0">
                    <Sun className="h-4 w-4 text-accent-text" />
                  </span>
                  Sunlight: {crop.sunlight}
                </div>
                <div className="flex items-start text-content/80">
                  <span className="w-8 flex-shrink-0">
                    <Droplets className="h-4 w-4 text-accent-text" />
                  </span>
                  Watering: {crop.watering}
                </div>
                <div className="flex items-start text-content/80">
                  <span className="w-8 flex-shrink-0">
                    <Sprout className="h-4 w-4 text-accent-text" />
                  </span>
                  Fertilizing: {crop.fertilizing || 'Apply balanced fertilizer during growing season'}
                </div>
                <div className="flex items-start text-content/80">
                  <span className="w-8 flex-shrink-0">
                    <Ruler className="h-4 w-4 text-accent-text" />
                  </span>
                  Spacing: {crop.spacing}
                </div>
              </div>
            </div>

            {crop.companions && crop.companions.length > 0 && (
              <div className="bg-accent-base/5 rounded-lg p-4">
                <h4 className="font-medium text-content mb-3 flex items-center flex-wrap">
                  <Heart className="h-4 w-4 mr-2 text-accent-text flex-shrink-0" />
                  Companion Plants
                </h4>
                <div className="flex flex-wrap gap-2">
                  {crop.companions.map((companion, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 text-sm bg-white text-accent-text rounded-full shadow-sm border border-accent-text/10 break-words"
                    >
                      {companion}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {crop.tips && crop.tips.length > 0 && (
              <div className="bg-accent-base/5 rounded-lg p-4">
                <h4 className="font-medium text-content mb-3 flex items-center flex-wrap">
                  <AlertTriangle className="h-4 w-4 mr-2 text-accent-text flex-shrink-0" />
                  Growing Tips
                </h4>
                <ul className="space-y-2 text-content/80">
                  {crop.tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-accent-text rounded-full mt-2 mr-2 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mt-6">
      <h2 className="text-xl font-semibold text-content mb-6 break-words">Plant Information</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-accent-text text-white'
                  : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Plant Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {CATEGORIES[activeTab].map((cropName) => (
          <button
            key={cropName}
            onClick={() => handleCropClick(cropName)}
            className={`p-3 sm:p-4 rounded-lg text-left transition-colors relative overflow-hidden ${
              selectedCrop === cropName
                ? 'bg-accent-text text-white'
                : 'bg-accent-base/5 hover:bg-accent-base/10'
            }`}
          >
            <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-accent-base/10 rounded-full" />
            <h3 className="font-medium capitalize break-words">{cropName}</h3>
            <p className="text-sm mt-1 opacity-80 break-words">
              {crops[cropName]?.harvestTime ? `${crops[cropName].harvestTime} days` : 'Harvest varies'}
            </p>
          </button>
        ))}
      </div>

      {/* Selected Crop Information */}
      {selectedCrop && renderCropInfo(selectedCrop)}
    </div>
  );
}

export default PlantInformation;