import React from 'react';
import { Plus, Minus, PackagePlus } from 'lucide-react';

interface Package {
  name: string;
  description: string;
  price: number;
  features: string[];
}

interface PackageInputProps {
  packages: Package[];
  onChange: (packages: Package[]) => void;
  currency: string;
}

export function PackageInput({ packages, onChange, currency }: PackageInputProps) {
  const handlePackageChange = (index: number, field: keyof Package, value: string | number | string[]) => {
    const newPackages = [...packages];
    newPackages[index] = {
      ...newPackages[index],
      [field]: value
    };
    onChange(newPackages);
  };

  const handleFeatureChange = (packageIndex: number, featureIndex: number, value: string) => {
    const newPackages = [...packages];
    const newFeatures = [...newPackages[packageIndex].features];
    newFeatures[featureIndex] = value;
    newPackages[packageIndex] = {
      ...newPackages[packageIndex],
      features: newFeatures
    };
    onChange(newPackages);
  };

  const addFeature = (packageIndex: number) => {
    const newPackages = [...packages];
    newPackages[packageIndex].features.push('');
    onChange(newPackages);
  };

  const removeFeature = (packageIndex: number, featureIndex: number) => {
    const newPackages = [...packages];
    newPackages[packageIndex].features.splice(featureIndex, 1);
    onChange(newPackages);
  };

  const addPackage = () => {
    const newPackage: Package = {
      name: '',
      description: '',
      price: 0,
      features: ['']
    };
    onChange([...packages, newPackage]);
  };

  const removePackage = (index: number) => {
    const newPackages = [...packages];
    newPackages.splice(index, 1);
    onChange(newPackages);
  };

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-accent-text/20 rounded-lg">
        <PackagePlus className="h-12 w-12 text-accent-text/50 mb-4" />
        <h3 className="text-lg font-medium text-content mb-2">No Packages Yet</h3>
        <p className="text-content/60 text-center mb-4">
          Create packages to offer different service tiers to your clients
        </p>
        <button
          type="button"
          onClick={addPackage}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg, packageIndex) => (
          <div
            key={packageIndex}
            className="bg-white rounded-lg border border-accent-text/10 p-6 space-y-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-content mb-2">
                  Package Name
                </label>
                <input
                  type="text"
                  value={pkg.name}
                  onChange={(e) => handlePackageChange(packageIndex, 'name', e.target.value)}
                  className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="e.g., Basic"
                />
              </div>
              <button
                type="button"
                onClick={() => removePackage(packageIndex)}
                className="ml-2 text-red-500 hover:text-red-600 p-1"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Description
              </label>
              <textarea
                value={pkg.description}
                onChange={(e) => handlePackageChange(packageIndex, 'description', e.target.value)}
                className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                rows={3}
                placeholder="Describe what's included in this package..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Price ({currency})
              </label>
              <input
                type="number"
                value={pkg.price}
                onChange={(e) => handlePackageChange(packageIndex, 'price', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-content">
                  Features
                </label>
                <button
                  type="button"
                  onClick={() => addFeature(packageIndex)}
                  className="text-accent-text hover:text-accent-text/80"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {pkg.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(packageIndex, featureIndex, e.target.value)}
                      className="flex-1 px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                      placeholder="e.g., 1 hour session"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(packageIndex, featureIndex)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {packages.length < 3 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={addPackage}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-base/10 rounded-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Package
          </button>
        </div>
      )}
    </div>
  );
}