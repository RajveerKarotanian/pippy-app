# Pippy - Schizophrenia Companion Chatbot (PWA)

Pippy is a Progressive Web Application (PWA) designed to provide empathetic support for individuals experiencing schizophrenia symptoms. It features a friendly penguin companion chatbot that offers grounding techniques, distraction games, and emotional support.

## Features

### 🤖 Chatbot Functionality
- **Episode Detection**: Initial prompt to assess if user is experiencing an episode
- **Grounding Techniques**: 5-4-3-2-1 technique, breathing exercises, body scans
- **Distraction Games**: Color hunts, animal alphabet, counting challenges
- **Fallback Logic**: Works offline with preloaded responses

### 🎤 Voice Interaction
- **Text-to-Speech**: Pippy speaks responses using browser-native APIs
- **Speech Recognition**: Voice input for hands-free interaction
- **Natural Conversation**: Seamless voice-based chat experience

### 🌧️ Audio Features
- **Rain Sounds**: Ambient rain sound generator for calming effect
- **Volume Control**: Adjustable audio levels
- **Audio Context**: Browser-native audio processing

### 📱 PWA Features
- **Offline Support**: Service worker caching for offline functionality
- **Installable**: Add to home screen on mobile devices
- **Responsive Design**: Mobile-first, desktop-accessible

### 🎨 User Interface
- **Calming Design**: Soft colors and smooth animations
- **Dark/Light Mode**: Toggle between themes
- **Animated Pippy**: Cute penguin character with speaking/listening animations
- **Mobile Optimized**: Touch-friendly interface

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **CSS3** with animations and responsive design
- **Web Speech API** for voice features
- **Web Audio API** for rain sounds
- **Service Workers** for PWA functionality

### Backend
- **Node.js** with Express
- **Rate Limiting** for API protection
- **CORS** configuration
- **Helmet** for security headers

### Offline Features
- **Preloaded Logic**: Grounding techniques and games stored locally
- **Fallback Responses**: Works without internet connection
- **Service Worker Caching**: Static assets cached for offline use

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Frontend Setup
```bash
# Navigate to project directory
cd pippy-app

# Install dependencies
npm install

# Start development server
npm start
```

### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start server
npm start
```

### Production Build
```bash
# Build the React app
npm run build

# Serve the built files
npm install -g serve
serve -s build
```

## Usage

### Getting Started
1. Open the application in your browser
2. Pippy will greet you and ask if you're experiencing an episode
3. Respond with "yes" or "no" to guide the conversation
4. Use voice input by clicking the microphone button
5. Toggle rain sounds for ambient relief

### Voice Commands
- Click the microphone button to start voice input
- Speak naturally to Pippy
- The app will transcribe your speech and respond
- Pippy will speak responses back to you

### Grounding Techniques
- **5-4-3-2-1**: Sensory grounding exercise
- **Deep Breathing**: Calming breath work
- **Body Scan**: Progressive muscle relaxation

### Distraction Games
- **Color Hunt**: Find objects by color
- **Animal Alphabet**: Name animals A-Z
- **Counting Challenge**: Count objects in your environment

## PWA Installation

### Mobile (iOS)
1. Open Safari and navigate to the app
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### Mobile (Android)
1. Open Chrome and navigate to the app
2. Tap the menu button
3. Select "Add to Home screen"
4. Tap "Add"

### Desktop
1. Open Chrome and navigate to the app
2. Click the install icon in the address bar
3. Click "Install"

## Privacy & Security

### Data Protection
- No user data is stored or logged
- All conversations are processed locally when possible
- No personal information is collected
- Service worker caches only static assets

### Security Features
- Rate limiting on API endpoints
- CORS protection
- Security headers with Helmet
- Input validation and sanitization

## Browser Support

### Required Features
- **Service Workers**: For PWA functionality
- **Web Speech API**: For voice features
- **Web Audio API**: For rain sounds
- **CSS Grid/Flexbox**: For responsive layout

### Supported Browsers
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Development

### Project Structure
```
pippy-app/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── ChatInput.tsx
│   │   ├── MessageBubble.tsx
│   │   └── PippyAvatar.tsx
│   ├── services/
│   │   ├── chatbotService.ts
│   │   └── audioService.ts
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── server/
│   ├── server.js
│   └── package.json
└── README.md
```

### Adding New Features
1. Create new components in `src/components/`
2. Add TypeScript types in `src/types/`
3. Implement services in `src/services/`
4. Update CSS files for styling
5. Test on multiple devices and browsers

## Contributing

### Guidelines
- Follow TypeScript best practices
- Use functional components with hooks
- Maintain accessibility standards
- Test voice features thoroughly
- Ensure offline functionality

### Testing
- Test on mobile devices
- Verify PWA installation
- Check voice recognition accuracy
- Test offline scenarios
- Validate accessibility

## License

MIT License - see LICENSE file for details.

## Support

This application is designed for mental health support but is not a substitute for professional medical care. If you're experiencing a mental health crisis, please contact emergency services or a mental health professional.

## Acknowledgments

- Built with React and TypeScript
- Voice features powered by Web Speech API
- PWA functionality using Service Workers
- Designed for accessibility and inclusivity
