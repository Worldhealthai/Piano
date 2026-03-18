import React from 'react';
import { useStore } from '../store/useStore';

export const MidiIndicator: React.FC = () => {
  const midiConnected = useStore((s) => s.midiConnected);
  const midiDevices = useStore((s) => s.midiDevices);

  if (!navigator.requestMIDIAccess) return null;

  return (
    <div className={`midi-indicator ${midiConnected ? 'midi-indicator--connected' : 'midi-indicator--disconnected'}`}>
      <span className={`midi-dot ${midiConnected ? 'midi-dot--on' : 'midi-dot--off'}`} />
      <span className="midi-label">
        {midiConnected
          ? `MIDI: ${midiDevices[0]?.name ?? 'Connected'}`
          : 'No MIDI'}
      </span>
    </div>
  );
};
