import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Move, Crop, Edit, X, Check, Droplets, TreeDeciduous, Flower, Sprout } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { PlotForm } from './PlotForm';
import { Plot } from './Plot';
import { PlotDetails } from './PlotDetails';
import { ElementType } from './types';

interface GardenPlannerProps {
  fieldId: string;
  isOwner: boolean;
}

export function GardenPlanner({ fieldId, isOwner }: GardenPlannerProps) {
  const [plots, setPlots] = useState<ElementType[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [showPlotForm, setShowPlotForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlot, setEditingPlot] = useState<ElementType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPlotId, setDraggedPlotId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gridSize] = useState(20); // Grid size in pixels
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<'select' | 'move' | 'add'>('select');
  const [containerHeight, setContainerHeight] = useState(600);
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });

  // Set initial container height based on window size
  useEffect(() => {
    // For larger screens, use a taller container
    if (window.innerWidth >= 768) {
      setContainerHeight(800);
    }
  }, []);

  // Load garden layout from database
  useEffect(() => {
    const loadGardenLayout = async () => {
      try {
        const { data, error } = await supabase
          .from('garden_layouts')
          .select('*')
          .eq('field_id', fieldId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data?.elements) {
          setPlots(data.elements);
        }
      } catch (err) {
        console.error('Error loading garden layout:', err);
        setError('Failed to load garden layout');
      }
    };

    loadGardenLayout();
  }, [fieldId]);

  // Save garden layout to database
  const saveGardenLayout = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('garden_layouts')
        .upsert({
          field_id: fieldId,
          user_id: user.id,
          elements: plots,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err: any) {
      console.error('Error saving garden layout:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlot = (plot: Omit<ElementType, 'id' | 'position'>) => {
    const newPlot: ElementType = {
      id: `plot-${Date.now()}`,
      position: { x: 100, y: 100 },
      ...plot
    };

    setPlots([...plots, newPlot]);
    setShowPlotForm(false);
    
    // Auto-save after adding plot
    setTimeout(() => {
      saveGardenLayout();
    }, 100);
    
    // Create a field task if planted date is provided
    if (plot.plantedDate && plot.plantedWith) {
      createFieldTask(newPlot);
    }
  };

  const handleUpdatePlot = (updatedPlot: ElementType) => {
    const oldPlot = plots.find(plot => plot.id === updatedPlot.id);
    setPlots(plots.map(plot => 
      plot.id === updatedPlot.id ? updatedPlot : plot
    ));
    setEditingPlot(null);
    setIsEditing(false);
    
    // Create or update field task if planted date is provided
    if (updatedPlot.plantedDate && updatedPlot.plantedWith) {
      // Check if this is a new planting date or plant
      const isNewPlanting = !oldPlot?.plantedDate || 
                           oldPlot.plantedDate !== updatedPlot.plantedDate ||
                           oldPlot.plantedWith !== updatedPlot.plantedWith;
      
      if (isNewPlanting) {
        createFieldTask(updatedPlot);
      }
    }
  };

  // Function to create a field task from a plot
  const createFieldTask = async (plot: ElementType) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !plot.plantedDate || !plot.plantedWith) return;

      const { error } = await supabase
        .from('field_tasks')
        .insert([{
          field_id: fieldId,
          user_id: user.id,
          title: `Planted ${plot.plantedWith} in ${plot.name}`,
          details: `Planted ${plot.plantedWith} in ${plot.name}${plot.notes ? `\n\nNotes: ${plot.notes}` : ''}`,
          date: plot.plantedDate,
          task_type: 'planting'
        }]);

      if (error) {
        console.error('Error creating field task:', error);
      }
    } catch (err) {
      console.error('Error creating field task:', err);
    }
  };

  const handleDeletePlot = (id: string) => {
    setPlots(plots.filter(plot => plot.id !== id));
    if (selectedPlotId === id) {
      setSelectedPlotId(null);
    }
  };

  const handlePlotClick = (id: string) => {
    if (mode === 'select') {
      setSelectedPlotId(id === selectedPlotId ? null : id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (mode !== 'move') return;
    
    e.stopPropagation();
    const plot = plots.find(p => p.id === id);
    if (!plot) return;

    setIsDragging(true);
    setDraggedPlotId(id);

    // Calculate offset from the mouse position to the plot's top-left corner
    const plotElement = e.currentTarget as HTMLElement;
    const rect = plotElement.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (mode !== 'move') return;
    
    e.stopPropagation();
    const plot = plots.find(p => p.id === id);
    if (!plot) return;

    setIsDragging(true);
    setDraggedPlotId(id);

    // Calculate offset from the touch position to the plot's top-left corner
    const touch = e.touches[0];
    const plotElement = e.currentTarget as HTMLElement;
    const rect = plotElement.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedPlotId || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Get the scroll position of the container
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;
    
    // Calculate position considering scroll and scale
    const x = (e.clientX - containerRect.left - dragOffset.x + scrollLeft) / scale;
    const y = (e.clientY - containerRect.top - dragOffset.y + scrollTop) / scale;

    // Snap to grid
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    // Ensure we don't go negative
    const finalX = Math.max(0, snappedX);
    const finalY = Math.max(0, snappedY);

    setPlots(plots.map(plot => 
      plot.id === draggedPlotId 
        ? { ...plot, position: { x: finalX, y: finalY } } 
        : plot
    ));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !draggedPlotId || !containerRef.current) return;
    
    e.preventDefault(); // Prevent scrolling while dragging
    
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Get the scroll position of the container
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;
    
    // Calculate position considering scroll and scale
    const x = (touch.clientX - containerRect.left - dragOffset.x + scrollLeft) / scale;
    const y = (touch.clientY - containerRect.top - dragOffset.y + scrollTop) / scale;

    // Snap to grid
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    // Ensure we don't go negative
    const finalX = Math.max(0, snappedX);
    const finalY = Math.max(0, snappedY);

    setPlots(plots.map(plot => 
      plot.id === draggedPlotId 
        ? { ...plot, position: { x: finalX, y: finalY } } 
        : plot
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedPlotId(null);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDraggedPlotId(null);
  };

  const handleEditPlot = (plot: ElementType) => {
    setEditingPlot(plot);
    setIsEditing(true);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the container, not on a plot
    if (e.target === containerRef.current) {
      setSelectedPlotId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-content flex items-center flex-shrink-0 mr-2">
          <Sprout className="h-5 w-5 mr-2 text-accent-text" />
          Garden Planner
        </h2>
        {isOwner ? (
          <div className="flex flex-wrap gap-2 justify-end">
            <div className="flex bg-accent-base/10 rounded-lg p-1 mb-1 sm:mb-0">
              <button
                onClick={() => setMode('select')}
                className={`px-2 sm:px-3 py-1.5 rounded-md flex items-center text-xs sm:text-sm ${
                  mode === 'select' 
                    ? 'bg-accent-text text-white' 
                    : 'text-content/80 hover:bg-accent-base/20'
                }`}
                title="Select mode"
              >
                <Crop className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Select</span>
              </button>
              <button
                onClick={() => setMode('move')}
                className={`px-2 sm:px-3 py-1.5 rounded-md flex items-center text-xs sm:text-sm ${
                  mode === 'move' 
                    ? 'bg-accent-text text-white' 
                    : 'text-content/80 hover:bg-accent-base/20'
                }`}
                title="Move mode"
              >
                <Move className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Move</span>
              </button>
            </div>
            
            <div className="flex bg-accent-base/10 rounded-lg p-1 mb-1 sm:mb-0">
              <button
                onClick={handleZoomIn}
                className="px-2 py-1.5 text-content/80 hover:bg-accent-base/20 rounded-md"
                title="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="px-2 py-1.5 text-content/80 hover:bg-accent-base/20 rounded-md"
                title="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={() => setShowPlotForm(true)}
              className="px-2 sm:px-3 py-1.5 bg-accent-text text-white rounded-md hover:bg-accent-text/90 flex items-center text-xs sm:text-sm mb-1 sm:mb-0"
              title="Add plot"
            >
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Add Plot</span>
            </button>
            
            <button
              onClick={saveGardenLayout}
              disabled={saving}
              className="px-2 sm:px-3 py-1.5 border border-accent-text text-accent-text rounded-md hover:bg-accent-text/10 flex items-center text-xs sm:text-sm disabled:opacity-50"
              title="Save layout"
            >
              <Save className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        ) : (
          <div className="text-sm text-content/60 bg-accent-base/10 px-4 py-2 rounded-lg">
            Only the field owner can edit the garden planner. You can view the layout below.
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div 
          ref={containerRef}
          className="relative border border-accent-text/20 rounded-lg bg-accent-base/5"
          style={{ 
            width: '100%', 
            height: `${containerHeight}px`,
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
            backgroundSize: `${gridSize * scale}px ${gridSize * scale}px`,
            cursor: isOwner && mode === 'move' ? 'move' : 'default',
            overflow: 'auto' // Add scrolling capability
          }}
          onClick={handleContainerClick}
          onMouseMove={isOwner ? handleMouseMove : undefined}
          onTouchMove={isOwner ? handleTouchMove : undefined}
          onMouseUp={isOwner ? handleMouseUp : undefined}
          onTouchEnd={isOwner ? handleTouchEnd : undefined}
          onMouseLeave={isOwner ? handleMouseUp : undefined}
        >
          <div style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left', 
            width: '100%', 
            height: '100%',
            minWidth: '2000px',  // Ensure minimum width for content
            minHeight: '2000px'  // Ensure minimum height for content
          }}>
            {plots.map(plot => (
              <Plot
                key={plot.id}
                plot={plot}
                isSelected={selectedPlotId === plot.id}
                onClick={() => isOwner ? handlePlotClick(plot.id) : undefined}
                onMouseDown={(e) => isOwner ? handleMouseDown(e, plot.id) : undefined}
                onTouchStart={(e) => isOwner ? handleTouchStart(e, plot.id) : undefined}
                onDelete={() => isOwner ? handleDeletePlot(plot.id) : undefined}
                onEdit={() => isOwner ? handleEditPlot(plot) : undefined}
                isOwner={isOwner}
              />
            ))}
          </div>
        </div>

        {selectedPlotId && isOwner && (
          <div className="w-full md:w-80 flex-shrink-0">
            <PlotDetails 
              plot={plots.find(p => p.id === selectedPlotId)!}
              onEdit={() => {
                const plot = plots.find(p => p.id === selectedPlotId);
                if (plot) {
                  setEditingPlot(plot);
                  setIsEditing(true);
                }
              }}
              onDelete={() => handleDeletePlot(selectedPlotId)}
            />
          </div>
        )}
        
        {plots.length === 0 && (
          <div className="w-full text-center py-12 text-content/60">
            <Sprout className="h-12 w-12 mx-auto mb-4 text-content/20" />
            <p className="text-lg mb-2">No garden layout yet</p>
            <p className="text-sm">
              {isOwner 
                ? 'Click "Add Plot" to start designing your garden layout' 
                : 'The field owner can create a garden layout using the planner'
              }
            </p>
          </div>
        )}
      </div>

      {showPlotForm && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto m-4 sm:m-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-content flex items-center">
                <Plus className="h-5 w-5 mr-2 text-accent-text" />
                Add Garden Plot
              </h3>
              <button 
                onClick={() => setShowPlotForm(false)}
                className="text-content/60 hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PlotForm onSubmit={handleAddPlot} onCancel={() => setShowPlotForm(false)} />
          </div>
        </div>
      )}

      {isEditing && editingPlot && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto m-4 sm:m-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-content flex items-center">
                <Edit className="h-5 w-5 mr-2 text-accent-text" />
                Edit Garden Plot
              </h3>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditingPlot(null);
                }}
                className="text-content/60 hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PlotForm 
              initialValues={editingPlot}
              onSubmit={(values) => handleUpdatePlot({ ...editingPlot, ...values })}
              onCancel={() => {
                setIsEditing(false);
                setEditingPlot(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Minus icon component since it's not directly imported from lucide-react
function Minus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}