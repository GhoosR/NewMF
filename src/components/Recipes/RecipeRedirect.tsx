import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function RecipeRedirect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    async function redirectToSlug() {
      if (!id) {
        navigate('/recipes');
        return;
      }

      try {
        // Try to find the recipe by ID and get its slug
        const { data: recipe, error } = await supabase
          .from('recipes')
          .select('slug')
          .eq('id', id)
          .single();

        if (error || !recipe) {
          // Recipe not found, redirect to recipes list
          navigate('/recipes');
          return;
        }

        // Redirect to the slug-based URL
        navigate(`/recipes/${recipe.slug}`, { replace: true });
      } catch (error) {
        console.error('Error redirecting recipe:', error);
        navigate('/recipes');
      }
    }

    redirectToSlug();
  }, [id, navigate]);

  // Show loading while redirecting
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
    </div>
  );
}



