import React, { useState, useEffect } from 'react';
import { Sprout, Apple, Leaf, TreeDeciduous, Calendar, Clock, TrendingUp, Scissors, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { crops, getPlantingTimesForCountry } from '../../lib/constants/crops';
import { formatDate } from '../../lib/utils/dateUtils';

interface PlantedCrop {
  id: string;
  crop_name: string;
  title: string;
  details?: string;
  date: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

interface GardenTabProps {
  fieldId: string;
  fieldCountry: string;
}

export function GardenTab({ fieldId, fieldCountry }: GardenTabProps) {
  const [plantedCrops, setPlantedCrops] = useState<PlantedCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [harvesting, setHarvesting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchPlantedCrops();
  }, [fieldId]);

  const fetchPlantedCrops = async () => {
    try {
      const { data, error } = await supabase
        .from('field_tasks')
        .select(`
          id,
          crop_name,
          title,
          details,
          date,
          created_at,
          user:users!field_tasks_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('field_id', fieldId)
        .eq('task_type', 'planting')
        .not('crop_name', 'is', null)
        .order('date', { ascending: false });

      if (error) throw error;
      setPlantedCrops(data || []);
    } catch (err: any) {
      console.error('Error fetching planted crops:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHarvest = async (cropId: string, cropName: string, cropTitle: string) => {
    if (!window.confirm(`Are you sure you want to harvest ${cropTitle}? This will mark it as completed and create a harvest task.`)) {
      return;
    }

    try {
      setHarvesting(cropId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create harvest task
      const { error: taskError } = await supabase
        .from('field_tasks')
        .insert([{
          field_id: fieldId,
          user_id: user.id,
          title: `Harvested ${cropName.replace('_', ' ')}`,
          details: `Harvested ${cropTitle}`,
          date: new Date().toISOString().split('T')[0], // Today's date
          task_type: 'harvesting',
          crop_name: cropName
        }]);

      if (taskError) throw taskError;

      // Remove the crop from the planted crops list by refetching
      await fetchPlantedCrops();
    } catch (err: any) {
      console.error('Error harvesting crop:', err);
      setError(err.message);
    } finally {
      setHarvesting(null);
    }
  };

  const handleRemoveCrop = async (cropId: string, cropTitle: string) => {
    if (!window.confirm(`Are you sure you want to remove ${cropTitle}? This will delete the planting task.`)) {
      return;
    }

    try {
      setRemoving(cropId);
      
      // Delete the planting task
      const { error } = await supabase
        .from('field_tasks')
        .delete()
        .eq('id', cropId);

      if (error) throw error;

      // Remove from local state
      setPlantedCrops(prev => prev.filter(crop => crop.id !== cropId));
    } catch (err: any) {
      console.error('Error removing crop:', err);
      setError(err.message);
    } finally {
      setRemoving(null);
    }
  };

  const getCropCategory = (cropName: string): 'vegetables' | 'fruits' | 'herbs' | 'trees' => {
    const vegetableCrops = ['tomatoes', 'carrots', 'potatoes', 'lettuce', 'cucumbers'];
    const fruitCrops = ['strawberries', 'blueberries', 'grapes'];
    const herbCrops = ['basil', 'rosemary', 'mint', 'lavender'];
    const treeCrops = ['apples', 'peaches', 'pears', 'cherries', 'walnuts', 'olives', 'oranges', 'lemons'];

    if (vegetableCrops.includes(cropName)) return 'vegetables';
    if (fruitCrops.includes(cropName)) return 'fruits';
    if (herbCrops.includes(cropName)) return 'herbs';
    if (treeCrops.includes(cropName)) return 'trees';
    return 'vegetables'; // default
  };

  const calculateHarvestInfo = (cropName: string, plantedDate: string) => {
    const crop = crops[cropName];
    if (!crop) return null;

    const planted = new Date(plantedDate);
    const today = new Date();
    
    // Parse harvest time in days (e.g., "90-120" or "365")
    const harvestTime = crop.harvestTime;
    let harvestDaysMin: number;
    let harvestDaysMax: number;

    if (harvestTime.includes('-')) {
      const [minDays, maxDays] = harvestTime.split('-').map(d => parseInt(d));
      harvestDaysMin = minDays;
      harvestDaysMax = maxDays;
    } else {
      const days = parseInt(harvestTime);
      harvestDaysMin = days;
      harvestDaysMax = days;
    }

    // Calculate harvest dates
    const harvestStart = new Date(planted);
    harvestStart.setDate(harvestStart.getDate() + harvestDaysMin);
    
    const harvestEnd = new Date(planted);
    harvestEnd.setDate(harvestEnd.getDate() + harvestDaysMax);

    // Calculate days
    const daysPlanted = Math.floor((today.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
    const daysToHarvest = Math.floor((harvestStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalGrowingDays = harvestDaysMin;
    
    const progress = Math.min(100, Math.max(0, (daysPlanted / totalGrowingDays) * 100));

    return {
      harvestStart,
      harvestEnd,
      daysToHarvest,
      daysPlanted,
      progress,
      status: daysToHarvest <= 0 ? 'ready' : 
              daysToHarvest <= 7 ? 'soon' : 
              daysToHarvest <= 30 ? 'upcoming' : 'growing'
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-red-600 bg-red-50';
      case 'soon': return 'text-orange-600 bg-orange-50';
      case 'upcoming': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getStatusText = (status: string, daysToHarvest: number) => {
    switch (status) {
      case 'ready': return 'Ready to harvest!';
      case 'soon': return `Harvest in ${daysToHarvest} days`;
      case 'upcoming': return `Harvest in ${daysToHarvest} days`;
      default: return `${daysToHarvest} days to harvest`;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vegetables': return <Sprout className="h-5 w-5 text-green-600" />;
      case 'fruits': return <Apple className="h-5 w-5 text-red-600" />;
      case 'herbs': return <Leaf className="h-5 w-5 text-emerald-600" />;
      case 'trees': return <TreeDeciduous className="h-5 w-5 text-amber-600" />;
      default: return <Sprout className="h-5 w-5 text-green-600" />;
    }
  };

  // Group crops by category
  const groupedCrops = plantedCrops.reduce((acc, crop) => {
    const category = getCropCategory(crop.crop_name);
    if (!acc[category]) acc[category] = [];
    acc[category].push(crop);
    return acc;
  }, {} as Record<string, PlantedCrop[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (plantedCrops.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-accent-base/10 rounded-full">
            <Sprout className="h-12 w-12 text-accent-text" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-content mb-2">No crops planted yet</h3>
        <p className="text-content/60 mb-6">
          Start by adding planting tasks with crop selections to track your garden progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedCrops).map(([category, crops]) => (
        <div key={category} className="bg-white rounded-lg shadow-sm border border-accent-text/10 overflow-hidden">
          <div className="bg-accent-base/5 px-6 py-4 border-b border-accent-text/10">
            <div className="flex items-center">
              {getCategoryIcon(category)}
              <h2 className="text-xl font-semibold text-content ml-3 capitalize">
                {category}
              </h2>
              <span className="ml-3 px-3 py-1 bg-accent-text/10 text-accent-text text-sm rounded-full">
                {crops.length} {crops.length === 1 ? 'crop' : 'crops'}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crops.map((crop) => {
                const harvestInfo = calculateHarvestInfo(crop.crop_name, crop.date);
                const cropData = crops[crop.crop_name];
                
                return (
                  <div key={crop.id} className="bg-accent-base/5 rounded-xl p-5 border border-accent-text/10 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-content capitalize mb-1">
                          {crop.crop_name.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-content/60 mb-2">
                          {crop.title}
                        </p>
                        <div className="flex items-center text-sm text-content/60">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Planted {formatDate(crop.date)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                        {getCategoryIcon(category)}
                        <button
                          onClick={() => handleRemoveCrop(crop.id, crop.title)}
                          disabled={removing === crop.id}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                          title="Remove crop"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {harvestInfo && (
                      <div className="space-y-3">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-content/60">Growing Progress</span>
                            <span className="text-content/80 font-medium">
                              {Math.round(harvestInfo.progress)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-accent-text rounded-full h-2 transition-all duration-300"
                              style={{ width: `${harvestInfo.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Harvest Status */}
                        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(harvestInfo.status)}`}>
                          <div className="flex items-center justify-between">
                            <span>{getStatusText(harvestInfo.status, harvestInfo.daysToHarvest)}</span>
                            {harvestInfo.status === 'ready' && (
                              <TrendingUp className="h-4 w-4" />
                            )}
                          </div>
                        </div>

                        {/* Harvest Window */}
                        <div className="text-sm text-content/60">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              Harvest: {formatDate(harvestInfo.harvestStart)} - {formatDate(harvestInfo.harvestEnd)}
                            </span>
                          </div>
                        </div>

                        {/* Days Planted */}
                        <div className="text-xs text-content/50">
                          Planted {harvestInfo.daysPlanted} days ago
                        </div>
                      </div>
                    )}

                    {crop.details && (
                      <div className="mt-4 pt-4 border-t border-accent-text/10">
                        <p className="text-sm text-content/70 italic">
                          "{crop.details}"
                        </p>
                      </div>
                    )}
                  </div>
                );

                {/* Harvest Button */}
                <div className="mt-4 pt-4 border-t border-accent-text/10">
                  <button
                    onClick={() => handleHarvest(crop.id, crop.crop_name, crop.title)}
                    disabled={harvesting === crop.id}
                    onClick={() => handleHarvest(crop.id, crop.crop_name, crop.title)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Scissors className="h-4 w-4 mr-2" />
                    {harvesting === crop.id ? 'Harvesting...' : 'Harvest'}
                  </button>
                </div>
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}