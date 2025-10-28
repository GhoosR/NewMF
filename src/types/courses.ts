import type { User } from './users';

export interface Course {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  language: string;
  price: number;
  currency: string;
  thumbnail_url?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user?: User;
  lessons?: {
    id: string;
    title: string;
    description: string;
    duration: number;
    order_number: number;
  }[];
  _count?: {
    lessons: number;
  };
}