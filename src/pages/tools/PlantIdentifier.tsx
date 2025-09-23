import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertTriangle, Loader2, Leaf, Info, Heart, Skull, Sprout, Flower2, XCircle, LogIn, CheckCircle, Droplets } from 'lucide-react';
import { Meta } from '../../components/Meta';
import { identifyPlant } from '../../lib/services/claudeService';
import { supabase } from '../../lib/supabase';
import { Auth } from '../../components/Auth';

interface PlantInfo {
  isPlant: boolean;
  name: string | null;
  scientificName: string | null;
  description: string | null;
  uses?: string[] | null;
  edible: boolean;
  medicinal: boolean;
  toxic: boolean;
  isHealthy: boolean;
  healthIssues: string[] | null;
  careInstructions: {
    watering: string;
    sunlight: string;
    soil: string;
    fertilizing: string;
  } | null;
  confidence: number;
}

export default function PlantIdentifier() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlantInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dailyAttempts, setDailyAttempts] = useState<number>(0);
  const [authLoading, setAuthLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);

        if (user) {
          const { data: attempts } = await supabase.rpc('check_daily_attempts', { user_id: user.id });
          setDailyAttempts(attempts || 0);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        const { data: attempts } = await supabase.rpc('check_daily_attempts', { user_id: session.user.id });
        setDailyAttempts(attempts || 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP).');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setLoading(false);
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      setError(
        'Image file is too large (max 10MB). Tip: You can take a screenshot of the image to reduce its size.'
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setLoading(false);
      return;
    }

    try {
      // Clean up previous image URL if it exists
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }

      // Create image URL for preview
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;
          const { content, confidence } = await identifyPlant(base64Image);
          if (!content || !content.isPlant === undefined) {
            throw new Error('Failed to analyze image. Please try again with a clearer photo.');
          }
          setResult({ ...content, confidence });
          // Update attempts count after successful identification
          setDailyAttempts(prev => prev + 1);
        } catch (err: any) {
          console.error('Error processing image:', err);
          setError(err.message || 'Failed to process image. Please try again.');
          if (selectedImage) {
            URL.revokeObjectURL(selectedImage);
          }
          setSelectedImage(null);
        } finally {
          setLoading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the input
          }
        }
      };

      reader.onerror = () => {
        const errorMsg = 'Failed to read image file. Please try a different image or check if the file is corrupted.';
        setError(errorMsg);
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (selectedImage) {
          URL.revokeObjectURL(selectedImage);
          setSelectedImage(null);
        }
      };
    } catch (err: any) {
      console.error('Error handling file:', err);
      setError(err.message || 'Failed to handle image file. Please try again.');
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
    }
  };

  const handleTakePhoto = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (dailyAttempts >= 3) {
      setError('Daily limit reached. You can analyze up to 3 plants per day.');
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'camera';
      fileInputRef.current.click();
    }
  };

  const handleUploadPhoto = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (dailyAttempts >= 3) {
      setError('Daily limit reached. You can analyze up to 3 plants per day.');
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  // Clean up object URL when component unmounts or when image changes
  React.useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-[#F3F7EE] to-[#f9fafc]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-accent-base/10 rounded-full">
              <Leaf className="h-12 w-12 text-accent-text" />
            </div>
          </div>
          <h1 className="text-4xl font-gelica font-bold text-content mb-6">
            Identify Plants with AI
          </h1>
          <p className="text-xl text-content/70 mb-8 max-w-2xl mx-auto">
            Sign in to access our advanced plant identification tool. Analyze up to 3 plants per day and discover their properties.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Sign in to Start
            </button>
            <p className="text-sm text-content/60">
              Don't have an account? <button onClick={() => setShowAuthModal(true)} className="text-accent-text hover:text-accent-text/80">Create one now</button>
            </p>
          </div>
        </div>

        {showAuthModal && (
          <Auth onClose={() => setShowAuthModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Meta 
        title="Plant Identifier"
        description="Identify plants and learn about their properties using our AI-powered plant recognition tool."
      />

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-content mb-4">Plant Identifier</h1>
        <p className="text-content/70 mb-2">
          Take or upload a photo of a plant to identify it and learn about its properties.
        </p>
        <p className="text-sm text-accent-text">
          {3 - dailyAttempts} identifications remaining today
        </p>
      </div>

      {/* Warning Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Important Safety Notice</p>
            <p>
              While our plant identification tool is highly accurate, never consume or use plants solely based on this identification. Always verify with a qualified expert, especially for medicinal or edible use.
            </p>
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={handleTakePhoto}
            className="relative group overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-text/5 to-accent-text/10 group-hover:scale-105 transition-transform duration-300"></div>
            <div className="relative p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-white rounded-full shadow-sm mb-4">
                <Camera className="h-6 w-6 text-accent-text" />
              </div>
              <h3 className="font-medium text-content mb-2">Take Photo</h3>
              <p className="text-sm text-content/60">Use your device's camera</p>
            </div>
          </button>
          
          <button
            onClick={handleUploadPhoto}
            className="relative group overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-text/5 to-accent-text/10 group-hover:scale-105 transition-transform duration-300"></div>
            <div className="relative p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-white rounded-full shadow-sm mb-4">
                <Upload className="h-6 w-6 text-accent-text" />
              </div>
              <h3 className="font-medium text-content mb-2">Upload Photo</h3>
              <p className="text-sm text-content/60">Choose from your gallery</p>
            </div>
          </button>
        </div>

        <p className="mt-6 text-sm text-content/60 text-center">
          Supported formats: JPEG, PNG, WebP • Max size: 10MB
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Preview and Results */}
      {(selectedImage || loading || error || result) && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {selectedImage && (
            <div className="relative p-6 pb-0">
              <div className="relative aspect-square sm:aspect-video w-full overflow-hidden rounded-xl border border-accent-text/10 bg-accent-base/5">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Selected plant"
                    className="w-full h-full object-contain"
                  />
                </div>
                {loading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                    <p className="text-white text-sm">Analyzing image...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-6">
            {error && (
              <div className="flex items-center justify-center p-4 bg-red-50 rounded-xl text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            {result && !result.isPlant && (
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl text-content/80">
                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Not a Plant</h3>
                <p className="text-center">
                  The image doesn't appear to show a plant. Please upload a clear photo of a plant for identification.
                </p>
              </div>
            )}

            {result && result.isPlant && result.name && (
              <div className="space-y-6">
                {/* Header with Confidence Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-content">{result.name}</h2>
                    <p className="text-content/60 italic">{result.scientificName}</p>
                  </div>
                  <div className="inline-flex items-center px-3 py-1 bg-accent-base/10 rounded-full">
                    <Info className="h-4 w-4 text-accent-text mr-2" />
                    <span className="text-accent-text text-sm">
                      {Math.round(result.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg ${result.edible ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center mb-2 transition-colors">
                      <Sprout className={`h-5 w-5 mr-2 ${result.edible ? 'text-green-600' : 'text-gray-400'}`} />
                      <h3 className="font-medium">Edible</h3>
                    </div>
                    <p className={result.edible ? 'text-green-700' : 'text-gray-500'}>
                      {result.edible ? 'Safe to consume' : 'Not confirmed edible'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${result.medicinal ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center mb-2">
                      <Heart className={`h-5 w-5 mr-2 ${result.medicinal ? 'text-blue-600' : 'text-gray-400'}`} />
                      <h3 className="font-medium">Medicinal</h3>
                    </div>
                    <p className={result.medicinal ? 'text-blue-700' : 'text-gray-500'}>
                      {result.medicinal ? 'Has medicinal properties' : 'No known medicinal use'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${result.toxic ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center mb-2">
                      <Skull className={`h-5 w-5 mr-2 ${result.toxic ? 'text-red-600' : 'text-gray-400'}`} />
                      <h3 className="font-medium">Toxicity</h3>
                    </div>
                    <p className={result.toxic ? 'text-red-700' : 'text-gray-500'}>
                      {result.toxic ? '⚠️ Toxic - Exercise caution' : 'No known toxicity'}
                    </p>
                  </div>
                </div>

                {/* Health Status */}
                {result.isHealthy !== undefined && (
                  <div className={`mt-4 p-4 rounded-lg ${result.isHealthy ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <div className="flex items-center mb-2">
                      <div className={`p-1 rounded-full ${result.isHealthy ? 'bg-green-100' : 'bg-amber-100'}`}>
                        {result.isHealthy ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <h3 className="font-medium text-content ml-2">
                        Plant Health: {result.isHealthy ? 'Healthy' : 'Needs Attention'}
                      </h3>
                    </div>
                    
                    {!result.isHealthy && result.healthIssues && result.healthIssues.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-amber-800 mb-1">Possible Issues:</h4>
                        <ul className="space-y-1">
                          {result.healthIssues.map((issue, index) => (
                            <li key={index} className="text-sm text-amber-700 flex items-start">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Care Instructions */}
                {result.careInstructions && (
                  <div className="mt-4 bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center mb-3">
                      <Droplets className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-content">Care Instructions</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.careInstructions.watering && (
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <h4 className="text-sm font-medium text-blue-700 mb-1">Watering</h4>
                          <p className="text-sm text-content/80">{result.careInstructions.watering}</p>
                        </div>
                      )}
                      {result.careInstructions.sunlight && (
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <h4 className="text-sm font-medium text-amber-700 mb-1">Sunlight</h4>
                          <p className="text-sm text-content/80">{result.careInstructions.sunlight}</p>
                        </div>
                      )}
                      {result.careInstructions.soil && (
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <h4 className="text-sm font-medium text-brown-700 mb-1">Soil</h4>
                          <p className="text-sm text-content/80">{result.careInstructions.soil}</p>
                        </div>
                      )}
                      {result.careInstructions.fertilizing && (
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <h4 className="text-sm font-medium text-green-700 mb-1">Fertilizing</h4>
                          <p className="text-sm text-content/80">{result.careInstructions.fertilizing}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {result.description && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <Flower2 className="h-5 w-5 text-accent-text mr-2" />
                      <h3 className="font-medium text-content">Description</h3>
                    </div>
                    <p className="text-content/80 leading-relaxed">{result.description}</p>
                  </div>
                )}

                {/* Uses */}
                {result.uses && result.uses.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-medium text-content mb-3">Common Uses</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.uses.map((use, index) => (
                        <div 
                          key={index}
                          className="flex items-center bg-white p-3 rounded-lg shadow-sm"
                        >
                          <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-2"></span>
                          <span className="text-content/80">{use}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety Notice */}
                <div className="bg-accent-base/5 rounded-xl p-4 text-sm border border-accent-text/10">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-4 w-4 text-accent-text mr-2" />
                    <span className="font-medium text-content">Safety Notice</span>
                  </div>
                  <p className="text-content/80">
                    This identification is provided as a guide only. Please consult with a qualified expert before using any plant for consumption or medicinal purposes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { PlantIdentifier };