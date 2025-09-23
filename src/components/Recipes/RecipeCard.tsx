import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, ChefHat } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { StatusIndicator } from '../StatusIndicator';
import { formatCategoryName } from '../../lib/utils/formatters';
import type { Recipe } from '../../types/recipes';

interface RecipeCardProps {
  recipe: Recipe;
  showStatus?: boolean;
}

export function RecipeCard({ recipe, showStatus = false }: RecipeCardProps) {
  const totalTime = recipe.prep_time + recipe.cook_time;

  return (
    <div className="bg-background rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/recipes/${recipe.id}`}>
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={recipe.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=400'}
            alt={recipe.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Link 
            to={`/profile/${recipe.user_id}/listings`}
            className="flex items-center space-x-2 group"
          >
            <Avatar 
              url={recipe.user?.avatar_url} 
              size="sm"
              userId={recipe.user_id}
              editable={false}
            />
            <span className="text-sm text-content group-hover:text-accent-text">
              {recipe.user?.username || 'Anonymous'}
            </span>
          </Link>
          {showStatus ? (
            <StatusIndicator status={recipe.approval_status} />
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-accent-base text-accent-text rounded-full">
              {formatCategoryName(recipe.difficulty)}
            </span>
          )}
        </div>
        <Link to={`/recipes/${recipe.id}`}>
          <h3 className="text-lg font-semibold text-content mb-2 hover:text-accent-text">
            {recipe.title}
          </h3>
        </Link>

        <p className="text-content/80 line-clamp-2 mb-4">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between text-sm text-content/60">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{totalTime} mins</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center">
            <ChefHat className="h-4 w-4 mr-1" />
            <span>{recipe.cuisine_type}</span>
          </div>
        </div>

        {recipe.dietary_preferences.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {recipe.dietary_preferences.slice(0, 2).map((pref, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-accent-base/50 text-accent-text rounded-full"
              >
                {pref}
              </span>
            ))}
            {recipe.dietary_preferences.length > 2 && (
              <span className="px-2 py-0.5 text-xs bg-accent-base/50 text-accent-text rounded-full">
                +{recipe.dietary_preferences.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}