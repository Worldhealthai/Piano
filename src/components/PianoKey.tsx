import React from 'react';
import { useStore } from '../store/useStore';
import { isBlackKey, getNoteLetter } from '../utils/noteHelpers';
import { getKeyForNote } from '../hooks/useKeyboard';
import type { NoteWithOctave } from '../types';

interface PianoKeyProps {
  note: NoteWithOctave;
  onPress: (note: NoteWithOctave) => void;
  onRelease: (note: NoteWithOctave) => void;
}

export const PianoKey: React.FC<PianoKeyProps> = React.memo(({ note, onPress, onRelease }) => {
  const activeKeys = useStore((s) => s.activeKeys);
  const correctKeys = useStore((s) => s.correctKeys);
  const wrongKeys = useStore((s) => s.wrongKeys);
  const waitingForNote = useStore((s) => s.waitingForNote);
  const settings = useStore((s) => s.settings);

  const isActive = activeKeys.has(note);
  const isCorrect = correctKeys.has(note);
  const isWrong = wrongKeys.has(note);
  const isWaiting = waitingForNote === note;
  const black = isBlackKey(note);

  const keyShortcut = getKeyForNote(note, settings.octaveShift);
  const noteLetter = getNoteLetter(note);        // e.g. "C♯"
  const isC = note.startsWith('C') && !black;   // highlight C notes

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    onPress(note);
  };
  const handlePointerUp = () => onRelease(note);
  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.buttons > 0) onRelease(note);
  };

  if (black) {
    return (
      <div
        className={`black-key ${isActive ? 'black-key--active' : ''} ${isCorrect ? 'black-key--correct' : ''} ${isWrong ? 'black-key--wrong' : ''} ${isWaiting ? 'black-key--waiting' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{ touchAction: 'none' }}
        data-note={note}
      >
        {/* Always show note letter on black keys */}
        <div className="key-label key-label--black">
          {noteLetter}
        </div>
        {/* Show keyboard shortcut only when enabled */}
        {settings.showKeyLabels && settings.labelType === 'key' && keyShortcut && (
          <div className="key-label key-label--black key-label--shortcut">
            {keyShortcut.toUpperCase()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`white-key ${isActive ? 'white-key--active' : ''} ${isCorrect ? 'white-key--correct' : ''} ${isWrong ? 'white-key--wrong' : ''} ${isWaiting ? 'white-key--waiting' : ''} ${isC ? 'white-key--c' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={{ touchAction: 'none' }}
      data-note={note}
    >
      {/* Bottom label area: note letter (always) + keyboard shortcut (if enabled) */}
      <div className="key-bottom-labels">
        {settings.showKeyLabels && settings.labelType === 'key' && keyShortcut && (
          <div className="key-label key-label--shortcut-white">
            {keyShortcut.toUpperCase()}
          </div>
        )}
        {/* Always show note letter on white keys */}
        <div className={`key-label key-label--note-white ${isC ? 'key-label--c' : ''}`}>
          {noteLetter}
        </div>
      </div>
    </div>
  );
});
