import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="App">
      <Chat isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
    </div>
  );
}

export default App;
