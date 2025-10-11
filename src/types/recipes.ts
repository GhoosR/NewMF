export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine_type: string;
  dietary_preferences: string[];
  image_url?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user?: {
    username?: string;
    avatar_url?: string;
  };
}

export interface RecipeFormData {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time: string;
  cook_time: string;
  servings: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine_type: string;
  dietary_preferences: string[];
  image?: File;
}