import React, { useState, useEffect } from 'react';
import { Plus, Calendar, History, Users, Info } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Meta } from '../components/Meta';
import { CreateFieldModal } from '../components/Agriculture/CreateFieldModal';
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

export function Agriculture() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchFields();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchFields();
      } else {
        setFields([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

const fetchFields = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch fields owned by the user
    const { data: ownedFields, error: ownedFieldsError } = await supabase
      .from('fields')
      .select('*')
      .eq('owner_id', user.id);

    if (ownedFieldsError) throw ownedFieldsError;

    // Fetch fields where the user is a member
    const { data: memberFields, error: memberFieldsError } = await supabase
      .from('field_members')
      .select('field_id')
      .eq('user_id', user.id);

    if (memberFieldsError) throw memberFieldsError;

    const memberFieldIds = memberFields.map(member => member.field_id);

    // Fetch details of fields where the user is a member
    const { data: memberFieldDetails, error: memberFieldDetailsError } = await supabase
      .from('fields')
      .select('*')
      .in('id', memberFieldIds);

    if (memberFieldDetailsError) throw memberFieldDetailsError;

    // Combine owned and member fields
    const allFields = [...ownedFields, ...memberFieldDetails];

    // Get member counts for each field
    const fieldsWithCounts = await Promise.all(
      allFields.map(async (field) => {
        const { count } = await supabase
          .from('field_members')
          .select('*', { count: 'exact', head: true })
          .eq('field_id', field.id);

        return {
          ...field,
          _count: { members: (count || 0) + 1 } // +1 for owner
        };
      })
    );

    setFields(fieldsWithCounts);
  } catch (err: any) {
    console.error('Error fetching fields:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-[#F3k7EE] to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-accent-base/10 rounded-full">
              <Calendar className="h-12 w-12 text-accent-text" />
            </div>
          </div>
          <h1 className="text-4xl font-gelica font-bold text-content mb-6">
            Agricultural Field Management
          </h1>
          <p className="text-xl text-content/70 mb-8 max-w-2xl mx-auto">
            Create and manage your agricultural fields, track activities, and collaborate with others. Sign in to get started.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
            >
              Sign in to Start
            </button>
            <p className="text-sm text-content/60">
              Don't have an account? <button onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))} className="text-accent-text hover:text-accent-text/80">Create one now</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile Full-Width Header */}
      <div className="lg:hidden relative h-64 overflow-hidden -mx-4 sm:-mx-6">
        <img
          src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/planting.webp"
          alt="Design & Manage Your Garden Layout"
          className="w-full h-full object-cover shadow-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
      </div>

      {/* Mobile Content Below Image */}
      <div className="lg:hidden px-4 py-8 text-center bg-gray-50 -mx-4 sm:-mx-6">
        <h1 className="text-3xl font-gelica font-bold text-content mb-4">
          Design & Manage Your Garden Layout
        </h1>
        <p className="text-lg text-content/70 mb-6 max-w-md mx-auto">
        Track planting schedules, work on a solo project or together with your garden team, and explore layout designs.
        </p>
        <Link
          to="/practitioners?categories=Permaculture_Designer"
          className="inline-flex items-center px-6 py-3 bg-accent-text text-white rounded-lg font-medium hover:bg-accent-text/90 transition-colors shadow-sm"
        >
          Find Permaculture Experts
        </Link>
      </div>

      {/* Desktop Hero */}
      <div className="hidden lg:block relative mb-12">
        <div className="py-8 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-gelica leading-tight mb-6">
                  Design & Manage Your Garden Layout
                </h1>
                <p className="text-lg lg:text-xl text-gray-600 mb-6">
                Track planting schedules, work on a solo project or together with your garden team, and explore layout designs. 
                </p>
                <div className="mb-6">
                  <Link
                    to="/practitioners?categories=Permaculture_Designer"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
                  >
                    Find Permaculture Experts
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <img 
                  src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/planting.webp" 
                  alt="Agriculture Management"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Meta 
        title="Agricultural Field Management"
        description="Create and manage your agricultural fields, track activities, and collaborate with others."
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-content">Agricultural Fields</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-base/10 rounded-md"
          >
            <Info className="h-4 w-4 mr-2" />
            {showInfo ? 'Hide Information' : 'More Information'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-text hover:bg-accent-text/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Field
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="max-w-4xl mx-auto mb-12 animate-fade-in">
          <h2 className="text-xl font-semibold text-content mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-accent-base/20 flex items-center justify-center text-accent-text font-bold">1</div>
                <h3 className="ml-3 font-medium text-content">Create Your Field</h3>
              </div>
              <p className="text-content/70">Start by creating your agricultural field and adding basic information like location and description.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-accent-base/20 flex items-center justify-center text-accent-text font-bold">2</div>
                <h3 className="ml-3 font-medium text-content">Add Team Members</h3>
              </div>
              <p className="text-content/70">Invite family members or collaborators to join your field and work together.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-accent-base/20 flex items-center justify-center text-accent-text font-bold">3</div>
                <h3 className="ml-3 font-medium text-content">Track Activities</h3>
              </div>
              <p className="text-content/70">Log and manage field tasks like planting, watering, and harvesting in a shared calendar.</p>
            </div>
          </div>
          
          {/* Video Tutorial Section */}
          <div className="mt-8 bg-gradient-to-r from-accent-text/5 to-accent-text/10 rounded-xl p-6 border border-accent-text/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-content mb-2">Complete Process Overview</h3>
                <p className="text-content/70 mb-4">
                  Watch this comprehensive video guide that walks through the entire agricultural management process from start to finish.
                </p>
              </div>
            </div>
            <a
              href="https://www.youtube.com/watch?v=KsrbxM-2x98"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Watch Complete Tutorial
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
        </div>
      ) : fields.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Calendar className="h-12 w-12 text-content/20 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-content mb-2">No Fields Yet</h2>
          <p className="text-content/60 mb-6">
            Create your first agricultural field to start tracking activities and collaborating with others.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-base/10 rounded-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Field
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <div
              key={field.id}
              className="relative rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Background Image */}
              <div className="absolute inset-0 w-full h-full">
                <img 
                  src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/fieldbg.png" 
                  alt="" 
                  className="w-full h-full object-cover opacity-100"
                />
                <div className="absolute inset-0 bg-white/90 "></div>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold text-content mb-2 relative z-10">
                  {field.name}
                </h3>
                {field.description && (
                  <p className="text-content/80 mb-4 line-clamp-2 relative z-10">
                    {field.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-content/60 relative z-10">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{field._count?.members || 1} members</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {new Date(field.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 relative z-10 border-t border-accent-text/10">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center text-sm text-content/60">
                    <Info className="h-4 w-4 mr-1" />
                    <span>
                      {europeanCountries.find(c => c.value === field.country)?.label || field.country}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/agriculture/${field.id}`)}
                    className="inline-flex items-center px-3 py-1 text-sm text-accent-text hover:bg-accent-text hover:text-white rounded-md transition-colors"
                  >
                    View Field
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateFieldModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchFields();
          }}
        />
      )}
    </div>
  );
}

export default Agriculture;