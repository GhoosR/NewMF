import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { RecipeCard } from '../components/Recipes/RecipeCard';
import { RecipeFilters } from '../components/Recipes/Filters/RecipeFilters';
import { CreateRecipeModal } from '../components/Recipes/CreateRecipeModal';
import { Hero } from '../components/Hero';
import { Meta } from '../components/Meta';
import { supabase } from '../lib/supabase';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import type { Recipe } from '../types/recipes';

interface Filters {
  cuisineTypes: string[];
  difficulties: string[];
  dietaryPreferences: string[];
  timeRange: string;
}

export function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    cuisineTypes: [],
    difficulties: [],
    dietaryPreferences: [],
    timeRange: ''
  });

  const RECIPES_PER_PAGE = 12;

  const loadMoreRecipes = async () => {
    if (loading || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      await fetchRecipes(nextPage, true);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more recipes:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const observerRef = useInfiniteScroll({
    loading: loading || loadingMore,
    hasMore,
    onLoadMore: loadMoreRecipes,
    threshold: 0.5
  });

  const handleFilterChange = (filterType: keyof Filters, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'timeRange' ? values[0] || '' : values
    }));
    // Reset pagination when filters change
    setPage(0);
    setHasMore(true);
  };

  const fetchRecipes = async (pageNumber = 0, append = false) => {
    try {
      setError(null);
      if (!append) {
        setLoading(true);
      }
      
      let query = supabase
        .from('recipes')
        .select(`
          *,
          user:users (
            username,
            avatar_url
          )
        `)
        .eq('approval_status', 'approved')
        .range(pageNumber * RECIPES_PER_PAGE, (pageNumber + 1) * RECIPES_PER_PAGE - 1);

      // Apply filters
      if (filters.cuisineTypes.length > 0) {
        query = query.in('cuisine_type', filters.cuisineTypes);
      }
      if (filters.difficulties.length > 0) {
        query = query.in('difficulty', filters.difficulties);
      }
      if (filters.dietaryPreferences.length > 0) {
        query = query.overlaps('dietary_preferences', filters.dietaryPreferences);
      }
      if (filters.timeRange) {
        const totalTime = 'prep_time + cook_time';
        switch (filters.timeRange) {
          case 'under_30':
            query = query.lt(totalTime, 30);
            break;
          case '30_60':
            query = query.gte(totalTime, 30).lt(totalTime, 60);
            break;
          case 'over_60':
            query = query.gte(totalTime, 60);
            break;
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (append) {
        setRecipes(prev => [...prev, ...(data || [])]);
      } else {
        setRecipes(data || []);
      }
      
      setHasMore((data?.length || 0) === RECIPES_PER_PAGE);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (append) {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    // Reset pagination when filters change
    setPage(0);
    setRecipes([]);
    setHasMore(true);
    fetchRecipes();
  }, [filters]);

  return (
    <div>
      <Meta 
        title="Healthy & Mindful Recipes | Mindful Family"
        description="Discover nourishing recipes that support your wellness journey. From plant-based meals to mindful eating inspirations for a healthier lifestyle."
      />
      
      {/* Mobile Full-Width Header */}
      <div className="lg:hidden relative h-64 overflow-hidden">
        <img
          src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/fresh-food-healthy-chef.png"
          alt="Welcome to our community kitchen"
          className="w-full h-full object-cover shadow-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
      </div>

      {/* Mobile Content Below Image */}
      <div className="lg:hidden px-4 py-8 text-center bg-gray-50">
        <h1 className="text-3xl font-gelica font-bold text-content mb-4">
          Welcome to our community kitchen
        </h1>
        <p className="text-lg text-content/70 mb-6 max-w-md mx-auto">
          We invite you to contribute your favourite recipes and help us build a vibrant collection of meals that reflect the rich tapestry of our diverse cuisines and cultures. What's cooking in your corner of the world?
        </p>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-accent-text text-white rounded-lg font-medium hover:bg-accent-text/90 transition-colors shadow-sm"
        >
          Submit Listing
        </button>
      </div>

      {/* Desktop Hero */}
      <div className="hidden lg:block">
        <Hero
          title="Welcome to our community kitchen"
          subtitle="We invite you to contribute your favourite recipes and help us build a vibrant collection of meals that reflect the rich tapestry of our diverse cuisines and cultures. What's cooking in your corner of the world?"
          image="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/fresh-food-healthy-chef.png"
          showAddListing
          onAddListing={() => setShowCreateModal(true)}
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto">
        <RecipeFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {error && (
          <div className="text-red-600 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="bg-background rounded-lg p-8 text-center">
            <p className="text-content">No recipes match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
            
            {/* Loading indicator */}
            {loadingMore && (
              <div className="col-span-full flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-text"></div>
              </div>
            )}
            
            {/* Intersection observer target */}
            <div ref={observerRef} className="col-span-full h-10"></div>
            
            {/* No more recipes message */}
            {!hasMore && recipes.length > 0 && (
              <div className="col-span-full text-center py-4 text-content/60">
                No more recipes to load
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {showCreateModal && (
        <CreateRecipeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Refresh recipes
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}