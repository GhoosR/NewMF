# Voice Messages Feature Implementation

## 🎤 Overview

This implementation adds voice message functionality to the Mindful Family chat system, allowing users to record, send, and play back voice messages in real-time conversations.

## ✨ Features

- **Voice Recording**: Record voice messages up to 5 minutes long
- **Real-time Playback**: Play voice messages with progress bar and time controls
- **File Management**: Automatic upload to Supabase Storage with proper organization
- **Cross-platform**: Works on desktop and mobile browsers
- **Error Handling**: Comprehensive error handling and user feedback
- **Accessibility**: Keyboard navigation and screen reader support

## 🏗️ Architecture

### Components

1. **VoiceRecorder** (`src/components/ui/VoiceRecorder.tsx`)
   - Handles voice recording using MediaRecorder API
   - Provides recording controls (start/stop/play/delete/send)
   - Shows recording duration and file size
   - Handles microphone permissions and errors

2. **VoiceMessagePlayer** (`src/components/ui/VoiceMessagePlayer.tsx`)
   - Plays voice messages with custom controls
   - Shows progress bar and time information
   - Supports download functionality
   - Handles audio loading and error states

3. **ChatCard** (Updated)
   - Integrated voice recording button
   - Displays voice messages with custom player
   - Handles voice message sending

### Database Schema

The `messages` table has been extended with voice message support:

```sql
ALTER TABLE messages 
ADD COLUMN message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file')),
ADD COLUMN audio_url TEXT,
ADD COLUMN audio_duration INTEGER,
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT,
ADD COLUMN file_size INTEGER,
ADD COLUMN file_type TEXT;
```

### Storage

Voice messages are stored in Supabase Storage under the `chat-files` bucket:
- Path: `voice-messages/{user_id}/{timestamp}-{uuid}.webm`
- Format: WebM with Opus codec
- Size limit: 10MB per file
- Automatic cleanup after 30 days

## 🚀 Usage

### Recording a Voice Message

1. Click the microphone button in the chat input
2. Grant microphone permissions when prompted
3. Click the record button to start recording
4. Speak your message (up to 5 minutes)
5. Click stop to finish recording
6. Review the recording and click send

### Playing Voice Messages

1. Voice messages appear as audio players in the chat
2. Click play to start playback
3. Use the progress bar to seek through the message
4. Download option available for saving messages

## 🔧 Technical Details

### Audio Format

- **Codec**: Opus (WebM container)
- **Sample Rate**: 44.1kHz
- **Bitrate**: Variable (optimized for voice)
- **Channels**: Mono (optimized for voice)

### Browser Support

- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Optimizations

- **Chunked Recording**: Data collected every 100ms for smooth recording
- **Compressed Audio**: WebM format reduces file size
- **Lazy Loading**: Audio players load on demand
- **Background Upload**: Files upload while user continues chatting

## 🛠️ Setup Instructions

### 1. Database Migration

Run the database migrations in order:

```bash
# Apply voice message schema
supabase db push

# Or run migrations manually:
psql -f supabase/migrations/20250127000002_add_voice_message_support.sql
psql -f supabase/migrations/20250127000003_create_chat_files_storage.sql
```

### 2. Storage Configuration

Create the storage bucket in Supabase:

```sql
-- Run this in Supabase SQL editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg']
);
```

### 3. Environment Variables

Ensure these environment variables are set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Testing

### Test Page

A test page is available at `/voice-message-test` to verify functionality:

- Browser compatibility check
- Recording and playback testing
- Error handling verification
- Performance monitoring

### Manual Testing Checklist

- [ ] Microphone permissions granted
- [ ] Recording starts and stops correctly
- [ ] Audio playback works
- [ ] Progress bar functions properly
- [ ] Download feature works
- [ ] Error messages display correctly
- [ ] Mobile compatibility verified
- [ ] File size limits respected

## 🔒 Security Considerations

### File Upload Security

- **File Type Validation**: Only audio files allowed
- **Size Limits**: 10MB maximum per file
- **User Isolation**: Files organized by user ID
- **Access Control**: RLS policies prevent unauthorized access

### Privacy

- **Temporary URLs**: Local blob URLs cleaned up after use
- **No Server Storage**: Audio processed client-side until upload
- **User Control**: Users can delete their own messages

## 🐛 Troubleshooting

### Common Issues

1. **Microphone Not Working**
   - Check browser permissions
   - Ensure HTTPS connection
   - Try refreshing the page

2. **Recording Not Starting**
   - Check MediaRecorder API support
   - Verify microphone is not in use by another app
   - Check browser console for errors

3. **Upload Fails**
   - Check Supabase storage configuration
   - Verify RLS policies
   - Check file size limits

4. **Playback Issues**
   - Check audio codec support
   - Verify file URL is accessible
   - Check browser audio permissions

### Debug Mode

Enable debug logging:

```javascript
localStorage.setItem('mf_debug_voice', 'true');
```

## 📈 Future Enhancements

### Planned Features

- **Voice Message Transcription**: Convert speech to text
- **Voice Filters**: Apply audio effects
- **Group Voice Messages**: Send to multiple recipients
- **Voice Message Reactions**: React with emojis
- **Voice Message Forwarding**: Forward to other conversations
- **Voice Message Search**: Search within voice content

### Performance Improvements

- **Audio Compression**: Further reduce file sizes
- **Streaming Playback**: Stream large files
- **Caching**: Cache frequently played messages
- **Background Processing**: Process audio in web workers

## 📝 API Reference

### Functions

#### `sendVoiceMessage(conversationId, audioBlob, duration)`
Sends a voice message to a conversation.

**Parameters:**
- `conversationId` (string): Target conversation ID
- `audioBlob` (Blob): Recorded audio data
- `duration` (number): Audio duration in seconds

**Returns:** Promise<Message>

#### `getConversationMessages(conversationId, beforeTimestamp, limit)`
Retrieves messages including voice messages.

**Returns:** Array of messages with voice message metadata

### Database Functions

#### `validate_voice_message()`
Validates voice message data before insertion.

#### `cleanup_old_voice_messages()`
Cleans up voice messages older than 30 days.

## 🤝 Contributing

When contributing to voice message functionality:

1. Test on multiple browsers and devices
2. Ensure accessibility compliance
3. Add proper error handling
4. Update documentation
5. Include test cases

## 📄 License

This feature is part of the Mindful Family platform and follows the same licensing terms.



