import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ClipboardList, Users, Info, Plus, ArrowLeft, UserPlus, MoreVertical, Trash2, LogOut, Pen, Leaf, Sprout, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Profile/Avatar';
import { TaskModal } from '../components/Agriculture/TaskModal';
import { Calendar } from '../components/Agriculture/Calendar';
import { AddMemberModal } from '../components/Agriculture/AddMemberModal';
import { GardenPlanner } from '../components/Agriculture/GardenPlanner/GardenPlanner';
import { Username } from '../components/Profile/Username';
import { TaskTypeIcon } from '../components/Agriculture/TaskTypeIcon';
import { Notepad } from '../components/Agriculture/Notepad';
import PlantInformation from '../components/Agriculture/PlantInformation';
import { GardenTab } from '../components/Agriculture/GardenTab';
import { europeanCountries } from '../lib/constants/countries';

interface Field {
  id: string;
  name: string;
  description?: string;
  country: string;
  owner_id: string;
  created_at: string;
  owner?: {
    username: string;
    avatar_url?: string;
  };
  _count?: {
    members: number;
  };
}

interface Task {
  id: string;
  field_id: string;
  user_id: string;
  date: string;
  task_type: 'planting' | 'watering' | 'harvesting' | 'fertilising' | 'other';
  title: string;
  details?: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export function FieldDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [field, setField] = useState<Field | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'garden' | 'calendar' | 'activities' | 'notes' | 'plants'>('garden');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [fieldMembers, setFieldMembers] = useState<any[]>([]);
  const [showMembersList, setShowMembersList] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle swipe between tabs on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const swipeDistance = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50;
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      const tabs = ['garden', 'calendar', 'activities', 'planner', 'plants', 'notes'];
      const currentIndex = tabs.indexOf(activeTab);
      
      if (swipeDistance > 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        setActiveTab(tabs[currentIndex - 1] as typeof activeTab);
      } else if (swipeDistance < 0 && currentIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        setActiveTab(tabs[currentIndex + 1] as typeof activeTab);
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

const fetchFieldDetails = async () => {
  if (!id) return;

  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Not authenticated');

    // Fetch field details
    const { data: fieldData, error: fieldError } = await supabase
      .from('fields')
      .select(`*,
        owner:users!fields_owner_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (fieldError) throw fieldError;
    if (!fieldData) throw new Error('Field not found');
    
    // Check if current user is the owner
    setIsOwner(currentUser.id === fieldData.owner_id);
    
    // Fetch field members with user details
    const { data: membersData, error: membersError } = await supabase
      .from('field_members')
      .select(`
        id,
        user_id,
        created_at,
        user:users!field_members_user_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq('field_id', id);

    if (membersError) throw membersError;
    
    // Check if current user is a member
    const isMemberCheck = membersData?.some(member => member.user_id === currentUser.id) || false;
    setIsMember(isMemberCheck);
    
    // Check if user has access
    if (fieldData.owner_id !== currentUser.id && !isMemberCheck) {
      throw new Error('You do not have access to this field');
    }

    setField(fieldData);
    
    // Set field members (includes owner + members)
    const allMembers = [
      {
        id: 'owner',
        user_id: fieldData.owner_id,
        created_at: fieldData.created_at,
        user: fieldData.owner,
        isOwner: true
      },
      ...(membersData || []).map(member => ({ ...member, isOwner: false }))
    ];
    
    setFieldMembers(allMembers);

    // Fetch tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('field_tasks')
      .select(`
        *,
        user:users!field_tasks_user_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq('field_id', id)
      .order('date', { ascending: false });

    if (tasksError) throw tasksError;
    setTasks(tasksData || []);
  } catch (err: any) {
    console.error('Error fetching field details:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/agriculture');
    } catch (err: any) {
      console.error('Error deleting field:', err);
      alert('Failed to delete field. Please try again.');
    }
  };

  const handleLeave = async () => {
    if (!id || !window.confirm('Are you sure you want to leave this field?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('field_members')
        .delete()
        .eq('field_id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      navigate('/agriculture');
    } catch (err: any) {
      console.error('Error leaving field:', err);
      alert('Failed to leave field. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('field_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      // Update tasks list
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err: any) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task. Please try again.');
    }
  };

  // Filter tasks based on date
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (taskFilter === 'upcoming') {
      return taskDate >= today;
    } else if (taskFilter === 'past') {
      return taskDate < today;
    }
    return true;
  });

  useEffect(() => {
    fetchFieldDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to="/agriculture"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to fields
        </Link>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">
            {error || 'Field not found'}
          </h2>
          <Link 
            to="/agriculture" 
            className="text-accent-text hover:text-accent-text/80"
          >
            View all fields
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link 
        to="/agriculture"
        className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to fields
      </Link>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-content mb-2">{field.name}</h1>
              <div className="flex items-center text-sm text-content/60">
                <Info className="h-4 w-4 mr-1" />
                <span>
                  {europeanCountries.find(c => c.value === field.country)?.label || field.country}
                </span>
                <span className="mx-2">•</span>
                <button
                  onClick={() => setShowMembersList(true)}
                  className="flex items-center text-sm text-content/60 hover:text-accent-text transition-colors"
                >
                  <Users className="h-4 w-4 mr-1" />
                  <span>{fieldMembers.length} members</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="inline-flex items-center p-2 text-content/60 hover:text-content hover:bg-accent-base/10 rounded-full transition-colors"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border border-accent-text/10">
                    {isOwner ? (
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Field
                      </button>
                    ) : isMember && (
                      <button
                        onClick={handleLeave}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Field
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-accent-text text-sm font-medium rounded-md text-accent-text hover:bg-accent-text hover:text-white transition-colors whitespace-nowrap"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </button>
              )}
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-text hover:bg-accent-text/90 whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </button>
            </div>
          </div>

          {field.description && (
            <p className="text-content/80 mb-6">{field.description}</p>
          )}

          <div 
            className="flex space-x-4 border-b border-accent-text/10 overflow-x-auto scrollbar-hide"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button
              onClick={() => setActiveTab('garden')}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'garden'
                  ? 'border-accent-text text-accent-text'
                  : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
              }`}
            >
              <Sprout className="h-4 w-4 inline mr-2" />
              Garden
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'calendar'
                  ? 'border-accent-text text-accent-text'
                  : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
              }`}
            >
              <CalendarIcon className="h-4 w-4 inline mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activities'
                  ? 'border-accent-text text-accent-text'
                  : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
              }`}
            >
              <ClipboardList className="h-4 w-4 inline mr-2" />
              Activities
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'planner'
                  ? 'border-accent-text text-accent-text'
                  : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
              }`}
            >
              <Pen className="h-4 w-4 inline mr-2" />
              Planner
            </button>
            <button
              onClick={() => setActiveTab('plants')}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'plants'
                  ? 'border-accent-text text-accent-text'
                  : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
              }`}
            >
              <Leaf className="h-4 w-4 inline mr-2" />
              Plants
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notes'
                  ? 'border-accent-text text-accent-text'
                  : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
              }`}
            >
              <Pen className="h-4 w-4 inline mr-2" />
              Notes
            </button>
          </div>

          <div className="mt-6">
            {activeTab === 'garden' ? (
              <div>
                <GardenTab fieldId={field.id} fieldCountry={field.country} />
              </div>
            ) : activeTab === 'calendar' ? (
              <Calendar 
                tasks={tasks}
                onDateClick={(date) => {
                  setSelectedDate(date);
                  setShowAddTaskModal(true);
                }}
              />
            ) : activeTab === 'activities' ? (
              <div>
                <div className="mb-4 flex space-x-2">
                  <button
                    onClick={() => setTaskFilter('all')}
                    className={`px-4 py-1 text-sm rounded-full transition-colors ${
                      taskFilter === 'all'
                        ? 'bg-accent-text text-white'
                        : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
                    }`}
                  >
                    All Tasks
                  </button>
                  <button
                    onClick={() => setTaskFilter('upcoming')}
                    className={`px-4 py-1 text-sm rounded-full transition-colors ${
                      taskFilter === 'upcoming'
                        ? 'bg-accent-text text-white'
                        : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setTaskFilter('past')}
                    className={`px-4 py-1 text-sm rounded-full transition-colors ${
                      taskFilter === 'past'
                        ? 'bg-accent-text text-white'
                        : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
                    }`}
                  >
                    Past
                  </button>
                </div>
                <div className="space-y-4">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-content/60">
                      No tasks available.
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <div 
                        key={task.id}
                        className="flex items-start space-x-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex-shrink-0">
                          <Avatar
                            url={task.user?.avatar_url}
                            size="sm"
                            userId={task.user_id}
                            editable={false}
                          />
                        </div>
                        <div className="flex-1 min-w-0 relative">
                          <div className="flex items-center text-sm mb-1">
                            <TaskTypeIcon type={task.task_type} className="text-accent-text mr-2" />
                            <Username
                              username={task.user?.username || 'Anonymous'}
                              userId={task.user_id}
                              className="font-medium text-content"
                            />
                            <span className="text-content/60 ml-1">
                              {new Date(task.date) > new Date() ? 'scheduled' : 'completed'} {task.task_type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-content/80 font-medium">
                            {task.title}
                          </p>
                          {task.details && (
                            <p className="text-xs text-content/70 mt-1 whitespace-pre-line">
                              {task.details}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-content/60">
                              {new Date(task.date).toLocaleDateString()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              className="text-red-500 hover:text-red-700 text-xs hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeTab === 'planner' ? (
              <GardenPlanner fieldId={field.id} isOwner={isOwner} />
            ) : activeTab === 'plants' ? (
              <PlantInformation country={field.country} />
            ) : activeTab === 'notes' ? (
              <Notepad fieldId={field.id} />
            ) : null}
          </div>
        </div>
      </div>

      {showAddTaskModal && (
        <TaskModal
          fieldId={field.id}
          selectedDate={selectedDate || undefined}
          onClose={() => setShowAddTaskModal(false)}
          onSuccess={async () => {
            setShowAddTaskModal(false);
            setSelectedDate(null);
            await fetchFieldDetails();
          }}
        />
      )}
      
      {showAddMemberModal && (
        <AddMemberModal
          fieldId={field.id}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={async () => {
            setShowAddMemberModal(false);
            await fetchFieldDetails();
          }}
        />
      )}
      
      {/* Members List Modal */}
      {showMembersList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-accent-text/10">
              <h3 className="text-lg font-semibold text-content">Field Members</h3>
              <button
                onClick={() => setShowMembersList(false)}
                className="p-2 text-content/60 hover:text-content hover:bg-accent-base/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="divide-y divide-accent-text/10">
                {fieldMembers.map((member) => (
                  <div key={member.id} className="p-4 flex items-center space-x-3">
                    <Avatar
                      url={member.user?.avatar_url}
                      size="md"
                      userId={member.user_id}
                      editable={false}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Username
                          username={member.user?.username || 'Anonymous'}
                          userId={member.user_id}
                          className="font-medium text-content"
                        />
                        {member.isOwner && (
                          <span className="px-2 py-0.5 bg-accent-text/10 text-accent-text text-xs rounded-full">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-content/60">
                        {member.isOwner ? 'Created' : 'Joined'} {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FieldDetails;