import { PippyResponse, GroundingTechnique, DistractionGame } from '../types';

// Preloaded grounding techniques for offline use
export const groundingTechniques: GroundingTechnique[] = [
  {
    id: '54321',
    name: '5-4-3-2-1 Technique',
    description: 'A sensory grounding technique to help you feel more present',
    steps: [
      'Look around and name 5 things you can see',
      'Touch 4 things you can feel',
      'Listen for 3 things you can hear',
      'Smell 2 things you can smell',
      'Taste 1 thing you can taste'
    ]
  },
  {
    id: 'breathing',
    name: 'Deep Breathing',
    description: 'Simple breathing exercise to calm your nervous system',
    steps: [
      'Sit comfortably and close your eyes',
      'Breathe in slowly through your nose for 4 counts',
      'Hold your breath for 4 counts',
      'Breathe out slowly through your mouth for 6 counts',
      'Repeat this cycle 5-10 times'
    ]
  },
  {
    id: 'body-scan',
    name: 'Body Scan',
    description: 'Progressive muscle relaxation to release tension',
    steps: [
      'Start with your toes - tense them for 5 seconds, then relax',
      'Move to your calves - tense and relax',
      'Continue up your body: thighs, stomach, chest, arms, hands, neck, face',
      'Feel the tension leaving each part as you relax'
    ]
  }
];

// Preloaded distraction games for offline use
export const distractionGames: DistractionGame[] = [
  {
    id: 'color-naming',
    name: 'Color Hunt',
    description: 'Find objects of different colors around you',
    instructions: [
      'Look around your room',
      'Find 3 things that are blue',
      'Find 3 things that are red',
      'Find 3 things that are green',
      'Find 3 things that are yellow'
    ]
  },
  {
    id: 'animal-naming',
    name: 'Animal Alphabet',
    description: 'Name animals for each letter of the alphabet',
    instructions: [
      'Start with A - name an animal that starts with A',
      'Continue through the alphabet: B, C, D...',
      'Take your time and be creative!',
      'If you get stuck, skip that letter and continue'
    ]
  },
  {
    id: 'counting-game',
    name: 'Counting Challenge',
    description: 'Count objects in your environment',
    instructions: [
      'Count all the windows in your room',
      'Count all the books you can see',
      'Count all the electrical outlets',
      'Count all the pieces of furniture',
      'Count all the items on your desk'
    ]
  }
];

// Helper function to get random pip variations
export const getRandomPip = () => {
  const pipVariations = ['pip!', 'pip~', 'pip! 🐧', 'pip~ ✨', 'pip! 💙', 'pip~ 🌟', 'pip! 💕', 'pip~ 🎮'];
  return pipVariations[Math.floor(Math.random() * pipVariations.length)];
};

// Fallback responses for when AI is unavailable
export const fallbackResponses = {
  greeting: `Hi there! (◕‿◕) I'm Pippy, your friendly penguin companion! Are you currently experiencing an episode? <i>waddles excitedly</i> ${getRandomPip()}`,
  episodeYes: `I'm here with you, and we'll get through this together! (｡◕‿◕｡) Let me help you with some grounding techniques. <i>gentle wing pat</i> ${getRandomPip()}`,
  episodeNo: `That's great! (◠‿◠) How can I help you today? I can share coping techniques or just chat with you! <i>happy dance</i> ${getRandomPip()}`,
  groundingIntro: `Let's try a grounding technique together! (◕‿◕) This will help you feel more present and safe. <i>nuzzles gently</i> ${getRandomPip()}`,
  distractionIntro: `Sometimes a little distraction can help! (◠‿◠) Let's play a simple game together! <i>bounces excitedly</i> ${getRandomPip()}`,
  error: `I'm having a little trouble thinking right now, but let's try something else together! (◕‿◕) <i>tilts head curiously</i> ${getRandomPip()}`,
  support: `Remember, I'm here for you. You're not alone in this. (｡◕‿◕｡) <i>warm hug</i> ${getRandomPip()}`,
  calmDown: `Let's take a moment to breathe together. (｡◕‿◕｡) You're safe here with me. <i>gentle wing on your shoulder</i> ${getRandomPip()}`,
  gameOffer: `Would you like to try a grounding technique first, or would you prefer to play a distraction game? (◕‿◕) <i>tilts head curiously</i> ${getRandomPip()}`
};

export class ChatbotService {
  private isOnline: boolean = true;

  constructor() {
    // Check if we can reach external services
    this.checkConnectivity();
  }

  private async checkConnectivity(): Promise<void> {
    try {
      // Simple connectivity check
      await fetch('https://httpbin.org/get', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      this.isOnline = true;
    } catch (error) {
      this.isOnline = false;
      console.log('ChatbotService: Operating in offline mode');
    }
  }

  public async processMessage(userMessage: string, isEpisode: boolean | null): Promise<PippyResponse> {
    try {
      if (this.isOnline) {
        // Try to get AI response
        return await this.getAIResponse(userMessage, isEpisode);
      } else {
        // Use fallback logic
        return this.getFallbackResponse(userMessage, isEpisode);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      return this.getFallbackResponse(userMessage, isEpisode);
    }
  }

  private async getAIResponse(userMessage: string, isEpisode: boolean | null): Promise<PippyResponse> {
    // This would integrate with an AI service like Hugging Face
    // For now, we'll use fallback responses
    return this.getFallbackResponse(userMessage, isEpisode);
  }

  private getFallbackResponse(userMessage: string, isEpisode: boolean | null): PippyResponse {
    const message = userMessage.toLowerCase();

    // Handle initial episode question
    if (isEpisode === null) {
      if (message.includes('yes') || message.includes('episode') || message.includes('experiencing')) {
        return {
          text: fallbackResponses.episodeYes,
          groundingTechnique: '54321',
          shouldAnimate: true
        };
      } else if (message.includes('no') || message.includes('not')) {
        return {
          text: fallbackResponses.episodeNo,
          shouldAnimate: true
        };
      }
    }

    // Handle episode responses - first focus on calming down
    if (isEpisode === true) {
          // If user is distressed, always offer calming first
    if (message.includes('scared') || message.includes('afraid') || message.includes('anxiety') || 
        message.includes('panic') || message.includes('overwhelmed') || message.includes('stress')) {
      return {
        text: `I understand you're feeling ${message.includes('scared') ? 'scared' : message.includes('anxiety') ? 'anxious' : 'overwhelmed'}. (｡◕‿◕｡) Let's take some deep breaths together! <i>gentle wing on your shoulder</i> Breathe in... and out... You're safe here with me. <i>warm nuzzle</i> ${getRandomPip()}`,
        groundingTechnique: 'breathing',
        shouldAnimate: true
      };
    }
      
      // If user asks for grounding techniques
      if (message.includes('grounding') || message.includes('technique') || message.includes('help')) {
        const technique = groundingTechniques[Math.floor(Math.random() * groundingTechniques.length)];
        return {
          text: `${fallbackResponses.groundingIntro} Let's try the ${technique.name}: ${technique.description} ${getRandomPip()}`,
          groundingTechnique: technique.id,
          shouldAnimate: true
        };
      }
      
      // If user asks for games/distractions
      if (message.includes('distraction') || message.includes('game') || message.includes('play')) {
        const game = distractionGames[Math.floor(Math.random() * distractionGames.length)];
        return {
          text: `${fallbackResponses.distractionIntro} Let's play ${game.name}: ${game.description} ${getRandomPip()}`,
          distractionGame: game.id,
          shouldAnimate: true
        };
      }
      
          // If user says yes to game offer
    if (message.includes('yes') && (message.includes('game') || message.includes('play') || message.includes('distraction'))) {
      const game = distractionGames[Math.floor(Math.random() * distractionGames.length)];
      return {
        text: `Great! Let's play ${game.name}! (◕‿◕) ${game.description} <i>bounces excitedly</i> ${getRandomPip()}`,
        distractionGame: game.id,
        shouldAnimate: true
      };
    }
    
    // If user says yes to grounding offer
    if (message.includes('yes') && (message.includes('grounding') || message.includes('technique'))) {
      const technique = groundingTechniques[Math.floor(Math.random() * groundingTechniques.length)];
      return {
        text: `Perfect! Let's try the ${technique.name}. (◕‿◕) ${technique.description} <i>nuzzles gently</i> ${getRandomPip()}`,
        groundingTechnique: technique.id,
        shouldAnimate: true
      };
    }
      
      // Default episode response - offer both options
      return {
        text: fallbackResponses.gameOffer,
        shouldAnimate: true
      };
    }

      // Handle general conversation
  if (message.includes('hello') || message.includes('hi')) {
    return {
      text: `Hello! (◕‿◕) How are you feeling today? <i>waddles over excitedly</i> ${getRandomPip()}`,
      shouldAnimate: true
    };
  } else if (message.includes('thank')) {
    return {
      text: `You're very welcome! (｡◕‿◕｡) I'm always here for you! <i>happy wing flap</i> ${getRandomPip()}`,
      shouldAnimate: true
    };
  } else if (message.includes('bye') || message.includes('goodbye')) {
    return {
      text: `Take care! (◠‿◠) Remember, I'm always here when you need me! <i>gentle wave</i> ${getRandomPip()}`,
      shouldAnimate: true
    };
  }

  // Default response - offer help
  return {
    text: `I'm here to listen and support you! (◕‿◕) Would you like to try a grounding technique or play a distraction game? <i>tilts head curiously</i> ${getRandomPip()}`,
    shouldAnimate: true
  };
  }

  public getGroundingTechnique(id: string): GroundingTechnique | undefined {
    return groundingTechniques.find(technique => technique.id === id);
  }

  public getDistractionGame(id: string): DistractionGame | undefined {
    return distractionGames.find(game => game.id === id);
  }

  public getRandomGroundingTechnique(): GroundingTechnique {
    return groundingTechniques[Math.floor(Math.random() * groundingTechniques.length)];
  }

  public getRandomDistractionGame(): DistractionGame {
    return distractionGames[Math.floor(Math.random() * distractionGames.length)];
  }
} 