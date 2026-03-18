import React from 'react';
import { Settings, Library, ChevronLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ModeSelector } from './ModeSelector';
import { MidiIndicator } from './MidiIndicator';

export const TopBar: React.FC = () => {
  const currentView = useStore((s) => s.currentView);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const setShowSettings = useStore((s) => s.setShowSettings);
  const selectedSong = useStore((s) => s.selectedSong);

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        {currentView === 'practice' ? (
          <button
            className="icon-btn"
            onClick={() => setCurrentView('library')}
            title="Back to library"
          >
            <ChevronLeft size={18} />
          </button>
        ) : (
          <div className="app-logo">
            <span className="logo-key">K</span>
            <span className="logo-text">eyFlow</span>
          </div>
        )}

        {currentView === 'practice' && selectedSong && (
          <div className="song-info">
            <span className="song-title">{selectedSong.title}</span>
            {selectedSong.artist && (
              <span className="song-artist">{selectedSong.artist}</span>
            )}
          </div>
        )}
      </div>

      <div className="top-bar-center">
        {currentView === 'practice' && <ModeSelector />}
      </div>

      <div className="top-bar-right">
        <MidiIndicator />
        {currentView === 'library' && (
          <button
            className="icon-btn"
            onClick={() => setCurrentView('practice')}
            title="Open practice"
            style={{ display: selectedSong ? 'flex' : 'none' }}
          >
            <Library size={18} />
          </button>
        )}
        <button
          className="icon-btn"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
