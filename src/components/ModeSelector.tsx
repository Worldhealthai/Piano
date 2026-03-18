import React from 'react';
import { Eye, Music, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { PracticeMode } from '../types';

const MODES: { id: PracticeMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'watch', label: 'Watch', icon: <Eye size={14} />, desc: 'Auto-play song' },
  { id: 'practice', label: 'Practice', icon: <Music size={14} />, desc: 'Guided learning' },
  { id: 'play', label: 'Play', icon: <Trophy size={14} />, desc: 'Timed scoring' },
];

export const ModeSelector: React.FC = () => {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const isPlaying = useStore((s) => s.playback.isPlaying);

  return (
    <div className="mode-selector">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => !isPlaying && setMode(m.id)}
          disabled={isPlaying}
          title={m.desc}
          className={`mode-btn ${mode === m.id ? 'mode-btn--active' : ''}`}
        >
          {m.icon}
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
};
