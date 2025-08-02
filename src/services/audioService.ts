import { AudioState, VoiceRecognitionState, SpeechSynthesisState } from '../types';

export class AudioService {
  private audioContext: AudioContext | null = null;
  private rainGain: GainNode | null = null;
  private rainOscillator: OscillatorNode | null = null;
  private speechSynthesis: SpeechSynthesis | null = null;
  private speechRecognition: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private isMuted: boolean = false; // Add mute state
  private cachedVoice: SpeechSynthesisVoice | null = null; // Cache the selected voice for consistency

  constructor() {
    this.initializeAudio();
    this.initializeSpeech();
  }

  private initializeAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('AudioContext not supported:', error);
    }
  }

  private initializeSpeech(): void {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
      
      // Wait for voices to load if they're not available immediately
      if (this.speechSynthesis.getVoices().length === 0) {
        this.speechSynthesis.addEventListener('voiceschanged', () => {
          console.log('Voices loaded:', this.speechSynthesis?.getVoices().length);
          // Log available voices for debugging
          const voices = this.speechSynthesis?.getVoices() || [];
          voices.forEach(voice => {
            console.log('Available voice:', voice.name, voice.lang);
          });
        });
      } else {
        // Log available voices immediately
        const voices = this.speechSynthesis.getVoices();
        voices.forEach(voice => {
          console.log('Available voice:', voice.name, voice.lang);
        });
      }
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'en-US';
    }
  }

  // Rain sound functionality
  public startRainSound(): void {
    if (!this.audioContext) {
      console.error('AudioContext not available');
      return;
    }

    try {
      // Create oscillator for rain sound
      this.rainOscillator = this.audioContext.createOscillator();
      this.rainGain = this.audioContext.createGain();

      // Configure rain sound (white noise-like)
      this.rainOscillator.type = 'sawtooth';
      this.rainOscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
      this.rainOscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);

      // Configure gain for volume control
      this.rainGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      this.rainGain.gain.exponentialRampToValueAtTime(0.05, this.audioContext.currentTime + 0.1);

      // Connect nodes
      this.rainOscillator.connect(this.rainGain);
      this.rainGain.connect(this.audioContext.destination);

      // Start the oscillator
      this.rainOscillator.start();
    } catch (error) {
      console.error('Error starting rain sound:', error);
    }
  }

  public stopRainSound(): void {
    if (this.rainOscillator) {
      this.rainOscillator.stop();
      this.rainOscillator = null;
    }
    if (this.rainGain) {
      this.rainGain = null;
    }
  }

  public setRainVolume(volume: number): void {
    if (this.rainGain) {
      this.rainGain.gain.setValueAtTime(volume * 0.1, this.audioContext!.currentTime);
    }
  }

  // Mute functionality
  public mute(): void {
    this.isMuted = true;
    // Immediately stop any current speech without delay
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
    console.log('Audio muted immediately');
  }

  public unmute(): void {
    this.isMuted = false;
  }

  public isMutedState(): boolean {
    return this.isMuted;
  }

  // Helper function to clean text for speech
  private cleanTextForSpeech(text: string): string {
    return text
      // Remove emojis (more comprehensive)
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]/gu, '')
      // Remove tilde symbols
      .replace(/~/g, '')
      // Remove asterisks (for actions like *waddles*)
      .replace(/\*[^*]*\*/g, '')
      // Remove kaomoji patterns more comprehensively
      .replace(/\([^)]*[◕◠◡‿＾≧✿⁀ᗢ´｡•ᵕω⌒￣❁づﾉヮ･ﾟ✧≦ノ][^)]*\)/g, '')
      .replace(/\([^)]*[｡◕‿◕｡◠‿◠＾◡＾≧◡≦✿◕‿◕⁀ᗢ⁀´｡•ᵕ•｡`＾▽＾o˘◡˘o๑˃ᴗ˂ﻭ´｡•ω•｡`⌒‿⌒⁀ᗢ⁀￣▽￣❁´◡`❁づ｡◕‿‿◕｡づﾉ◕ヮ◕ﾉ･ﾟ✧≧ω≦ノ◕ヮ◕ノ][^)]*\)/g, '')
      // Remove HTML tags like <i>waddles excitedly</i>
      .replace(/<[^>]*>/g, '')
      // Remove "pip" variations at the end
      .replace(/\s*pip[!~]*\s*$/i, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Speech synthesis (Text-to-Speech)
  public speak(text: string, onEnd?: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        console.error('Speech synthesis not supported');
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Check if muted - if so, just resolve without speaking
      if (this.isMuted) {
        console.log('Audio is muted, skipping speech');
        if (onEnd) onEnd();
        resolve();
        return;
      }

      // Always cancel any current speech immediately
      if (this.isSpeaking) {
        console.log('Cancelling current speech for new message');
        this.speechSynthesis.cancel();
        this.isSpeaking = false;
      }

      // Clean the text for speech
      const cleanText = this.cleanTextForSpeech(text);
      // Check if text is empty after cleaning
      if (!cleanText.trim()) {
        console.log('Text is empty after cleaning, skipping speech');
        if (onEnd) onEnd();
        resolve();
        return;
      }

      // Set speaking flag immediately
      this.isSpeaking = true;
      
      // Create new utterance
      this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
      
        // Set for younger sounding lady voice with higher pitch
  this.currentUtterance.rate = 0.85; // Slightly slower for clarity
  this.currentUtterance.pitch = 1.6; // Higher pitch for younger female voice
  this.currentUtterance.volume = 1.0; // Full volume for clarity
      
      // Try to find a cute/happy/expressive voice
      let voices = this.speechSynthesis.getVoices();
      if (voices.length === 0) {
        console.log('No voices available, waiting for voices to load...');
        setTimeout(() => {
          voices = this.speechSynthesis!.getVoices();
          this.selectBestVoice();
          this.startSpeaking(resolve, reject, onEnd);
        }, 100);
        return;
      }
      
      this.selectBestVoice();
      this.startSpeaking(resolve, reject, onEnd);
    });
  }

  private selectBestVoice(): void {
    if (!this.currentUtterance || !this.speechSynthesis) return;

    // If we have a cached voice, use it for consistency
    if (this.cachedVoice) {
      this.currentUtterance.voice = this.cachedVoice;
      console.log('Using cached voice:', this.cachedVoice.name);
      return;
    }

    const voices = this.speechSynthesis.getVoices();
    let preferredVoice = null;
    
    // Prioritize higher-pitched female voices for a more youthful sound
    const highPitchFemaleVoices = [
      'samantha', 'victoria', 'zira', 'hazel', 'fiona', 'sophie', 'emma', 'lisa', 'ava',
      'sarah', 'rachel', 'monica', 'phoebe', 'jill', 'helena', 'maria'
    ];
    
    // First try to find a high-pitched female voice
    preferredVoice = voices.find(voice =>
      voice.lang.includes('en') &&
      highPitchFemaleVoices.some(name => voice.name.toLowerCase().includes(name))
    );

    // If no high-pitch voice found, try for any female voice
    if (!preferredVoice) {
      const femaleKeywords = [
        'female', 'woman', 'lady', 'girl', 'samantha', 'victoria', 'zira', 'hazel', 
        'fiona', 'karen', 'lisa', 'sophie', 'emma', 'jill', 'ava', 'sarah', 'rachel'
      ];
      preferredVoice = voices.find(voice =>
        voice.lang.includes('en') &&
        femaleKeywords.some(keyword => voice.name.toLowerCase().includes(keyword))
      );
    }

    // If still no preferred voice, try for any English voice
    if (!preferredVoice) {
      preferredVoice = voices.find(voice => voice.lang.includes('en'));
    }

    if (preferredVoice) {
      this.currentUtterance.voice = preferredVoice;
      this.cachedVoice = preferredVoice; // Cache the voice for consistency
      console.log('Using voice:', preferredVoice.name);
    } else {
      console.log('No preferred voice found, using default');
    }
  }

  private startSpeaking(resolve: () => void, reject: (error: Error) => void, onEnd?: () => void): void {
    if (!this.currentUtterance || !this.speechSynthesis) {
      reject(new Error('Speech synthesis not available'));
      return;
    }

    // Set up event handlers
    this.currentUtterance.onend = () => {
      console.log('Speech synthesis completed successfully');
      this.isSpeaking = false;
      if (onEnd) onEnd();
      resolve();
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      // Don't retry automatically to prevent repetition
      reject(new Error('Speech synthesis failed'));
    };

    // Start speaking with error handling
    try {
      this.speechSynthesis.speak(this.currentUtterance);
      console.log('Speech synthesis started');
    } catch (error) {
      console.error('Error starting speech synthesis:', error);
      reject(new Error('Failed to start speech synthesis'));
    }
  }

  public stopSpeaking(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  // Speech recognition (Speech-to-Text)
  public startListening(onResult: (transcript: string) => void, onError?: (error: string) => void): void {
    if (!this.speechRecognition) {
      if (onError) onError('Speech recognition not supported');
      return;
    }

    try {
      this.speechRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      this.speechRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (onError) onError(event.error);
      };

      this.speechRecognition.onend = () => {
        // Restart listening for continuous interaction
        this.speechRecognition.start();
      };

      this.speechRecognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      if (onError) onError('Failed to start speech recognition');
    }
  }

  public stopListening(): void {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }

  // Check support for various features
  public getAudioState(): AudioState {
    return {
      isRainPlaying: this.rainOscillator !== null,
      isSpeaking: this.speechSynthesis?.speaking || false,
      isListening: this.speechRecognition?.state === 'recording',
      volume: 0.5 // Default volume
    };
  }

  public getVoiceRecognitionState(): VoiceRecognitionState {
    return {
      isSupported: this.speechRecognition !== null,
      isListening: this.speechRecognition?.state === 'recording',
      transcript: '',
      error: null
    };
  }

  public getSpeechSynthesisState(): SpeechSynthesisState {
    const voices = this.speechSynthesis?.getVoices() || [];
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') && voice.name.toLowerCase().includes('female')
    );

    return {
      isSupported: this.speechSynthesis !== null,
      isSpeaking: this.speechSynthesis?.speaking || false,
      voice: preferredVoice || null,
      rate: 0.9,
      pitch: 1.0
    };
  }

  // Cleanup
  public cleanup(): void {
    this.stopRainSound();
    this.stopSpeaking();
    this.stopListening();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
} 