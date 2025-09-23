import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { RecipeCard } from './RecipeCard';
import type { Recipe } from '../../types/recipes';

interface RecipesListProps {
  userId: string;
}

export function RecipesList({ userId }: RecipesListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    async function fetchRecipes() {
      try {
        let query = supabase
          .from('recipes')
          .select(`
            *,
            user:users (
              username,
              avatar_url
            )
          `)
          .eq('user_id', userId);

        // If viewing someone else's profile, only show approved recipes
        if (currentUserId !== userId) {
          query = query.eq('approval_status', 'approved');
        }

        // For own profile, show all except rejected
        else {
          query = query.neq('approval_status', 'rejected');
        }

        const { data, error } = await query;
        if (error) throw error;
        setRecipes(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (userId && currentUserId !== undefined) {
      fetchRecipes();
    }
  }, [userId, currentUserId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">{error}</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.length === 0 ? (
        <p className="text-content/60 col-span-full text-center py-8">
          No recipes yet
        </p>
      ) : (
        recipes.map((recipe) => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe} 
            showStatus={currentUserId === userId}
          />
        ))
      )}
    </div>
  );
}