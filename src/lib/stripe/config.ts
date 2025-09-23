export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  plans: {
    monthly: {
      priceId: 'price_1R0RtjJscEBO2friHwUBGSEU', // Replace with your actual monthly price ID
      amount: 500, // £5.00 in cents
      currency: 'gbp',
      interval: 'month'
    },
    yearly: {
      priceId: 'price_1R0RukJscEBO2friyguPw3Q7', // Replace with your actual yearly price ID
      amount: 5000, // £50.00 in cents
      currency: 'gbp', 
      interval: 'year'
    }
  }
};

export const formatPrice = (amount: number, currency: string = 'eur'): string => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  }).format(amount / 100);
};