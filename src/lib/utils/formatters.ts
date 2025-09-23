import { workArrangements } from '../constants';
import { europeanCountries } from '../constants/countries';
import { languages } from '../constants/languages';

export function formatPrice(price: number | string, currency: string = 'EUR'): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  const symbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£'
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${numericPrice.toFixed(2)}`;
}

export function formatCategoryName(category: string): string {
  return category.replace(/_/g, ' ');
}

export function formatWorkArrangement(arrangement: string): string {
  const found = workArrangements.find(a => a.value === arrangement);
  return found ? found.label : arrangement.replace(/_/g, ' ');
}

export function getFullCountryName(countryCode: string): string {
  const country = europeanCountries.find(c => c.value === countryCode);
  return country ? country.label : countryCode;
}

export function getFullLanguages(languageString: string): string {
  return languageString.split(',')
    .map(lang => {
      const language = languages.find(l => l.value === lang.trim());
      return language ? language.label : lang.trim();
    })
    .join(', ');
}