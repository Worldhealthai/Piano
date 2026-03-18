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
  const setCurrentBeat = useStore((s) => s.setCurrentBeat);
  const setPlaying = useStore((s) => s.setPlaying);
  const setPaused = useStore((s) => s.setPaused);
  const setTotalBeats = useStore((s) => s.setTotalBeats);
  const setWaitingForNote = useStore((s) => s.setWaitingForNote);
  const hitNote = useStore((s) => s.hitNote);
  const resetScore = useStore((s) => s.resetScore);

  // Keep all frequently-changing values in refs so callbacks stay stable
  const playbackRef = useRef(useStore.getState().playback);
  const modeRef = useRef(useStore.getState().mode);
  const selectedSongRef = useRef(useStore.getState().selectedSong);
  const waitingForNoteRef = useRef(useStore.getState().waitingForNote);

  // Subscribe to store changes via refs (avoids re-renders driving re-creation of tick)
  useEffect(() => {
    return useStore.subscribe((state) => {
      playbackRef.current = state.playback;
      modeRef.current = state.mode;
      selectedSongRef.current = state.selectedSong;
      waitingForNoteRef.current = state.waitingForNote;
    });
  }, []);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const noteIndexRef = useRef<number>(0);
  const isWaitingRef = useRef<boolean>(false);
  const activeNotesRef = useRef<Set<string>>(new Set());

  // Stable callbacks via refs
  const onPlayNoteRef = useRef(onPlayNote);
  const onNoteActiveRef = useRef(onNoteActive);
  const onNoteEndRef = useRef(onNoteEnd);
  const onSongEndRef = useRef(onSongEnd);
  useEffect(() => { onPlayNoteRef.current = onPlayNote; }, [onPlayNote]);
  useEffect(() => { onNoteActiveRef.current = onNoteActive; }, [onNoteActive]);
  useEffect(() => { onNoteEndRef.current = onNoteEnd; }, [onNoteEnd]);
  useEffect(() => { onSongEndRef.current = onSongEnd; }, [onSongEnd]);

  const getBpm = useCallback(() => {
    const song = selectedSongRef.current;
    const mult = playbackRef.current.tempoMultiplier;
    return (song?.bpm ?? 120) * mult;
  }, []);

  const beatToMs = useCallback((beats: number) => (60 / getBpm()) * beats * 1000, [getBpm]);

  // tick is stable — reads everything from refs
  const tick = useCallback((timestamp: number) => {
    const pb = playbackRef.current;
    const song = selectedSongRef.current;

    if (!pb.isPlaying || !song) return;

    const elapsed = timestamp - startTimeRef.current;
    const bpm = getBpm();
    const beatsElapsed = (elapsed / 1000) * (bpm / 60);
    setCurrentBeat(beatsElapsed);

    const notes = song.notes;

    while (noteIndexRef.current < notes.length) {
      const note = notes[noteIndexRef.current];
      const loopEnd = pb.loopEnd;
      const loopStart = pb.loopStart ?? 0;

      // Loop handling
      if (loopEnd !== null && beatsElapsed >= loopEnd) {
        const loopStartMs = (60 / bpm) * loopStart * 1000;
        startTimeRef.current = timestamp - loopStartMs;
        noteIndexRef.current = notes.findIndex((n) => n.time >= loopStart);
        if (noteIndexRef.current < 0) noteIndexRef.current = 0;
        activeNotesRef.current.forEach((n) => onNoteEndRef.current(n));
        activeNotesRef.current.clear();
        break;
      }

      if (beatsElapsed < note.time) break;

      // Practice mode: wait for correct key press
      if (modeRef.current === 'practice' && !isWaitingRef.current) {
        isWaitingRef.current = true;
        const waitNote = note.chordNotes ? note.chordNotes[0] : note.note;
        setWaitingForNote(waitNote);
        startTimeRef.current = timestamp - (60 / bpm) * note.time * 1000;
        break;
      }

      if (isWaitingRef.current) break;

      // Trigger note
      const allNotes = note.chordNotes ?? [note.note];
      const durMs = beatToMs(note.duration) / 1000;
      allNotes.forEach((n) => {
        onPlayNoteRef.current(n, durMs);
        onNoteActiveRef.current(n);
        activeNotesRef.current.add(n);
        setTimeout(() => {
          onNoteEndRef.current(n);
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
        setPlaying(false);
        setPaused(false);
        setCurrentBeat(0);
        setWaitingForNote(null);
        noteIndexRef.current = 0;
        isWaitingRef.current = false;
        activeNotesRef.current.forEach((n) => onNoteEndRef.current(n));
        activeNotesRef.current.clear();
        onSongEndRef.current();
        return;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [getBpm, beatToMs, setCurrentBeat, setPlaying, setPaused, setWaitingForNote]);

  const startSong = useCallback(() => {
    const song = selectedSongRef.current;
    if (!song) return;
    cancelAnimationFrame(rafRef.current);
    resetScore();
    noteIndexRef.current = 0;
    isWaitingRef.current = false;
    activeNotesRef.current.clear();

    const totalBeats = song.notes.reduce(
      (max: number, n: ParsedNote) => Math.max(max, n.time + n.duration),
      0
    );
    setTotalBeats(totalBeats);
    setPlaying(true);
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [resetScore, setTotalBeats, setPlaying, tick]);

  const pauseSong = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = playbackRef.current.currentBeat;
    setPlaying(false);
    setPaused(true);
  }, [setPlaying, setPaused]);

  const resumeSong = useCallback(() => {
    const song = selectedSongRef.current;
    if (!song) return;
    setPlaying(true);
    setPaused(false);
    startTimeRef.current = performance.now() - beatToMs(pausedAtRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [setPlaying, setPaused, beatToMs, tick]);

  const stopSong = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setPaused(false);
    setCurrentBeat(0);
    setWaitingForNote(null);
    noteIndexRef.current = 0;
    isWaitingRef.current = false;
    activeNotesRef.current.forEach((n) => onNoteEndRef.current(n));
    activeNotesRef.current.clear();
  }, [setPlaying, setPaused, setCurrentBeat, setWaitingForNote]);

  // notifyNotePressed is stable — no tick in deps
  const notifyNotePressed = useCallback(
    (pressedNote: string) => {
      if (!isWaitingRef.current || !waitingForNoteRef.current) return;
      if (pressedNote === waitingForNoteRef.current) {
        isWaitingRef.current = false;
        setWaitingForNote(null);
        hitNote();
        noteIndexRef.current++;
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [setWaitingForNote, hitNote, tick]
  );

  // Cancel RAF when externally stopped
  useEffect(() => {
    return useStore.subscribe((state) => {
      if (!state.playback.isPlaying && !state.playback.isPaused) {
        cancelAnimationFrame(rafRef.current);
      }
    });
  }, []);

  // Set total beats when song changes
  useEffect(() => {
    const song = selectedSongRef.current;
    if (song) {
      const totalBeats = song.notes.reduce(
        (max: number, n: ParsedNote) => Math.max(max, n.time + n.duration),
        0
      );
      setTotalBeats(totalBeats);
    }
  }, [setTotalBeats]);

  return { startSong, pauseSong, resumeSong, stopSong, notifyNotePressed };
}
