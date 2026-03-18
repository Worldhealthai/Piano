import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, RotateCcw, ChevronLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { FallingNotes } from './FallingNotes';
import { Piano } from './Piano';
import { TempoControl } from './TempoControl';
import { ScoreDisplay, FinalScore } from './ScoreDisplay';
import { usePianoAudio } from '../hooks/usePianoAudio';
import { useMidi } from '../hooks/useMidi';
import { useKeyboard } from '../hooks/useKeyboard';
import { useSongPlayer } from '../hooks/useSongPlayer';

export const PracticeView: React.FC = () => {
  const selectedSong = useStore((s) => s.selectedSong);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const playback = useStore((s) => s.playback);
  const mode = useStore((s) => s.mode);
  const audioReady = useStore((s) => s.audioReady);
  const pressKey = useStore((s) => s.pressKey);
  const releaseKey = useStore((s) => s.releaseKey);
  const setCorrectKey = useStore((s) => s.setCorrectKey);
  const setWrongKey = useStore((s) => s.setWrongKey);
  const clearKeyFeedback = useStore((s) => s.clearKeyFeedback);
  const hitNote = useStore((s) => s.hitNote);
  const missNote = useStore((s) => s.missNote);
  const waitingForNote = useStore((s) => s.waitingForNote);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showFinalScore, setShowFinalScore] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const { initAudio, playNote, stopNote } = usePianoAudio();

  const handleSongEnd = useCallback(() => {
    if (mode === 'play') setShowFinalScore(true);
  }, [mode]);

  const { startSong, pauseSong, resumeSong, stopSong, notifyNotePressed } = useSongPlayer({
    onPlayNote: (note, dur) => playNote(note, dur),
    onNoteActive: (note) => pressKey(note),
    onNoteEnd: (note) => releaseKey(note),
    onSongEnd: handleSongEnd,
  });

  const waitingRef = useRef(waitingForNote);
  useEffect(() => { waitingRef.current = waitingForNote; }, [waitingForNote]);
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const playingRef = useRef(playback.isPlaying);
  useEffect(() => { playingRef.current = playback.isPlaying; }, [playback.isPlaying]);

  const handleNoteOn = useCallback(
    (note: string) => {
      initAudio();
      playNote(note);
      pressKey(note);

      const currentMode = modeRef.current;
      const isPlaying = playingRef.current;
      const waiting = waitingRef.current;

      if (isPlaying && currentMode === 'practice') {
        notifyNotePressed(note);
        if (waiting === note) {
          setCorrectKey(note);
          hitNote();
          setTimeout(() => clearKeyFeedback(note), 400);
        } else if (waiting && waiting !== note) {
          setWrongKey(note);
          missNote();
          setTimeout(() => clearKeyFeedback(note), 400);
        }
      } else if (isPlaying && currentMode === 'play') {
        if (waiting === note) {
          setCorrectKey(note);
          hitNote();
          setTimeout(() => clearKeyFeedback(note), 400);
        } else if (waiting) {
          setWrongKey(note);
          missNote();
          setTimeout(() => clearKeyFeedback(note), 400);
        }
      }
    },
    [initAudio, playNote, pressKey, notifyNotePressed, setCorrectKey, setWrongKey, clearKeyFeedback, hitNote, missNote]
  );

  const handleNoteOff = useCallback(
    (note: string) => {
      stopNote(note);
      releaseKey(note);
    },
    [stopNote, releaseKey]
  );

  useMidi(handleNoteOn, handleNoteOff);
  useKeyboard(handleNoteOn, handleNoteOff);

  // Measure canvas container
  useEffect(() => {
    const measure = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (canvasContainerRef.current) ro.observe(canvasContainerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!selectedSong) {
    return (
      <div className="practice-empty">
        <p>No song selected.</p>
        <button className="btn-primary" onClick={() => setCurrentView('library')}>
          <ChevronLeft size={16} /> Choose a Song
        </button>
      </div>
    );
  }

  const progress = playback.totalBeats > 0
    ? (playback.currentBeat / playback.totalBeats) * 100
    : 0;

  return (
    <div className="practice-view">
      {/* Progress bar */}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Canvas for falling notes */}
      <div className="falling-notes-container" ref={canvasContainerRef}>
        {containerSize.width > 0 && (
          <FallingNotes
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
          />
        )}

        {/* Audio init overlay */}
        {!audioReady && (
          <div className="audio-overlay" onClick={() => initAudio()}>
            <div className="audio-prompt">
              <span className="audio-prompt-icon">♪</span>
              <span className="audio-prompt-text">Click to enable audio</span>
            </div>
          </div>
        )}

        {/* Score */}
        <div className="score-overlay">
          <ScoreDisplay />
        </div>

        {/* Waiting indicator */}
        {mode === 'practice' && playback.isPlaying && waitingForNote && (
          <div className="waiting-indicator">
            Press <span className="waiting-note font-mono">{waitingForNote}</span>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="controls-row">
        <TempoControl />

        <div className="playback-controls">
          {!playback.isPlaying && !playback.isPaused && (
            <button
              className="play-btn"
              onClick={() => { initAudio(); startSong(); }}
              disabled={!selectedSong}
            >
              <Play size={20} fill="currentColor" />
              <span>Play</span>
            </button>
          )}
          {playback.isPlaying && (
            <button className="play-btn" onClick={pauseSong}>
              <Pause size={20} fill="currentColor" />
              <span>Pause</span>
            </button>
          )}
          {playback.isPaused && (
            <button className="play-btn" onClick={resumeSong}>
              <Play size={20} fill="currentColor" />
              <span>Resume</span>
            </button>
          )}
          {(playback.isPlaying || playback.isPaused) && (
            <button className="stop-btn" onClick={stopSong}>
              <Square size={16} fill="currentColor" />
            </button>
          )}
          <button
            className="icon-btn"
            onClick={stopSong}
            title="Restart"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Piano */}
      <div className="piano-wrapper">
        <Piano onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
      </div>

      {showFinalScore && (
        <FinalScore onClose={() => setShowFinalScore(false)} />
      )}
    </div>
  );
};
