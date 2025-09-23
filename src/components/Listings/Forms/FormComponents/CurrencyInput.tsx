import React from 'react';

interface CurrencyInputProps {
  label: string;
  amount: string;
  currency: string;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  required?: boolean;
}

const currencies = [
  { value: 'EUR', label: '€ (EUR)' },
  { value: 'GBP', label: '£ (GBP)' },
  { value: 'USD', label: '$ (USD)' },
  { value: 'CHF', label: 'CHF' }
];

export function CurrencyInput({
  label,
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  required
}: CurrencyInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-content">
        {label} {required && '*'}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="block w-full rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20 bg-background pr-20"
          placeholder="0.00"
          required={required}
        />
        <div className="absolute inset-y-0 right-0">
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-content/60 sm:text-sm rounded-md focus:ring-accent-text focus:border-accent-text"
          >
            {currencies.map((curr) => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}