import React from 'react';
import { Gauge } from 'lucide-react';
import { useStore } from '../store/useStore';

export const TempoControl: React.FC = () => {
  const tempoMultiplier = useStore((s) => s.playback.tempoMultiplier);
  const setTempoMultiplier = useStore((s) => s.setTempoMultiplier);
  const bpm = useStore((s) => s.selectedSong?.bpm ?? 120);
  const isPlaying = useStore((s) => s.playback.isPlaying);

  const effectiveBpm = Math.round(bpm * tempoMultiplier);

  return (
    <div className="tempo-control">
      <div className="tempo-header">
        <Gauge size={14} />
        <span>Tempo</span>
        <span className="tempo-value font-mono">{effectiveBpm} BPM</span>
        <span className="tempo-pct">({Math.round(tempoMultiplier * 100)}%)</span>
      </div>
      <input
        type="range"
        min={0.5}
        max={1.5}
        step={0.05}
        value={tempoMultiplier}
        onChange={(e) => !isPlaying && setTempoMultiplier(parseFloat(e.target.value))}
        disabled={isPlaying}
        className="slider"
      />
      <div className="tempo-labels">
        <span>50%</span>
        <span>100%</span>
        <span>150%</span>
      </div>
    </div>
  );
};
