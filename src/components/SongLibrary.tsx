import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Play, Music, Star } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Song } from '../types';

export const SongLibrary: React.FC = () => {
  const songs = useStore((s) => s.songs);
  const selectedSong = useStore((s) => s.selectedSong);
  const selectSong = useStore((s) => s.selectSong);
  const deleteSong = useStore((s) => s.deleteSong);
  const setShowSongEditor = useStore((s) => s.setShowSongEditor);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const [filter, setFilter] = useState<'all' | 'preset' | 'custom'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = songs.filter((s) => {
    if (filter === 'preset') return s.isPreset;
    if (filter === 'custom') return !s.isPreset;
    return true;
  });

  const handlePlay = (song: Song) => {
    selectSong(song);
    setCurrentView('practice');
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteSong(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="library-container animate-fade-in">
      <div className="library-header">
        <div>
          <h1 className="library-title">Song Library</h1>
          <p className="library-subtitle">{songs.length} songs · Select one to start learning</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowSongEditor(true)}
        >
          <Plus size={16} /> Add Song
        </button>
      </div>

      <div className="library-filters">
        {(['all', 'preset', 'custom'] as const).map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? 'chip--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Songs' : f === 'preset' ? 'Built-in' : 'My Songs'}
          </button>
        ))}
      </div>

      <div className="song-grid">
        {filtered.map((song) => {
          const isSelected = selectedSong?.id === song.id;
          return (
            <div
              key={song.id}
              className={`song-card ${isSelected ? 'song-card--selected' : ''}`}
              onClick={() => selectSong(song)}
            >
              <div className="song-card-icon">
                {song.isPreset ? (
                  <Star size={16} className="text-accent-cyan" />
                ) : (
                  <Music size={16} className="text-accent-violet" />
                )}
              </div>
              <div className="song-card-info">
                <h3 className="song-card-title">{song.title}</h3>
                {song.artist && (
                  <p className="song-card-artist">{song.artist}</p>
                )}
                <p className="song-card-meta">
                  {song.notes.length} notes · {song.bpm} BPM
                </p>
              </div>
              <div className="song-card-actions">
                <button
                  className="song-action-btn song-action-btn--play"
                  onClick={(e) => { e.stopPropagation(); handlePlay(song); }}
                  title="Practice this song"
                >
                  <Play size={14} />
                </button>
                {!song.isPreset && (
                  <>
                    <button
                      className="song-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSongEditor(true, song);
                      }}
                      title="Edit song"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className={`song-action-btn song-action-btn--delete ${deleteConfirm === song.id ? 'song-action-btn--confirm' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleDelete(song.id); }}
                      title={deleteConfirm === song.id ? 'Click again to confirm' : 'Delete song'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <Music size={40} className="empty-state-icon" />
          <p className="empty-state-text">No songs here yet.</p>
          <button className="btn-primary" onClick={() => setShowSongEditor(true)}>
            <Plus size={16} /> Add Your First Song
          </button>
        </div>
      )}
    </div>
  );
};
