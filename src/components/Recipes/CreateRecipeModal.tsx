import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FileInput } from '../Listings/Forms/FormComponents/FileInput';
import { TextArea } from '../Listings/Forms/FormComponents/TextArea';
import { MultiSelect } from '../Listings/Forms/FormComponents/MultiSelect';
import { generateSlug } from '../../lib/utils/slugUtils';
import type { RecipeFormData } from '../../types/recipes';

interface CreateRecipeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

const CUISINE_TYPES = [
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'indian', label: 'Indian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'thai', label: 'Thai' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'french', label: 'French' },
  { value: 'american', label: 'American' },
  { value: 'middle_eastern', label: 'Middle Eastern' }
];

const DIETARY_PREFERENCES = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'dairy_free', label: 'Dairy Free' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'nut_free', label: 'Nut Free' }
];

export function CreateRecipeModal({ onClose, onSuccess }: CreateRecipeModalProps) {
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    prep_time: '',
    cook_time: '',
    servings: '',
    difficulty: 'easy',
    cuisine_type: '',
    dietary_preferences: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload image if provided
      let imageUrl = '';
      if (formData.image) {
        const { data: imageData, error: imageError } = await supabase.storage
          .from('recipe-images')
          .upload(`${user.id}/${Date.now()}-${formData.image.name}`, formData.image);
        
        if (imageError) throw imageError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(imageData.path);
        
        imageUrl = publicUrl;
      }

      // Create recipe
      const { error: insertError } = await supabase
        .from('recipes')
        .insert([{
          user_id: user.id,
          title: formData.title,
          slug: generateSlug(formData.title),
          description: formData.description,
          ingredients: formData.ingredients.filter(i => i.trim()),
          instructions: formData.instructions.filter(i => i.trim()),
          prep_time: parseInt(formData.prep_time),
          cook_time: parseInt(formData.cook_time),
          servings: parseInt(formData.servings),
          difficulty: formData.difficulty,
          cuisine_type: formData.cuisine_type,
          dietary_preferences: formData.dietary_preferences,
          image_url: imageUrl
        }]);

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((item, i) => i === index ? value : item)
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((item, i) => i === index ? value : item)
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-content">Create Recipe</h2>
          <button onClick={onClose} className="text-content/60 hover:text-content">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-content">Recipe Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20 bg-background"
              placeholder="Enter recipe title"
            />
          </div>

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="Describe your recipe..."
            required
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-content">Ingredients *</label>
              <button
                type="button"
                onClick={addIngredient}
                className="text-sm text-accent-text hover:text-accent-text/80"
              >
                + Add Ingredient
              </button>
            </div>
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    className="flex-1 rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20 bg-background"
                    placeholder={`Ingredient ${index + 1}`}
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                      title="Remove ingredient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-content">Instructions *</label>
              <button
                type="button"
                onClick={addInstruction}
                className="text-sm text-accent-text hover:text-accent-text/80"
              >
                + Add Step
              </button>
            </div>
            <div className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className="flex-1 rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20 bg-background"
                    placeholder={`Step ${index + 1}`}
                  />
                  {formData.instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                      title="Remove step"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-content">Prep Time (mins) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.prep_time}
                onChange={(e) => setFormData(prev => ({ ...prev, prep_time: e.target.value }))}
                className="mt-1 block w-full rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20 bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content">Cook Time (mins) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.cook_time}
                onChange={(e) => setFormData(prev => ({ ...prev, cook_time: e.target.value }))}
                className="mt-1 block w-full rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20 bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content">Servings *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value }))}
                className="mt-1 block w-full rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20 bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content">Difficulty *</label>
              <select
                required
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                className="mt-1 block w-full rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20 bg-background"
              >
                {DIFFICULTIES.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content">Cuisine Type *</label>
              <select
                required
                value={formData.cuisine_type}
                onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
                className="mt-1 block w-full rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20 bg-background"
              >
                <option value="">Select cuisine type</option>
                {CUISINE_TYPES.map(cuisine => (
                  <option key={cuisine.value} value={cuisine.value}>{cuisine.label}</option>
                ))}
              </select>
            </div>
          </div>

          <MultiSelect
            label="Dietary Preferences"
            options={DIETARY_PREFERENCES}
            selectedValues={formData.dietary_preferences}
            onChange={(values) => setFormData(prev => ({ ...prev, dietary_preferences: values }))}
          />

          <FileInput
            label="Recipe Image"
            onChange={(files) => setFormData(prev => ({ ...prev, image: files[0] }))}
            maxFiles={1}
            maxSize={5}
            accept="image/*"
            description="Upload a photo of your recipe"
          />

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-content hover:text-content/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}