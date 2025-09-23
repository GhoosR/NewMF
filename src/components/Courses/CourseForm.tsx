import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { FormInput } from '../ui/FormInput';
import { FormTextArea } from '../ui/FormTextArea';
import { FormSelect } from '../ui/FormSelect';
import { FileInput } from '../Listings/Forms/FormComponents/FileInput';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../lib/hooks/useAdmin';

const categories = [
  { value: 'wellness', label: 'Wellness & Health' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'personal_growth', label: 'Personal Growth' }
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' }
];

interface CourseFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  language: string;
  lessons: {
    title: string;
    description: string;
    duration: string;
    type: 'video' | 'pdf' | 'text';
    content?: string;
    video_url?: string;
  }[];
}

function CourseForm({ onClose, onSuccess }: CourseFormProps) {
  const { isAdmin } = useAdmin();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    language: '',
    lessons: []
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addLesson = () => {
    setFormData(prev => ({
      ...prev,
      lessons: [
        ...prev.lessons,
        {
          title: '',
          description: '',
          duration: '',
          type: 'video',
          content: ''
        }
      ]
    }));
  };

  const removeLesson = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.filter((_, i) => i !== index)
    }));
  };

  const updateLesson = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => 
        i === index ? { ...lesson, [field]: value } : lesson
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (formData.lessons.length === 0) {
      setError('Please add at least one lesson');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload thumbnail if provided
      let thumbnailUrl = '';
      if (thumbnail) {
        const { data: imageData, error: imageError } = await supabase.storage
          .from('course-materials')
          .upload(`${user.id}/thumbnails/${Date.now()}-${thumbnail.name}`, thumbnail);
        
        if (imageError) throw imageError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('course-materials')
          .getPublicUrl(imageData.path);
        
        thumbnailUrl = publicUrl;
      }

      // Create course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert([{
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          language: formData.language,
          price: 0,
          currency: 'EUR',
          thumbnail_url: thumbnailUrl
        }])
        .select()
        .single();

      if (courseError) throw courseError;

      // Upload lesson files and create lessons
      const lessonPromises = formData.lessons.map(async (lesson, index) => {
        let content_url = '';
        if (lesson.type === 'text') {
          content_url = lesson.content || '';
        } else if (lesson.type === 'video' && lesson.video_url) {
          // Convert watch URL to embed URL if needed
          const videoId = lesson.video_url.match(/(?:\/embed\/|watch\?v=|\/v\/|youtu\.be\/|\/v=|\/e\/|watch\?v%3D|watch\?feature=player_embedded&v=|%2Fvideos%2F|embed%\u200C\u200B2F|youtu.be%2F|v%2F)([^#\&\?\n]*)/);
          content_url = videoId ? `https://www.youtube.com/embed/${videoId[1]}` : lesson.video_url;
        }

        return {
          course_id: course.id,
          title: lesson.title,
          description: lesson.description,
          content_url,
          duration: parseInt(lesson.duration),
          type: lesson.type,
          order_number: index + 1
        };
      });

      const lessonData = await Promise.all(lessonPromises);
      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonData);

      if (lessonsError) throw lessonsError;
      
      onSuccess();
    } catch (err: any) {
      console.error('Error creating course:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Course" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 ? (
          <div className="space-y-6">
            <FormInput
              label="Course Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />

            <FormTextArea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                options={categories}
                required
              />

              <FormSelect
                label="Language"
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                options={languages}
                required
              />
            </div>

            <FileInput
              label="Course Thumbnail"
              onChange={(files) => setThumbnail(files[0])}
              maxFiles={1}
              maxSize={2}
              accept="image/*"
              description="Upload a thumbnail image for your course"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-content">Course Lessons</h3>
              <button
                type="button"
                onClick={addLesson}
                className="text-sm text-accent-text hover:text-accent-text/80"
              >
                + Add Lesson
              </button>
            </div>

            {formData.lessons.map((lesson, index) => (
              <div key={index} className="space-y-4 p-4 bg-accent-base/5 rounded-lg">
                <div className="flex justify-between">
                  <h4 className="font-medium text-content">Lesson {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeLesson(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <FormInput
                  label="Title"
                  value={lesson.title}
                  onChange={(e) => updateLesson(index, 'title', e.target.value)}
                  required
                />

                <FormTextArea
                  label="Description"
                  value={lesson.description}
                  onChange={(e) => updateLesson(index, 'description', e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    label="Content Type"
                    value={lesson.type}
                    onChange={(e) => {
                      const type = e.target.value as 'video' | 'pdf' | 'text';
                      updateLesson(index, 'type', type);
                      // Clear content when switching types
                      updateLesson(index, 'content', '');
                      updateLesson(index, 'video_url', '');
                    }}
                    options={[
                      { value: 'video', label: 'Video' },
                      { value: 'text', label: 'Text Content' }
                    ]}
                    required
                  />

                  <FormInput
                    label="Duration (minutes)"
                    type="number"
                    min="1"
                    value={lesson.duration}
                    onChange={(e) => updateLesson(index, 'duration', e.target.value)}
                    required
                  />
                </div>

                {lesson.type === 'text' ? (
                  <FormTextArea
                    label="Content"
                    value={lesson.content}
                    onChange={(e) => updateLesson(index, 'content', e.target.value)}
                    required
                  />
                ) : lesson.type === 'video' ? (
                  <div>
                    <label className="block text-sm font-medium text-content mb-2">Video URL</label>
                    <input
                      type="text"
                      value={lesson.video_url || ''}
                      onChange={(e) => updateLesson(index, 'video_url', e.target.value)}
                      placeholder="Enter YouTube video URL"
                      className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                      required
                    />
                    <p className="mt-1 text-sm text-content/60">
                      Paste a YouTube embed URL (e.g., https://www.youtube.com/embed/VIDEO_ID)
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-3">
          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-sm font-medium text-content hover:text-content/80"
            >
              Back
            </button>
          )}
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
            {loading ? 'Creating...' : currentStep === 1 ? 'Next' : 'Create Course'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export { CourseForm };