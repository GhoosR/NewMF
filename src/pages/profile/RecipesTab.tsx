import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { CreateRecipeModal } from '../../components/Recipes/CreateRecipeModal';
import { RecipesList } from '../../components/Recipes/RecipesList';
import { supabase } from '../../lib/supabase';

interface RecipesTabProps {
  userId: string;
}

export function RecipesTab({ userId }: RecipesTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwnProfile(user?.id === userId);
    };
    checkOwnership();
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-content">
          {isOwnProfile ? 'Your Recipes' : 'Recipes'}
        </h2>
        {isOwnProfile && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-text hover:bg-accent-text/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </button>
        )}
      </div>

      <RecipesList userId={userId} />

      {showCreateModal && (
        <CreateRecipeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Refresh recipes list
          }}
        />
      )}
    </div>
  );
}