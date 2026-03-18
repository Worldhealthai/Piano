import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useStore } from '../store/useStore';

// Salamander Grand Piano samples via CDN
const SAMPLE_BASE = 'https://tonejs.github.io/audio/salamander/';
const SAMPLE_NOTES: Record<string, string> = {
  'A0': `${SAMPLE_BASE}A0.mp3`,
  'C1': `${SAMPLE_BASE}C1.mp3`,
  'D#1': `${SAMPLE_BASE}Ds1.mp3`,
  'F#1': `${SAMPLE_BASE}Fs1.mp3`,
  'A1': `${SAMPLE_BASE}A1.mp3`,
  'C2': `${SAMPLE_BASE}C2.mp3`,
  'D#2': `${SAMPLE_BASE}Ds2.mp3`,
  'F#2': `${SAMPLE_BASE}Fs2.mp3`,
  'A2': `${SAMPLE_BASE}A2.mp3`,
  'C3': `${SAMPLE_BASE}C3.mp3`,
  'D#3': `${SAMPLE_BASE}Ds3.mp3`,
  'F#3': `${SAMPLE_BASE}Fs3.mp3`,
  'A3': `${SAMPLE_BASE}A3.mp3`,
  'C4': `${SAMPLE_BASE}C4.mp3`,
  'D#4': `${SAMPLE_BASE}Ds4.mp3`,
  'F#4': `${SAMPLE_BASE}Fs4.mp3`,
  'A4': `${SAMPLE_BASE}A4.mp3`,
  'C5': `${SAMPLE_BASE}C5.mp3`,
  'D#5': `${SAMPLE_BASE}Ds5.mp3`,
  'F#5': `${SAMPLE_BASE}Fs5.mp3`,
  'A5': `${SAMPLE_BASE}A5.mp3`,
  'C6': `${SAMPLE_BASE}C6.mp3`,
  'D#6': `${SAMPLE_BASE}Ds6.mp3`,
  'F#6': `${SAMPLE_BASE}Fs6.mp3`,
  'A6': `${SAMPLE_BASE}A6.mp3`,
  'C7': `${SAMPLE_BASE}C7.mp3`,
};

let samplerInstance: Tone.Sampler | null = null;
let fallbackSynth: Tone.PolySynth | null = null;
let audioInitialized = false;
let usingSampler = false;

export function usePianoAudio() {
  const setAudioReady = useStore((s) => s.setAudioReady);
  const volume = useStore((s) => s.settings.volume);
  const initAttempted = useRef(false);

  const initAudio = useCallback(async () => {
    if (audioInitialized) return;
    if (initAttempted.current) return;
    initAttempted.current = true;

    try {
      await Tone.start();

      // Audio context is running — immediately mark ready so overlay disappears
      // Sampler loads in background; synth fires if sampler fails
      initFallbackSynth(); // start with synth immediately (instant sound)

      // Also try to load high-quality sampler (will replace synth when ready)
      samplerInstance = new Tone.Sampler({
        urls: SAMPLE_NOTES,
        onload: () => {
          usingSampler = true;
        },
        onerror: () => {
          // Keep using fallback synth — already initialized
        },
      }).toDestination();
    } catch {
      initFallbackSynth();
    }
  }, [setAudioReady]);

  function initFallbackSynth() {
    if (audioInitialized) return;
    try {
      fallbackSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle8' },
        envelope: {
          attack: 0.005,
          decay: 0.4,
          sustain: 0.3,
          release: 1.5,
        },
        volume: -8,
      }).toDestination();
      audioInitialized = true;
      usingSampler = false;
      setAudioReady(true);
    } catch {
      // Audio unavailable
    }
  }

  const playNote = useCallback((note: string, duration?: number) => {
    if (!audioInitialized) return;
    try {
      const vel = 0.8;
      if (usingSampler && samplerInstance) {
        if (duration) {
          samplerInstance.triggerAttackRelease(note, duration, Tone.now(), vel);
        } else {
          samplerInstance.triggerAttack(note, Tone.now(), vel);
        }
      } else if (fallbackSynth) {
        if (duration) {
          fallbackSynth.triggerAttackRelease(note, duration, Tone.now(), vel);
        } else {
          fallbackSynth.triggerAttack(note, Tone.now(), vel);
        }
      }
    } catch {
      // Ignore playback errors
    }
  }, []);

  const stopNote = useCallback((note: string) => {
    if (!audioInitialized) return;
    try {
      if (usingSampler && samplerInstance) {
        samplerInstance.triggerRelease(note, Tone.now());
      } else if (fallbackSynth) {
        fallbackSynth.triggerRelease(note, Tone.now());
      }
    } catch {
      // Ignore
    }
  }, []);

  const stopAll = useCallback(() => {
    if (!audioInitialized) return;
    try {
      if (usingSampler && samplerInstance) {
        samplerInstance.releaseAll();
      } else if (fallbackSynth) {
        fallbackSynth.releaseAll();
      }
    } catch {
      // Ignore
    }
  }, []);

  // Sync volume
  useEffect(() => {
    const db = Tone.gainToDb(volume);
    if (samplerInstance) samplerInstance.volume.value = db;
    if (fallbackSynth) fallbackSynth.volume.value = db;
  }, [volume]);

  return { initAudio, playNote, stopNote, stopAll };
}
