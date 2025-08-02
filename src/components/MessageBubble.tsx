import React from 'react';
import { Message } from '../types';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  isDarkMode: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDarkMode }) => {
  const isPippy = message.sender === 'pippy';
  const timestamp = message.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`message-bubble ${isPippy ? 'pippy' : 'user'} ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="message-content">
        <div className="message-text" dangerouslySetInnerHTML={{ __html: message.text }}>
        </div>
        <div className="message-timestamp">
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble; 