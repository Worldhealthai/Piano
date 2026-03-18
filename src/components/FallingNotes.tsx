import React, { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generatePianoKeys, isBlackKey, getNoteColor, getNoteLetter } from '../utils/noteHelpers';
import type { ParsedNote, NoteWithOctave } from '../types';

interface FallingNotesProps {
  containerWidth: number;
  containerHeight: number;
}

interface ActiveFallingNote {
  id: string;
  note: NoteWithOctave;
  label: string;       // note letter, e.g. "C♯"
  startBeat: number;
  duration: number;
  color: string;
  isHit: boolean;
  particles: Particle[];
  dissolveAlpha: number; // for hit-dissolve animation
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

const HIT_LINE_RATIO = 0.88;
const BEATS_VISIBLE = 6;

function getNoteX(note: NoteWithOctave, canvasWidth: number): { x: number; width: number } {
  const whiteKeyWidth = canvasWidth / WHITE_KEYS.length;

  if (!isBlackKey(note)) {
    const idx = WHITE_KEYS.indexOf(note);
    return { x: idx * whiteKeyWidth, width: whiteKeyWidth };
  }

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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const FallingNotes: React.FC<FallingNotesProps> = ({ containerWidth, containerHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallingNotesRef = useRef<ActiveFallingNote[]>([]);
  const rafRef = useRef<number>(0);

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

  useEffect(() => {
    if (!playback.isPlaying && !playback.isPaused) {
      fallingNotesRef.current = [];
    }
  }, [playback.isPlaying, playback.isPaused, selectedSong]);

  function spawnParticles(x: number, y: number, color: string, count = 10): Particle[] {
    return Array.from({ length: count }, () => ({
      x: x + (Math.random() - 0.5) * 20,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5 - 2,
      life: 1,
      color,
      size: Math.random() * 5 + 2,
    }));
  }

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

    ctx.clearRect(0, 0, w, h);

    if (!song || (!isPlaying && !isPaused)) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const bpm = (song.bpm ?? 120) * tempoMultiplier;
    const pixelsPerBeat = h / BEATS_VISIBLE;
    const notes: ParsedNote[] = song.notes;

    // ── Spawn new notes ───────────────────────────────────────────
    notes.forEach((note) => {
      if (note.time > currentBeat + BEATS_VISIBLE) return;

      const allNotes = note.chordNotes ?? [note.note];
      allNotes.forEach((n) => {
        const id = `${note.time}-${n}`;
        if (fallingNotesRef.current.some((fn) => fn.id === id)) return;
        fallingNotesRef.current.push({
          id,
          note: n,
          label: getNoteLetter(n),
          startBeat: note.time,
          duration: note.duration,
          color: getNoteColor(n),
          isHit: false,
          particles: [],
          dissolveAlpha: 1,
        });
      });
    });

    void bpm;

    // ── Draw hit line ─────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, hitLineY);
    ctx.lineTo(w, hitLineY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ── Draw key-column dividers (very subtle) ────────────────────
    const whiteKeyWidth = w / WHITE_KEYS.length;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 1; i < WHITE_KEYS.length; i++) {
      ctx.beginPath();
      ctx.moveTo(i * whiteKeyWidth, 0);
      ctx.lineTo(i * whiteKeyWidth, h);
      ctx.stroke();
    }
    ctx.restore();

    // ── Update & draw falling notes ───────────────────────────────
    const toRemove: string[] = [];

    fallingNotesRef.current.forEach((fn) => {
      const beatProgress = currentBeat - fn.startBeat;
      const beatsUntilHit = fn.startBeat - currentBeat; // negative when note has arrived

      const noteHeight = Math.max(fn.duration * pixelsPerBeat, 14);
      // bottomY = position of note's bottom edge
      const bottomY = hitLineY - beatsUntilHit * pixelsPerBeat;
      const topY = bottomY - noteHeight;

      const { x, width } = getNoteX(fn.note, w);
      const pad = isBlackKey(fn.note) ? 1.5 : 2;

      const isAtHitZone = beatProgress >= 0 && beatProgress <= fn.duration;
      const isPressed =
        activeKeysRef.current.has(fn.note) ||
        correctKeysRef.current.has(fn.note);

      // Hit detection
      if (isAtHitZone && isPressed && !fn.isHit) {
        fn.isHit = true;
        fn.particles = spawnParticles(x + width / 2, hitLineY, fn.color);
      }

      // Dissolve after hit
      if (fn.isHit) {
        fn.dissolveAlpha = Math.max(0, fn.dissolveAlpha - 0.06);
        if (fn.dissolveAlpha <= 0 || bottomY > h + 10) {
          toRemove.push(fn.id);
        }
      } else if (bottomY > h + 40) {
        toRemove.push(fn.id);
        return;
      }

      const baseAlpha = fn.isHit ? fn.dissolveAlpha : 0.92;
      if (baseAlpha <= 0) return;

      const color = fn.color;
      const glow = isAtHitZone ? 22 : 6;

      // ── Note bar body ─────────────────────────────────────────
      ctx.save();
      ctx.globalAlpha = baseAlpha;
      ctx.shadowBlur = glow;
      ctx.shadowColor = color;

      // Gradient fill: lighter top → darker bottom
      const grad = ctx.createLinearGradient(x, topY, x, bottomY);
      grad.addColorStop(0, color + 'EE');
      grad.addColorStop(0.5, color + 'AA');
      grad.addColorStop(1, color + '55');
      ctx.fillStyle = grad;
      roundRect(ctx, x + pad, topY + pad, width - pad * 2, noteHeight - pad * 2, 5);
      ctx.fill();

      // Inner highlight (top edge shimmer)
      ctx.shadowBlur = 0;
      const shimmer = ctx.createLinearGradient(x, topY, x, topY + noteHeight * 0.25);
      shimmer.addColorStop(0, 'rgba(255,255,255,0.28)');
      shimmer.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shimmer;
      roundRect(ctx, x + pad, topY + pad, width - pad * 2, noteHeight * 0.25, 5);
      ctx.fill();

      // Border stroke
      ctx.strokeStyle = color + 'CC';
      ctx.lineWidth = 1;
      ctx.globalAlpha = baseAlpha * 0.7;
      roundRect(ctx, x + pad, topY + pad, width - pad * 2, noteHeight - pad * 2, 5);
      ctx.stroke();

      ctx.restore();

      // ── Note label at TOP of bar ──────────────────────────────
      // Show if bar is tall enough
      if (noteHeight > 28 && topY > -30) {
        const fontSize = Math.min(12, Math.max(9, width * 0.45));
        ctx.save();
        ctx.globalAlpha = baseAlpha * 0.95;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px "Space Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.fillText(fn.label, x + width / 2, topY + pad + 3);
        ctx.restore();
      }

      // ── Glow pill label near hit zone ────────────────────────
      // Shown when note is within 1.5 beats of the hit line
      const beatsToHit = fn.startBeat - currentBeat;
      if (beatsToHit <= 1.5 && beatsToHit >= -0.1 && !fn.isHit) {
        const labelY = Math.max(topY - 4, 2); // float just above the bar's top
        const fontSize = Math.min(11, Math.max(9, width * 0.42));
        const pillW = Math.max(width - 4, 22);
        const pillH = 16;
        const pillX = x + (width - pillW) / 2;
        const pillY = labelY - pillH - 2;

        // Pill background
        ctx.save();
        ctx.globalAlpha = Math.min(1, (1.5 - beatsToHit) / 1.2) * 0.9;
        ctx.fillStyle = color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = color;
        roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#07070A';
        ctx.font = `bold ${fontSize}px "Space Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fn.label, x + width / 2, pillY + pillH / 2);
        ctx.restore();
      }

      // ── Duration label (hold indicator) ──────────────────────
      // For notes > 1.5 beats, show a hold label at the bottom of bar
      if (fn.duration >= 1.5 && noteHeight > 50) {
        ctx.save();
        ctx.globalAlpha = baseAlpha * 0.55;
        ctx.fillStyle = '#ffffff';
        ctx.font = `9px "Space Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${fn.duration}b`, x + width / 2, bottomY - pad - 2);
        ctx.restore();
      }

      // ── Particles ─────────────────────────────────────────────
      fn.particles = fn.particles.filter((p) => p.life > 0);
      fn.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= 0.04;

        ctx.save();
        ctx.globalAlpha = p.life * p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });

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
