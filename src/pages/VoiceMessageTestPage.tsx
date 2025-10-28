import React from 'react';
import { VoiceMessageTest } from '../components/VoiceMessageTest';
import { Meta } from '../components/Meta';

export function VoiceMessageTestPage() {
  return (
    <div>
      <Meta 
        title="Voice Message Test | Mindful Family"
        description="Test the voice message functionality in the chat system"
      />
      <VoiceMessageTest />
    </div>
  );
}




