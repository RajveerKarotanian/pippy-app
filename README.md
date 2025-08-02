# Pippy - Your Friendly Penguin Companion 🐧

A therapeutic chatbot companion designed to help with mental health support, featuring voice interaction and grounding techniques.

## Features

- **Voice Interaction**: Speak with Pippy using your microphone (works on iPhone Safari!)
- **Text Chat**: Type messages for text-based interaction
- **Grounding Techniques**: Access various therapeutic exercises
- **Distraction Games**: Fun activities to help with anxiety
- **Dark/Light Mode**: Toggle between themes
- **Mobile Optimized**: Works perfectly on iPhone, iPad, and Android devices

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (Optional)
Create a `.env` file in the root directory for enhanced AI features:

```env
# API Keys for enhanced features (optional)
REACT_APP_HUGGING_FACE_API_KEY=your_hugging_face_api_key_here
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: The app works without API keys using built-in responses, but adding keys enables enhanced AI features.

### 3. Start Development Server
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Mobile Compatibility

### iPhone/iPad (Safari)
- ✅ **Voice Input**: Works perfectly with microphone
- ✅ **No Zoom**: Fixed viewport prevents zooming when typing
- ✅ **Touch Optimized**: Proper touch targets and gestures
- ✅ **Full Screen**: Optimized for mobile viewing

### Android
- ✅ **Voice Input**: Works with Chrome and other browsers
- ✅ **Responsive Design**: Adapts to different screen sizes
- ✅ **Touch Friendly**: Optimized for touch interactions

## Voice Input Setup

### iPhone Safari
1. Open the app in Safari
2. Tap the microphone button 🎤
3. Allow microphone access when prompted
4. Start speaking!

### Troubleshooting Voice Input
- **Permission Denied**: Go to Settings > Safari > Microphone > Allow
- **Not Working**: Try refreshing the page and allowing permissions again
- **No Sound**: Check your device's microphone settings

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Deploy automatically

### Netlify
1. Push your code to GitHub
2. Connect your repo to Netlify
3. Deploy automatically

## API Keys (Optional)

### Hugging Face API Key
1. Go to [Hugging Face](https://huggingface.co/settings/tokens)
2. Create a new token
3. Add to your `.env` file as `REACT_APP_HUGGING_FACE_API_KEY`

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to your `.env` file as `REACT_APP_OPENAI_API_KEY`

## Security

- API keys are stored in environment variables
- `.env` file is ignored by Git
- No sensitive data is stored in the browser

## Browser Support

- ✅ Chrome (Desktop & Mobile)
- ✅ Safari (iPhone/iPad)
- ✅ Firefox (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)

## Voice Recognition Support

- ✅ **Chrome**: Full support
- ✅ **Safari (iOS)**: Full support
- ✅ **Firefox**: Full support
- ✅ **Edge**: Full support

## Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Improving the code
- Adding new therapeutic techniques

## License

This project is open source and available under the MIT License.
