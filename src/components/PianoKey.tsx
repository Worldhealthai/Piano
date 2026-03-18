import React from 'react';
import { useStore } from '../store/useStore';
import { isBlackKey, formatNoteDisplay } from '../utils/noteHelpers';
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

  const keyLabel = getKeyForNote(note, settings.octaveShift);
  const noteLabel = formatNoteDisplay(note);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    onPress(note);
  };

  const handlePointerUp = () => {
    onRelease(note);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.buttons > 0) onRelease(note);
  };

  if (black) {
    return (
      <div
        className={`
          black-key relative select-none cursor-pointer
          ${isActive ? 'black-key--active' : ''}
          ${isCorrect ? 'black-key--correct' : ''}
          ${isWrong ? 'black-key--wrong' : ''}
          ${isWaiting ? 'black-key--waiting' : ''}
        `}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{ touchAction: 'none' }}
        data-note={note}
      >
        {settings.showKeyLabels && (
          <div className="key-label key-label--black">
            {settings.labelType === 'note' ? noteLabel : (keyLabel?.toUpperCase() ?? '')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        white-key relative select-none cursor-pointer
        ${isActive ? 'white-key--active' : ''}
        ${isCorrect ? 'white-key--correct' : ''}
        ${isWrong ? 'white-key--wrong' : ''}
        ${isWaiting ? 'white-key--waiting' : ''}
      `}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={{ touchAction: 'none' }}
      data-note={note}
    >
      {settings.showKeyLabels && (
        <div className="key-label key-label--white">
          {settings.labelType === 'note' ? noteLabel : (keyLabel?.toUpperCase() ?? '')}
        </div>
      )}
    </div>
  );
});
