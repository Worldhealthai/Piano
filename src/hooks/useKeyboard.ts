import { useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import type { KeyboardMapping } from '../types';

// Standard two-row piano keyboard layout
// Bottom row: white keys, Top row: black keys
const BASE_KEYBOARD_MAP: KeyboardMapping = {
  // Octave base (C4 by default)
  'z': 'C4',
  's': 'C#4',
  'x': 'D4',
  'd': 'D#4',
  'c': 'E4',
  'v': 'F4',
  'g': 'F#4',
  'b': 'G4',
  'h': 'G#4',
  'n': 'A4',
  'j': 'A#4',
  'm': 'B4',
  // Next octave
  ',': 'C5',
  'l': 'C#5',
  '.': 'D5',
  ';': 'D#5',
  '/': 'E5',
  // Upper row for higher octave
  'q': 'C5',
  '2': 'C#5',
  'w': 'D5',
  '3': 'D#5',
  'e': 'E5',
  'r': 'F5',
  '5': 'F#5',
  't': 'G5',
  '6': 'G#5',
  'y': 'A5',
  '7': 'A#5',
  'u': 'B5',
  'i': 'C6',
};

function shiftNote(note: string, semitones: number): string {
  if (semitones === 0) return note;
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return note;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const [, name, octStr] = match;
  const oct = parseInt(octStr, 10);
  const idx = noteNames.indexOf(name);
  const newMidi = (oct + 1) * 12 + idx + semitones;
  const newOct = Math.floor(newMidi / 12) - 1;
  const newIdx = newMidi % 12;
  return `${noteNames[newIdx]}${newOct}`;
}

export function buildKeyboardMap(octaveShift: number): KeyboardMapping {
  const semitones = octaveShift * 12;
  const map: KeyboardMapping = {};
  for (const [key, note] of Object.entries(BASE_KEYBOARD_MAP)) {
    map[key] = shiftNote(note, semitones);
  }
  return map;
}

export function getKeyForNote(note: string, octaveShift: number): string | undefined {
  const map = buildKeyboardMap(octaveShift);
  return Object.entries(map).find(([, n]) => n === note)?.[0];
}

const pressedKeys = new Set<string>();

export function useKeyboard(
  onNoteOn: (note: string) => void,
  onNoteOff: (note: string) => void
) {
  const octaveShift = useStore((s) => s.settings.octaveShift);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return;

      const key = e.key.toLowerCase();
      if (pressedKeys.has(key)) return; // prevent key repeat
      pressedKeys.add(key);

      const map = buildKeyboardMap(octaveShift);
      const note = map[key];
      if (note) {
        e.preventDefault();
        onNoteOn(note);
      }
    },
    [octaveShift, onNoteOn]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeys.delete(key);

      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return;

      const map = buildKeyboardMap(octaveShift);
      const note = map[key];
      if (note) {
        e.preventDefault();
        onNoteOff(note);
      }
    },
    [octaveShift, onNoteOff]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
