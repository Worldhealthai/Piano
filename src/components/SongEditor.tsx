import React, { useState, useEffect } from 'react';
import { X, Plus, HelpCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { createSong } from '../utils/songParser';
import { parseSongNotation } from '../utils/songParser';

export const SongEditor: React.FC = () => {
  const showSongEditor = useStore((s) => s.showSongEditor);
  const editingSong = useStore((s) => s.editingSong);
  const setShowSongEditor = useStore((s) => s.setShowSongEditor);
  const addSong = useStore((s) => s.addSong);
  const updateSong = useStore((s) => s.updateSong);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [notation, setNotation] = useState('');
  const [bpm, setBpm] = useState('120');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (editingSong) {
      setTitle(editingSong.title);
      setArtist(editingSong.artist ?? '');
      setNotation(editingSong.rawNotation);
      setBpm(String(editingSong.bpm));
    } else {
      setTitle('');
      setArtist('');
      setNotation('');
      setBpm('120');
    }
    setError('');
  }, [editingSong, showSongEditor]);

  if (!showSongEditor) return null;

  const handleSave = () => {
    if (!title.trim()) {
      setError('Song title is required.');
      return;
    }
    if (!notation.trim()) {
      setError('Note sequence is required.');
      return;
    }

    const notes = parseSongNotation(notation);
    if (notes.length === 0) {
      setError('Could not parse any valid notes. Check your notation format.');
      return;
    }

    const bpmNum = parseInt(bpm, 10);
    if (isNaN(bpmNum) || bpmNum < 20 || bpmNum > 300) {
      setError('BPM must be between 20 and 300.');
      return;
    }

    if (editingSong) {
      updateSong(createSong({
        ...editingSong,
        title: title.trim(),
        artist: artist.trim() || undefined,
        rawNotation: notation.trim(),
        bpm: bpmNum,
      }));
    } else {
      addSong(createSong({
        title: title.trim(),
        artist: artist.trim() || undefined,
        rawNotation: notation.trim(),
        bpm: bpmNum,
      }));
    }
    setShowSongEditor(false);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={() => setShowSongEditor(false)}>
      <div
        className="editor-panel animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <h2 className="panel-title">
            <Plus size={16} /> {editingSong ? 'Edit Song' : 'Add New Song'}
          </h2>
          <button className="icon-btn" onClick={() => setShowSongEditor(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="editor-fields">
          <div className="field">
            <label className="field-label">Song Title *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Favorite Song"
            />
          </div>

          <div className="field">
            <label className="field-label">Artist (optional)</label>
            <input
              className="input"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. Mozart"
            />
          </div>

          <div className="field">
            <label className="field-label">BPM</label>
            <input
              className="input input--sm"
              type="number"
              min={20}
              max={300}
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="field-label-row">
              <label className="field-label">Note Sequence *</label>
              <button
                className="help-btn"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle size={14} /> Format help
              </button>
            </div>

            {showHelp && (
              <div className="help-box">
                <p className="help-title">Notation Format</p>
                <div className="help-examples">
                  <div className="help-example">
                    <span className="help-example-code">C4 D4 E4 F4</span>
                    <span className="help-example-desc">Simple (1 beat each)</span>
                  </div>
                  <div className="help-example">
                    <span className="help-example-code">C4:1 D4:0.5 E4:0.5</span>
                    <span className="help-example-desc">With durations in beats</span>
                  </div>
                  <div className="help-example">
                    <span className="help-example-code">[C4,E4,G4]:1</span>
                    <span className="help-example-desc">Chord (C major)</span>
                  </div>
                </div>
                <p className="help-notes">Notes: C D E F G A B + # for sharps. Octaves 2–7 (e.g. C4 = middle C)</p>
              </div>
            )}

            <textarea
              className="textarea"
              value={notation}
              onChange={(e) => setNotation(e.target.value)}
              placeholder="C4:1 D4:1 E4:0.5 F4:0.5 G4:2 ..."
              rows={5}
            />
            {notation && (
              <p className="field-hint">
                {parseSongNotation(notation).length} notes parsed
              </p>
            )}
          </div>

          {error && <p className="field-error">{error}</p>}
        </div>

        <div className="editor-actions">
          <button className="btn-ghost" onClick={() => setShowSongEditor(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            {editingSong ? 'Save Changes' : 'Add Song'}
          </button>
        </div>
      </div>
    </div>
  );
};
