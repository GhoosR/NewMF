import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Users, ChefHat, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Profile/Avatar';
import { Username } from '../components/Profile/Username';
import { CreateRecipeModal } from '../components/Recipes/CreateRecipeModal';
import { Meta } from '../components/Meta';
import { formatCategoryName } from '../lib/utils/formatters';
import type { Recipe } from '../types/recipes';

export function RecipeDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnRecipe, setIsOwnRecipe] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Check if the slug parameter looks like a UUID (old ID-based URL)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || '');
        
        let query;
        if (isUUID) {
          // If it's a UUID, try to find by ID and redirect to slug
          query = supabase
            .from('recipes')
            .select(`
              *,
              user:users (
                id,
                username,
                avatar_url,
                verified
              )
            `)
            .eq('id', slug)
            .single();
        } else {
          // If it's a slug, find by slug
          query = supabase
            .from('recipes')
            .select(`
              *,
              user:users (
                id,
                username,
                avatar_url,
                verified
              )
            `)
            .eq('slug', slug)
            .single();
        }
        
        const { data, error } = await query;

        if (error) throw error;
        if (!data) throw new Error('Recipe not found');

        // If we found a recipe by ID (UUID), redirect to the slug URL
        if (isUUID && data.slug) {
          navigate(`/recipes/${data.slug}`, { replace: true });
          return;
        }

        setRecipe(data);
        setIsOwnRecipe(currentUser?.id === data.user_id);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchRecipe();
    }
  }, [slug]);

  const handleDelete = async () => {
    if (!recipe?.id || !window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id);

      if (deleteError) throw deleteError;
      navigate('/recipes');
    } catch (err: any) {
      console.error('Error deleting recipe:', err);
      alert('Failed to delete recipe. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to="/recipes"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to recipes
        </Link>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">
            {error || 'Recipe not found'}
          </h2>
          <Link 
            to="/recipes" 
            className="text-accent-text hover:text-accent-text/80"
          >
            View all recipes
          </Link>
        </div>
      </div>
    );
  }

  const totalTime = recipe.prep_time + recipe.cook_time;

  return (
    <>
      <Meta 
        title={`${recipe.title} - Healthy Recipe`}
        description={`Try this delicious ${recipe.title} recipe. ${recipe.description.substring(0, 150)}...`}
        image={recipe.image_url}
        type="article"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link 
        to="/recipes"
        className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to recipes
      </Link>

      <div className="bg-background rounded-lg shadow-sm overflow-hidden">
        <div className="relative h-64 sm:h-96">
          <img
            src={recipe.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=1920'}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            {recipe.user && (
              <Link 
                to={`/profile/${recipe.user.id}/listings`}
                className="flex items-center space-x-3 group"
              >
                <Avatar 
                  url={recipe.user.avatar_url} 
                  size="md"
                  userId={recipe.user.id}
                  editable={false}
                />
                <div>
                  <Username 
                    username={recipe.user.username || 'Anonymous'}
                    userId={recipe.user.id}
                    verified={recipe.user.verified}
                    className="block text-sm font-medium text-content group-hover:text-accent-text"
                  />
                  <span className="block text-sm text-content/60">
                    Recipe Creator
                  </span>
                </div>
              </Link>
            )}
            <div className="flex items-center space-x-3">
              {isOwnRecipe ? (
                <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-base/10 rounded-md"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </>
              ) : null}
              <div className="flex space-x-2">
                <span className="px-3 py-1 text-sm font-medium bg-accent-base text-accent-text rounded-full">
                  {formatCategoryName(recipe.difficulty)}
                </span>
                <span className="px-3 py-1 text-sm font-medium bg-accent-base text-accent-text rounded-full">
                  {formatCategoryName(recipe.cuisine_type)}
                </span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-content mb-4">{recipe.title}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center text-content/80">
              <Clock className="h-5 w-5 mr-2" />
              <span>{totalTime} mins total</span>
            </div>
            <div className="flex items-center text-content/80">
              <Users className="h-5 w-5 mr-2" />
              <span>{recipe.servings} servings</span>
            </div>
            <div className="flex items-center text-content/80">
              <ChefHat className="h-5 w-5 mr-2" />
              <span>{recipe.cuisine_type}</span>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <div className="text-content/80 whitespace-pre-line">{recipe.description}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-content mb-4">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center text-content/80">
                    <span className="w-2 h-2 bg-accent-text rounded-full mr-2"></span>
                    {ingredient}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-content mb-4">Instructions</h2>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex text-content/80">
                    <span className="font-bold mr-4">{index + 1}.</span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {recipe.dietary_preferences.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-content mb-4">Dietary Information</h2>
              <div className="flex flex-wrap gap-2">
                {recipe.dietary_preferences.map((pref, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-accent-base text-accent-text rounded-full"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <CreateRecipeModal
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            window.location.reload();
          }}
        />
      )}
      </div>
    </>
  );
}