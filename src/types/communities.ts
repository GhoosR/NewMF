export interface Community {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  owner_id: string;
  avatar_url?: string;
  banner_url?: string;
  created_at: string;
  updated_at: string;
  _count?: {
    members: number;
  };
  owner?: {
    id: string;
    username?: string;
    avatar_url?: string;
    verified?: boolean;
    verified?: boolean;
  };
}

export interface CommentType {
  id: string;
  post_id: string;
  parent_id?: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    username?: string;
    avatar_url?: string;
    verified?: boolean;
  };
  replies: CommentType[];
}

export interface CommunityPost {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  user?: {
    username?: string;
    avatar_url?: string;
    verified?: boolean;
  };
  community?: {
    id: string;
    name: string;
    type: 'public' | 'private';
  };
  _count?: {
    comments: number;
  };
  community_post_comments?: Array<{ count: number }>;
}

export type CommunityPost as CommunityPostType = CommunityPost;