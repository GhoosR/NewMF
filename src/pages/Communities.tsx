import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { CommunityCard } from '../components/Communities/CommunityCard'; 
import { CreateCommunityModal } from '../components/Communities/CreateCommunityModal';
import { SubscriptionModal } from '../components/Subscription/SubscriptionModal';
import { Auth } from '../components/Auth';
import { Meta } from '../components/Meta';
import { supabase } from '../lib/supabase';
import { isProfessional } from '../lib/auth/authService';
import { Leaf } from 'lucide-react';
import type { Community } from '../types/communities';

// Official group owner ID
const OFFICIAL_OWNER_ID = '8a5791a8-8dbc-4c49-a146-f5768d0007ed';

export function Communities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [canCreateCommunity, setCanCreateCommunity] = useState(false);
  const [filter, setFilter] = useState<'all' | 'official' | 'community'>('all');

  const fetchCommunities = async () => {
    try {
      // First fetch all communities
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select(`
          *,
          owner:users!communities_owner_id_fkey (
            id,
            username,
            avatar_url
          )
        `);

      if (communitiesError) throw communitiesError;

      // Then fetch member counts separately to avoid recursion
      const communitiesWithCounts = await Promise.all(
        communitiesData.map(async (community) => {
          const { count } = await supabase
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id);

          return {
            ...community,
            _count: {
              members: count || 0
            }
          };
        })
      );

      setCommunities(communitiesWithCounts);
    } catch (err: any) {
      console.error('Error fetching communities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        checkAccess();
      } else {
        setCanCreateCommunity(false);
      }
    });

    // Fetch communities regardless of auth status
    fetchCommunities();

    return () => subscription.unsubscribe();
  }, []);

  const checkAccess = async () => {
    const hasProfessionalAccess = await isProfessional();
    setCanCreateCommunity(hasProfessionalAccess);
  };

  const handleCreateCommunity = () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('show-auth'));
    } else if (canCreateCommunity) {
      setShowCreateModal(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  // Filter communities based on selected filter
  const filteredCommunities = communities.filter(community => {
    if (filter === 'all') return true;
    if (filter === 'official') return community.owner_id === OFFICIAL_OWNER_ID;
    if (filter === 'community') return community.owner_id !== OFFICIAL_OWNER_ID;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-[#F3F7EE] to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-accent-base/10 rounded-full">
              <Leaf className="h-12 w-12 text-accent-text" />
            </div>
          </div>
          <h1 className="text-4xl font-gelica font-bold text-content mb-6">
            Join Our Wellness Communities
          </h1>
          <p className="text-xl text-content/70 mb-8 max-w-2xl mx-auto">
            Connect with like-minded individuals, share experiences, and grow together in our vibrant wellness communities. Free for all members!
          </p>
          <div className="space-y-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
            >
              Sign in to Join Communities
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
    <div>
      <Meta 
        title="Wellness Communities & Groups | Mindful Family"
        description="Join vibrant wellness communities and connect with like-minded people. Share experiences and grow together in your wellness journey."
      />
      
      {/* Mobile Full-Width Header */}
      <div className="lg:hidden relative h-64 overflow-hidden">
        <img
          src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/humans-connecting.png"
          alt="Join Wellness Communities"
          className="w-full h-full object-cover shadow-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
      </div>

      {/* Mobile Content Below Image */}
      <div className="lg:hidden px-4 py-8 text-center bg-gray-50">
        <h1 className="text-3xl font-gelica font-bold text-content mb-4">
          Join Wellness Communities
        </h1>
        <p className="text-lg text-content/70 mb-6 max-w-md mx-auto">
          Connect with like-minded individuals, share experiences, and grow together in our vibrant wellness communities.
        </p>
        {isAuthenticated ? (
          <button 
            onClick={handleCreateCommunity}
            className="px-6 py-3 bg-accent-text text-white rounded-lg font-medium hover:bg-accent-text/90 transition-colors shadow-sm"
          >
            Create Community
          </button>
        ) : (
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
            className="px-6 py-3 bg-accent-text text-white rounded-lg font-medium hover:bg-accent-text/90 transition-colors shadow-sm"
          >
            Sign in to Create
          </button>
        )}
      </div>

      {/* Desktop Hero */}
      <div className="hidden lg:block">
        <div className="relative mb-12 bg-gradient-to-b from-[#F3F7EE] to-gray-50 overflow-hidden">
          <div className="py-8 lg:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl lg:text-5xl font-gelica leading-tight mb-6">
                    Join Wellness Communities
                  </h1>
                  <p className="text-lg lg:text-xl text-gray-600 mb-6">
                    Connect with like-minded individuals, share experiences, and grow together in our vibrant wellness communities.
                  </p>
                  <div className="mb-6">
                    {isAuthenticated ? (
                      <button 
                        onClick={handleCreateCommunity}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
                      >
                        Create Community
                      </button>
                    ) : (
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
                      >
                        Sign in to Create
                      </button>
                    )}
                  </div>
                </div>
                <div className="hidden lg:block">
                  <img 
                    src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/humans-connecting.png" 
                    alt="Wellness Communities"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-accent-text text-white'
                    : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('official')}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  filter === 'official'
                    ? 'bg-accent-text text-white'
                    : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
                }`}
              >
                Official Communities
              </button>
              <button
                onClick={() => setFilter('community')}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  filter === 'community'
                    ? 'bg-accent-text text-white'
                    : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
                }`}
              >
                Communities
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="text-red-600 mb-4">{error}</div>
        )}

        {communities.length === 0 ? (
          <div className="bg-background rounded-lg p-8 text-center">
            <p className="text-content">No communities available</p>
          </div>
        ) : (
          <>
            {!isAuthenticated && (
              <div className="bg-accent-base/10 border border-accent-text/10 rounded-lg p-4 mb-6">
                <p className="text-content/80">
                  Sign in to join communities and participate in discussions. 
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
                    className="ml-2 text-accent-text hover:text-accent-text/80"
                  >
                    Sign in now
                  </button>
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCommunities.length === 0 ? (
                <div className="col-span-full text-center py-8 text-content/60">
                  {filter === 'official' 
                    ? 'No official groups found' 
                    : filter === 'community' 
                      ? 'No community groups found' 
                      : 'No communities found'}
                </div>
              ) : filteredCommunities.map((community) => (
                <div 
                  key={community.id}
                  onClick={() => !isAuthenticated && window.dispatchEvent(new CustomEvent('show-auth'))}
                  className={!isAuthenticated ? 'cursor-pointer' : undefined}
                >
                  <CommunityCard 
                    community={community}
                    disabled={!isAuthenticated}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {showCreateModal && (
          <CreateCommunityModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchCommunities();
            }}
          />
        )}

        {showUpgradeModal && (
          <SubscriptionModal
            onClose={() => setShowUpgradeModal(false)}
            onSuccess={() => {
              setShowUpgradeModal(false);
              checkAccess();
            }}
          />
        )}
      </div>
    </div>
  );
}