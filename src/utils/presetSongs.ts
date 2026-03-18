import { createSong } from './songParser';
import type { Song } from '../types';

export const PRESET_SONGS: Song[] = [
  createSong({
    id: 'preset-twinkle',
    title: 'Twinkle Twinkle Little Star',
    artist: 'Traditional',
    bpm: 100,
    isPreset: true,
    rawNotation: 'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2',
  }),
  createSong({
    id: 'preset-fur-elise',
    title: 'Für Elise',
    artist: 'Beethoven',
    bpm: 120,
    isPreset: true,
    rawNotation: 'E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1 C4:0.5 E4:0.5 A4:0.5 B4:1 E4:0.5 G#4:0.5 B4:0.5 C5:1 E4:0.5 E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1',
  }),
  createSong({
    id: 'preset-ode-to-joy',
    title: 'Ode to Joy',
    artist: 'Beethoven',
    bpm: 110,
    isPreset: true,
    rawNotation: 'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:0.5 D4:2 E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:0.5 C4:2',
  }),
  createSong({
    id: 'preset-happy-birthday',
    title: 'Happy Birthday',
    artist: 'Traditional',
    bpm: 100,
    isPreset: true,
    rawNotation: 'C4:0.75 C4:0.25 D4:1 C4:1 F4:1 E4:2 C4:0.75 C4:0.25 D4:1 C4:1 G4:1 F4:2 C4:0.75 C4:0.25 C5:1 A4:1 F4:1 E4:1 D4:1 A#4:0.75 A#4:0.25 A4:1 F4:1 G4:1 F4:2',
  }),
  createSong({
    id: 'preset-moonlight',
    title: 'Moonlight Sonata',
    artist: 'Beethoven',
    bpm: 60,
    isPreset: true,
    rawNotation: '[G#3,C#4,E4]:1.5 [G#3,C#4,E4]:0.5 [A3,C#4,E4]:1 [A3,C#4,E4]:1 [G#3,B3,E4]:1 [G#3,B3,E4]:1 [F#3,A3,D#4]:1 [F#3,A3,D#4]:1 [F#3,A3,C#4]:1 [F#3,A3,C#4]:1 [E3,G#3,C#4]:1 [E3,G#3,C#4]:1',
  }),
  createSong({
    id: 'preset-let-it-be',
    title: 'Let It Be',
    artist: 'The Beatles',
    bpm: 75,
    isPreset: true,
    rawNotation: 'C4:1 C4:0.5 C4:0.5 C4:0.5 D4:0.5 E4:2 E4:0.5 E4:0.5 E4:0.5 F4:0.5 E4:0.5 D4:0.5 C4:2 G4:1 G4:0.5 F4:0.5 E4:0.5 D4:0.5 C4:2 C4:1 C4:0.5 D4:0.5 E4:1 G4:1 A4:2',
  }),
  createSong({
    id: 'preset-canon',
    title: 'Canon in D',
    artist: 'Pachelbel',
    bpm: 90,
    isPreset: true,
    rawNotation: 'D4:2 A3:2 B3:2 F#3:2 G3:2 D3:2 G3:2 A3:2 D4:1 E4:1 F#4:1 D4:1 F#4:1 E4:1 D4:1 C#4:1 B3:1 A3:1 B3:1 C#4:1 D4:1 E4:1 F#4:1 G4:1 F#4:2',
  }),
  createSong({
    id: 'preset-clair-de-lune',
    title: 'Clair de Lune',
    artist: 'Debussy',
    bpm: 55,
    isPreset: true,
    rawNotation: 'G#4:1 A#4:0.5 G#4:0.5 F4:0.5 G#4:0.5 C5:1 D#5:0.5 C5:0.5 A#4:0.5 C5:0.5 F5:2 G#4:1 A#4:0.5 G#4:0.5 F4:0.5 G#4:0.5 D#5:1 F5:0.5 D#5:0.5 C5:0.5 D#5:0.5 G#5:2',
  }),
];
