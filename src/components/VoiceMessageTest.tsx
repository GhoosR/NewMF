import React, { useState } from 'react';
import { VoiceRecorder } from '../components/ui/VoiceRecorder';
import { VoiceMessagePlayer } from '../components/ui/VoiceMessagePlayer';

export function VoiceMessageTest() {
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; duration: number } | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    try {
      addTestResult(`Voice message recorded: ${duration.toFixed(1)}s, ${(audioBlob.size / 1024).toFixed(1)}KB`);
      setRecordedAudio({ blob: audioBlob, duration });
      
      // Simulate sending to server
      await new Promise(resolve => setTimeout(resolve, 1000));
      addTestResult('Voice message sent successfully!');
    } catch (error) {
      addTestResult(`Error sending voice message: ${error}`);
    }
  };

  const handleCancel = () => {
    addTestResult('Voice recording cancelled');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Voice Message Test</h1>
        <p className="text-gray-600">Test the voice recording and playback functionality</p>
      </div>

      {/* Voice Recorder */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Record Voice Message</h2>
        <VoiceRecorder
          onSendVoiceMessage={handleSendVoiceMessage}
          onCancel={handleCancel}
        />
      </div>

      {/* Playback Test */}
      {recordedAudio && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Playback Test</h2>
          <VoiceMessagePlayer
            audioUrl={URL.createObjectURL(recordedAudio.blob)}
            duration={recordedAudio.duration}
            showDownload={true}
          />
        </div>
      )}

      {/* Test Results */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Test Results</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No test results yet...</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-sm text-gray-700 font-mono">
                {result}
              </div>
            ))
          )}
        </div>
        {testResults.length > 0 && (
          <button
            onClick={() => setTestResults([])}
            className="mt-4 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Browser Compatibility Check */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Browser Compatibility</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${navigator.mediaDevices ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>MediaDevices API: {navigator.mediaDevices ? 'Supported' : 'Not Supported'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${MediaRecorder ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>MediaRecorder API: {MediaRecorder ? 'Supported' : 'Not Supported'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${Audio ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Audio API: {Audio ? 'Supported' : 'Not Supported'}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Click the microphone button to start recording</li>
          <li>Speak your message (up to 5 minutes)</li>
          <li>Click the stop button to finish recording</li>
          <li>Review your recording and click send</li>
          <li>Test the playback functionality</li>
          <li>Check the test results for any errors</li>
        </ol>
      </div>
    </div>
  );
}




