import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoiceMessage: (audioBlob: Blob, duration: number) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onSendVoiceMessage, onCancel, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile device
  useEffect(() => {
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Check if MediaRecorder is supported (important for WebView)
      if (!window.MediaRecorder) {
        setError('Voice recording is not supported in this browser. Please use Chrome or Safari.');
        return;
      }
      
      // Check microphone permissions first
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (permission.state === 'denied') {
            setError('Microphone access denied. Please enable microphone permissions in your browser settings.');
            return;
          }
        } catch (permError) {
          // Permissions API might not be available in WebView
          console.log('Permissions API not available:', permError);
        }
      }
      
      // WebView-compatible audio constraints
      const audioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: isMobile ? 44100 : 48000,
          channelCount: 1,
          // Additional constraints for WebView compatibility
          latency: 0.01,
          volume: 1.0
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      // Detect supported MIME type for WebView compatibility
      let mimeType = 'audio/webm;codecs=opus';
      
      // Check for WebView-specific support
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else {
        // Fallback - let MediaRecorder choose
        mimeType = '';
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(blob);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      // Handle mobile-specific errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        setIsRecording(false);
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 0.1);
      }, 100);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      
      // Provide specific error messages for mobile and WebView
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone permissions in your app settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please check your device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Voice recording is not supported in this browser. Please use Chrome or Safari.');
      } else if (err.name === 'NotReadableError') {
        setError('Microphone is being used by another app. Please close other apps and try again.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Microphone settings are not supported. Please try again.');
      } else if (err.name === 'SecurityError') {
        setError('Microphone access blocked for security reasons. Please check your browser settings.');
      } else {
        setError('Failed to access microphone. Please check permissions and try again.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      } else {
        // Create a new audio element for each playback
        const audio = new Audio();
        audio.src = URL.createObjectURL(audioBlob);
        audioRef.current = audio;
        
        // Mobile-specific audio settings
        audio.preload = 'auto';
        audio.controls = false;
        
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audio.src);
        };
        
        audio.onerror = () => {
          console.error('Audio playback error');
          setIsPlaying(false);
          setError('Failed to play audio. Your device may not support this audio format.');
        };
        
        // Handle mobile playback requirements
        audio.play().catch(err => {
          console.error('Playback failed:', err);
          setIsPlaying(false);
          
          // Provide specific error messages for mobile
          if (err.name === 'NotAllowedError') {
            setError('Audio playback requires user interaction. Please tap the play button again.');
          } else {
            setError('Failed to play audio. Please try again.');
          }
        });
        
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  const sendVoiceMessage = async () => {
    if (audioBlob && recordingTime > 0) {
      try {
        await onSendVoiceMessage(audioBlob, recordingTime);
        // Reset state after successful send
        setAudioBlob(null);
        setRecordingTime(0);
        setIsPlaying(false);
      } catch (err) {
        console.error('Error sending voice message:', err);
        setError('Failed to send voice message. Please try again.');
      }
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time) || time < 0) {
      return '0:00';
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-3">
      {error && (
        <div className="text-red-600 text-sm max-w-xs">
          {error}
        </div>
      )}
      
      {!audioBlob ? (
        // Recording state - inline with input
        <>
          {isRecording ? (
            <>
              <div className="flex items-center space-x-2 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-gray-800">{formatTime(recordingTime)}</span>
              </div>
              <button
                onClick={stopRecording}
                className="w-12 h-12 md:w-8 md:h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
              >
                <Square className="h-6 w-6 md:h-4 md:w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={startRecording}
              disabled={disabled}
              className="w-12 h-12 md:w-8 md:h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isMobile ? "Tap to start recording (microphone permission required)" : "Click to start recording"}
            >
              <Mic className="h-6 w-6 md:h-4 md:w-4" />
            </button>
          )}
        </>
      ) : (
        // Playback state - inline controls
        <>
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="text-sm">{formatTime(recordingTime)}</span>
          </div>
          
          <button
            onClick={playRecording}
            className="w-12 h-12 md:w-8 md:h-8 rounded-full bg-accent-text hover:bg-accent-text/90 text-white flex items-center justify-center transition-colors"
            title={isMobile ? "Tap to play (may require user interaction)" : "Click to play"}
          >
            {isPlaying ? <Pause className="h-6 w-6 md:h-4 md:w-4" /> : <Play className="h-6 w-6 md:h-4 md:w-4" />}
          </button>
          
          <button
            onClick={deleteRecording}
            className="w-12 h-12 md:w-8 md:h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-colors"
            title="Delete recording"
          >
            <Trash2 className="h-6 w-6 md:h-4 md:w-4" />
          </button>
          
          <button
            onClick={sendVoiceMessage}
            disabled={disabled || recordingTime <= 0}
            className="w-12 h-12 md:w-8 md:h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send voice message"
          >
            <Send className="h-6 w-6 md:h-4 md:w-4" />
          </button>
        </>
      )}
    </div>
  );
}