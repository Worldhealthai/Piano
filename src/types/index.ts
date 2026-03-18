export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type NoteWithOctave = string; // e.g. "C4", "F#3"

export interface ParsedNote {
  note: NoteWithOctave;
  duration: number; // in beats
  time: number;     // start time in beats from beginning
  isChord?: boolean;
  chordNotes?: NoteWithOctave[];
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  rawNotation: string;
  notes: ParsedNote[];
  bpm: number;
  isPreset?: boolean;
}

export type PracticeMode = 'watch' | 'practice' | 'play';

export type KeyState = 'idle' | 'active' | 'correct' | 'wrong';

export interface FallingNote {
  id: string;
  note: NoteWithOctave;
  chordNotes?: NoteWithOctave[];
  startBeat: number;
  duration: number;
  y: number;       // current y position in px
  height: number;  // pixel height
  x: number;       // pixel x position
  width: number;   // pixel width
  color: string;
  isActive: boolean;
  isHit: boolean;
  opacity: number;
}

export interface KeyboardMapping {
  [key: string]: NoteWithOctave;
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer?: string;
}

export interface Settings {
  octaveShift: number;
  volume: number;
  selectedMidiDeviceId: string | null;
  showKeyLabels: boolean;
  labelType: 'note' | 'key';
  theme: 'dark' | 'light';
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentBeat: number;
  totalBeats: number;
  loopStart: number | null;
  loopEnd: number | null;
  tempoMultiplier: number;
}

export interface ScoreState {
  totalNotes: number;
  hitNotes: number;
  missedNotes: number;
  streak: number;
  maxStreak: number;
  accuracy: number;
}

export interface AppState {
  // View
  currentView: 'library' | 'practice';
  showSettings: boolean;
  showSongEditor: boolean;
  editingSong: Song | null;
  audioReady: boolean;

  // Songs
  songs: Song[];
  selectedSong: Song | null;

  // Practice
  mode: PracticeMode;
  playback: PlaybackState;
  score: ScoreState;

  // Piano
  activeKeys: Set<NoteWithOctave>;
  correctKeys: Set<NoteWithOctave>;
  wrongKeys: Set<NoteWithOctave>;
  waitingForNote: NoteWithOctave | null;

  // Settings
  settings: Settings;

  // MIDI
  midiDevices: MidiDevice[];
  midiConnected: boolean;
}
