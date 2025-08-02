import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
  };

  // Adjust height when value changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type your message..."
          className={`chat-input ${isDarkMode ? 'dark' : 'light'}`}
          disabled={isListening}
          rows={1}
          style={{
            resize: 'none',
            minHeight: '20px',
            maxHeight: '100px',
            overflowY: 'auto'
          }}
        />
        <div className="input-controls">
          <button
            className={`voice-btn ${isListening ? 'active' : ''}`}
            onClick={onToggleVoice}
            title={isListening ? 'Stop voice input' : 'Start voice input (works on iPhone Safari)'}
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