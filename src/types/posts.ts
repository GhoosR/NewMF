export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostStats {
  likes: number;
  liked_by_user: boolean;
}