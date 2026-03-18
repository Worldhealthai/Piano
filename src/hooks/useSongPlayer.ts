import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { ParsedNote } from '../types';

interface PlayerOptions {
  onPlayNote: (note: string, duration: number) => void;
  onNoteActive: (note: string) => void;
  onNoteEnd: (note: string) => void;
  onSongEnd: () => void;
}

export function useSongPlayer({
  onPlayNote,
  onNoteActive,
  onNoteEnd,
  onSongEnd,
}: PlayerOptions) {
  const { playback, mode, selectedSong, setCurrentBeat, setPlaying, setPaused, setTotalBeats, waitingForNote, setWaitingForNote, hitNote, resetScore } = useStore((s) => ({
    playback: s.playback,
    mode: s.mode,
    selectedSong: s.selectedSong,
    setCurrentBeat: s.setCurrentBeat,
    setPlaying: s.setPlaying,
    setPaused: s.setPaused,
    setTotalBeats: s.setTotalBeats,
    waitingForNote: s.waitingForNote,
    setWaitingForNote: s.setWaitingForNote,
    hitNote: s.hitNote,
    resetScore: s.resetScore,
  }));

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const noteIndexRef = useRef<number>(0);
  const isWaitingRef = useRef<boolean>(false);
  const activeNotesRef = useRef<Set<string>>(new Set());

  const getBpm = useCallback(() => {
    return (selectedSong?.bpm ?? 120) * playback.tempoMultiplier;
  }, [selectedSong, playback.tempoMultiplier]);

  const beatToMs = useCallback(
    (beats: number) => (60 / getBpm()) * beats * 1000,
    [getBpm]
  );

  const stopSong = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setPaused(false);
    setCurrentBeat(0);
    setWaitingForNote(null);
    noteIndexRef.current = 0;
    isWaitingRef.current = false;
    activeNotesRef.current.forEach((n) => onNoteEnd(n));
    activeNotesRef.current.clear();
  }, [setPlaying, setPaused, setCurrentBeat, setWaitingForNote, onNoteEnd]);

  const tick = useCallback(
    (timestamp: number) => {
      if (!playback.isPlaying || !selectedSong) return;

      const elapsed = timestamp - startTimeRef.current;
      const beatsElapsed = (elapsed / 1000) * (getBpm() / 60);
      setCurrentBeat(beatsElapsed);

      const notes = selectedSong.notes;

      // Process notes that should now be triggered
      while (noteIndexRef.current < notes.length) {
        const note = notes[noteIndexRef.current];
        const loopEnd = playback.loopEnd;
        const loopStart = playback.loopStart ?? 0;

        // Loop handling
        if (loopEnd !== null && beatsElapsed >= loopEnd) {
          startTimeRef.current = timestamp - beatToMs(loopStart);
          noteIndexRef.current = notes.findIndex((n) => n.time >= loopStart);
          if (noteIndexRef.current < 0) noteIndexRef.current = 0;
          activeNotesRef.current.forEach((n) => onNoteEnd(n));
          activeNotesRef.current.clear();
          break;
        }

        if (beatsElapsed < note.time) break;

        // Practice mode: wait for correct key press
        if (mode === 'practice' && !isWaitingRef.current) {
          isWaitingRef.current = true;
          const waitNote = note.chordNotes ? note.chordNotes[0] : note.note;
          setWaitingForNote(waitNote);
          // Pause time advancement
          startTimeRef.current = timestamp - beatToMs(note.time);
          break;
        }

        if (isWaitingRef.current) break;

        // Trigger note audio and visual
        const allNotes = note.chordNotes ?? [note.note];
        allNotes.forEach((n) => {
          onPlayNote(n, beatToMs(note.duration) / 1000);
          onNoteActive(n);
          activeNotesRef.current.add(n);
          setTimeout(() => {
            onNoteEnd(n);
            activeNotesRef.current.delete(n);
          }, beatToMs(note.duration));
        });

        noteIndexRef.current++;
      }

      // Song end
      if (noteIndexRef.current >= notes.length && !isWaitingRef.current) {
        const lastNote = notes[notes.length - 1];
        const songEndBeat = lastNote ? lastNote.time + lastNote.duration : 0;
        if (beatsElapsed >= songEndBeat) {
          stopSong();
          onSongEnd();
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [
      playback,
      selectedSong,
      mode,
      getBpm,
      beatToMs,
      setCurrentBeat,
      setWaitingForNote,
      onPlayNote,
      onNoteActive,
      onNoteEnd,
      onSongEnd,
      stopSong,
    ]
  );

  const startSong = useCallback(() => {
    if (!selectedSong) return;
    cancelAnimationFrame(rafRef.current);
    resetScore();
    noteIndexRef.current = 0;
    isWaitingRef.current = false;
    activeNotesRef.current.clear();

    const totalBeats = selectedSong.notes.reduce((max, n) => Math.max(max, n.time + n.duration), 0);
    setTotalBeats(totalBeats);
    setPlaying(true);
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [selectedSong, resetScore, setTotalBeats, setPlaying, tick]);

  const pauseSong = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = playback.currentBeat;
    setPaused(true);
    setPlaying(false);
  }, [playback.currentBeat, setPaused, setPlaying]);

  const resumeSong = useCallback(() => {
    if (!selectedSong) return;
    setPlaying(true);
    setPaused(false);
    startTimeRef.current = performance.now() - beatToMs(pausedAtRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [selectedSong, setPlaying, setPaused, beatToMs, tick]);

  // Called when user presses a note in Practice mode
  const notifyNotePressed = useCallback(
    (pressedNote: string) => {
      if (!isWaitingRef.current || !waitingForNote) return;
      if (pressedNote === waitingForNote) {
        isWaitingRef.current = false;
        setWaitingForNote(null);
        hitNote();
        noteIndexRef.current++;
        // Resume tick
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [waitingForNote, setWaitingForNote, hitNote, tick]
  );

  // When isPlaying changes to false externally, stop RAF
  useEffect(() => {
    if (!playback.isPlaying) {
      cancelAnimationFrame(rafRef.current);
    }
  }, [playback.isPlaying]);

  // Update notes list when song changes
  useEffect(() => {
    if (selectedSong) {
      const totalBeats = selectedSong.notes.reduce(
        (max: number, n: ParsedNote) => Math.max(max, n.time + n.duration),
        0
      );
      setTotalBeats(totalBeats);
    }
  }, [selectedSong, setTotalBeats]);

  return { startSong, pauseSong, resumeSong, stopSong, notifyNotePressed };
}
