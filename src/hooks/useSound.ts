import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'poke-nash-sound-enabled';

interface SoundConfig {
  volume: number;
}

const DEFAULT_CONFIG: SoundConfig = {
  volume: 0.5,
};

// Audio context and sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Generate beep sounds using Web Audio API
function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Envelope for smoother sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
}

// Button click sound - short high-pitched beep
function playClickSound(volume: number): void {
  playTone(800, 0.08, 'sine', volume);
}

// Attack sound - descending tone with more body
function playAttackSound(volume: number): void {
  playTone(400, 0.15, 'square', volume);
  setTimeout(() => playTone(300, 0.1, 'square', volume), 50);
}

// Faint/knockout sound - dramatic descending
function playFaintSound(volume: number): void {
  playTone(600, 0.2, 'sine', volume);
  setTimeout(() => playTone(500, 0.2, 'sine', volume), 100);
  setTimeout(() => playTone(400, 0.3, 'sine', volume), 200);
  setTimeout(() => playTone(200, 0.4, 'sine', volume), 300);
}

// Super effective sound - ascending chime
function playSuperEffectiveSound(volume: number): void {
  playTone(523, 0.1, 'sine', volume); // C5
  setTimeout(() => playTone(659, 0.1, 'sine', volume), 80); // E5
  setTimeout(() => playTone(784, 0.15, 'sine', volume), 160); // G5
}

// Not very effective - descending
function playNotEffectiveSound(volume: number): void {
  playTone(400, 0.15, 'sine', volume);
  setTimeout(() => playTone(350, 0.2, 'sine', volume), 100);
}

export function useSound(config: SoundConfig = DEFAULT_CONFIG) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return true;
    return stored === 'true';
  });
  
  const [volume, setVolume] = useState(config.volume);
  const hasInteracted = useRef(false);

  // Persist sound preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(soundEnabled));
  }, [soundEnabled]);

  // Mark that user has interacted (enables audio context)
  const markInteracted = useCallback(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      // Try to resume audio context on first interaction
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  const playClick = useCallback(() => {
    if (soundEnabled && hasInteracted.current) {
      playClickSound(volume);
    }
  }, [soundEnabled, volume]);

  const playAttack = useCallback(() => {
    if (soundEnabled && hasInteracted.current) {
      playAttackSound(volume);
    }
  }, [soundEnabled, volume]);

  const playFaint = useCallback(() => {
    if (soundEnabled && hasInteracted.current) {
      playFaintSound(volume);
    }
  }, [soundEnabled, volume]);

  const playSuperEffective = useCallback(() => {
    if (soundEnabled && hasInteracted.current) {
      playSuperEffectiveSound(volume);
    }
  }, [soundEnabled, volume]);

  const playNotEffective = useCallback(() => {
    if (soundEnabled && hasInteracted.current) {
      playNotEffectiveSound(volume);
    }
  }, [soundEnabled, volume]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return {
    soundEnabled,
    volume,
    setVolume,
    toggleSound,
    playClick,
    playAttack,
    playFaint,
    playSuperEffective,
    playNotEffective,
    markInteracted,
  };
}

export type UseSoundReturn = ReturnType<typeof useSound>;

