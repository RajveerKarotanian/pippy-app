import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatState } from '../types';
import { AIService } from '../services/aiService';
import { AudioService } from '../services/audioService';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import PippyAvatar from './PippyAvatar';
import './Chat.css';

// Custom Pippy image paths - updated to match your actual file names
const PIPPY_IMAGES = {
  closed: '/pippy_closed.png',
  open: '/pippy_open.png', 
  talking: '/pippy_talking.gif'
};

// Debug: Log the image paths
console.log('PIPPY_IMAGES:', PIPPY_IMAGES);

interface ChatProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Chat: React.FC<ChatProps> = ({ isDarkMode, onToggleDarkMode }) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isEpisode: null,
    isListening: false,
    isSpeaking: false,
    isMuted: false,
    isDarkMode
  });

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiService = useRef(new AIService());
  const audioService = useRef(new AudioService());

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  // Initialize chat with Pippy's greeting
  useEffect(() => {
    const initializeChat = async () => {
      // Clear AI service context for new conversation
      aiService.current.clearContext();
      
      // Get the greeting from AI service to ensure consistency
      const greetingResponse = await aiService.current.processMessage('', null);
      const greetingMessage: Message = {
        id: Date.now().toString(),
        text: greetingResponse.text,
        sender: 'pippy',
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [greetingMessage]
      }));

             // Speak the greeting
       try {
         setChatState(prev => ({ ...prev, isSpeaking: true }));
         await audioService.current.speak(greetingMessage.text);
         setChatState(prev => ({ ...prev, isSpeaking: false }));
       } catch (error) {
         console.error('Failed to speak greeting:', error);
         setChatState(prev => ({ ...prev, isSpeaking: false }));
       }
    };

    initializeChat();
  }, []);

  // Handle user message submission
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setInputValue('');
    setIsTyping(true);

    try {
      // Process message with AI service
      const response = await aiService.current.processMessage(message, chatState.isEpisode);
      
      // Update episode state if this is the first response
      let newIsEpisode = chatState.isEpisode;
      if (chatState.isEpisode === null) {
        newIsEpisode = message.toLowerCase().includes('yes') || message.toLowerCase().includes('episode');
      }

      // Add Pippy's response
      const pippyMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'pippy',
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, pippyMessage],
        isEpisode: newIsEpisode
      }));

             // Speak Pippy's response
       try {
         setChatState(prev => ({ ...prev, isSpeaking: true }));
         await audioService.current.speak(response.text);
         setChatState(prev => ({ ...prev, isSpeaking: false }));
       } catch (error) {
         console.error('Failed to speak response:', error);
         setChatState(prev => ({ ...prev, isSpeaking: false }));
       }

    } catch (error) {
      console.error('Error processing message:', error);
      
             // Add error message
               const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm having a little trouble thinking right now, but let's try something else together! (◕‿◕) <i>tilts head curiously</i> pip! 🤔",
          sender: 'pippy',
          timestamp: new Date()
        };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    } finally {
      setIsTyping(false);
    }
  };

  // Handle voice input
  const handleVoiceInput = (transcript: string) => {
    setInputValue(transcript);
    handleSendMessage(transcript);
  };

  // Toggle mute
  const toggleMute = () => {
    if (chatState.isMuted) {
      audioService.current.unmute();
      setChatState(prev => ({ ...prev, isMuted: false }));
    } else {
      audioService.current.mute();
      setChatState(prev => ({ ...prev, isMuted: true }));
    }
  };

  // Toggle voice listening
  const toggleVoiceListening = () => {
    if (chatState.isListening) {
      audioService.current.stopListening();
      setChatState(prev => ({ ...prev, isListening: false }));
    } else {
      audioService.current.startListening(
        handleVoiceInput,
        (error) => console.error('Voice recognition error:', error)
      );
      setChatState(prev => ({ ...prev, isListening: true }));
    }
  };

  return (
    <div className={`chat-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="chat-header">
        <div className="header-content">
          <PippyAvatar 
            isSpeaking={chatState.isSpeaking} 
            isListening={chatState.isListening}
            customImages={PIPPY_IMAGES}
          />
          <div className="header-text">
            <h1>Pippy</h1>
            <p>Your Friendly Penguin Companion</p>
          </div>
        </div>
        <div className="header-controls">
          <button 
            className={`control-btn ${chatState.isMuted ? 'active' : ''}`}
            onClick={toggleMute}
            title="Toggle mute"
          >
            {chatState.isMuted ? '🔇' : '🔊'}
          </button>
          <button 
            className={`control-btn ${chatState.isListening ? 'active' : ''}`}
            onClick={toggleVoiceListening}
            title="Toggle voice input"
          >
            🎤
          </button>
          <button 
            className="control-btn"
            onClick={onToggleDarkMode}
            title="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="messages-container">
        {chatState.messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            isDarkMode={isDarkMode}
          />
        ))}
        {isTyping && (
          <div className="typing-indicator">
            <PippyAvatar 
              isSpeaking={true} 
              isListening={false}
              customImages={PIPPY_IMAGES}
            />
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isListening={chatState.isListening}
        onToggleVoice={toggleVoiceListening}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default Chat;