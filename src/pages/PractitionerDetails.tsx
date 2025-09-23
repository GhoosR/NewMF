import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Globe, ArrowLeft, Mic2, Coins, Edit, Trash2, FileText, CheckCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PackageDisplay } from '../components/Practitioners/PackageDisplay';
import { Avatar } from '../components/Profile/Avatar';
import { Username } from '../components/Profile/Username';
import { BookmarkButton } from '../components/BookmarkButton';
import { PractitionerForm } from '../components/Listings/Forms/PractitionerForm';
import { ImageGalleryModal } from '../components/ui/ImageGalleryModal';
import { languages } from '../lib/constants/languages';
import { europeanCountries } from '../lib/constants/countries';
import { formatCategoryName, formatWorkArrangement } from '../lib/utils/formatters';
import type { Practitioner } from '../types/practitioners';

export function PractitionerDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [packages, setPackages] = useState<PractitionerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Practitioner | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const getFullLanguages = (languageString: string) => {
    return languageString.split(',')
      .map(lang => {
        const language = languages.find(l => l.value === lang.trim());
        return language ? language.label : lang.trim();
      })
      .join(', ');
  };

  const getFullCountryName = (countryCode: string) => {
    const country = europeanCountries.find(c => c.value === countryCode);
    return country ? country.label : countryCode;
  };

  const formatPriceList = (priceList: string) => {
    // First try to match the exact price with currency
    const exactMatch = priceList.match(/(\d+(?:\.\d+)?)\s*([€$£]|EUR|USD|GBP)\s*(?:\/|per)?\s*h(?:our)?/i);
    if (exactMatch) {
      const [_, amount, currencyMatch] = exactMatch;
      
      // Normalize currency to symbol
      const currencyMap: Record<string, string> = {
        'EUR': '€',
        'USD': '$',
        'GBP': '£',
        '€': '€',
        '$': '$',
        '£': '£'
      };

      // Use matched currency or default to €
      const currency = currencyMap[currencyMatch?.toUpperCase() || ''] || currencyMatch || '€';
      
      return `${currency}${amount}/hour`;
    }

    // If no currency pattern found, try to match just the number
    const numberMatch = priceList.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      return `€${numberMatch[1]}/hour`;
    }

    return null;
  };

  const handleDelete = async () => {
    if (!practitioner?.id || !window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('practitioners')
        .delete()
        .eq('id', practitioner.id);

      if (deleteError) throw deleteError;
      navigate('/practitioners');
    } catch (err: any) {
      console.error('Error deleting practitioner:', err);
      alert('Failed to delete listing. Please try again.');
    }
  };

  useEffect(() => {
    async function fetchPractitioner() {
      if (!slug) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setIsAuthenticated(!!currentUser);
        
        if (currentUser) {
          const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', currentUser.id)
            .single();
          setIsAdmin(!!userData?.is_admin);
        }

        // Fetch practitioner data
        const { data: practitionerData, error: practitionerError } = await supabase
          .from('practitioners')
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

        if (practitionerError) throw practitionerError;
        if (!practitionerData) throw new Error('Practitioner not found');

        // Fetch packages
        const { data: packagesData, error: packagesError } = await supabase
          .from('practitioner_packages')
          .select('*')
          .eq('practitioner_id', practitionerData.id)
          .order('price', { ascending: true });

        if (packagesError) throw packagesError;

        setPractitioner(practitionerData);
        setPackages(packagesData || []);

        setIsOwnProfile(currentUser?.id === practitionerData.user_id);
      } catch (err: any) {
        console.error('Error fetching practitioner:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPractitioner();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !practitioner) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <Link 
          to="/practitioners"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to practitioners
        </Link>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">
            {error || 'Practitioner not found'}
          </h2>
          <Link 
            to="/practitioners" 
            className="text-accent-text hover:text-accent-text/80"
          >
            View all practitioners
          </Link>
        </div>
      </div>
    );
  }

  const price = practitioner.price_list ? formatPriceList(practitioner.price_list) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <Link 
          to="/practitioners"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to practitioners
        </Link>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative h-64 sm:h-96">
              <img
                src={practitioner.images?.[0] || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1920'}
                alt={practitioner.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {practitioner.user && (
                  <Link 
                    to={`/profile/${practitioner.user.id}/listings`}
                    className="flex items-center space-x-3 group"
                  >
                    <Avatar 
                      url={practitioner.user.avatar_url} 
                      size="md"
                      userId={practitioner.user.id}
                      editable={false}
                    />
                    <div>
                      <Username 
                        username={practitioner.user.username || 'Anonymous'}
                        userId={practitioner.user.id}
                        verified={!!practitioner.user?.verified}
                        className="block text-sm font-medium text-content group-hover:text-accent-text"
                      />
                      <span className="block text-sm text-content/60">
                        Member since {new Date(practitioner.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {!isOwnProfile && practitioner.user && (
                    <>
                      {isAuthenticated ? (
                        <Link
                          to={`/chat/${practitioner.user.id}`}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Link>
                      ) : (
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Sign in to Message
                        </button>
                      )}
                    </>
                  )}
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => setShowEditModal(practitioner)}
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
                  )}
                  <div className="flex space-x-2">
                    <span className="px-3 py-1 text-sm font-medium bg-accent-base text-accent-text rounded-full">
                      {formatCategoryName(practitioner.category)}
                    </span>
                    {!isOwnProfile && (
                      <BookmarkButton targetId={practitioner.id} targetType="practitioners" />
                    )}
                    {practitioner.corporate_wellness && (
                      <span className="px-3 py-1 text-sm font-medium bg-green-50 text-green-600 rounded-full">
                        Corporate Wellness
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {price && (
                <div className="mb-4">
                  <div className="inline-flex items-center bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg">
                    <Coins className="h-5 w-5 mr-2" />
                    <span className="font-medium">{price}</span>
                  </div>
                </div>
              )}

              <h1 className="text-3xl font-bold text-content mb-4">{practitioner.title}</h1>
            </div>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <MapPin className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Location</h3>
              </div>
              <p className="text-content/80">{practitioner.address || getFullCountryName(practitioner.country)}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <Globe className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Work Arrangement</h3>
              </div>
              <p className="text-content/80">{formatWorkArrangement(practitioner.work_arrangement)}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <Mic2 className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Languages</h3>
              </div>
              <p className="text-content/80">{getFullLanguages(practitioner.language)}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-content mb-4">About</h2>
            <div className="text-content/80 whitespace-pre-line">{practitioner.description}</div>
          </div>

          {/* Packages */}
          {packages.length > 0 && practitioner.user && (
            <PackageDisplay 
              packages={packages}
              practitionerUserId={practitioner.user.id}
            />
          )}

          {/* Services & Expertise */}
          {practitioner.faqs && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-content mb-4">Services & FAQs</h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-line text-content/80 font-sans">{practitioner.faqs}</div>
              </div>
            </div>
          )}

          {/* Certification */}
          {(isAdmin || isOwnProfile) && practitioner.certification_url && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-content mb-4">Certification</h2>
              <div className="bg-accent-base/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-accent-text" />
                    <span className="text-content/80">Certification Document</span>
                  </div>
                  <a 
                    href={practitioner.certification_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-base/20 rounded-md"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Certification
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Gallery */}
          {practitioner.images && practitioner.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-content mb-4">Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {practitioner.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setShowImageGallery(true);
                    }}
                    className="rounded-lg w-full h-48 overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={image}
                      alt={`${practitioner.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showImageGallery && practitioner.images && (
        <ImageGalleryModal
          isOpen={showImageGallery}
          onClose={() => setShowImageGallery(false)}
          images={practitioner.images}
          initialIndex={selectedImageIndex}
        />
      )}

      {showEditModal && showEditModal.id && (
        <PractitionerForm
          onClose={() => setShowEditModal(null)}
          editId={showEditModal.id}
          onSuccess={() => {
            setShowEditModal(null);
            window.location.reload();
          }}
        />
      )}

      {showEditModal && (
        <PractitionerForm
          onClose={() => setShowEditModal(null)}
          editPractitioner={showEditModal}
          onSuccess={() => {
            setShowEditModal(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}