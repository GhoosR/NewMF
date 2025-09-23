import React, { useState, useEffect } from 'react';
import { Modal } from '../../Modal';
import { TextArea } from './FormComponents/TextArea';
import { MultiSelect } from './FormComponents/MultiSelect';
import { SelectInput } from './FormComponents/SelectInput';
import { ArrowLeft, ArrowRight, Briefcase, Building2, MapPin, Mail } from 'lucide-react';
import { europeanCountries } from '../../../lib/constants/countries';
import { supabase } from '../../../lib/supabase';

interface JobFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editId?: string;
}

type Step = 'basics' | 'details' | 'requirements' | 'contact';

interface StepConfig {
  id: Step;
  title: string;
  icon: React.ComponentType<any>;
}

const steps: StepConfig[] = [
  { id: 'basics', title: 'Basic Info', icon: Briefcase },
  { id: 'details', title: 'Details', icon: Building2 },
  { id: 'requirements', title: 'Requirements', icon: MapPin },
  { id: 'contact', title: 'Contact', icon: Mail },
];

const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
  { value: 'volunteer', label: 'Volunteer' },
];

const COMMON_REQUIREMENTS = [
  { value: 'certification', label: 'Professional Certification' },
  { value: 'experience', label: 'Previous Experience' },
  { value: 'education', label: 'Relevant Education' },
  { value: 'language', label: 'Language Skills' },
  { value: 'remote', label: 'Remote Work Experience' },
];

export function JobForm({ onClose, onSuccess, editId }: JobFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    description: '',
    location: '',
    country: '',
    job_type: '',
    salary_range: '',
    requirements: [] as string[],
    contact_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch job data if editing
    if (editId) {
      const fetchJob = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('job_offers')
            .select('*')
            .eq('id', editId)
            .single();

          if (error) throw error;
          if (!data) throw new Error('Job not found');

          setFormData({
            title: data.title,
            company_name: data.company_name,
            description: data.description,
            location: data.location,
            country: data.country || '',
            job_type: data.job_type,
            salary_range: data.salary_range,
            requirements: data.requirements || [],
            contact_email: data.contact_email
          });
        } catch (err: any) {
          console.error('Error fetching job:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchJob();
    }
  }, [editId]);

  const isStepValid = () => {
    switch (currentStep) {
      case 'basics':
        return formData.title && formData.company_name && formData.description;
      case 'details':
        return formData.location && formData.country && formData.job_type;
      case 'requirements':
        return formData.requirements.length > 0 && formData.salary_range;
      case 'contact':
        return formData.contact_email;
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

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const jobData = {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      title: formData.title,
      company_name: formData.company_name,
      description: formData.description,
      location: formData.location,
      country: formData.country,
      job_type: formData.job_type,
      salary_range: formData.salary_range,
      requirements: formData.requirements,
      contact_email: formData.contact_email
    };

    try {
      let error;
      
      if (editId) {
        // Update existing job
        const { error: updateError } = await supabase
          .from('job_offers')
          .update(jobData)
          .eq('id', editId);
        
        error = updateError;
      } else {
        // Create new job
        const { error: insertError } = await supabase
          .from('job_offers')
          .insert([jobData]);
        
        error = insertError;
      }

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-content mb-2">Job Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="e.g., Yoga Instructor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-2">Company Name *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="Your company name"
              />
            </div>

            <TextArea
              label="Job Description"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe the role, responsibilities, and requirements..."
              required
            />
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-content mb-2">Job Type *</label>
              <select
                required
                value={formData.job_type}
                onChange={(e) => setFormData(prev => ({ ...prev, job_type: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              >
                <option value="">Select job type</option>
                {JOB_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <SelectInput
              label="Country"
              value={formData.country}
              onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              options={europeanCountries}
              required
            />

            <div>
              <label className="block text-sm font-medium text-content mb-2">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="City or Remote"
              />
            </div>
          </div>
        );

      case 'requirements':
        return (
          <div className="space-y-6">
            <MultiSelect
              label="Requirements"
              options={COMMON_REQUIREMENTS}
              selectedValues={formData.requirements}
              onChange={(values) => setFormData(prev => ({ ...prev, requirements: values }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-content mb-2">Salary Range *</label>
              <input
                type="text"
                required
                value={formData.salary_range}
                onChange={(e) => setFormData(prev => ({ ...prev, salary_range: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="e.g., €30,000 - €45,000 per year"
              />
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-content mb-2">Contact Email *</label>
              <input
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <Modal title="Add Job Listing" onClose={onClose} fullScreenOnMobile={true}>
      {/* Progress Steps */}
      <div className="mb-8">
        {/* Desktop Steps */}
        <div className="hidden md:block">
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPast = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors p-3
                    ${isActive || isPast 
                      ? 'border-accent-text bg-accent-text text-white' 
                      : 'border-accent-text/20 text-content/60'
                    }
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-full h-0.5 mx-2 ${
                      isPast ? 'bg-accent-text' : 'bg-accent-text/20'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span key={step.id} className="text-xs text-content/60 w-20 text-center">
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Mobile Steps */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <span className="text-sm text-content/60">Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}</span>
          <span className="text-sm font-medium text-content">{steps.find(s => s.id === currentStep)?.title}</span>
        </div>
        <div className="md:hidden bg-accent-base/10 rounded-full h-2 mb-6">
          <div 
            className="h-full bg-accent-text rounded-full transition-all duration-300"
            style={{ 
              width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {error && (
        <div className="mb-6 text-red-600 text-sm bg-red-50 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep !== 'basics' ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center px-4 py-2 text-sm font-medium text-content hover:text-content/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        ) : (
          <div></div>
        )}
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-content hover:text-content/80"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            disabled={loading || !isStepValid()}
            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50"
          >
            {loading ? (
              'Creating...'
            ) : currentStep === 'contact' ? (
              editId ? 'Update Job' : 'Create Job'
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}