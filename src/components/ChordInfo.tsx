import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { detectChord, getNoteLetter, getNoteColor } from '../utils/noteHelpers';
import type { NoteWithOctave } from '../types';

/** Returns the next 1–3 distinct note groups upcoming in the song */
function useUpcomingNotes() {
  const selectedSong = useStore((s) => s.selectedSong);
  const currentBeat = useStore((s) => s.playback.currentBeat);
  const isPlaying = useStore((s) => s.playback.isPlaying);

  return useMemo(() => {
    if (!selectedSong || !isPlaying) return [];
    const upcoming = selectedSong.notes
      .filter((n) => n.time > currentBeat && n.time <= currentBeat + 4)
      .slice(0, 4);
    return upcoming;
  }, [selectedSong, currentBeat, isPlaying]);
}

export const ChordInfo: React.FC = () => {
  const activeKeys = useStore((s) => s.activeKeys);
  const isPlaying = useStore((s) => s.playback.isPlaying);
  const isPaused = useStore((s) => s.playback.isPaused);

  const activeArr = useMemo(() => [...activeKeys] as NoteWithOctave[], [activeKeys]);
  const chord = useMemo(() => detectChord(activeArr), [activeArr]);
  const upcoming = useUpcomingNotes();

  const hasActivity = activeArr.length > 0 || isPlaying || isPaused;
  if (!hasActivity) return null;

  return (
    <div className="chord-info-panel animate-fade-in">
      {/* ── Current chord / notes ─────────────────── */}
      <div className="chord-info-current">
        {activeArr.length === 0 ? (
          <span className="chord-idle">Play a note…</span>
        ) : chord ? (
          <>
            <div className="chord-name">
              <span className="chord-root">{chord.root}</span>
              <span className="chord-type">{chord.type}</span>
            </div>
            <div className="chord-symbol">{chord.symbol}</div>
            <div className="chord-notes-row">
              {chord.noteLetters.map((letter, i) => (
                <React.Fragment key={letter + i}>
                  <span className="chord-note-pill">{letter}</span>
                  {i < chord.noteLetters.length - 1 && (
                    <span className="chord-note-sep">–</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </>
        ) : (
          <div className="chord-notes-free">
            {activeArr.map((note) => (
              <span
                key={note}
                className="active-note-badge"
                style={{ '--note-color': getNoteColor(note) } as React.CSSProperties}
              >
                {getNoteLetter(note)}
                <span className="active-note-oct">{note.match(/\d$/)?.[0]}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Upcoming notes strip ──────────────────── */}
      {upcoming.length > 0 && (
        <div className="chord-upcoming">
          <span className="chord-upcoming-label">Next</span>
          <div className="chord-upcoming-notes">
            {upcoming.map((n, i) => {
              const allNotes = n.chordNotes ?? [n.note];
              return (
                <div key={`${n.time}-${i}`} className="upcoming-group">
                  {allNotes.map((note) => (
                    <span
                      key={note}
                      className="upcoming-note-chip"
                      style={{ '--note-color': getNoteColor(note) } as React.CSSProperties}
                    >
                      {getNoteLetter(note)}
                    </span>
                  ))}
                  {n.duration >= 1.5 && (
                    <span className="upcoming-hold">hold</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
