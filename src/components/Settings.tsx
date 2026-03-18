import React from 'react';
import { X, Volume2, Keyboard, Monitor } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Settings: React.FC = () => {
  const showSettings = useStore((s) => s.showSettings);
  const setShowSettings = useStore((s) => s.setShowSettings);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const midiDevices = useStore((s) => s.midiDevices);

  if (!showSettings) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={() => setShowSettings(false)}>
      <div
        className="settings-panel animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <h2 className="panel-title">Settings</h2>
          <button className="icon-btn" onClick={() => setShowSettings(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="settings-sections">
          {/* Audio */}
          <section className="settings-section">
            <h3 className="settings-section-title">
              <Volume2 size={14} /> Audio
            </h3>
            <div className="setting-row">
              <label className="setting-label">Volume</label>
              <div className="setting-control">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.volume}
                  onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                  className="slider"
                />
                <span className="setting-value font-mono">{Math.round(settings.volume * 100)}%</span>
              </div>
            </div>
          </section>

          {/* Keyboard */}
          <section className="settings-section">
            <h3 className="settings-section-title">
              <Keyboard size={14} /> Keyboard
            </h3>
            <div className="setting-row">
              <label className="setting-label">Octave Shift</label>
              <div className="setting-control setting-control--buttons">
                <button
                  className="icon-btn"
                  onClick={() => updateSettings({ octaveShift: Math.max(-2, settings.octaveShift - 1) })}
                >
                  −
                </button>
                <span className="setting-value font-mono">{settings.octaveShift > 0 ? `+${settings.octaveShift}` : settings.octaveShift}</span>
                <button
                  className="icon-btn"
                  onClick={() => updateSettings({ octaveShift: Math.min(2, settings.octaveShift + 1) })}
                >
                  +
                </button>
              </div>
            </div>
            <div className="setting-row">
              <label className="setting-label">Key Labels</label>
              <div className="setting-control setting-control--row">
                <button
                  className={`chip ${settings.showKeyLabels ? 'chip--active' : ''}`}
                  onClick={() => updateSettings({ showKeyLabels: true })}
                >
                  Show
                </button>
                <button
                  className={`chip ${!settings.showKeyLabels ? 'chip--active' : ''}`}
                  onClick={() => updateSettings({ showKeyLabels: false })}
                >
                  Hide
                </button>
              </div>
            </div>
            <div className="setting-row">
              <label className="setting-label">Label Type</label>
              <div className="setting-control setting-control--row">
                <button
                  className={`chip ${settings.labelType === 'key' ? 'chip--active' : ''}`}
                  onClick={() => updateSettings({ labelType: 'key' })}
                >
                  Keys (Z, X, C...)
                </button>
                <button
                  className={`chip ${settings.labelType === 'note' ? 'chip--active' : ''}`}
                  onClick={() => updateSettings({ labelType: 'note' })}
                >
                  Notes (C4, D4...)
                </button>
              </div>
            </div>
          </section>

          {/* MIDI */}
          <section className="settings-section">
            <h3 className="settings-section-title">
              <Monitor size={14} /> MIDI
            </h3>
            {midiDevices.length === 0 ? (
              <p className="setting-help">No MIDI devices detected. Connect a USB MIDI keyboard and refresh.</p>
            ) : (
              <div className="setting-row">
                <label className="setting-label">MIDI Device</label>
                <select
                  className="select"
                  value={settings.selectedMidiDeviceId ?? ''}
                  onChange={(e) =>
                    updateSettings({ selectedMidiDeviceId: e.target.value || null })
                  }
                >
                  <option value="">All devices</option>
                  {midiDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Theme */}
          <section className="settings-section">
            <h3 className="settings-section-title">Display</h3>
            <div className="setting-row">
              <label className="setting-label">Theme</label>
              <div className="setting-control setting-control--row">
                <button
                  className={`chip ${settings.theme === 'dark' ? 'chip--active' : ''}`}
                  onClick={() => updateSettings({ theme: 'dark' })}
                >
                  Dark
                </button>
                <button
                  className={`chip ${settings.theme === 'light' ? 'chip--active' : ''}`}
                  onClick={() => updateSettings({ theme: 'light' })}
                >
                  Light
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
