import React, { useState, KeyboardEvent } from 'react';
import './ChatInput.css';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  isListening: boolean;
  onToggleVoice: () => void;
  isDarkMode: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isListening,
  onToggleVoice,
  isDarkMode
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend(value.trim());
      }
    }
  };

  const handleSendClick = () => {
    if (value.trim()) {
      onSend(value.trim());
    }
  };

  return (
    <div className={`chat-input-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className={`input-wrapper ${isFocused ? 'focused' : ''}`}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type your message..."
          className={`chat-input ${isDarkMode ? 'dark' : 'light'}`}
          disabled={isListening}
        />
        <div className="input-controls">
          <button
            className={`voice-btn ${isListening ? 'active' : ''}`}
            onClick={onToggleVoice}
            title={isListening ? 'Stop voice input' : 'Start voice input'}
            disabled={!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)}
          >
            🎤
          </button>
          <button
            className="send-btn"
            onClick={handleSendClick}
            disabled={!value.trim()}
            title="Send message"
          >
            ➤
          </button>
        </div>
      </div>
      {isListening && (
        <div className="listening-indicator">
          <span className="listening-dot"></span>
          Listening...
        </div>
      )}
    </div>
  );
};

export default ChatInput; 