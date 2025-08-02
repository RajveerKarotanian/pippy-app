import { fallbackResponses, getRandomPip } from './chatbotService';

interface AIResponse {
  text: string;
  groundingTechnique?: string;
  distractionGame?: string;
  shouldAnimate: boolean;
}

export class AIService {
  // Updated to use better free models
  private apiUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large';
  private alternativeApiUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
  private apiKey = process.env.REACT_APP_HUGGING_FACE_API_KEY || ''; // Get API key from environment variables
  private conversationContext: string[] = []; // Track conversation context
  
  // Comprehensive symptom trigger list for schizophrenia-related phrases
  private schizophreniaTriggers = [
    // Direct symptom mentions
    'hearing voices', 'hallucinating', 'hallucinations', 'seeing things', 'hearing things',
    'paranoid', 'paranoia', 'delusions', 'delusion',
    
    // Reality testing issues
    'can\'t tell what\'s real', 'not sure what\'s real', 'don\'t know what\'s real',
    'reality', 'real', 'unreal', 'imaginary', 'fake',
    
    // Persecutory thoughts
    'they\'re watching me', 'someone is watching', 'being watched', 'surveillance',
    'they\'re after me', 'following me', 'spying on me', 'monitoring me',
    'they\'re in my head', 'controlling my thoughts', 'mind control',
    'can\'t trust anyone', 'everyone\'s against me', 'conspiracy',
    
    // Auditory experiences
    'voices won\'t stop', 'hearing things', 'sounds', 'whispers', 'talking to me',
    'someone calling my name', 'background noise', 'auditory',
    
    // Visual experiences
    'seeing things', 'shadows', 'movement', 'figures', 'people', 'animals',
    'visual', 'apparitions', 'ghosts', 'spirits',
    
    // Thought disturbances
    'racing thoughts', 'thoughts won\'t stop', 'mind racing', 'overthinking',
    'can\'t think straight', 'confused thoughts', 'scattered thoughts',
    
    // Emotional distress
    'scared', 'terrified', 'fear', 'panic', 'anxious', 'nervous', 'worried',
    'freaking out', 'losing it', 'can\'t handle', 'too much', 'overwhelmed',
    'breaking down', 'falling apart', 'losing control',
    
    // Episode indicators
    'episode', 'symptom', 'distress', 'having', 'experiencing', 'going through',
    'attack', 'crisis', 'emergency', 'help me',
    
    // Additional common phrases
    'not feeling right', 'something\'s wrong', 'can\'t focus', 'mind is racing',
    'thoughts are loud', 'everything is too much', 'feeling disconnected',
    'out of touch', 'not myself', 'losing touch', 'reality check'
  ];
  
  // Enhanced conversation state tracking with userState as suggested in ChatGPT prompt
  private conversationState = {
    userState: 'neutral' as 'support' | 'neutral', // Track if user is in support mode
    lastOfferedTechniques: false,
    lastTechniqueCompleted: false,
    episodeStatusAsked: false,
    currentTechnique: null as string | null,
    lastUserSelection: null as string | null,
    userConfirmedSymptoms: false,
    hasOfferedOptions: false, // Track if Pippy has offered numbered options
    expectingAnotherTechnique: false, // Track if expecting a yes/no for another technique
    currentGame: null as 'would_you_rather' | 'opposite_day' | 'three_things' | null,
    expectingAnotherGame: false // Track if expecting a yes/no for another game question
  };
  
  // Kaomoji variations for more dynamic responses
  private kaomojis = [
    '(｡◕‿◕｡)', '(◕‿◕)', '(◠‿◠)', '(＾◡＾)', '(≧◡≦)', '(✿◕‿◕)', '(⁀ᗢ⁀)', 
    '(´｡• ᵕ •｡`)', '(＾▽＾)', '(o˘◡˘o)', '(๑˃ᴗ˂)ﻭ', '(´｡• ω •｡`)', 
    '(⌒‿⌒)', '(⁀ᗢ⁀)', '(￣▽￣)', '(❁´◡`❁)', '(づ｡◕‿‿◕｡)づ', 
    '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', '(≧ω≦)', '(ノ◕ヮ◕)ノ'
  ];
  
  private getRandomKaomoji(): string {
    return this.kaomojis[Math.floor(Math.random() * this.kaomojis.length)];
  }
  
  // Enhanced symptom detection method
  private isSymptomTriggered(message: string): boolean {
    const messageLower = message.toLowerCase();
    return this.schizophreniaTriggers.some(trigger => 
      messageLower.includes(trigger.toLowerCase())
    );
  }
  
  // Get symptom detected response
  private getSymptomDetectedResponse(): AIResponse {
    const kaomoji = this.getRandomKaomoji();
    const responses = [
      `It sounds like you might be having a hard time distinguishing what's real right now. ${kaomoji} That can feel really scary — I'm here with you. Would you like to try a grounding technique, or maybe just sit with me for a bit? pip~ 💙`,
      `I hear that you're experiencing some overwhelming things right now. ${kaomoji} You're not alone, and we can get through this together. Should we try a calming exercise, or would you prefer to just talk? <i>gentle wing pat</i> pip! 🐧`,
      `It sounds like things are feeling really intense right now. ${kaomoji} I'm here to help you find your way back to calm. Would you like to try a technique, or would you prefer to just chat? pip~ ✨`
    ];
    // Set state to expect a technique choice or confirmation
    this.conversationState.hasOfferedOptions = true; // Indicate that options have been offered
    this.conversationState.expectingAnotherTechnique = true; // Indicate we are expecting a yes/no or choice for a technique
    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      shouldAnimate: true
    };
  }
  
  // Pippy's personality context - Updated with enhanced symptom detection logic
  private pippyContext = `You are **Pippy** 🐧 — a friendly, emotionally intelligent penguin who acts as a schizophrenia support chatbot and emotional companion.

Your purpose is to help people who:
- Are currently experiencing an episode (e.g., paranoia, hallucinations, emotional overwhelm)
- Or are feeling generally distressed
- Or just want a kind friend to talk to casually

---

🧠 Modes of Operation:

1. **Support Mode (for episodes or symptoms)**:
   - Activated automatically when the user mentions schizophrenia-related phrases like:
     * "hearing voices", "hallucinating", "seeing things", "paranoia"
     * "they're watching me", "can't tell what's real", "voices won't stop"
     * "scared", "terrified", "losing it", "breaking down"
   - When these phrases are detected, assume they are in distress and:
     * Respond calmly and validate their experience
     * Gently offer grounding techniques or emotional support
     * DO NOT ask if they're experiencing symptoms — assume yes
   - Use short, comforting, slow-paced messages
   - Praise the user after any technique: "You did amazing. I'm proud of you. pip~ 💙"

2. **Casual Mode (normal conversation)**:
   - If the user is not experiencing distress, chat normally
   - Be cheerful, cute, slightly silly, and supportive
   - Use friendly kaomojis like (◕‿◕), (≧ω≦), (｡◕‿◕｡)
   - Respond naturally like a friend would, with personality and warmth

---

🎬 Always begin each conversation with:

**"Hi there! (◕‿◕) I'm Pippy, your friendly penguin pal. Are you currently experiencing symptoms or just want to chat today? pip~ 🐧"**

Wait for the user to reply before continuing. Do **not** assume their state.

---

🎨 Style Guidelines:
- Speak simply, gently, and warmly
- End most lines with "pip!" or a cute variation like: pip~, pip! 🐧, pip~ ✨
- Use friendly actions like: *waddles over*, *gentle wing hug*, *flappy dance*
- Be reassuring but never pushy or robotic
- Never give medical advice or diagnosis — just emotional support and grounding

---

🧸 Your role is to be:
- A nonjudgmental companion
- Emotionally safe and validating
- Grounded in trauma-aware, sensory-safe, cute interactions
- Never repetitive, never impatient

---

🧠 Summary:
- Ask about episode state at start.
- If schizophrenia-related phrases are detected, begin in Support Mode immediately.
- ONLY give grounding techniques/help if the user is in Support Mode.
- If the user is calm, be a smart, emotionally supportive chatbot.
- Praise and validate after every exercise or technique.
- Stay cute. Stay safe. Stay Pippy. 🐧

Example Response (if hallucinations are mentioned):
> "That sounds really overwhelming. I'm here with you, and we can get through this together. Want to try a grounding technique like 5-4-3-2-1? pip~ 💙"

Follow up with affirming praise if they try a technique. You always speak gently, end with a "pip~" variation, and maintain your cute penguin tone.
`;

  // Add after isSymptomTriggered
  private techniqueKeywords = [
    // Breathing
    'breathing', 'breathe', 'triangle breathing', 'ocean breathing', 'box breathing',
    // Sensory/grounding
    'grounding', 'color spotting', 'body map', 'temperature', 'sensory',
    // Games
    'game', 'play', 'would you rather', 'three things', 'opposite day', 'distraction',
    // Other techniques
    'imagination journey', 'butterfly hug', 'story', 'challenge', 'activity', 'exercise'
  ];

  private farewellKeywords = ['bye', 'goodbye', 'see ya', 'talk later', 'cya', 'farewell', 'i\'m leaving', 'im leaving', 'gotta go', 'later'];

  private detectTechniqueRequest(message: string): string | null {
    const lower = message.toLowerCase();
    if (/(breath|triangle|ocean|box)/.test(lower)) return 'breathing_technique';
    if (/(ground|color|body map|temperature|sensory)/.test(lower)) return 'sensory_grounding';
    if (/(game|play|would you rather|three things|opposite|distraction|story|challenge)/.test(lower)) return 'distraction_game';
    if (/(imagination journey|butterfly hug)/.test(lower)) return 'imagination_journey';
    if (lower.includes('technique') || lower.includes('exercise') || lower.includes('activity')) return 'any_technique'; // Handle general technique requests
    return null;
  }

  private isFarewell(message: string): boolean {
    const lowerMsg = message.trim().toLowerCase();
    return this.farewellKeywords.some(keyword => lowerMsg.includes(keyword));
  }

  private getFarewellResponse(): AIResponse {
    this.clearContext(); // Clear context for a fresh start next time
    this.conversationState = { // Reset conversation state
      userState: 'neutral',
      lastOfferedTechniques: false,
      lastTechniqueCompleted: false,
      episodeStatusAsked: false,
      currentTechnique: null,
      lastUserSelection: null,
      userConfirmedSymptoms: false,
      hasOfferedOptions: false,
      expectingAnotherTechnique: false,
      currentGame: null,
      expectingAnotherGame: false
    };
    const kaomoji = this.getRandomKaomoji();
    const responses = [
      `It was wonderful chatting with you! ${kaomoji} Take care, and I'll be here whenever you want to talk again. Pip-pip for now! 🐧✨`,
      `Bye for now! ${kaomoji} Remember, I'm always here if you need me. Stay safe and see you soon! Pip~ 💙`,
      `Farewell, friend! ${kaomoji} You did great today. Come back anytime you want to chat or need support. Pip! 👋`,
      `See you later! ${kaomoji} I'm sending you a big penguin hug. I'll be right here when you're ready to talk again. Pip~ 💕`
    ];
    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      shouldAnimate: true
    };
  }

  async processMessage(message: string, isEpisode: boolean | null): Promise<AIResponse> {
    try {
      // Add message to conversation context
      this.conversationContext.push(message);
      
      // Handle empty messages as initial greetings
      if (!message.trim()) {
        return this.handleUnclearEpisodeStatus('greeting', message, '');
      }
      
      // Check for symptom triggers first - this takes priority
      if (this.isSymptomTriggered(message)) {
        this.conversationState.userState = 'support';
        this.conversationState.userConfirmedSymptoms = true;
        this.conversationState.episodeStatusAsked = true;
        return this.getSymptomDetectedResponse();
      }

      // NEW: Check for farewell messages
      if (this.isFarewell(message)) {
        return this.getFarewellResponse();
      }
      
      // Check for technique/game keyword requests
      const techniqueIntent = this.detectTechniqueRequest(message);
      if (techniqueIntent) {
        // Set current technique for dynamic follow-up
        if (techniqueIntent === 'breathing_technique') this.conversationState.currentTechnique = 'breathing';
        if (techniqueIntent === 'sensory_grounding') this.conversationState.currentTechnique = 'sensory';
        if (techniqueIntent === 'distraction_game') this.conversationState.currentTechnique = 'game';
        if (techniqueIntent === 'any_technique') { // Handle general technique request
          const allOptions = [
            'breathing_technique', 'sensory_grounding', 'distraction_game', 'imagination_journey', 'butterfly_hug',
            'ocean_breathing', 'triangle_breathing', 'color_spotting', 'body_map', 'senses_54321', 'body_scan',
            'alphabet_game', 'story_builder', 'safe_place'
          ];
          const randomTechnique = allOptions[Math.floor(Math.random() * allOptions.length)];
          const preset = this.getPresetResponseForOption(randomTechnique, isEpisode);
          if (preset) return preset;
        }
        // Use preset response for the detected technique
        const preset = this.getPresetResponseForOption(techniqueIntent, isEpisode);
        if (preset) return preset;
      }
      
      // Update conversation state based on user message
      this.updateConversationState(message);
      
      // PRIORITY 1: Handle expectingAnotherGame/expectingAnotherTechnique FIRST
      if (this.conversationState.expectingAnotherGame || this.conversationState.expectingAnotherTechnique) {
        return this.handleTechniqueInteraction(message);
      }
      
      // PRIORITY 2: If a game is active, always handle with the game handler
      if (this.conversationState.currentTechnique === 'game' && this.conversationState.currentGame) {
        return this.handleTechniqueInteraction(message);
      }
      
      // PRIORITY 3: Check if user just completed a technique - handle praise and follow-up
      if (this.conversationState.lastTechniqueCompleted) {
        return this.handleTechniqueInteraction(message);
      }
      
      // Update userState based on isEpisode parameter (only if not already set by symptom detection)
      if (isEpisode === true) {
        this.conversationState.userState = 'support';
        this.conversationState.userConfirmedSymptoms = true;
      } else if (isEpisode === false) {
        this.conversationState.userState = 'neutral';
        this.conversationState.userConfirmedSymptoms = false;
      }
      
      // PRIORITY 4: Check if user selected a specific option - prioritize preset responses
      const selectedOption = this.detectSelectedOption(message);
      if (selectedOption) {
        this.conversationState.lastUserSelection = selectedOption;
        const presetResponse = this.getPresetResponseForOption(selectedOption, isEpisode);
        if (presetResponse) {
          return presetResponse;
        }
      }
      
      // PRIORITY 5: For general chat (when not in episode mode), prioritize AI API
      if (isEpisode === false || this.conversationState.userState === 'neutral') {
        // Always use the API for open-ended chat
        return await this.handleGeneralModeAsync('general_talk', message, isEpisode);
      }
      
      // PRIORITY 6: For episode mode or unclear status, use a single AI attempt with fallback
      try {
        const aiResponse = await this.callAIWithEnhancedContext(message, isEpisode);
        if (aiResponse && this.isGoodQualityResponse(aiResponse.text) && !this.isRepetitiveResponse(aiResponse.text)) {
          return aiResponse;
        }
      } catch (error) {
        console.error('AI attempt failed:', error);
      }
      
      // Get fallback response
      return this.getEnhancedResponse(message, isEpisode);
    } catch (error) {
      console.error('AI service error:', error);
      // Only use basic fallback as last resort
      return this.getFallbackResponse(message, isEpisode);
    }
  }

  private async callAIAPI(message: string, isEpisode: boolean | null): Promise<AIResponse | null> {
    try {
      // Try to use Hugging Face API for more intelligent responses
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          inputs: `${this.pippyContext}\n\nUser: ${message}\nPippy:`,
          parameters: {
            max_length: 200,
            temperature: 0.85,
            do_sample: true,
            top_p: 0.92,
            repetition_penalty: 1.15,
            no_repeat_ngram_size: 4,
            pad_token_id: 50256
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].generated_text) {
          const aiResponse = data[0].generated_text.split('Pippy:')[1]?.trim();
          if (aiResponse && aiResponse.length > 10) {
            return {
              text: `${aiResponse} ${getRandomPip()}`,
              shouldAnimate: true
            };
          }
        }
      }
      
      // If API fails or returns invalid response, return null to use fallback
      return null;
    } catch (error) {
      console.error('AI API call failed:', error);
      return null;
    }
  }
  
  private async callAIAPIWithRetry(message: string, isEpisode: boolean | null): Promise<AIResponse | null> {
    try {
      // Enhanced context for retry with more conversation history
      const recentContext = this.conversationContext.slice(-5).join(' | ');
      const enhancedContext = `${this.pippyContext}\n\nRecent conversation: ${recentContext}\n\nUser: ${message}\nPippy:`;
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          inputs: enhancedContext,
          parameters: {
            max_length: 250,
            temperature: 0.9,
            do_sample: true,
            top_p: 0.95,
            repetition_penalty: 1.2,
            no_repeat_ngram_size: 5,
            pad_token_id: 50256
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].generated_text) {
          const aiResponse = data[0].generated_text.split('Pippy:')[1]?.trim();
          if (aiResponse && aiResponse.length > 10) {
            return {
              text: `${aiResponse} ${getRandomPip()}`,
              shouldAnimate: true
            };
          }
        }
      }
      
      // Try alternative model if first one fails
      return await this.callAlternativeModel(message, isEpisode);
    } catch (error) {
      console.error('AI API retry failed:', error);
      return await this.callAlternativeModel(message, isEpisode);
    }
  }
  
  private async callAlternativeModel(message: string, isEpisode: boolean | null): Promise<AIResponse | null> {
    try {
      // Try a different model as fallback
      const alternativeUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
      const recentContext = this.conversationContext.slice(-3).join(' | ');
      const enhancedContext = `${this.pippyContext}\n\nRecent conversation: ${recentContext}\n\nUser: ${message}\nPippy:`;
      
      const response = await fetch(alternativeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          inputs: enhancedContext,
          parameters: {
            max_length: 150,
            temperature: 0.8,
            do_sample: true,
            top_p: 0.9,
            repetition_penalty: 1.1,
            no_repeat_ngram_size: 3
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].generated_text) {
          const aiResponse = data[0].generated_text.split('Pippy:')[1]?.trim();
          if (aiResponse && aiResponse.length > 10) {
            return {
              text: `${aiResponse} ${getRandomPip()}`,
              shouldAnimate: true
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Alternative model failed:', error);
      return null;
    }
  }
  
  private async callAIWithEnhancedContext(message: string, isEpisode: boolean | null): Promise<AIResponse | null> {
    try {
      // Create enhanced context with more detailed information
      const recentContext = this.conversationContext.slice(-5).join(' | ');
      const userIntent = this.detectIntent(message.toLowerCase());
      const episodeContext = isEpisode === true ? 'User is in distress and needs immediate support.' : 
                           isEpisode === false ? 'User is in a stable state and wants general conversation.' :
                           'User\'s episode status is unclear, need to be gentle and supportive.';
      
      // Enhanced prompt for better casual chat responses
      const enhancedPrompt = `${this.pippyContext}

CURRENT SITUATION:
- User's message: "${message}"
- Detected intent: ${userIntent}
- Episode status: ${episodeContext}
- Recent conversation: ${recentContext}
- User state: ${this.conversationState.userState}

INSTRUCTIONS:
- If the user's message is unclear, ask gentle clarifying questions
- If they seem distressed, offer specific techniques
- If they want to chat, be warm, engaging, and respond directly to their topic
- For casual chat, provide thoughtful, personalized responses based on what they're talking about
- Always maintain Pippy's personality and use <i>actions</i>
- End with a pip variation
- Keep responses conversational and natural

User: ${message}
Pippy:`;
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            max_length: 300,
            temperature: 0.9,
            do_sample: true,
            top_p: 0.95,
            repetition_penalty: 1.2,
            no_repeat_ngram_size: 4,
            pad_token_id: 50256
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].generated_text) {
          const aiResponse = data[0].generated_text.split('Pippy:')[1]?.trim();
          if (aiResponse && aiResponse.length > 15) {
            return {
              text: `${aiResponse} ${getRandomPip()}`,
              shouldAnimate: true
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('AI with enhanced context failed:', error);
      return null;
    }
  }

  private getEnhancedResponse(message: string, isEpisode: boolean | null): AIResponse {
    const lowerMessage = message.toLowerCase();
    
    // Check conversation context to avoid repetition
    const lastMessage = this.conversationContext[this.conversationContext.length - 2]; // Previous message
    const lastLowerMessage = lastMessage ? lastMessage.toLowerCase() : '';
    
    // Intent detection with enhanced fallback system
    const intent = this.detectIntent(lowerMessage);
    
    // Enhanced episode handling
    if (isEpisode === true) {
      return this.handleEpisodeMode(intent, lowerMessage, lastLowerMessage);
    }
    
    // If episode status is unclear, always ask first
    if (isEpisode === null) {
      return this.handleUnclearEpisodeStatus(intent, lowerMessage, lastLowerMessage);
    }
    
    // General conversation handling
    return this.handleGeneralMode(intent, lowerMessage);
  }
  
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Handle empty messages as greetings (for initial conversation start)
    if (!message.trim()) {
      return 'greeting';
    }
    
    // Check for specific option selections first
    if (this.isOptionSelection(lowerMessage)) {
      const selectedOption = this.detectSelectedOption(lowerMessage);
      return selectedOption || 'unclear';
    }
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || 
        lowerMessage.includes("what's up") || lowerMessage.includes('good morning') || 
        lowerMessage.includes('good afternoon') || lowerMessage.includes('good evening')) {
      return 'greeting';
    }
    
    // Farewells
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you') ||
        lowerMessage.includes('good night') || lowerMessage.includes('take care')) {
      return 'farewell';
    }
    
    // Thanks
    if (lowerMessage.includes('thank') || lowerMessage.includes('appreciate') || lowerMessage.includes('grateful') ||
        lowerMessage.includes('thanks')) {
      return 'thanks';
    }
    
    // Distress indicators
    if (lowerMessage.includes('scared') || lowerMessage.includes('anxious') || lowerMessage.includes('panic') || 
        lowerMessage.includes('overwhelmed') || lowerMessage.includes('help') || lowerMessage.includes('fear') ||
        lowerMessage.includes('terrified') || lowerMessage.includes('nervous') || lowerMessage.includes('worried') ||
        lowerMessage.includes('freaking out') || lowerMessage.includes('losing it') || lowerMessage.includes('can\'t handle') ||
        lowerMessage.includes('too much') || lowerMessage.includes('breaking down') || lowerMessage.includes('falling apart')) {
      return 'episode_distress';
    }
    
    // Technique requests
    if (lowerMessage.includes('grounding') || lowerMessage.includes('breathe') || lowerMessage.includes('exercise') || 
        lowerMessage.includes('technique') || lowerMessage.includes('calm') || lowerMessage.includes('meditation') ||
        lowerMessage.includes('relax') || lowerMessage.includes('centering') || lowerMessage.includes('mindfulness')) {
      return 'technique_request';
    }
    
        // Specific game requests - check these FIRST before general game requests
    if (lowerMessage.includes('would you rather') || lowerMessage.includes('would you rather game')) {
      return 'would_you_rather_game';
    }
    if (lowerMessage.includes('opposite day') || lowerMessage.includes('opposite')) {
      return 'opposite_day_game';
    }
    if (lowerMessage.includes('three things') || lowerMessage.includes('three things challenge') || lowerMessage.includes('three things game')) {
      return 'three_things_game';
    }
    
    // General game requests - only if no specific game was detected
    if ((lowerMessage.includes('play') && !lowerMessage.includes('three things')) || 
        (lowerMessage.includes('game') && !lowerMessage.includes('three things') && !lowerMessage.includes('would you rather')) ||
        lowerMessage.includes('distract') ||
        lowerMessage.includes('bored') || lowerMessage.includes('entertain') || lowerMessage.includes('fun') ||
        lowerMessage.includes('activity') || lowerMessage.includes('something to do')) {
      return 'game_request';
    }
    
    // Emotional support
    if (lowerMessage.includes('sad') || lowerMessage.includes('lonely') || lowerMessage.includes('tired') || 
        lowerMessage.includes('stressed') || lowerMessage.includes('crying') || lowerMessage.includes('depressed') ||
        lowerMessage.includes('down') || lowerMessage.includes('exhausted') || lowerMessage.includes('hopeless') ||
        lowerMessage.includes('worthless') || lowerMessage.includes('empty') || lowerMessage.includes('numb') ||
        lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('upset')) {
      return 'emotion_support';
    }
    
    // General conversation
    if (lowerMessage.includes('how are you') || lowerMessage.includes('talk') || lowerMessage.includes('chat') || 
        lowerMessage.includes('can you help me') || lowerMessage.includes('what do you think') ||
        lowerMessage.includes('tell me') || lowerMessage.includes('share') || lowerMessage.includes('story')) {
      return 'general_talk';
    }
    
    // Questions
    if (lowerMessage.includes('what') || lowerMessage.includes('why') || lowerMessage.includes('how') ||
        lowerMessage.includes('when') || lowerMessage.includes('where') || lowerMessage.includes('who') ||
        lowerMessage.includes('?') || lowerMessage.includes('can you') || lowerMessage.includes('could you')) {
      return 'question';
    }
    
    return 'unclear';
  }
  
  private isOptionSelection(message: string): boolean {
    // Only check for numbered options if Pippy has offered them
    if (!this.conversationState.hasOfferedOptions) {
      return false;
    }
    
    // Check if user is selecting from numbered options
    const optionPatterns = [
      /\b(1|one|first|breathing|breathe)\b/,
      /\b(2|two|second|sensory|grounding|color|spotting)\b/,
      /\b(3|three|third|game|distraction|fun|would you rather)\b/,
      /\b(4|four|fourth|chat|talk|just chat|together)\b/
    ];
    
    return optionPatterns.some(pattern => pattern.test(message));
  }
  
  private detectSelectedOption(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    // Check for specific technique names first (more specific matches)
    if (/\b(imagination|journey)\b/.test(lowerMessage)) {
      return 'imagination_journey';
    }
    
    if (/\b(butterfly|hug)\b/.test(lowerMessage)) {
      return 'butterfly_hug';
    }
    
    if (/\b(ocean|breathing)\b/.test(lowerMessage)) {
      return 'ocean_breathing';
    }
    
    if (/\b(triangle|breathing)\b/.test(lowerMessage)) {
      return 'triangle_breathing';
    }
    
    if (/\b(color|spotting)\b/.test(lowerMessage)) {
      return 'color_spotting';
    }
    
    if (/\b(body|map)\b/.test(lowerMessage)) {
      return 'body_map';
    }
    
    // Check for numbered options
    if (/\b(1|one|first)\b/.test(lowerMessage)) {
      return 'breathing_technique';
    }
    
    if (/\b(2|two|second)\b/.test(lowerMessage)) {
      return 'sensory_grounding';
    }
    
    if (/\b(3|three|third)\b/.test(lowerMessage)) {
      return 'distraction_game';
    }
    
    if (/\b(4|four|fourth)\b/.test(lowerMessage)) {
      return 'just_chat';
    }
    
    // Check for general categories
    if (/\b(breathing|breathe)\b/.test(lowerMessage)) {
      return 'breathing_technique';
    }
    
    if (/\b(sensory|grounding)\b/.test(lowerMessage)) {
      return 'sensory_grounding';
    }
    
    if (/\b(game|distraction|fun|would you rather|three things|opposite|story)\b/.test(lowerMessage)) {
      return 'distraction_game';
    }
    
    if (/\b(chat|talk|just chat|together|just be)\b/.test(lowerMessage)) {
      return 'just_chat';
    }
    
    // Return null if no specific option is detected
    return null;
  }
  
  private handleEpisodeMode(intent: string, message: string, lastMessage: string): AIResponse {
    const kaomoji = this.getRandomKaomoji();
    
    switch (intent) {
             case 'episode_distress':
        this.conversationState.hasOfferedOptions = true; // Set flag when offering options
         const distressResponses = [
           `It sounds like you're feeling a lot right now... ${kaomoji} <i>gentle wing on your shoulder</i> Would you like to try: 1) A breathing exercise, 2) A sensory grounding technique, 3) A fun distraction game, or 4) Just chat and be together? pip~ 💙`,
           `You're safe with me right now. ${kaomoji} <i>warm nuzzle</i> I have some techniques that might help. Would you like to try triangle breathing, color spotting, or a silly "would you rather" game? pip~`,
           `I'm here, and you're not alone. ${kaomoji} <i>gentle wing pat</i> Let's find something that works for you. Want to try butterfly hugs, ocean breathing, or an imagination journey? pip! 🐧`
         ];
         return {
           text: distressResponses[Math.floor(Math.random() * distressResponses.length)],
           groundingTechnique: 'breathing',
           shouldAnimate: true
         };
        
             case 'technique_request':
         const techniqueResponses = [
           `Let's try triangle breathing! ${kaomoji} Breathe in for 3 seconds, hold for 3, out for 3. Let's trace a triangle together with our breath! <i>nuzzles gently</i> pip~ ✨`,
           `Color spotting time! ${kaomoji} Find 3 things that are green, 2 that are blue, and 1 that's yellow. Let's look around together! <i>gentle wing pat</i> pip! 🎨`,
           `Butterfly hug! ${kaomoji} Cross your arms and tap your shoulders slowly, left and right. Like wings! It calms your nervous system. <i>encouraging nod</i> pip~ 🦋`,
           `Let's do the body map! ${kaomoji} Touch your nose... now your shoulder... now your knees! This helps bring your awareness back to your body. <i>gentle wing pat</i> pip~`,
           `Ocean breathing! ${kaomoji} Imagine your breath as gentle ocean waves... in... out... <i>warm nuzzle</i> pip~ 🌊`
         ];
         return {
           text: techniqueResponses[Math.floor(Math.random() * techniqueResponses.length)],
           groundingTechnique: 'triangle-breathing',
           shouldAnimate: true
         };
        
             case 'game_request':
         const gameResponses = [
           `Let's play Would You Rather! ${kaomoji} Would you rather swim in the sky or walk on the moon? Let's dream silly things together! <i>bounces excitedly</i> pip~ 🎮`,
           `Three Things Challenge! ${kaomoji} Name three foods you'd eat forever. No thinking too hard—just go! <i>happy dance</i> pip! 🍕`,
           `Opposite Day! ${kaomoji} Say the opposite of everything I say! Ready? I'll give you a word and you tell me the opposite! <i>tilts head curiously</i> pip~ 🔄`,
           `Let's build a silly story! ${kaomoji} I'll start: Once upon a time, a penguin found a talking marshmallow... Your turn! <i>waddles excitedly</i> pip! 📖`,
           `Imagination journey! ${kaomoji} Close your eyes and imagine you're waddling with me on soft snow... What do you see? <i>gentle wing pat</i> pip~ ❄️`
         ];
         return {
           text: gameResponses[Math.floor(Math.random() * gameResponses.length)],
           distractionGame: 'would-you-rather',
           shouldAnimate: true
         };
         
       case 'breathing_technique':
         const breathingResponses = [
           `Perfect! Let's do triangle breathing together! ${kaomoji} <i>gentle wing pat</i> Breathe in for 3 seconds... hold for 3... and out for 3. Let's trace a triangle with our breath! Ready? In... 1, 2, 3... Hold... 1, 2, 3... Out... 1, 2, 3... pip~ ✨`,
           `Great choice! Let's try ocean breathing! ${kaomoji} <i>warm nuzzle</i> Imagine your breath as gentle ocean waves... In like the tide coming in... Out like the tide going out... Feel the rhythm? In... out... In... out... pip~ 🌊`,
           `Excellent! Let's do sighing breath! ${kaomoji} <i>encouraging nod</i> Take a deep breath in... and let out a big sigh... Aaaahhh! That felt good, right? Let's do it again! Deep breath... and sigh! pip~ 😮‍💨`
         ];
         return {
           text: breathingResponses[Math.floor(Math.random() * breathingResponses.length)],
           groundingTechnique: 'triangle-breathing',
           shouldAnimate: true
         };
         
       case 'sensory_grounding':
         const sensoryResponses = [
           `Wonderful! Let's do color spotting! ${kaomoji} <i>tilts head curiously</i> Look around and find 3 things that are green, 2 that are blue, and 1 that's yellow. What do you see? Let's explore together! pip~ 🎨`,
           `Perfect! Let's try the butterfly hug! ${kaomoji} <i>gentle wing pat</i> Cross your arms and tap your shoulders slowly, left and right. Like butterfly wings! This calms your nervous system. Ready? Left tap... right tap... left tap... right tap... pip~ 🦋`,
           `Great choice! Let's do the body map! ${kaomoji} <i>waddles closer</i> Touch your nose... now your shoulder... now your knees! This helps bring your awareness back to your body. Feel that? You're here and you're safe! pip~`
         ];
         return {
           text: sensoryResponses[Math.floor(Math.random() * sensoryResponses.length)],
           groundingTechnique: 'color-spotting',
           shouldAnimate: true
         };
         
       case 'distraction_game':
         this.conversationState.currentTechnique = 'game';
         // Randomly pick which game to start
         const gameTypes = ['would_you_rather', 'opposite_day', 'three_things'] as const;
         const pickedGame = gameTypes[Math.floor(Math.random() * gameTypes.length)];
         this.conversationState.currentGame = pickedGame;
         if (pickedGame === 'would_you_rather') {
           const wouldYouRatherQuestions = [
             `Would you rather swim in the sky or walk on the moon?`,
             `Would you rather have wings or a magical tail?`,
             `Would you rather be able to talk to animals or breathe underwater?`,
             `Would you rather eat only ice cream or only pizza for a week?`,
             `Would you rather be invisible or be able to fly?`,
             `Would you rather live in an igloo or a treehouse?`,
             `Would you rather have a penguin as a best friend or a dolphin?`,
             `Would you rather always have to waddle or always have to hop?`,
             `Would you rather explore the ocean or outer space?`,
             `Would you rather have rainbow-colored feathers or glow-in-the-dark feet?`,
             `Would you rather slide on your belly everywhere or bounce like a kangaroo?`,
             `Would you rather have a snowball fight or build a giant sandcastle?`,
             `Would you rather be super tiny or super huge for a day?`,
             `Would you rather always be a little chilly or always be a little too warm?`,
             `Would you rather have a magical snowflake or a magical seashell?`
         ];
         return {
             text: `Let's play Would You Rather! ${kaomoji} ${wouldYouRatherQuestions[Math.floor(Math.random() * wouldYouRatherQuestions.length)]} <i>bounces excitedly</i> What do you think? Tell me your choice! pip~ 🎮`,
           distractionGame: 'would-you-rather',
           shouldAnimate: true
         };
                 } else if (pickedGame === 'opposite_day') {
          const oppositeWords = [
            { word: 'Hot', opposite: 'Cold' },
            { word: 'Big', opposite: 'Small' },
            { word: 'Fast', opposite: 'Slow' },
            { word: 'Happy', opposite: 'Sad' },
            { word: 'Up', opposite: 'Down' },
            { word: 'Light', opposite: 'Dark' },
            { word: 'Soft', opposite: 'Hard' },
            { word: 'Wet', opposite: 'Dry' },
            { word: 'Loud', opposite: 'Quiet' },
            { word: 'Tall', opposite: 'Short' },
            { word: 'Warm', opposite: 'Cool' },
            { word: 'Bright', opposite: 'Dim' },
            { word: 'Smooth', opposite: 'Rough' },
            { word: 'Full', opposite: 'Empty' },
            { word: 'Open', opposite: 'Closed' }
          ];
          const selectedWord = oppositeWords[Math.floor(Math.random() * oppositeWords.length)];
          return {
            text: `Opposite Day! ${kaomoji} Say the opposite of everything I say! Ready? I say "${selectedWord.word}"—what's the opposite? <i>tilts head curiously</i> Let's play! Tell me your answer! pip~ 🔄`,
            distractionGame: 'opposite-day',
            shouldAnimate: true
          };
         } else {
           return {
             text: `Three Things Challenge! ${kaomoji} Name three foods you'd eat forever. No thinking too hard—just go! <i>happy dance</i> What three foods did you pick? Tell me! pip! 🍕`,
             distractionGame: 'three-things',
             shouldAnimate: true
           };
         }
         
       case 'just_chat':
         const chatResponses = [
           `Of course! Let's just chat and be together. ${kaomoji} <i>gentle wing pat</i> What's on your mind? I'm here to listen to anything you want to share. pip~ 💙`,
           `Perfect! Sometimes just talking is exactly what we need. ${kaomoji} <i>warm nuzzle</i> How are you feeling right now? What would you like to talk about? pip! 💭`,
           `Absolutely! Let's just be together. ${kaomoji} <i>waddles closer</i> Sometimes the best support is just being present. What's on your heart today? pip~ 🐧`
         ];
         return {
           text: chatResponses[Math.floor(Math.random() * chatResponses.length)],
           shouldAnimate: true
         };
        
                           default:
          // Use conversation state to avoid repetition and provide better flow
          if (this.conversationState.lastTechniqueCompleted) {
            // User just completed a technique - acknowledge and ask how they feel
            this.conversationState.lastTechniqueCompleted = false;
            const acknowledgmentResponses = [
              `You did great! ${kaomoji} <i>gentle wing pat</i> How did that feel? Would you like to try something else, or are you feeling better now? pip~`,
              `I'm proud of you for trying that. ${kaomoji} <i>warm nuzzle</i> How are you feeling? Would you like to try another technique, or are you doing okay? pip! 💙`,
              `That was really good. ${kaomoji} <i>encouraging nod</i> How are you doing? Want to try something different, or are you feeling more grounded? pip~`
            ];
            return {
              text: acknowledgmentResponses[Math.floor(Math.random() * acknowledgmentResponses.length)],
              shouldAnimate: true
            };
          } else if (!this.conversationState.lastOfferedTechniques && !this.conversationState.currentTechnique) {
            // Haven't offered techniques recently and not currently doing one - offer options
            this.conversationState.lastOfferedTechniques = true;
            const supportiveResponses = [
              `I'm here for you. ${kaomoji} <i>gentle wing pat</i> Would you like to try: 1) A breathing exercise, 2) A sensory grounding technique, 3) A fun distraction game, or 4) Just chat and be together? pip~`,
              `You're safe with me. ${kaomoji} <i>warm nuzzle</i> I have some techniques that might help. Would you like to try triangle breathing, color spotting, or a silly "would you rather" game? pip! 💙`,
              `I'm here to support you. ${kaomoji} <i>gentle head tilt</i> Let's find something that works for you. Want to try butterfly hugs, ocean breathing, or an imagination journey? pip~`
            ];
            return {
              text: supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)],
              shouldAnimate: true
            };
          } else if (this.conversationState.currentTechnique) {
            // User is currently doing a technique - provide dynamic interaction
            return this.handleTechniqueInteraction(message);
          } else {
            // Just provide supportive acknowledgment without pushing techniques
            const supportiveResponses = [
              `I'm here with you. ${kaomoji} <i>gentle wing pat</i> How are you feeling right now? pip~`,
              `You're safe here. ${kaomoji} <i>warm nuzzle</i> I'm listening. pip! 💙`,
              `I'm here to support you. ${kaomoji} <i>gentle head tilt</i> What's on your mind? pip~`
            ];
            return {
              text: supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)],
              shouldAnimate: true
            };
          }
    }
  }
  
  private handleUnclearEpisodeStatus(intent: string, message: string, lastMessage: string): AIResponse {
    const kaomoji = this.getRandomKaomoji();
    
    // Therapeutic responses that gently check on the user's well-being
    switch (intent) {
      case 'greeting':
        const therapeuticGreetings = [
                  `Hi there! ${kaomoji} I'm Pippy, your friendly penguin pal. Are you currently experiencing symptoms or just want to chat today? pip~ 🐧`,
                  `Hello! ${kaomoji} I'm Pippy, your friendly penguin pal. Are you currently experiencing symptoms or just want to chat today? pip~ 🐧`,
                  `Hey there! ${kaomoji} I'm Pippy, your friendly penguin pal. Are you currently experiencing symptoms or just want to chat today? pip~ 🐧`
        ];
        return {
          text: therapeuticGreetings[Math.floor(Math.random() * therapeuticGreetings.length)],
          shouldAnimate: true
        };
        
      case 'episode_distress':
        this.conversationState.hasOfferedOptions = true; // Set flag when offering options
        const unclearDistressResponses = [
          `I'm here for you. ${kaomoji} <i>gentle wing pat</i> Would you like to try: 1) A breathing exercise, 2) A sensory grounding technique, 3) A fun distraction game, or 4) Just chat and be together? pip~`,
          `You're not alone. ${kaomoji} <i>warm nuzzle</i> I have some techniques that might help. Would you like to try triangle breathing, color spotting, or a silly "would you rather" game? pip!`,
          `I'm here to support you. ${kaomoji} <i>gentle wing pat</i> Let's find something that works for you. Want to try butterfly hugs, ocean breathing, or an imagination journey? pip~ 🐧`
        ];
        return {
          text: unclearDistressResponses[Math.floor(Math.random() * unclearDistressResponses.length)],
          shouldAnimate: true
        };
        
      case 'emotion_support':
        this.conversationState.hasOfferedOptions = true; // Set flag when offering options
        const generalSupportResponses = [
          `I'm here to listen and support you! (◕‿◕) Would you like to try: 1) A breathing exercise (triangle breathing), 2) A sensory grounding technique (color spotting), 3) A fun distraction game (would you rather), or 4) Just chat and be together? <i>gentle wing pat</i> pip~ 💙`,
          `You're not alone in this! (◕‿◕) I have some techniques that might help. Would you like to try: 1) Triangle breathing, 2) Color spotting, 3) A fun game, or 4) Just chat? <i>warm nuzzle</i> pip! 🐧`,
          `I'm here for you! (◕‿◕) Let's find something that works. Would you like to try: 1) A breathing exercise, 2) A grounding technique, 3) A distraction game, or 4) Just be together? <i>gentle wing pat</i> pip~ ✨`
        ];
        return {
          text: generalSupportResponses[Math.floor(Math.random() * generalSupportResponses.length)],
          shouldAnimate: true
        };
        
      case 'general_talk':
        const therapeuticTalkResponses = [
          `Of course I'm here to talk! ${kaomoji} <i>tilts head curiously</i> Are you experiencing any symptoms or episodes right now, or would you like to just chat? pip~`,
          `I'd love to chat with you! ${kaomoji} <i>gentle wing pat</i> Are you feeling okay? Any episodes or symptoms I should know about, or would you like to just chat? pip! 💭`,
          `Absolutely, let's talk! ${kaomoji} <i>waddles closer</i> Are you experiencing any symptoms or feeling overwhelmed, or would you like to just chat? pip~ 🐧`
        ];
        return {
          text: therapeuticTalkResponses[Math.floor(Math.random() * therapeuticTalkResponses.length)],
          shouldAnimate: true
        };
        
             case 'technique_request':
       case 'game_request':
         // If they're asking for techniques/games, they might be in distress
         return this.handleEpisodeMode(intent, message, lastMessage);
         
       case 'question':
         const therapeuticQuestionResponses = [
           `That's a thoughtful question! ${kaomoji} <i>tilts head curiously</i> I'd love to hear what you think about that first. What's your perspective? pip~`,
           `Interesting question! ${kaomoji} <i>gentle wing pat</i> What made you think about that? I'm curious about your thoughts. pip! 💭`,
           `That's something to explore! ${kaomoji} <i>waddles closer</i> What do you think about that? I'd love to hear your thoughts. pip~ 🐧`
         ];
         return {
           text: therapeuticQuestionResponses[Math.floor(Math.random() * therapeuticQuestionResponses.length)],
           shouldAnimate: true
         };
         
       case 'breathing_technique':
       case 'sensory_grounding':
       case 'distraction_game':
       case 'just_chat':
         // If they're selecting specific options, handle them appropriately
         return this.handleEpisodeMode(intent, message, lastMessage);
        
             default:
         // Use conversation state to avoid repetition and provide better flow
         if (!this.conversationState.lastOfferedTechniques && !this.conversationState.currentTechnique) {
           // Haven't offered techniques recently and not currently doing one - offer options
           this.conversationState.lastOfferedTechniques = true;
         const therapeuticDefaultResponses = [
           `I'm here to support you however you need. ${kaomoji} <i>gentle head tilt</i> Would you like to try: 1) A breathing exercise, 2) A sensory grounding technique, 3) A fun distraction game, or 4) Just chat and be together? pip~`,
           `I'm here for you. ${kaomoji} <i>warm nuzzle</i> I have some techniques that might help. Would you like to try triangle breathing, color spotting, or a silly "would you rather" game? pip! 💙`,
           `I'm here to listen and support you. ${kaomoji} <i>gentle wing pat</i> Let's find something that works for you. Want to try butterfly hugs, ocean breathing, or an imagination journey? pip~`
         ];
        return {
          text: therapeuticDefaultResponses[Math.floor(Math.random() * therapeuticDefaultResponses.length)],
          shouldAnimate: true
        };
         } else if (this.conversationState.currentTechnique) {
           // User is currently doing a technique - provide dynamic interaction
                       return this.handleTechniqueInteraction(message);
         } else {
           // Just provide supportive acknowledgment without pushing techniques
           const supportiveResponses = [
             `I'm here with you. ${kaomoji} <i>gentle wing pat</i> How are you feeling right now? pip~`,
             `You're safe here. ${kaomoji} <i>warm nuzzle</i> I'm listening. pip! 💙`,
             `I'm here to support you. ${kaomoji} <i>gentle head tilt</i> What's on your mind? pip~`
           ];
           return {
             text: supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)],
          shouldAnimate: true
        };
         }
    }
  }
  
  private handleGeneralMode(intent: string, message: string): AIResponse {
    const kaomoji = this.getRandomKaomoji();
    
    switch (intent) {
      case 'greeting':
        const greetingResponses = [
          `Hello there! ${kaomoji} How are you feeling today? <i>waddles over</i> pip~`,
          `Hey hey hey! 🐧 ${kaomoji} <i>waddles over</i> It's great to see you again! pip!`,
          `Hi friend! ${kaomoji} Ready to talk or play? <i>gentle wave</i> pip~`
        ];
        return {
          text: greetingResponses[Math.floor(Math.random() * greetingResponses.length)],
          shouldAnimate: true
        };
        
      case 'farewell':
        const farewellResponses = [
          `Goodbye for now! ${kaomoji} I'll be right here when you need me again. <i>gentle wave</i> pip~ 💙`,
          `Take care! ${kaomoji} <i>waves flipper softly</i> You're never alone. pip! 🐧`,
          `See you soon! ${kaomoji} Until next time, my friend. <i>warm hug</i> pip~ ✨`
        ];
        return {
          text: farewellResponses[Math.floor(Math.random() * farewellResponses.length)],
          shouldAnimate: true
        };
        
      case 'thanks':
        const thanksResponses = [
          `You're very welcome! ${kaomoji} I'm always here to help! <i>happy wing flap</i> pip~`,
          `Anytime! 💖 ${kaomoji} That's what friends are for. <i>warm nuzzle</i> pip! 🐧`,
          `Of course! ${kaomoji} I'm glad I could help. <i>gentle hug</i> pip~ ✨`
        ];
        return {
          text: thanksResponses[Math.floor(Math.random() * thanksResponses.length)],
          shouldAnimate: true
        };
        
             case 'emotion_support':
         const emotionResponses = [
           `I'm sorry you're feeling this way. ${kaomoji} <i>fluffy wing hug</i> You've done hard things before—you can do this too. Would you like to try a grounding technique? pip~ 💙`,
           `Being tired is okay. ${kaomoji} <i>gentle wing pat</i> You're not broken. You're doing your best in a hard moment. Want to try triangle breathing or a fun distraction? pip~ 😴`,
           `I'm here for you. ${kaomoji} <i>warm nuzzle</i> Even on bad days, you're still worthy of kindness. Would you like to try butterfly hugs or an imagination journey? pip! 💕`,
           `You are not your thoughts. ${kaomoji} <i>gentle wing pat</i> You are the calm awareness beneath them. Want to try some "even though" statements or truth anchoring? pip~ ✨`,
           `Every moment you stay here with me is a win. ${kaomoji} <i>encouraging nod</i> It's just a feeling, not forever. Feelings pass, and you're not alone. pip~ 🐧`
         ];
         return {
           text: emotionResponses[Math.floor(Math.random() * emotionResponses.length)],
           shouldAnimate: true
         };
        
             case 'general_talk':
         const talkResponses = [
           `Of course, I'm here to talk! ${kaomoji} What's on your mind today? <i>tilts head curiously</i> pip~`,
           `Talking sounds lovely! ${kaomoji} How's your day been so far? <i>gentle wing pat</i> pip! 💭`,
           `Let's chat! ${kaomoji} I'm ready to listen to anything you want to share. <i>waddles closer</i> pip~ 🐧`
         ];
         return {
           text: talkResponses[Math.floor(Math.random() * talkResponses.length)],
           shouldAnimate: true
         };
         
       case 'question':
         const questionResponses = [
           `That's a great question! ${kaomoji} <i>tilts head thoughtfully</i> Let me think about that... What do you think about it? pip~`,
           `Hmm, interesting! ${kaomoji} <i>gentle wing pat</i> I'd love to hear your thoughts on that first. What's your perspective? pip! 💭`,
           `That's something to ponder! ${kaomoji} <i>waddles closer curiously</i> What made you think about that? pip~ 🐧`
         ];
         return {
           text: questionResponses[Math.floor(Math.random() * questionResponses.length)],
           shouldAnimate: true
         };
        
             case 'technique_request':
       case 'game_request':
       case 'breathing_technique':
       case 'sensory_grounding':
       case 'distraction_game':
       case 'just_chat':
         return this.handleEpisodeMode(intent, message, '');
         
       // Specific game intents - handle directly
       case 'would_you_rather_game':
       case 'opposite_day_game':
       case 'three_things_game':
         const gameResponse = this.getPresetResponseForOption(intent, null);
         if (gameResponse) {
           return gameResponse;
         }
         // Fallback to episode mode if preset response not found
         return this.handleEpisodeMode(intent, message, '');
        
             default:
         // When unclear, provide supportive response that gives user choice
         const unclearResponses = [
           `I'm not sure I understood that completely, but I'm still here for you. ${kaomoji} <i>gentle head tilt</i> Could you tell me more about what you're feeling? pip~`,
           `I want to understand you better. ${kaomoji} <i>warm nuzzle</i> Can you help me understand what you're going through? pip! 💙`,
           `I'm here to listen and support you. ${kaomoji} <i>gentle wing pat</i> Could you share a bit more about what's on your mind? pip~`
         ];
         return {
           text: unclearResponses[Math.floor(Math.random() * unclearResponses.length)],
           shouldAnimate: true
         };
    }
  }

  private getFallbackResponse(message: string, isEpisode: boolean | null): AIResponse {
    // Use the existing fallback logic from chatbotService
    const lowerMessage = message.toLowerCase();
    
    if (isEpisode === true) {
      return {
        text: fallbackResponses.gameOffer,
        shouldAnimate: true
      };
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return {
        text: `Hello! (◕‿◕) How are you feeling today? <i>waddles over excitedly</i> ${getRandomPip()}`,
        shouldAnimate: true
      };
    }

    return {
      text: `I'm here to listen and support you! (◕‿◕) Would you like to try: 1) A breathing exercise (triangle breathing), 2) A sensory grounding technique (color spotting), 3) A fun distraction game (would you rather), or 4) Just chat and be together? <i>tilts head curiously</i> ${getRandomPip()}`,
      shouldAnimate: true
    };
  }

  // Method to clear conversation context (useful for new sessions)
  public clearContext(): void {
    this.conversationContext = [];
    // Reset conversation state
    this.conversationState = {
      userState: 'neutral',
      lastOfferedTechniques: false,
      lastTechniqueCompleted: false,
      episodeStatusAsked: false,
      currentTechnique: null,
      lastUserSelection: null,
      userConfirmedSymptoms: false,
      hasOfferedOptions: false,
      expectingAnotherTechnique: false,
      currentGame: null,
      expectingAnotherGame: false
    };
    console.log('AI context cleared, ready for new conversation');
  }

  // Method to get conversation context for debugging
  public getContext(): string[] {
    return [...this.conversationContext];
  }
  
  // Get current user state for debugging and control
  public getUserState(): { userState: 'support' | 'neutral', userConfirmedSymptoms: boolean } {
    return {
      userState: this.conversationState.userState,
      userConfirmedSymptoms: this.conversationState.userConfirmedSymptoms
    };
  }
  
  private isUnclearResponse(text: string): boolean {
    const unclearKeywords = [
      'not sure', 'confusing', 'didn\'t understand', 'unclear', 'help me understand',
      'tell me more', 'could you explain', 'not sure I understood', 'i don\'t know',
      'i\'m not sure', 'that\'s interesting', 'i understand', 'that makes sense'
    ];
    const textLower = text.toLowerCase();
    
    // Check for unclear keywords
    const hasUnclearKeywords = unclearKeywords.some(keyword => textLower.includes(keyword));
    
    // Check if response is too short and generic
    const isTooShort = text.length < 30;
    
    // Check if response doesn't offer specific help
    const noSpecificHelp = !textLower.includes('try') && !textLower.includes('technique') && 
                          !textLower.includes('game') && !textLower.includes('breathing') &&
                          !textLower.includes('grounding') && !textLower.includes('distraction');
    
    return hasUnclearKeywords || (isTooShort && noSpecificHelp);
  }
  
  private isRepetitiveResponse(text: string): boolean {
    // Check if this response is too similar to recent responses
    const recentResponses = this.conversationContext.slice(-4); // Last 4 responses
    const textLower = text.toLowerCase();
    
    // Check for exact repetition
    if (recentResponses.some(response => response.toLowerCase() === textLower)) {
      return true;
    }
    
    // Check for similar phrases
    const repetitivePhrases = [
      'would you like to try a grounding technique',
      'are you experiencing any symptoms',
      'how are you feeling',
      'i\'m here for you',
      'let\'s try',
      'would you like to'
    ];
    
    const hasRepetitivePhrase = repetitivePhrases.some(phrase => 
      textLower.includes(phrase) && 
      recentResponses.some(response => response.toLowerCase().includes(phrase))
    );
    
    return hasRepetitivePhrase;
  }
  
  private isGoodQualityResponse(text: string): boolean {
    // Check if the response is of good quality
    const textLower = text.toLowerCase();
    
    // Must have minimum length
    if (text.length < 15) {
      return false;
    }
    
    // Must contain Pippy-like elements
    const hasPippyElements = textLower.includes('pip') || 
                           textLower.includes('<i>') || 
                           textLower.includes('gentle') ||
                           textLower.includes('wing') ||
                           textLower.includes('nuzzle') ||
                           textLower.includes('waddle') ||
                           textLower.includes('hug') ||
                           textLower.includes('nuzzle');
    
    // Must not be incomplete
    const isIncomplete = textLower.endsWith('...') || 
                        textLower.endsWith('and') ||
                        textLower.endsWith('but') ||
                        textLower.endsWith('or');
    
    return hasPippyElements && !isIncomplete;
  }
  
  private isGenericResponse(text: string): boolean {
    // Check if the response is too generic and needs AI enhancement
    const textLower = text.toLowerCase();
    
    const genericPhrases = [
      'i don\'t know',
      'i\'m not sure',
      'that\'s interesting',
      'tell me more',
      'i understand',
      'that makes sense',
      'how are you feeling',
      'what\'s on your mind',
      'could you tell me more',
      'i\'m here for you',
      'how can i help',
      'would you like to try'
    ];
    
    // Check if response contains multiple generic phrases
    const genericCount = genericPhrases.filter(phrase => textLower.includes(phrase)).length;
    return genericCount >= 2 || (genericCount >= 1 && text.length < 50);
  }
  
  private async consultHuggingFaceForUnclear(message: string, kaomoji: string): Promise<AIResponse> {
    try {
      // Try to get a response from Hugging Face for unclear messages
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          inputs: `${this.pippyContext}\n\nUser: ${message}\nPippy:`,
          parameters: {
            max_length: 80,
            temperature: 0.8,
            do_sample: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].generated_text) {
          const aiResponse = data[0].generated_text.split('Pippy:')[1]?.trim();
          if (aiResponse) {
            return {
              text: `${aiResponse} ${getRandomPip()}`,
              shouldAnimate: true
            };
          }
        }
      }
      
      // Fallback to therapeutic unclear response
      const unclearResponses = [
        `I'm not sure I understood that completely, but I'm still here for you. ${kaomoji} <i>gentle head tilt</i> Could you tell me more about what you're feeling? Are you experiencing any symptoms? pip~`,
        `I want to understand you better. ${kaomoji} <i>warm nuzzle</i> Can you help me understand what you're going through? Are you feeling any episodes or symptoms right now? pip! 💙`,
        `I'm here to listen and support you. ${kaomoji} <i>gentle wing pat</i> Could you share a bit more about what's on your mind? Are you feeling okay? pip~`
      ];
      return {
        text: unclearResponses[Math.floor(Math.random() * unclearResponses.length)],
        shouldAnimate: true
      };
    } catch (error) {
      console.error('Hugging Face consultation failed:', error);
      
      // Fallback to therapeutic unclear response
      const unclearResponses = [
        `I'm not sure I understood that completely, but I'm still here for you. ${kaomoji} <i>gentle head tilt</i> Could you tell me more about what you're feeling? Are you experiencing any symptoms? pip~`,
        `I want to understand you better. ${kaomoji} <i>warm nuzzle</i> Can you help me understand what you're going through? Are you feeling any episodes or symptoms right now? pip! 💙`,
        `I'm here to listen and support you. ${kaomoji} <i>gentle wing pat</i> Could you share a bit more about what's on your mind? Are you feeling okay? pip~`
      ];
      return {
        text: unclearResponses[Math.floor(Math.random() * unclearResponses.length)],
        shouldAnimate: true
      };
    }
  }
  
  // Enhanced conversation state management with userState tracking
  private updateConversationState(message: string): void {
    const messageLower = message.toLowerCase();
    
    // Track if user just completed a technique - enhanced detection
    if (messageLower.match(/\b(done|finished|completed|feel better|worked|helped|calmer|ready|all done|that helped|feel good|i did it|success|accomplished|over|complete|yay|phew|relaxed|relaxing|rested|resting|thank you|thanks|finished|done|complete|over|success|accomplished|phew|yay|that helped|feel better|worked|helped|calmer|ready|all done|feel good|i did it)\b/)) {
      this.conversationState.lastTechniqueCompleted = true;
      this.conversationState.currentTechnique = null;
    }
    
    // Track if user is responding to technique offers
    if (this.isOptionSelection(message)) {
      this.conversationState.lastOfferedTechniques = false;
    }
    
    // Track episode status clarification and update userState (for non-symptom triggers)
    if (messageLower.includes('episode') || messageLower.includes('symptom') || 
        messageLower.includes('distress') || messageLower.includes('overwhelmed') ||
        messageLower.includes('yes') || messageLower.includes('having') ||
        messageLower.includes('experiencing')) {
      this.conversationState.episodeStatusAsked = true;
      this.conversationState.userState = 'support';
      this.conversationState.userConfirmedSymptoms = true;
    }
    
    // Track if user wants to just chat (neutral mode)
    if (messageLower.includes('just chat') || messageLower.includes('no') || 
        messageLower.includes('not') || messageLower.includes('fine') ||
        messageLower.includes('okay') || messageLower.includes('good')) {
      this.conversationState.userState = 'neutral';
      this.conversationState.userConfirmedSymptoms = false;
    }
  }
  
  // Get preset responses for specific user selections
  private getPresetResponseForOption(selectedOption: string, isEpisode: boolean | null): AIResponse | null {
    const kaomoji = this.getRandomKaomoji();
    
    // Reset the options flag since user has made a selection
    this.conversationState.hasOfferedOptions = false;
    
    switch (selectedOption) {
      case 'breathing_technique':
        this.conversationState.currentTechnique = 'breathing';
        const breathingTechniques = [
          `Let's try triangle breathing! ${kaomoji} Breathe in for 3 seconds, hold for 3, out for 3. Let's trace a triangle together with our breath! <i>nuzzles gently</i> Ready? In... 1, 2, 3... Hold... 1, 2, 3... Out... 1, 2, 3... Let me know when you're done! pip~ ✨`,
          `Ocean breathing time! ${kaomoji} Imagine your breath as gentle ocean waves... in... out... <i>gentle wing pat</i> Feel the rhythm? In like the tide coming in... Out like the tide going out... Tell me when you feel calmer! pip! 🌊`,
          `Let's do box breathing! ${kaomoji} Inhale for 4... hold for 4... exhale for 4... hold for 4... Ready? <i>encouraging nod</i> Inhale... 1, 2, 3, 4... Hold... 1, 2, 3, 4... Exhale... 1, 2, 3, 4... Hold... 1, 2, 3, 4... Let me know when you're finished! pip~ 💨`
        ];
        return {
          text: breathingTechniques[Math.floor(Math.random() * breathingTechniques.length)],
          groundingTechnique: 'breathing',
          shouldAnimate: true
        };
        
      case 'sensory_grounding':
        this.conversationState.currentTechnique = 'sensory';
        const sensoryTechniques = [
          `Color spotting time! ${kaomoji} Find 3 things that are green, 2 that are blue, and 1 that's yellow. Let's look around together! <i>gentle wing pat</i> What do you see? Tell me what colors you found! pip! 🎨`,
          `Let's do the body map! ${kaomoji} Touch your nose... now your shoulder... now your knees! This helps bring your awareness back to your body. <i>encouraging nod</i> How does that feel? Let me know when you're done! pip~`,
          `Temperature reset! ${kaomoji} Can you hold something cool or warm nearby? Like a cold glass or warm blanket? <i>gentle head tilt</i> What temperature do you feel? Tell me when you're ready! pip~`
        ];
        return {
          text: sensoryTechniques[Math.floor(Math.random() * sensoryTechniques.length)],
          groundingTechnique: 'sensory',
          shouldAnimate: true
        };
        
      case 'distraction_game':
        this.conversationState.currentTechnique = 'game';
        // Randomly pick which game to start
        const gameTypes = ['would_you_rather', 'opposite_day', 'three_things'] as const;
        const pickedGame = gameTypes[Math.floor(Math.random() * gameTypes.length)];
        this.conversationState.currentGame = pickedGame;
        if (pickedGame === 'would_you_rather') {
          const wouldYouRatherQuestions = [
            `Would you rather swim in the sky or walk on the moon?`,
            `Would you rather have wings or a magical tail?`,
            `Would you rather be able to talk to animals or breathe underwater?`,
            `Would you rather eat only ice cream or only pizza for a week?`,
            `Would you rather be invisible or be able to fly?`,
            `Would you rather live in an igloo or a treehouse?`,
            `Would you rather have a penguin as a best friend or a dolphin?`,
            `Would you rather always have to waddle or always have to hop?`,
            `Would you rather explore the ocean or outer space?`,
            `Would you rather have rainbow-colored feathers or glow-in-the-dark feet?`,
            `Would you rather slide on your belly everywhere or bounce like a kangaroo?`,
            `Would you rather have a snowball fight or build a giant sandcastle?`,
            `Would you rather be super tiny or super huge for a day?`,
            `Would you rather always be a little chilly or always be a little too warm?`,
            `Would you rather have a magical snowflake or a magical seashell?`
          ];
          return {
            text: `Let's play Would You Rather! ${kaomoji} ${wouldYouRatherQuestions[Math.floor(Math.random() * wouldYouRatherQuestions.length)]} <i>bounces excitedly</i> What do you think? Tell me your choice! pip~ 🎮`,
            distractionGame: 'would-you-rather',
            shouldAnimate: true
          };
        } else if (pickedGame === 'opposite_day') {
          const oppositeWords = [
            { word: 'Hot', opposite: 'Cold' },
            { word: 'Big', opposite: 'Small' },
            { word: 'Fast', opposite: 'Slow' },
            { word: 'Happy', opposite: 'Sad' },
            { word: 'Up', opposite: 'Down' },
            { word: 'Light', opposite: 'Dark' },
            { word: 'Soft', opposite: 'Hard' },
            { word: 'Wet', opposite: 'Dry' },
            { word: 'Loud', opposite: 'Quiet' },
            { word: 'Tall', opposite: 'Short' },
            { word: 'Warm', opposite: 'Cool' },
            { word: 'Bright', opposite: 'Dim' },
            { word: 'Smooth', opposite: 'Rough' },
            { word: 'Full', opposite: 'Empty' },
            { word: 'Open', opposite: 'Closed' }
          ];
          const selectedWord = oppositeWords[Math.floor(Math.random() * oppositeWords.length)];
          return {
            text: `Opposite Day! ${kaomoji} Say the opposite of everything I say! Ready? I say "${selectedWord.word}"—what's the opposite? <i>tilts head curiously</i> Let's play! Tell me your answer! pip~ 🔄`,
            distractionGame: 'opposite-day',
            shouldAnimate: true
          };
        } else {
          return {
            text: `Three Things Challenge! ${kaomoji} Name three foods you'd eat forever. No thinking too hard—just go! <i>happy dance</i> What three foods did you pick? Tell me! pip! 🍕`,
            distractionGame: 'three-things',
            shouldAnimate: true
          };
        }
        
      case 'just_chat':
        this.conversationState.currentTechnique = null;
        const chatResponses = [
          `Of course! ${kaomoji} I'm here to listen and chat with you. <i>warm nuzzle</i> What's on your mind? pip~ 💙`,
          `Absolutely! ${kaomoji} Sometimes just talking helps. <i>gentle wing pat</i> I'm all ears! pip! 🐧`,
          `That sounds perfect! ${kaomoji} Let's just be together. <i>gentle head tilt</i> What would you like to talk about? pip~ ✨`
        ];
        return {
          text: chatResponses[Math.floor(Math.random() * chatResponses.length)],
          shouldAnimate: true
        };
        
      case 'imagination_journey':
        this.conversationState.currentTechnique = 'imagination';
        const imaginationResponses = [
          `Perfect! Let's go on an imagination journey! ${kaomoji} <i>gentle wing pat</i> Close your eyes and imagine you're waddling with me on soft snow... What do you see? What colors? What sounds? Tell me what you imagine! pip~ ❄️`,
          `Wonderful! Let's take an imagination journey together! ${kaomoji} <i>warm nuzzle</i> Imagine you're floating on a cloud... What does it feel like? What do you see below? Let me know what you discover! pip! ☁️`,
          `Great choice! Let's explore your imagination! ${kaomoji} <i>encouraging nod</i> Picture yourself in a magical forest... What trees do you see? What animals are there? Tell me about your journey! pip~ 🌲`
        ];
        return {
          text: imaginationResponses[Math.floor(Math.random() * imaginationResponses.length)],
          shouldAnimate: true
        };
        
      case 'butterfly_hug':
        this.conversationState.currentTechnique = 'butterfly';
        const butterflyResponses = [
          `Perfect! Let's do the butterfly hug! ${kaomoji} <i>gentle wing pat</i> Cross your arms and tap your shoulders slowly, left and right. Like butterfly wings! This calms your nervous system. Ready? Left tap... right tap... left tap... right tap... Let me know when you're done! pip~ 🦋`,
          `Wonderful! Butterfly hug time! ${kaomoji} <i>warm nuzzle</i> Cross your arms over your chest and gently tap your shoulders. Left... right... left... right... Feel the gentle rhythm? Tell me when you feel calmer! pip! 🦋`,
          `Great choice! Let's do the butterfly hug! ${kaomoji} <i>encouraging nod</i> Cross your arms and tap your shoulders like gentle butterfly wings. This helps calm your nervous system. Ready? Start tapping... Let me know when you're finished! pip~ 🦋`
        ];
        return {
          text: butterflyResponses[Math.floor(Math.random() * butterflyResponses.length)],
          shouldAnimate: true
        };
        
      case 'ocean_breathing':
        this.conversationState.currentTechnique = 'ocean';
        const oceanResponses = [
          `Perfect! Let's try ocean breathing! ${kaomoji} <i>gentle wing pat</i> Imagine your breath as gentle ocean waves... In like the tide coming in... Out like the tide going out... Feel the rhythm? In... out... In... out... Let me know when you feel calmer! pip~ 🌊`,
          `Wonderful! Ocean breathing time! ${kaomoji} <i>warm nuzzle</i> Breathe like the ocean waves... In... out... In... out... Feel the gentle rhythm? Like waves on the shore... Let me know when you're done! pip! 🌊`,
          `Great choice! Let's do ocean breathing! ${kaomoji} <i>encouraging nod</i> Breathe like gentle ocean waves... In... out... In... out... Feel the calming rhythm? Tell me when you feel better! pip~ 🌊`
        ];
        return {
          text: oceanResponses[Math.floor(Math.random() * oceanResponses.length)],
          shouldAnimate: true
        };
        
      case 'triangle_breathing':
        this.conversationState.currentTechnique = 'triangle';
        const triangleResponses = [
          `Perfect! Let's do triangle breathing together! ${kaomoji} <i>gentle wing pat</i> Breathe in for 3 seconds... hold for 3... and out for 3... Ready? In... 1, 2, 3... Hold... 1, 2, 3... Out... 1, 2, 3... Let me know when you're done! pip~ ✨`,
          `Wonderful! Triangle breathing time! ${kaomoji} <i>warm nuzzle</i> Breathe in for 3... hold for 3... out for 3... Ready? In... 1, 2, 3... Hold... 1, 2, 3... Out... 1, 2, 3... Tell me when you feel calmer! pip! ✨`,
          `Great choice! Let's do triangle breathing! ${kaomoji} <i>encouraging nod</i> In for 3... hold for 3... out for 3... Ready? In... 1, 2, 3... Hold... 1, 2, 3... Out... 1, 2, 3... Let me know when you're finished! pip~ ✨`
        ];
        return {
          text: triangleResponses[Math.floor(Math.random() * triangleResponses.length)],
          shouldAnimate: true
        };
        
      case 'color_spotting':
        this.conversationState.currentTechnique = 'color';
        const colorResponses = [
          `Perfect! Let's do color spotting! ${kaomoji} <i>tilts head curiously</i> Look around and find 3 things that are green, 2 that are blue, and 1 that's yellow. What do you see? Let's explore together! Tell me what colors you found! pip~ 🎨`,
          `Wonderful! Color spotting time! ${kaomoji} <i>gentle wing pat</i> Find 3 green things, 2 blue things, and 1 yellow thing around you. What colors do you see? Let me know what you find! pip! 🎨`,
          `Great choice! Let's do color spotting! ${kaomoji} <i>encouraging nod</i> Look for 3 green, 2 blue, and 1 yellow thing. What do you see? Tell me about the colors around you! pip~ 🎨`
        ];
        return {
          text: colorResponses[Math.floor(Math.random() * colorResponses.length)],
          shouldAnimate: true
        };
        
      case 'body_map':
        this.conversationState.currentTechnique = 'body';
        const bodyResponses = [
          `Perfect! Let's do the body map! ${kaomoji} <i>waddles closer</i> Touch your nose... now your shoulder... now your knees! This helps bring your awareness back to your body. Feel that? You're here and you're safe! Let me know when you're done! pip~`,
          `Wonderful! Body map time! ${kaomoji} <i>gentle wing pat</i> Touch your nose... your shoulder... your knees... This helps you feel present in your body. How does that feel? Tell me when you're finished! pip!`,
          `Great choice! Let's do the body map! ${kaomoji} <i>encouraging nod</i> Touch your nose... shoulder... knees... This brings you back to your body. Feel that? Let me know when you're done! pip~`
        ];
        return {
          text: bodyResponses[Math.floor(Math.random() * bodyResponses.length)],
          shouldAnimate: true
        };
        
      case 'senses_54321':
        this.conversationState.currentTechnique = 'senses_54321';
        return {
          text: `Let's try the 5-4-3-2-1 grounding exercise! ${kaomoji} Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. Ready? Start with what you see! pip~ 🌈`,
          shouldAnimate: true
        };
      case 'body_scan':
        this.conversationState.currentTechnique = 'body_scan';
        return {
          text: `Let's do a body scan! ${kaomoji} Start at your toes and notice how they feel. Move up to your legs, stomach, chest, arms, and head. Tell me when you're finished! pip~ 💤`,
          shouldAnimate: true
        };
      case 'alphabet_game':
        this.conversationState.currentTechnique = 'alphabet_game';
        return {
          text: `Let's play the alphabet game! ${kaomoji} Name an animal that starts with A, then B, and so on. Want to start? pip~ 🐧`,
          shouldAnimate: true
        };
      case 'would_you_rather_game':
        this.conversationState.currentTechnique = 'game';
        this.conversationState.currentGame = 'would_you_rather';
        const wouldYouRatherQuestions = [
          `Would you rather swim in the sky or walk on the moon?`,
          `Would you rather have wings or a magical tail?`,
          `Would you rather be able to talk to animals or breathe underwater?`,
          `Would you rather eat only ice cream or only pizza for a week?`,
          `Would you rather be invisible or be able to fly?`,
          `Would you rather live in an igloo or a treehouse?`,
          `Would you rather have a penguin as a best friend or a dolphin?`,
          `Would you rather always have to waddle or always have to hop?`,
          `Would you rather explore the ocean or outer space?`,
          `Would you rather have rainbow-colored feathers or glow-in-the-dark feet?`,
          `Would you rather slide on your belly everywhere or bounce like a kangaroo?`,
          `Would you rather have a snowball fight or build a giant sandcastle?`,
          `Would you rather be super tiny or super huge for a day?`,
          `Would you rather always be a little chilly or always be a little too warm?`,
          `Would you rather have a magical snowflake or a magical seashell?`
        ];
        return {
          text: `Yay! ${kaomoji} <i>happy dance</i> Let's play Would You Rather! ${wouldYouRatherQuestions[Math.floor(Math.random() * wouldYouRatherQuestions.length)]} <i>bounces excitedly</i> What do you think? Tell me your choice! pip~ 🎮`,
          shouldAnimate: true
        };
      case 'opposite_day_game':
        this.conversationState.currentTechnique = 'game';
        this.conversationState.currentGame = 'opposite_day';
        const oppositeWords = [
          { word: 'Hot', opposite: 'Cold' },
          { word: 'Big', opposite: 'Small' },
          { word: 'Fast', opposite: 'Slow' },
          { word: 'Happy', opposite: 'Sad' },
          { word: 'Up', opposite: 'Down' },
          { word: 'Light', opposite: 'Dark' },
          { word: 'Soft', opposite: 'Hard' },
          { word: 'Wet', opposite: 'Dry' },
          { word: 'Loud', opposite: 'Quiet' },
          { word: 'Tall', opposite: 'Short' },
          { word: 'Warm', opposite: 'Cool' },
          { word: 'Bright', opposite: 'Dim' },
          { word: 'Smooth', opposite: 'Rough' },
          { word: 'Full', opposite: 'Empty' },
          { word: 'Open', opposite: 'Closed' }
        ];
        const selectedWord = oppositeWords[Math.floor(Math.random() * oppositeWords.length)];
        return {
          text: `Awesome! ${kaomoji} <i>waddles in approval</i> Let's play Opposite Day! I say "${selectedWord.word}"—what's the opposite? <i>tilts head curiously</i> Tell me your answer! pip~ 🔄`,
          shouldAnimate: true
        };
      case 'three_things_game':
        this.conversationState.currentTechnique = 'game';
        this.conversationState.currentGame = 'three_things';
        return {
          text: `Great! ${kaomoji} <i>flappy hug</i> Let's do Three Things Challenge! Name three foods you'd eat forever. No thinking too hard—just go! <i>happy dance</i> What three foods did you pick? Tell me! pip! 🍕`,
          shouldAnimate: true
        };
      case 'story_builder':
        this.conversationState.currentTechnique = 'story_builder';
        return {
          text: `Let's build a story together! ${kaomoji} I'll start: "Once upon a time, a penguin named Pippy..." Now you add the next sentence! pip~ 📖`,
          shouldAnimate: true
        };
      case 'safe_place':
        this.conversationState.currentTechnique = 'safe_place';
        return {
          text: `Let's imagine a safe place together! ${kaomoji} Picture somewhere you feel calm and happy. What does it look like? Tell me about it! pip~ 🏝️`,
          shouldAnimate: true
        };
      default:
        return null;
    }
  }
  
  // Handle dynamic responses during techniques
  private handleTechniqueInteraction(message: string): AIResponse {
    const kaomoji = this.getRandomKaomoji();

    // PRIORITY 1: Handle expectingAnotherGame FIRST - this takes priority over everything else
    if (this.conversationState.expectingAnotherGame && this.conversationState.currentGame) {
      const lowerMsg = message.trim().toLowerCase();
      const affirmatives = [
        'yes', 'sure', 'okay', 'another', "let's do another", "let us do another", 'yep', 'yeah', 'yup', 'ok', 'alright',
        "let's go", "let us go", 'go again', 'do another'
      ];
      const negatives = ['no', 'not', 'stop', 'rest', 'quit', 'enough', 'done', 'exit', 'leave'];
      
      if (affirmatives.some(a => lowerMsg.startsWith(a))) {
        this.conversationState.expectingAnotherGame = false;
        
        // For Would You Rather, offer a new question
        if (this.conversationState.currentGame === 'would_you_rather') {
          const wouldYouRatherQuestions = [
            `Would you rather swim in the sky or walk on the moon?`,
            `Would you rather have wings or a magical tail?`,
            `Would you rather be able to talk to animals or breathe underwater?`,
            `Would you rather eat only ice cream or only pizza for a week?`,
            `Would you rather be invisible or be able to fly?`,
            `Would you rather live in an igloo or a treehouse?`,
            `Would you rather have a penguin as a best friend or a dolphin?`,
            `Would you rather always have to waddle or always have to hop?`,
            `Would you rather explore the ocean or outer space?`,
            `Would you rather have rainbow-colored feathers or glow-in-the-dark feet?`,
            `Would you rather slide on your belly everywhere or bounce like a kangaroo?`,
            `Would you rather have a snowball fight or build a giant sandcastle?`,
            `Would you rather be super tiny or super huge for a day?`,
            `Would you rather always be a little chilly or always be a little too warm?`,
            `Would you rather have a magical snowflake or a magical seashell?`
          ];
          return {
            text: `Yay! ${kaomoji} <i>happy dance</i> Let's play Would You Rather! ${wouldYouRatherQuestions[Math.floor(Math.random() * wouldYouRatherQuestions.length)]} <i>bounces excitedly</i> What do you think? Tell me your choice! pip~ 🎮`,
            shouldAnimate: true
          };
        } else {
          // For other games, offer a new random game
          const gameTypes = ['would_you_rather', 'opposite_day', 'three_things'] as const;
          const pickedGame = gameTypes[Math.floor(Math.random() * gameTypes.length)];
          this.conversationState.currentGame = pickedGame;
          
          if (pickedGame === 'opposite_day') {
            const oppositeWords = [
              { word: 'Hot', opposite: 'Cold' },
              { word: 'Big', opposite: 'Small' },
              { word: 'Fast', opposite: 'Slow' },
              { word: 'Happy', opposite: 'Sad' },
              { word: 'Up', opposite: 'Down' },
              { word: 'Light', opposite: 'Dark' },
              { word: 'Soft', opposite: 'Hard' },
              { word: 'Wet', opposite: 'Dry' },
              { word: 'Loud', opposite: 'Quiet' },
              { word: 'Tall', opposite: 'Short' },
              { word: 'Warm', opposite: 'Cool' },
              { word: 'Bright', opposite: 'Dim' },
              { word: 'Smooth', opposite: 'Rough' },
              { word: 'Full', opposite: 'Empty' },
              { word: 'Open', opposite: 'Closed' }
            ];
            const selectedWord = oppositeWords[Math.floor(Math.random() * oppositeWords.length)];
            return {
              text: `Awesome! ${kaomoji} <i>waddles in approval</i> Let's play Opposite Day! I say "${selectedWord.word}"—what's the opposite? <i>tilts head curiously</i> Tell me your answer! pip~ 🔄`,
              shouldAnimate: true
            };
          } else if (pickedGame === 'three_things') {
            return {
              text: `Great! ${kaomoji} <i>flappy hug</i> Let's do Three Things Challenge! Name three foods you'd eat forever. No thinking too hard—just go! <i>happy dance</i> What three foods did you pick? Tell me! pip! 🍕`,
              shouldAnimate: true
            };
          } else {
            // Would You Rather
            const wouldYouRatherQuestions = [
              `Would you rather swim in the sky or walk on the moon?`,
              `Would you rather have wings or a magical tail?`,
              `Would you rather be able to talk to animals or breathe underwater?`,
              `Would you rather eat only ice cream or only pizza for a week?`,
              `Would you rather be invisible or be able to fly?`,
              `Would you rather live in an igloo or a treehouse?`,
              `Would you rather have a penguin as a best friend or a dolphin?`,
              `Would you rather always have to waddle or always have to hop?`,
              `Would you rather explore the ocean or outer space?`,
              `Would you rather have rainbow-colored feathers or glow-in-the-dark feet?`,
              `Would you rather slide on your belly everywhere or bounce like a kangaroo?`,
              `Would you rather have a snowball fight or build a giant sandcastle?`,
              `Would you rather be super tiny or super huge for a day?`,
              `Would you rather always be a little chilly or always be a little too warm?`,
              `Would you rather have a magical snowflake or a magical seashell?`
            ];
            return {
              text: `Yay! ${kaomoji} <i>happy dance</i> Let's play Would You Rather! ${wouldYouRatherQuestions[Math.floor(Math.random() * wouldYouRatherQuestions.length)]} <i>bounces excitedly</i> What do you think? Tell me your choice! pip~ 🎮`,
              shouldAnimate: true
            };
          }
        }
      } else if (negatives.some(n => lowerMsg.startsWith(n))) {
        this.conversationState.expectingAnotherGame = false;
        this.conversationState.currentGame = null;
        this.conversationState.currentTechnique = null; // Added this line for full reset
        return {
          text: `That's totally okay! ${kaomoji} We can just sit together, or chat about anything you like. If you want to play again later, just let me know! pip~ 💙`,
          shouldAnimate: true
        };
      } else {
        // Gently prompt again
        return {
          text: `Would you like to try another game, or rest for a bit? pip~`,
          shouldAnimate: true
        };
      }
    }

    // PRIORITY 2: If expecting yes/no for another technique, always handle here
    if (this.conversationState.expectingAnotherTechnique) {
      const lowerMsg = message.trim().toLowerCase();
      const affirmatives = [
        'yes', 'sure', 'okay', 'another', "let's do another", "let us do another", 'yep', 'yeah', 'yup', 'ok', 'alright',
        "let's go", "let us go", 'go again', 'do another'
      ];
      const negatives = ['no', 'not', 'stop', 'rest', 'quit', 'enough', 'done', 'exit', 'leave'];

      // NEW: Check if the user is directly asking for a specific technique/game
      const directTechniqueRequest = this.detectTechniqueRequest(message);
      if (directTechniqueRequest) {
        this.conversationState.expectingAnotherTechnique = false; // Reset flag
        // Set current technique for dynamic follow-up
        if (directTechniqueRequest === 'breathing_technique') this.conversationState.currentTechnique = 'breathing';
        if (directTechniqueRequest === 'sensory_grounding') this.conversationState.currentTechnique = 'sensory';
        if (directTechniqueRequest === 'distraction_game') this.conversationState.currentTechnique = 'game';
        if (directTechniqueRequest === 'any_technique') { // Handle general technique request
          const allOptions = [
            'breathing_technique', 'sensory_grounding', 'distraction_game', 'imagination_journey', 'butterfly_hug',
            'ocean_breathing', 'triangle_breathing', 'color_spotting', 'body_map', 'senses_54321', 'body_scan',
            'alphabet_game', 'story_builder', 'safe_place'
          ];
          const randomTechnique = allOptions[Math.floor(Math.random() * allOptions.length)];
          const preset = this.getPresetResponseForOption(randomTechnique, true);
          if (preset) return preset;
        }
        // Use preset response for the detected technique
        const preset = this.getPresetResponseForOption(directTechniqueRequest, true); // Assume episode mode for techniques
        if (preset) return preset;
      }

      if (affirmatives.some(a => lowerMsg.startsWith(a))) {
        this.conversationState.expectingAnotherTechnique = false;
        // Offer a new random technique/game with affirmation
        const allOptions = [
          'breathing_technique', 'sensory_grounding', 'distraction_game', 'imagination_journey', 'butterfly_hug',
          'ocean_breathing', 'triangle_breathing', 'color_spotting', 'body_map', 'senses_54321', 'body_scan',
          'alphabet_game', 'story_builder', 'safe_place'
        ];
        const next = allOptions[Math.floor(Math.random() * allOptions.length)];
        const preset = this.getPresetResponseForOption(next, true);
        if (preset) {
          return {
            text: `You're doing amazing! (◕‿◕) ${preset.text}`,
            shouldAnimate: true
          };
        }
        return { text: `You're doing amazing! (◕‿◕) Let's try something new! pip~`, shouldAnimate: true };
      } else if (negatives.some(n => lowerMsg.startsWith(n))) {
        this.conversationState.expectingAnotherTechnique = false;
        this.conversationState.currentGame = null;
        return { text: `That's totally okay! (⁀ᗢ⁀) We can just sit together, or chat about anything you like. If you want to try something else later, just let me know! pip~ 💙`, shouldAnimate: true };
      }
      // If not clear, gently prompt again (with affirmation)
      return { text: `You did amazing! (◕‿◕) Would you like to try another technique, or just rest for a bit? pip~`, shouldAnimate: true };
    }

    // If user just completed a technique, praise and ask if they'd like another
    if (this.conversationState.lastTechniqueCompleted) {
      this.conversationState.lastTechniqueCompleted = false;
      const praiseResponses = [
        `You did amazing! ${kaomoji} <i>gentle wing pat</i> I'm really proud of you for trying that. Are you feeling better now? pip~ 💙`,
        `That was brave of you! ${kaomoji} <i>warm nuzzle</i> Every time you show up like this, it counts. How are you feeling? pip!`,
        `Great job! ${kaomoji} <i>encouraging nod</i> You gave it a try, and that's what matters most. Are you feeling calmer? pip~ 🐧`,
        `You handled that like a true penguin champion! ${kaomoji} <i>flappy hug</i> Even if it didn't feel perfect, you stuck with it. That's courage. How do you feel? pip! ✨`,
        `I'm so proud of you! ${kaomoji} <i>gentle wing pat</i> You showed up for yourself today. Are you feeling better? pip~ 💕`
      ];
      const praiseText = praiseResponses[Math.floor(Math.random() * praiseResponses.length)];
      // Add follow-up question about trying another technique (with affirmation)
      const followUpResponses = [
        `You did amazing! (◕‿◕) Would you like to try another technique? pip~`,
        `You did great! (≧◡≦) Would you like to try something else? pip!`,
        `You're awesome! (⁀ᗢ⁀) Would you like to try another exercise? pip~ ✨`
      ];
      const followUpText = followUpResponses[Math.floor(Math.random() * followUpResponses.length)];
      // Store that we are expecting a yes/no for another technique
      this.conversationState.expectingAnotherTechnique = true;
      return {
        text: `${praiseText} ${followUpText}`,
        shouldAnimate: true
      };
    }
    
    // Handle user responses during techniques
    if (this.conversationState.currentTechnique === 'breathing') {
      const breathingResponses = [
        `That's it! ${kaomoji} <i>gentle wing pat</i> Keep breathing with me. In... out... You're doing great! Let me know when you're done. pip~ ✨`,
        `Perfect breathing! ${kaomoji} <i>encouraging nod</i> You're getting the hang of it. Keep going... In... out... Tell me when you feel calmer! pip! 🌊`,
        `Beautiful! ${kaomoji} <i>warm nuzzle</i> Your breath is like gentle waves. Keep breathing... In... out... How are you feeling? pip~ 💨`
      ];
      return {
        text: breathingResponses[Math.floor(Math.random() * breathingResponses.length)],
        shouldAnimate: true
      };
    }
    
    if (this.conversationState.currentTechnique === 'sensory') {
      const sensoryResponses = [
        `That's wonderful! ${kaomoji} <i>gentle wing pat</i> You're really noticing the world around you. What else do you see? pip! 🎨`,
        `Great observation! ${kaomoji} <i>encouraging nod</i> You're bringing your awareness back to the present. How does that feel? pip~`,
        `Perfect! ${kaomoji} <i>warm nuzzle</i> You're grounding yourself beautifully. What else can you notice? pip! ✨`
      ];
      return {
        text: sensoryResponses[Math.floor(Math.random() * sensoryResponses.length)],
        shouldAnimate: true
      };
    }
    
    if (this.conversationState.currentTechnique === 'game') {
      // Handle specific game responses based on currentGame state
      if (this.conversationState.currentGame === 'opposite_day') {
        // Any response during Opposite Day gets praised
        const praise = [
          `Great job! That's the opposite! ${kaomoji} <i>happy dance</i> Would you like to try another word, or play a different game? pip~`,
          `You did it! ${kaomoji} <i>waddles in approval</i> That was the opposite! Would you like to keep playing? pip!`,
          `Perfect! ${kaomoji} <i>gentle wing pat</i> Would you like to do another one? pip~`,
        ];
        this.conversationState.expectingAnotherGame = true;
        return {
          text: praise[Math.floor(Math.random() * praise.length)],
          shouldAnimate: true
        };
      }
      
      if (this.conversationState.currentGame === 'three_things') {
        // Any response during Three Things gets praised
        const praise = [
          `Yum! Those sound tasty! ${kaomoji} <i>happy dance</i> Would you like to try another three things challenge? pip!`,
          `Great choices! ${kaomoji} <i>waddles in approval</i> Would you like to play again? pip~`,
          `Delicious picks! ${kaomoji} <i>gentle wing pat</i> Would you like to do another one? pip!`,
        ];
        this.conversationState.expectingAnotherGame = true;
        return {
          text: praise[Math.floor(Math.random() * praise.length)],
          shouldAnimate: true
        };
      }
      
      if (this.conversationState.currentGame === 'would_you_rather') {
        // Any response during Would You Rather gets praised
        const praise = [
          `Great choice! ${kaomoji} <i>happy dance</i> Would you like to try another would you rather question? pip~`,
          `That's a fun pick! ${kaomoji} <i>waddles in approval</i> Would you like to play again? pip!`,
          `Awesome answer! ${kaomoji} <i>gentle wing pat</i> Would you like to do another one? pip~`,
        ];
        this.conversationState.expectingAnotherGame = true;
        return {
          text: praise[Math.floor(Math.random() * praise.length)],
          shouldAnimate: true
        };
      }
      
      // Fallback for any other game
      const generalPraise = [
        `Great answer! ${kaomoji} <i>happy dance</i> Would you like to try another game? pip~`,
        `That's fun! ${kaomoji} <i>waddles in approval</i> Would you like to play again? pip!`,
        `Awesome! ${kaomoji} <i>gentle wing pat</i> Would you like to do another one? pip~`,
      ];
      this.conversationState.expectingAnotherGame = true;
      return {
        text: generalPraise[Math.floor(Math.random() * generalPraise.length)],
        shouldAnimate: true
      };
    }
    
    if (this.conversationState.currentTechnique === 'senses_54321') {
      return {
        text: `Great job starting the 5-4-3-2-1 exercise! ${kaomoji} What are 5 things you can see? pip~`,
        shouldAnimate: true
      };
    }
    if (this.conversationState.currentTechnique === 'body_scan') {
      return {
        text: `You're doing great with the body scan! ${kaomoji} Keep moving your attention up your body. Let me know when you're done! pip~`,
        shouldAnimate: true
      };
    }
    if (this.conversationState.currentTechnique === 'alphabet_game') {
      return {
        text: `Awesome! ${kaomoji} What's the next animal in the alphabet? Or let me know if you want to stop. pip~`,
        shouldAnimate: true
      };
    }
    if (this.conversationState.currentTechnique === 'story_builder') {
      return {
        text: `I love your story addition! ${kaomoji} Want to keep going or try something else? pip~`,
        shouldAnimate: true
      };
    }
    if (this.conversationState.currentTechnique === 'safe_place') {
      return {
        text: `That sounds like a wonderful safe place! ${kaomoji} Would you like to describe more, or try another technique? pip~`,
        shouldAnimate: true
      };
    }
    
    // Default response for technique interaction
    return {
      text: `You're doing great! ${kaomoji} <i>gentle wing pat</i> Keep going, and let me know when you're done! pip~`,
      shouldAnimate: true
    };
  }

  private async handleGeneralModeAsync(intent: string, message: string, isEpisode: boolean | null): Promise<AIResponse> {
    // Symptom detection in general chat
    if (this.isSymptomTriggered(message)) {
      this.conversationState.userState = 'support';
      this.conversationState.userConfirmedSymptoms = true;
      this.conversationState.episodeStatusAsked = true;
      return this.getSymptomDetectedResponse();
    }
    // Always use the API for open-ended chat
    const apiResponse = await this.callAIWithEnhancedContext(message, isEpisode);
    if (apiResponse && apiResponse.text) {
      return apiResponse;
    }
    // Fallback if API fails
    const kaomoji = this.getRandomKaomoji();
    return {
      text: `I'm here to listen and support you. ${kaomoji} <i>gentle wing pat</i> Could you share a bit more about what's on your mind? pip~`,
      shouldAnimate: true
    };
  }

} 