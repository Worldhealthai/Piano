import React, { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generatePianoKeys, isBlackKey, getNoteColor } from '../utils/noteHelpers';
import type { ParsedNote, NoteWithOctave } from '../types';

interface FallingNotesProps {
  containerWidth: number;
  containerHeight: number;
}

interface ActiveFallingNote {
  id: string;
  note: NoteWithOctave;
  chordNotes?: NoteWithOctave[];
  startBeat: number;
  duration: number;
  color: string;
  isHit: boolean;
  hitY?: number;
  particles: Particle[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const ALL_KEYS = generatePianoKeys(3, 6);
const WHITE_KEYS = ALL_KEYS.filter((k) => !isBlackKey(k));

const HIT_LINE_RATIO = 0.88; // 88% from top = hit zone
const BEATS_VISIBLE = 6; // how many beats are visible at once

function getNoteX(note: NoteWithOctave, canvasWidth: number): { x: number; width: number } {
  const whiteKeyWidth = canvasWidth / WHITE_KEYS.length;
  const black = isBlackKey(note);

  if (!black) {
    const idx = WHITE_KEYS.indexOf(note);
    return { x: idx * whiteKeyWidth, width: whiteKeyWidth };
  }

  // Black key: find position between white keys
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return { x: 0, width: whiteKeyWidth * 0.7 };
  const [, name, octStr] = match;
  const oct = parseInt(octStr, 10);
  const noteIdx = noteNames.indexOf(name);
  const prevWhiteName = noteNames[noteIdx - 1];
  const prevWhiteNote = `${prevWhiteName}${oct}` as NoteWithOctave;
  const leftIdx = WHITE_KEYS.indexOf(prevWhiteNote);
  const x = (leftIdx + 1) * whiteKeyWidth - whiteKeyWidth * 0.35;
  return { x, width: whiteKeyWidth * 0.7 };
}

export const FallingNotes: React.FC<FallingNotesProps> = ({ containerWidth, containerHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallingNotesRef = useRef<ActiveFallingNote[]>([]);
  const rafRef = useRef<number>(0);
  const lastNoteIndexRef = useRef<number>(0);

  const playback = useStore((s) => s.playback);
  const selectedSong = useStore((s) => s.selectedSong);
  const mode = useStore((s) => s.mode);
  const activeKeys = useStore((s) => s.activeKeys);
  const correctKeys = useStore((s) => s.correctKeys);

  const playbackRef = useRef(playback);
  const songRef = useRef(selectedSong);
  const modeRef = useRef(mode);
  const activeKeysRef = useRef(activeKeys);
  const correctKeysRef = useRef(correctKeys);

  useEffect(() => { playbackRef.current = playback; }, [playback]);
  useEffect(() => { songRef.current = selectedSong; }, [selectedSong]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { activeKeysRef.current = activeKeys; }, [activeKeys]);
  useEffect(() => { correctKeysRef.current = correctKeys; }, [correctKeys]);

  // Reset when song changes or stops
  useEffect(() => {
    if (!playback.isPlaying && !playback.isPaused) {
      fallingNotesRef.current = [];
      lastNoteIndexRef.current = 0;
    }
  }, [playback.isPlaying, playback.isPaused, selectedSong]);

  const spawnParticles = (x: number, y: number, color: string, count = 8): Particle[] => {
    return Array.from({ length: count }, () => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 1,
      color,
      size: Math.random() * 4 + 2,
    }));
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { currentBeat, isPlaying, isPaused, tempoMultiplier } = playbackRef.current;
    const song = songRef.current;
    const w = canvas.width;
    const h = canvas.height;
    const hitLineY = h * HIT_LINE_RATIO;

    // Clear
    ctx.clearRect(0, 0, w, h);

    if (!song || (!isPlaying && !isPaused)) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const bpm = (song.bpm ?? 120) * tempoMultiplier;
    const pixelsPerBeat = h / BEATS_VISIBLE;

    // Spawn new notes that should be visible
    const visibleAheadBeats = BEATS_VISIBLE;
    const notes: ParsedNote[] = song.notes;

    // Add notes to falling list
    notes.forEach((note, idx) => {
      if (idx < lastNoteIndexRef.current) return;
      if (note.time > currentBeat + visibleAheadBeats) return;

      // Check if already spawned
      const alreadySpawned = fallingNotesRef.current.some(
        (fn) => fn.id === `${note.time}-${note.note}`
      );
      if (alreadySpawned) return;

      const allNotes = note.chordNotes ?? [note.note];
      allNotes.forEach((n) => {
        fallingNotesRef.current.push({
          id: `${note.time}-${n}`,
          note: n,
          chordNotes: note.chordNotes,
          startBeat: note.time,
          duration: note.duration,
          color: getNoteColor(n),
          isHit: false,
          particles: [],
        });
      });
    });

    void bpm;

    // Draw hit line
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, hitLineY);
    ctx.lineTo(w, hitLineY);
    ctx.stroke();
    ctx.restore();

    // Update and draw falling notes
    const toRemove: string[] = [];

    fallingNotesRef.current.forEach((fn) => {
      const beatProgress = currentBeat - fn.startBeat;
      const noteTopBeat = fn.startBeat - currentBeat;
      const noteBottomBeat = fn.startBeat + fn.duration - currentBeat;

      // Position: notes fall from top. At beat=startBeat, note bottom hits hitLineY
      const noteHeight = Math.max(fn.duration * pixelsPerBeat, 12);
      const bottomY = hitLineY - noteTopBeat * pixelsPerBeat;
      const topY = bottomY - noteHeight;

      const { x, width } = getNoteX(fn.note, w);
      const padding = 2;

      // Check if note is at hit zone
      const isAtHitZone = beatProgress >= 0 && beatProgress <= fn.duration;

      // Check if user is pressing this note
      const isPressed = activeKeysRef.current.has(fn.note) || correctKeysRef.current.has(fn.note);

      if (isAtHitZone && isPressed && !fn.isHit) {
        fn.isHit = true;
        fn.hitY = bottomY;
        fn.particles = spawnParticles(x + width / 2, hitLineY, fn.color);
      }

      // Remove notes that have passed
      if (bottomY > h + 20 || topY > h + 20) {
        toRemove.push(fn.id);
        return;
      }

      // Draw note
      const alpha = fn.isHit ? Math.max(0, 1 - (beatProgress - 0) / fn.duration) : 0.9;
      if (alpha <= 0) {
        toRemove.push(fn.id);
        return;
      }

      const color = fn.color;
      const radius = 5;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Glow effect
      const glowIntensity = isAtHitZone ? 20 : 8;
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = color;

      // Fill note
      const grad = ctx.createLinearGradient(x, topY, x, bottomY);
      grad.addColorStop(0, color + 'CC');
      grad.addColorStop(1, color + '66');
      ctx.fillStyle = grad;

      // Rounded rect
      ctx.beginPath();
      ctx.moveTo(x + padding + radius, topY + padding);
      ctx.lineTo(x + width - padding - radius, topY + padding);
      ctx.arcTo(x + width - padding, topY + padding, x + width - padding, topY + padding + radius, radius);
      ctx.lineTo(x + width - padding, bottomY - padding - radius);
      ctx.arcTo(x + width - padding, bottomY - padding, x + width - padding - radius, bottomY - padding, radius);
      ctx.lineTo(x + padding + radius, bottomY - padding);
      ctx.arcTo(x + padding, bottomY - padding, x + padding, bottomY - padding - radius, radius);
      ctx.lineTo(x + padding, topY + padding + radius);
      ctx.arcTo(x + padding, topY + padding, x + padding + radius, topY + padding, radius);
      ctx.closePath();
      ctx.fill();

      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = alpha * 0.8;
      ctx.stroke();

      ctx.restore();

      // Draw particles
      fn.particles = fn.particles.filter((p) => p.life > 0);
      fn.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.05;

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      void noteBottomBeat;
    });

    // Clean up removed notes
    fallingNotesRef.current = fallingNotesRef.current.filter(
      (fn) => !toRemove.includes(fn.id)
    );

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={containerWidth}
      height={containerHeight}
      className="falling-notes-canvas"
    />
  );
};
