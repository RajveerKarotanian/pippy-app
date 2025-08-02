export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'pippy';
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatState {
  messages: Message[];
  isEpisode: boolean | null;
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isDarkMode: boolean;
}

export interface PippyResponse {
  text: string;
  groundingTechnique?: string;
  distractionGame?: string;
  shouldAnimate?: boolean;
}

export interface GroundingTechnique {
  id: string;
  name: string;
  description: string;
  steps: string[];
}

export interface DistractionGame {
  id: string;
  name: string;
  description: string;
  instructions: string[];
}

export interface AudioState {
  isRainPlaying: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  volume: number;
}

export interface VoiceRecognitionState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
}

export interface SpeechSynthesisState {
  isSupported: boolean;
  isSpeaking: boolean;
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
} 