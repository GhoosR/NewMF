import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NotepadProps {
  fieldId: string;
}

interface Note {
  id: string;
  content: string;
  updated_at: string;
  user: {
    username: string;
  };
}

export function Notepad({ fieldId }: NotepadProps) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSavedBy, setLastSavedBy] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      const { data } = await supabase
        .from('field_notes')
        .select(`
          content,
          updated_at,
          user:users(username)
        `)
        .eq('field_id', fieldId)
        .single();

      if (data) {
        setContent(data.content);
        setLastSavedBy(data.user.username);
        setLastSavedAt(data.updated_at);
      }
    };

    fetchNote();

    // Subscribe to changes
    const channel = supabase
      .channel(`field_notes:${fieldId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'field_notes',
          filter: `field_id=eq.${fieldId}`
        },
        async (payload) => {
          if (payload.new) {
            const { data } = await supabase
              .from('field_notes')
              .select(`
                content,
                updated_at,
                user:users(username)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setContent(data.content);
              setLastSavedBy(data.user.username);
              setLastSavedAt(data.updated_at);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fieldId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('field_notes')
        .upsert({
          field_id: fieldId,
          content,
          user_id: user.id
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 relative overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #ccc 31px, #ccc 32px)',
          backgroundPosition: '0 1em',
          marginTop: '1em'
        }}
      />
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-gelica font-bold text-content">Field Notes</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-accent-text text-white rounded-lg hover:bg-accent-text/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full min-h-[200px] p-4 bg-transparent font-['Kalam',_cursive] text-lg leading-8 focus:outline-none resize-none whitespace-pre-line"
        placeholder="Write your notes here..."
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #ccc 31px, #ccc 32px)',
          backgroundAttachment: 'local',
          lineHeight: '32px'
        }}
      />

      {lastSavedBy && lastSavedAt && (
        <div className="mt-4 text-sm text-content/60">
          Last edited by {lastSavedBy} • {new Date(lastSavedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}