import React, { useState, useEffect } from 'react';
import { Modal } from '../../Modal';
import { TextArea } from './FormComponents/TextArea';
import { CurrencyInput } from './FormComponents/CurrencyInput';
import { FileInput } from './FormComponents/FileInput';
import { SelectInput } from './FormComponents/SelectInput';
import { MultiSelect } from './FormComponents/MultiSelect';
import { PackageInput } from './FormComponents/PackageInput';
import { ArrowLeft, ArrowRight, User2, MapPin, Globe, FileText, Briefcase, Coins, Package } from 'lucide-react';
import { categories } from '../../../lib/constants/categories';
import { europeanCountries } from '../../../lib/constants/countries';
import { languages } from '../../../lib/constants/languages';
import { workArrangements } from '../../../lib/constants';
import { supabase } from '../../../lib/supabase';
import type { PractitionerFormData } from '../../../types/listings';

interface PractitionerFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editId?: string;
}

type Step = 'basics' | 'location' | 'packages' | 'services' | 'media';

interface StepConfig {
  id: Step;
  title: string;
  icon: React.ComponentType<any>;
}

const steps: StepConfig[] = [
  { id: 'basics', title: 'Basic Info', icon: User2 },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'packages', title: 'Packages', icon: Package },
  { id: 'services', title: 'Services', icon: Briefcase },
  { id: 'media', title: 'Media', icon: FileText },
];

export function PractitionerForm({ onClose, onSuccess, editId }: PractitionerFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [formData, setFormData] = useState<PractitionerFormData>({
    category: '',
    title: '',
    description: '',
    work_arrangement: '',
    corporate_wellness: false,
    country: '',
    address: '',
    languages: [],
    currency: 'EUR',
    faqs: '',
    packages: []
  });
  const [images, setImages] = useState<File[]>([]);
  const [certification, setCertification] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingCertificationUrl, setExistingCertificationUrl] = useState<string>('');
  const [loading, setLoading] = useState(!!editId);
  const [error, setError] = useState('');

  // Fetch practitioner data if editing
  useEffect(() => {
    if (editId) {
      const fetchPractitioner = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('practitioners')
            .select('*')
            .eq('id', editId)
            .single();

          if (error) throw error;
          if (data) {
            // Parse price list to extract hourly rate and currency
            let hourlyRate = '';
            let currency = 'EUR';
            
            if (data.price_list) {
              const priceMatch = data.price_list.match(/(\d+(?:\.\d+)?)\s*([A-Z]{3}|[€$£])/i);
              if (priceMatch) {
                hourlyRate = priceMatch[1];
                const currencyMatch = priceMatch[2].toUpperCase();
                // Convert symbols to currency codes
                if (currencyMatch === '€') currency = 'EUR';
                else if (currencyMatch === '$') currency = 'USD';
                else if (currencyMatch === '£') currency = 'GBP';
                else currency = currencyMatch;
              }
            }

            // Fetch existing packages
            const { data: packagesData, error: packagesError } = await supabase
              .from('practitioner_packages')
              .select('*')
              .eq('practitioner_id', data.id)
              .order('price', { ascending: true });

            if (packagesError) throw packagesError;

            const newFormData = {
              category: data.category || '',
              title: data.title || '',
              description: data.description || '',
              work_arrangement: data.work_arrangement || '',
              corporate_wellness: data.corporate_wellness || false,
              country: data.country || '',
              address: data.address || '',
              languages: data.language ? data.language.split(',').map(lang => lang.trim()) : [],
              hourly_rate: hourlyRate,
              currency: currency,
              faqs: data.faqs || '',
              packages: packagesData ? packagesData.map(pkg => ({
                name: pkg.name,
                description: pkg.description,
                price: pkg.price,
                features: pkg.features || []
              })) : []
            };
            
            setFormData(newFormData);
            
            // Set existing images and certification
            if (data.images && data.images.length > 0) {
              setExistingImages(data.images);
            }
            if (data.certification_url) {
              setExistingCertificationUrl(data.certification_url);
            }
          }
        } catch (err) {
          console.error('Error fetching practitioner:', err);
          setError('Failed to load practitioner data');
        } finally {
          setLoading(false);
        }
      };

      fetchPractitioner();
    }
  }, [editId]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload images if any
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          const { data, error } = await supabase.storage
            .from('listing-images')
            .upload(`${user.id}/${Date.now()}-${file.name}`, file);
          
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(data.path);
          
          return publicUrl;
        })
      );

      // Upload certification if provided
      let certificationUrl = '';
      if (certification) {
        const { data: certData, error: certError } = await supabase.storage
          .from('certification-images')
          .upload(`${user.id}/${Date.now()}-${certification.name}`, certification);
        
        if (certError) throw certError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('certification-images')
          .getPublicUrl(certData.path);
        
        certificationUrl = publicUrl;
      } else if (existingCertificationUrl) {
        // Keep existing certification if no new one uploaded
        certificationUrl = existingCertificationUrl;
      }

      // Find the lowest package price for starting_price
      const startingPrice = Math.min(...formData.packages.map(pkg => pkg.price));

      // Prepare data for insert/update
      const practitionerData = {
          user_id: user.id,
          category: formData.category,
          title: formData.title,
          description: formData.description,
          work_arrangement: formData.work_arrangement,
          corporate_wellness: formData.corporate_wellness,
          country: formData.country,
          address: formData.address,
          language: formData.languages.join(','),
          starting_price: startingPrice,
          currency: formData.currency,
          faqs: formData.faqs,
          images: [...existingImages, ...imageUrls],
          certification_url: certificationUrl
      };

      let error;
      
      if (editId) {
        // Update existing practitioner
        const { error: updateError } = await supabase
          .from('practitioners')
          .update(practitionerData)
          .eq('id', editId);
        
        error = updateError;
      } else {
        // Create new practitioner
        const { error: insertError } = await supabase
          .from('practitioners')
          .insert([practitionerData]);
        
        error = insertError;
      }

      if (error) throw error;

      // Get the practitioner ID
      const practitionerId = editId || (await supabase
        .from('practitioners')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      ).data?.id;

      if (!practitionerId) throw new Error('Failed to get practitioner ID');

      // Delete existing packages if editing
      if (editId) {
        const { error: deleteError } = await supabase
          .from('practitioner_packages')
          .delete()
          .eq('practitioner_id', practitionerId);
        
        if (deleteError) throw deleteError;
      }

      // Insert new packages
      const { error: packagesError } = await supabase
        .from('practitioner_packages')
        .insert(formData.packages.map(pkg => ({
          practitioner_id: practitionerId,
          name: pkg.name,
          description: pkg.description,
          price: typeof pkg.price === 'string' ? parseFloat(pkg.price) : pkg.price,
          currency: formData.currency,
          features: pkg.features
        })));

      if (packagesError) throw packagesError;
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(c => c.value === formData.category);

  const isStepValid = () => {
    switch (currentStep) {
      case 'basics':
        return formData.category && formData.title && formData.description;
      case 'location':
        return formData.country && formData.work_arrangement;
      case 'packages':
        return formData.packages.every(pkg => 
          pkg.name && pkg.description && pkg.price !== '' && pkg.price > 0 && pkg.features.length > 0 && pkg.features.every(f => f.trim() !== '')
        );
      case 'services':
        return formData.languages.length > 0;
      case 'media':
        return true; // Media is optional
    }
  };

  const handleNext = () => {
    if (!isStepValid()) {
      setError('Please fill in all required fields');
      return;
    }
    
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    } else {
      handleSubmit();
    }
    setError('');
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
    setError('');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basics':
        return (
          <div className="space-y-6">
            <SelectInput
              label="Category"
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              options={categories}
              required
            />

            <div>
              <label className="block text-sm font-medium text-content mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="e.g., Certified Yoga Instructor"
              />
            </div>

            <TextArea
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe your services..."
              required
            />
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <SelectInput
              label="Work Arrangement"
              value={formData.work_arrangement}
              onChange={(value) => setFormData(prev => ({ ...prev, work_arrangement: value }))}
              options={workArrangements}
              required
            />

            <div>
              <label className="block text-sm font-medium text-content mb-2">Corporate Wellness</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.corporate_wellness}
                  onChange={(e) => setFormData(prev => ({ ...prev, corporate_wellness: e.target.checked }))}
                  className="rounded border-accent-text/20 text-accent-text focus:ring-accent-text"
                />
                <span className="ml-2 text-sm text-content/80">
                  Available for corporate wellness programs
                </span>
              </div>
            </div>

            <SelectInput
              label="Country"
              value={formData.country}
              onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              options={europeanCountries}
              required
            />

            <div>
              <label className="block text-sm font-medium text-content mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="e.g., London, UK"
              />
            </div>
          </div>
        );

      case 'packages':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-content">Service Packages</h3>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-content/80">Currency:</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="px-2 py-1 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
            <PackageInput
              packages={formData.packages}
              onChange={(packages) => setFormData(prev => ({ ...prev, packages }))}
              currency={formData.currency}
            />
          </div>
        );

      case 'services':
        return (
          <div className="space-y-6">
            <MultiSelect
              label="Languages"
              options={languages}
              selectedValues={formData.languages}
              onChange={(values) => setFormData(prev => ({ ...prev, languages: values }))}
              required
            />

            <TextArea
              label="FAQs"
              value={formData.faqs}
              onChange={(value) => setFormData(prev => ({ ...prev, faqs: value }))}
              placeholder="Add frequently asked questions and answers..."
            />
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <FileInput
              label="Images"
              onChange={setImages}
              maxFiles={5}
              accept="image/*"
              multiple
              description="Upload images of your practice, workspace, or yourself (will be automatically compressed)"
            />

            {existingImages.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-content mb-2">Existing Images</h3>
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((url, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={url} 
                        alt={`Practitioner image ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory?.requiresCertification && (
              <FileInput
                label="Certification"
                onChange={(files) => setCertification(files[0])}
                maxFiles={1}
                accept="image/*,application/pdf"
                description="Please upload your certification for this practice (images will be automatically compressed)"
                required
              />
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <Modal title={editId ? "Edit Practitioner Listing" : "Add Practitioner Listing"} onClose={onClose}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
            <span className="ml-3 text-content">Loading practitioner data...</span>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={editId ? "Edit Practitioner Listing" : "Add Practitioner Listing"} onClose={onClose}>
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep === step.id
                  ? 'bg-accent-text text-white'
                  : index < steps.findIndex(s => s.id === currentStep)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                currentStep === step.id ? 'text-accent-text font-medium' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-200 mx-4" />
              )}
            </div>
          ))}
        </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 'basics'}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!isStepValid() || loading}
            className="px-6 py-2 bg-accent-text text-white rounded-md hover:bg-accent-text/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (editId ? 'Updating...' : 'Creating...') : currentStep === 'media' ? (editId ? 'Update Listing' : 'Create Listing') : 'Next'}
          </button>
        </div>
      </div>
    </Modal>
  );
}