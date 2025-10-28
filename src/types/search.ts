export interface SearchResult {
  id: string;
  title: string;
  slug?: string;
  description: string | null;
  type: 'practitioner' | 'event' | 'venue' | 'course' | 'recipe' | 'user';
  username?: string;
  avatar_url?: string;
  country?: string | null;
  created_at: string;
}