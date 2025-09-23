import React, { useState } from 'react';
import EmojiPickerReact, { EmojiClickData } from 'emoji-picker-react';

// Utility function to check if device is mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  triggerButton?: React.ReactNode;
}

export function EmojiPicker({ onEmojiSelect, triggerButton }: EmojiPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const isMobile = isMobileDevice();
  
  // Don't render the component at all on mobile devices
  if (isMobile) {
    return null;
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <div onClick={() => setShowPicker(!showPicker)}>
        {triggerButton || (
          <button
            type="button"
            className="p-2 text-accent-text hover:bg-accent-base/10 rounded-full transition-colors"
          >
            <span role="img" aria-label="emoji">😊</span>
          </button>
        )}
      </div>

      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-50 shadow-xl rounded-lg overflow-hidden">
          <EmojiPickerReact 
            onEmojiClick={handleEmojiClick}
            theme="light"
            lazyLoadEmojis={true}
          />
        </div>
      )}
    </div>
  );
}