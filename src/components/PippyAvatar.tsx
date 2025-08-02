import React from 'react';
import './PippyAvatar.css';

interface PippyAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  customImage?: string; // Path to your custom Pippy image
  customImages?: {
    closed: string;
    open: string;
    talking: string;
  };
}

const PippyAvatar: React.FC<PippyAvatarProps> = ({ isSpeaking, isListening, customImage, customImages }) => {
  // If multiple custom images are provided, use them based on state
  if (customImages) {
    let imageSrc = customImages.closed; // default
    
    if (isSpeaking) {
      imageSrc = customImages.talking;
    } else if (isListening) {
      imageSrc = customImages.open;
    }
    
    return (
      <div className={`pippy-avatar ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}>
        <img 
          src={imageSrc} 
          alt="Pippy the Penguin" 
          className="pippy-custom-image"
          onLoad={() => console.log('Pippy image loaded:', imageSrc)}
          onError={(e) => console.error('Pippy image failed to load:', imageSrc, e)}
        />
        
        {/* Speaking animation overlay */}
        {isSpeaking && (
          <div className="speaking-animation">
            <div className="speech-wave"></div>
            <div className="speech-wave"></div>
            <div className="speech-wave"></div>
          </div>
        )}
        
        {/* Listening animation overlay */}
        {isListening && (
          <div className="listening-animation">
            <div className="listening-wave"></div>
            <div className="listening-wave"></div>
            <div className="listening-wave"></div>
          </div>
        )}
      </div>
    );
  }
  
  // If single custom image is provided, use it
  if (customImage) {
    return (
      <div className={`pippy-avatar ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}>
        <img 
          src={customImage} 
          alt="Pippy the Penguin" 
          className="pippy-custom-image"
          onLoad={() => console.log('Pippy image loaded:', customImage)}
          onError={(e) => console.error('Pippy image failed to load:', customImage, e)}
        />
        
        {/* Speaking animation overlay */}
        {isSpeaking && (
          <div className="speaking-animation">
            <div className="speech-wave"></div>
            <div className="speech-wave"></div>
            <div className="speech-wave"></div>
          </div>
        )}
        
        {/* Listening animation overlay */}
        {isListening && (
          <div className="listening-animation">
            <div className="listening-wave"></div>
            <div className="listening-wave"></div>
            <div className="listening-wave"></div>
          </div>
        )}
      </div>
    );
  }

  // Fallback to CSS version
  return (
    <div className={`pippy-avatar ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}>
      <div className="pippy-character">
        {/* Penguin head */}
        <div className="pippy-head">
          {/* Blue cap */}
          <div className="pippy-cap"></div>
          
          {/* White face */}
          <div className="pippy-face">
            {/* Crown/mask on forehead */}
            <div className="pippy-crown"></div>
            
            {/* Eyes */}
            <div className="pippy-eyes">
              <div className="pippy-eye">
                <div className="pippy-pupil"></div>
                <div className="pippy-highlight"></div>
              </div>
              <div className="pippy-eye">
                <div className="pippy-pupil"></div>
                <div className="pippy-highlight"></div>
              </div>
            </div>
            
            {/* Cheeks */}
            <div className="pippy-cheeks">
              <div className="pippy-cheek"></div>
              <div className="pippy-cheek"></div>
            </div>
            
            {/* Beak */}
            <div className="pippy-beak"></div>
          </div>
        </div>
        
        {/* Body */}
        <div className="pippy-body">
          {/* Collar */}
          <div className="pippy-collar"></div>
          
          {/* Wings/Flippers */}
          <div className="pippy-wings">
            <div className="pippy-wing"></div>
            <div className="pippy-wing"></div>
          </div>
          
          {/* Belly markings */}
          <div className="pippy-belly">
            <div className="pippy-marking"></div>
            <div className="pippy-marking"></div>
          </div>
          
          {/* Feet */}
          <div className="pippy-feet">
            <div className="pippy-foot"></div>
            <div className="pippy-foot"></div>
          </div>
        </div>
      </div>
      
      {/* Speaking animation */}
      {isSpeaking && (
        <div className="speaking-animation">
          <div className="speech-wave"></div>
          <div className="speech-wave"></div>
          <div className="speech-wave"></div>
        </div>
      )}
      
      {/* Listening animation */}
      {isListening && (
        <div className="listening-animation">
          <div className="listening-wave"></div>
          <div className="listening-wave"></div>
          <div className="listening-wave"></div>
        </div>
      )}
    </div>
  );
};

export default PippyAvatar; 