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
