export interface Event {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string;
  country: string;
  price: number;
  ticket_url?: string;
  image_url?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username?: string;
    avatar_url?: string;
    full_name?: string;
  };
}