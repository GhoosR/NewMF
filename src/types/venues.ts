export interface Venue {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  amenities: string[];
  capacity: number;
  price: number | null;
  price_period: 'hour' | 'day' | 'week';
  currency: string;
  images: string[];
  contact_email: string;
  contact_phone?: string;
  sleeping_places: string;
  bedrooms: string;
  bathrooms: string;
  kitchens: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username?: string;
    avatar_url?: string;
    full_name?: string;
  };
}