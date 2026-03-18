import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Song, PracticeMode, Settings, MidiDevice } from '../types';
import { PRESET_SONGS } from '../utils/presetSongs';

interface StoreActions {
  // View
  setCurrentView: (view: AppState['currentView']) => void;
  setShowSettings: (show: boolean) => void;
  setShowSongEditor: (show: boolean, song?: Song | null) => void;
  setAudioReady: (ready: boolean) => void;

  // Songs
  addSong: (song: Song) => void;
  updateSong: (song: Song) => void;
  deleteSong: (id: string) => void;
  selectSong: (song: Song | null) => void;

  // Practice
  setMode: (mode: PracticeMode) => void;
  setPlaying: (playing: boolean) => void;
  setPaused: (paused: boolean) => void;
  setCurrentBeat: (beat: number) => void;
  setTotalBeats: (beats: number) => void;
  setTempoMultiplier: (mult: number) => void;
  setLoopPoints: (start: number | null, end: number | null) => void;
  resetPlayback: () => void;

  // Score
  hitNote: () => void;
  missNote: () => void;
  resetScore: () => void;

  // Piano keys
  pressKey: (note: string) => void;
  releaseKey: (note: string) => void;
  setCorrectKey: (note: string) => void;
  setWrongKey: (note: string) => void;
  clearKeyFeedback: (note: string) => void;
  setWaitingForNote: (note: string | null) => void;

  // Settings
  updateSettings: (settings: Partial<Settings>) => void;

  // MIDI
  setMidiDevices: (devices: MidiDevice[]) => void;
  setMidiConnected: (connected: boolean) => void;
}

type Store = AppState & StoreActions;

const defaultSettings: Settings = {
  octaveShift: 0,
  volume: 0.8,
  selectedMidiDeviceId: null,
  showKeyLabels: true,
  labelType: 'key',
  theme: 'dark',
};

const defaultPlayback = {
  isPlaying: false,
  isPaused: false,
  currentBeat: 0,
  totalBeats: 0,
  loopStart: null,
  loopEnd: null,
  tempoMultiplier: 1,
};

const defaultScore = {
  totalNotes: 0,
  hitNotes: 0,
  missedNotes: 0,
  streak: 0,
  maxStreak: 0,
  accuracy: 100,
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      // State
      currentView: 'library',
      showSettings: false,
      showSongEditor: false,
      editingSong: null,
      audioReady: false,

      songs: PRESET_SONGS,
      selectedSong: null,

      mode: 'watch',
      playback: defaultPlayback,
      score: defaultScore,

      activeKeys: new Set(),
      correctKeys: new Set(),
      wrongKeys: new Set(),
      waitingForNote: null,

      settings: defaultSettings,

      midiDevices: [],
      midiConnected: false,

      // Actions
      setCurrentView: (view) => set({ currentView: view }),
      setShowSettings: (show) => set({ showSettings: show }),
      setShowSongEditor: (show, song = null) => set({ showSongEditor: show, editingSong: song }),
      setAudioReady: (ready) => set({ audioReady: ready }),

      addSong: (song) => set((s) => ({ songs: [...s.songs, song] })),
      updateSong: (song) =>
        set((s) => ({ songs: s.songs.map((x) => (x.id === song.id ? song : x)) })),
      deleteSong: (id) =>
        set((s) => ({
          songs: s.songs.filter((x) => x.id !== id),
          selectedSong: s.selectedSong?.id === id ? null : s.selectedSong,
        })),
      selectSong: (song) => set({ selectedSong: song }),

      setMode: (mode) => set({ mode }),
      setPlaying: (isPlaying) =>
        set((s) => ({ playback: { ...s.playback, isPlaying, isPaused: !isPlaying ? s.playback.isPaused : false } })),
      setPaused: (isPaused) =>
        set((s) => ({ playback: { ...s.playback, isPaused } })),
      setCurrentBeat: (beat) =>
        set((s) => ({ playback: { ...s.playback, currentBeat: beat } })),
      setTotalBeats: (beats) =>
        set((s) => ({ playback: { ...s.playback, totalBeats: beats } })),
      setTempoMultiplier: (mult) =>
        set((s) => ({ playback: { ...s.playback, tempoMultiplier: mult } })),
      setLoopPoints: (start, end) =>
        set((s) => ({ playback: { ...s.playback, loopStart: start, loopEnd: end } })),
      resetPlayback: () => set({ playback: defaultPlayback }),

      hitNote: () =>
        set((s) => {
          const newHit = s.score.hitNotes + 1;
          const newTotal = s.score.totalNotes + 1;
          const newStreak = s.score.streak + 1;
          const maxStreak = Math.max(newStreak, s.score.maxStreak);
          return {
            score: {
              ...s.score,
              hitNotes: newHit,
              totalNotes: newTotal,
              streak: newStreak,
              maxStreak,
              accuracy: Math.round((newHit / newTotal) * 100),
            },
          };
        }),
      missNote: () =>
        set((s) => {
          const newMissed = s.score.missedNotes + 1;
          const newTotal = s.score.totalNotes + 1;
          return {
            score: {
              ...s.score,
              missedNotes: newMissed,
              totalNotes: newTotal,
              streak: 0,
              accuracy: Math.round((s.score.hitNotes / newTotal) * 100),
            },
          };
        }),
      resetScore: () => set({ score: defaultScore }),

      pressKey: (note) =>
        set((s) => {
          const newKeys = new Set(s.activeKeys);
          newKeys.add(note);
          return { activeKeys: newKeys };
        }),
      releaseKey: (note) =>
        set((s) => {
          const newKeys = new Set(s.activeKeys);
          newKeys.delete(note);
          return { activeKeys: newKeys };
        }),
      setCorrectKey: (note) =>
        set((s) => {
          const newKeys = new Set(s.correctKeys);
          newKeys.add(note);
          return { correctKeys: newKeys };
        }),
      setWrongKey: (note) =>
        set((s) => {
          const newKeys = new Set(s.wrongKeys);
          newKeys.add(note);
          return { wrongKeys: newKeys };
        }),
      clearKeyFeedback: (note) =>
        set((s) => {
          const newCorrect = new Set(s.correctKeys);
          const newWrong = new Set(s.wrongKeys);
          newCorrect.delete(note);
          newWrong.delete(note);
          return { correctKeys: newCorrect, wrongKeys: newWrong };
        }),
      setWaitingForNote: (note) => set({ waitingForNote: note }),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      setMidiDevices: (devices) => set({ midiDevices: devices }),
      setMidiConnected: (connected) => set({ midiConnected: connected }),
    }),
    {
      name: 'keyflow-storage',
      partialize: (state) => ({
        songs: state.songs.filter((s) => !s.isPreset),
        settings: state.settings,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<Store>;
        return {
          ...current,
          settings: { ...current.settings, ...(p.settings ?? {}) },
          songs: [
            ...PRESET_SONGS,
            ...(p.songs ?? []).filter((s: Song) => !s.isPreset),
          ],
        };
      },
    }
  )
);
