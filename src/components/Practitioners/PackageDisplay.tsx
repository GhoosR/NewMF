import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PractitionerPackage } from '../../types/practitioners';

interface PackageDisplayProps {
  packages: PractitionerPackage[];
  practitionerUserId: string;
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£'
  };
  return symbols[currency] || currency;
}

export function PackageDisplay({ packages, practitionerUserId }: PackageDisplayProps) {
  if (!packages?.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-content mb-6">Service Packages</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-background rounded-lg border border-accent-text/10 p-6 flex flex-col"
          >
            <div className="flex-1">
              <h3 className="text-lg font-medium text-content mb-2">{pkg.name}</h3>
              <p className="text-content/80 mb-4">{pkg.description}</p>
              <div className="text-2xl font-bold text-content mb-6">
                {getCurrencySymbol(pkg.currency)}{pkg.price}
              </div>
              <ul className="space-y-3">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-accent-text mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-content/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to={`/chat/${practitionerUserId}?message=Hi, I'm interested in your "${pkg.name}" package. Could you tell me more about it?`}
              className="mt-6 w-full px-6 py-3 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 transition-colors text-center"
            >
              Get Started
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
