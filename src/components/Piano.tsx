import React from 'react';
import { PianoKey } from './PianoKey';
import { generatePianoKeys, isBlackKey } from '../utils/noteHelpers';
import type { NoteWithOctave } from '../types';

interface PianoProps {
  onNoteOn: (note: NoteWithOctave) => void;
  onNoteOff: (note: NoteWithOctave) => void;
}

const ALL_KEYS = generatePianoKeys(3, 6);

// Group keys into octaves for layout
function getKeyGroups(): { white: NoteWithOctave[]; all: NoteWithOctave[] } {
  const white: NoteWithOctave[] = [];
  ALL_KEYS.forEach((k) => {
    if (!isBlackKey(k)) white.push(k);
  });
  return { white, all: ALL_KEYS };
}

export const Piano: React.FC<PianoProps> = ({ onNoteOn, onNoteOff }) => {
  const { white, all } = getKeyGroups();

  return (
    <div className="piano-container" style={{ touchAction: 'none' }}>
      <div className="piano-keys">
        {/* White keys as base layer */}
        {white.map((note) => (
          <PianoKey
            key={note}
            note={note}
            onPress={onNoteOn}
            onRelease={onNoteOff}
          />
        ))}

        {/* Black keys as overlay */}
        <div className="black-keys-overlay">
          {all.map((note) =>
            isBlackKey(note) ? (
              <BlackKeyPositioned
                key={note}
                note={note}
                whiteKeys={white}
                onPress={onNoteOn}
                onRelease={onNoteOff}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};

interface BlackKeyPositionedProps {
  note: NoteWithOctave;
  whiteKeys: NoteWithOctave[];
  onPress: (note: NoteWithOctave) => void;
  onRelease: (note: NoteWithOctave) => void;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function BlackKeyPositioned({ note, whiteKeys, onPress, onRelease }: BlackKeyPositionedProps) {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return null;
  const [, name, octStr] = match;
  const oct = parseInt(octStr, 10);

  // Find the white key immediately to the left of this black key
  // C# is between C and D, D# between D and E, etc.
  const noteIdx = NOTE_NAMES.indexOf(name);
  const prevWhiteName = NOTE_NAMES[noteIdx - 1];
  const prevWhiteNote = `${prevWhiteName}${oct}` as NoteWithOctave;

  const leftWhiteIdx = whiteKeys.indexOf(prevWhiteNote);
  if (leftWhiteIdx < 0) return null;

  // Position: between leftWhiteIdx and leftWhiteIdx+1
  const whiteKeyPercent = 100 / whiteKeys.length;
  const leftPercent = (leftWhiteIdx + 1) * whiteKeyPercent - whiteKeyPercent * 0.35;

  return (
    <div
      className="black-key-positioned"
      style={{ left: `${leftPercent}%`, width: `${whiteKeyPercent * 0.7}%` }}
    >
      <PianoKey note={note} onPress={onPress} onRelease={onRelease} />
    </div>
  );
}
