import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Download } from 'lucide-react';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration?: number;
  className?: string;
  showDownload?: boolean;
}

export function VoiceMessagePlayer({ 
  audioUrl, 
  duration, 
  className = '', 
  showDownload = true 
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    const handleLoadedMetadata = () => {
      setTotalDuration(audio.duration);
      setIsLoading(false);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickTime = (clickX / width) * totalDuration;
    
    audioRef.current.currentTime = clickTime;
    setCurrentTime(clickTime);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `voice-message-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  if (error) {
    return (
      <div className={`flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded ${className}`}>
        <Volume2 className="h-4 w-4 text-red-500" />
        <span className="text-red-700 text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border ${className}`}>
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className="w-12 h-12 md:w-8 md:h-8 rounded-full bg-accent-text hover:bg-accent-text/90 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
      >
        {isLoading ? (
          <div className="w-5 h-5 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-6 w-6 md:h-4 md:w-4" />
        ) : (
          <Play className="h-6 w-6 md:h-4 md:w-4 ml-0.5" />
        )}
      </button>

      {/* Progress Bar */}
      <div className="flex-1 min-w-0">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="w-full h-3 md:h-2 bg-gray-200 rounded-full cursor-pointer hover:h-4 md:hover:h-3 transition-all"
        >
          <div
            className="h-full bg-accent-text rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Time Display */}
      <div className="text-xs text-gray-500 flex-shrink-0 min-w-[40px] text-right">
        {formatTime(currentTime)} / {formatTime(totalDuration)}
      </div>

      {/* Download Button */}
      {showDownload && (
        <button
          onClick={handleDownload}
          className="w-8 h-8 md:w-6 md:h-6 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 flex items-center justify-center"
          title="Download voice message"
        >
          <Download className="h-5 w-5 md:h-4 md:w-4" />
        </button>
      )}
    </div>
  );
}
