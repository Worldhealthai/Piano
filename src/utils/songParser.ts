import type { ParsedNote, Song } from '../types';
import { noteToMidi } from './noteHelpers';

// Supported formats:
//   Simple: C4 D4 E4 F4
//   Timed:  C4:1 D4:0.5 E4:0.5
//   Chord:  [C4,E4,G4]:1
export function parseSongNotation(rawNotation: string): ParsedNote[] {
  const tokens = rawNotation.trim().split(/\s+/);
  const notes: ParsedNote[] = [];
  let currentTime = 0;

  for (const token of tokens) {
    if (!token) continue;

    const isChord = token.startsWith('[');

    if (isChord) {
      // Parse chord: [C4,E4,G4]:1  or  [C4,E4,G4]
      const chordMatch = token.match(/^\[([^\]]+)\](?::(\d+(?:\.\d+)?))?$/);
      if (!chordMatch) continue;
      const chordNotes = chordMatch[1].split(',').map(n => n.trim()).filter(n => isValidNote(n));
      const duration = chordMatch[2] ? parseFloat(chordMatch[2]) : 1;
      if (chordNotes.length === 0) continue;

      notes.push({
        note: chordNotes[0],
        chordNotes,
        duration,
        time: currentTime,
        isChord: true,
      });
      currentTime += duration;
    } else {
      // Parse single note: C4  or  C4:1
      const noteMatch = token.match(/^([A-G]#?\d)(?::(\d+(?:\.\d+)?))?$/);
      if (!noteMatch) continue;
      const note = noteMatch[1];
      if (!isValidNote(note)) continue;
      const duration = noteMatch[2] ? parseFloat(noteMatch[2]) : 1;

      notes.push({
        note,
        duration,
        time: currentTime,
        isChord: false,
      });
      currentTime += duration;
    }
  }

  return notes;
}

function isValidNote(note: string): boolean {
  if (!note.match(/^[A-G]#?\d$/)) return false;
  const midi = noteToMidi(note);
  return midi >= 36 && midi <= 96; // C2 to C7
}

export function getTotalBeats(notes: ParsedNote[]): number {
  if (notes.length === 0) return 0;
  const last = notes[notes.length - 1];
  return last.time + last.duration;
}

export function createSong(params: {
  title: string;
  artist?: string;
  rawNotation: string;
  bpm?: number;
  isPreset?: boolean;
  id?: string;
}): Song {
  return {
    id: params.id ?? `song-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: params.title,
    artist: params.artist,
    rawNotation: params.rawNotation,
    notes: parseSongNotation(params.rawNotation),
    bpm: params.bpm ?? 120,
    isPreset: params.isPreset ?? false,
  };
}
