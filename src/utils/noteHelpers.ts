import type { NoteWithOctave, NoteName } from '../types';

export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const OCTAVE_COLORS: Record<number, string> = {
  2: '#ff6b6b',
  3: '#00F0FF',
  4: '#8B5CF6',
  5: '#4ade80',
  6: '#fb923c',
};

export function noteToMidi(note: NoteWithOctave): number {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return -1;
  const [, name, octStr] = match;
  const octave = parseInt(octStr, 10);
  const noteIndex = NOTE_NAMES.indexOf(name as NoteName);
  return (octave + 1) * 12 + noteIndex;
}

export function midiToNote(midi: number): NoteWithOctave {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function isBlackKey(note: NoteWithOctave): boolean {
  const match = note.match(/^([A-G]#?)/);
  if (!match) return false;
  return match[1].includes('#');
}

export function getNoteColor(note: NoteWithOctave): string {
  const match = note.match(/\d$/);
  if (!match) return '#00F0FF';
  const octave = parseInt(match[0], 10);
  return OCTAVE_COLORS[octave] ?? '#00F0FF';
}

export function getOctave(note: NoteWithOctave): number {
  const match = note.match(/(\d)$/);
  return match ? parseInt(match[1], 10) : 4;
}

// Generate all piano keys from C3 to C6
export function generatePianoKeys(startOctave = 3, endOctave = 6): NoteWithOctave[] {
  const keys: NoteWithOctave[] = [];
  for (let oct = startOctave; oct <= endOctave; oct++) {
    for (const name of NOTE_NAMES) {
      const note = `${name}${oct}` as NoteWithOctave;
      keys.push(note);
      if (oct === endOctave && name === 'C') break;
    }
  }
  return keys;
}

export function formatNoteDisplay(note: NoteWithOctave): string {
  return note.replace('#', '♯');
}

/** Returns just the letter part, e.g. "C♯" from "C#4" */
export function getNoteLetter(note: NoteWithOctave): string {
  return note.replace(/\d$/, '').replace('#', '♯');
}

// ─── Chord Detection ──────────────────────────────────────────────────────────

export interface ChordResult {
  name: string;    // "C Major"
  root: string;    // "C"
  type: string;    // "Major"
  symbol: string;  // "C" / "Cm" / "Cmaj7"
  noteLetters: string[]; // ["C", "E", "G"]
}

interface ChordPattern {
  name: string;
  symbol: string;
  intervals: number[]; // sorted ascending, root = 0
}

// Ordered: longer/more-specific patterns first so they win over subsets
const CHORD_PATTERNS: ChordPattern[] = [
  // 5-note
  { name: 'Major 9',    symbol: 'maj9',  intervals: [0, 2, 4, 7, 11] },
  { name: 'Minor 9',    symbol: 'm9',    intervals: [0, 2, 3, 7, 10] },
  { name: 'Dominant 9', symbol: '9',     intervals: [0, 2, 4, 7, 10] },
  // 4-note
  { name: 'Major 7',    symbol: 'maj7',  intervals: [0, 4, 7, 11] },
  { name: 'Minor 7',    symbol: 'm7',    intervals: [0, 3, 7, 10] },
  { name: 'Dominant 7', symbol: '7',     intervals: [0, 4, 7, 10] },
  { name: 'Minor maj7', symbol: 'mMaj7', intervals: [0, 3, 7, 11] },
  { name: 'Half-dim 7', symbol: 'ø7',   intervals: [0, 3, 6, 10] },
  { name: 'Dim 7',      symbol: '°7',   intervals: [0, 3, 6, 9]  },
  { name: 'Add 9',      symbol: 'add9', intervals: [0, 2, 4, 7]  },
  { name: 'Sus2 7',     symbol: '7sus2', intervals: [0, 2, 7, 10] },
  // 3-note
  { name: 'Major',      symbol: '',      intervals: [0, 4, 7] },
  { name: 'Minor',      symbol: 'm',     intervals: [0, 3, 7] },
  { name: 'Diminished', symbol: '°',    intervals: [0, 3, 6] },
  { name: 'Augmented',  symbol: '+',     intervals: [0, 4, 8] },
  { name: 'Sus2',       symbol: 'sus2',  intervals: [0, 2, 7] },
  { name: 'Sus4',       symbol: 'sus4',  intervals: [0, 5, 7] },
  // 2-note
  { name: 'Power',      symbol: '5',     intervals: [0, 7] },
  { name: 'Octave',     symbol: '8',     intervals: [0, 0] }, // same note different oct
];

export function detectChord(notes: NoteWithOctave[]): ChordResult | null {
  if (notes.length < 2) return null;

  // Get unique pitch classes 0–11
  const pitchClasses = [
    ...new Set(notes.map((n) => noteToMidi(n) % 12).filter((m) => m >= 0)),
  ].sort((a, b) => a - b);

  if (pitchClasses.length < 2) return null;

  // Try longer patterns first (already ordered that way)
  for (const pattern of CHORD_PATTERNS) {
    if (pattern.intervals.length !== pitchClasses.length) continue;

    // Try every pitch class as potential root
    for (const rootPc of pitchClasses) {
      const intervals = pitchClasses
        .map((pc) => (pc - rootPc + 12) % 12)
        .sort((a, b) => a - b);

      const patSorted = [...pattern.intervals].sort((a, b) => a - b);
      if (intervals.every((v, i) => v === patSorted[i])) {
        const rootName = NOTE_NAMES[rootPc];
        const displayRoot = rootName.replace('#', '♯');
        const noteLetters = patSorted.map((i) =>
          NOTE_NAMES[(rootPc + i) % 12].replace('#', '♯')
        );
        return {
          name: `${displayRoot} ${pattern.name}`,
          root: displayRoot,
          type: pattern.name,
          symbol: `${displayRoot}${pattern.symbol}`,
          noteLetters,
        };
      }
    }
  }
  return null;
}
