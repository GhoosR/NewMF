export interface TimelinePost {
  id: string;
  user_id: string;
  content: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  user?: {
    username?: string;
    avatar_url?: string;
  };
  _count?: {
    comments: number;
  };
}

export interface TimelineComment {
  id: string;
  post_id: string;
  parent_id?: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    username?: string;
    avatar_url?: string;
  };
  replies?: TimelineComment[];
}