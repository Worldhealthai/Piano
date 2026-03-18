import React from 'react';
import { Flame, Target } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ScoreDisplay: React.FC = () => {
  const score = useStore((s) => s.score);
  const mode = useStore((s) => s.mode);
  const isPlaying = useStore((s) => s.playback.isPlaying);

  if (mode !== 'play' || !isPlaying) return null;

  return (
    <div className="score-display">
      <div className="score-item">
        <Target size={14} className="score-icon" />
        <span className="score-value">{score.accuracy}%</span>
        <span className="score-label">Accuracy</span>
      </div>
      {score.streak >= 3 && (
        <div className="score-item score-item--streak">
          <Flame size={14} className="score-icon score-icon--fire" />
          <span className="score-value">{score.streak}</span>
          <span className="score-label">Streak</span>
        </div>
      )}
    </div>
  );
};

interface FinalScoreProps {
  onClose: () => void;
}

export const FinalScore: React.FC<FinalScoreProps> = ({ onClose }) => {
  const score = useStore((s) => s.score);

  const grade = score.accuracy >= 95 ? 'S' : score.accuracy >= 85 ? 'A' : score.accuracy >= 70 ? 'B' : score.accuracy >= 55 ? 'C' : 'D';
  const gradeColor = grade === 'S' ? '#00F0FF' : grade === 'A' ? '#4ade80' : grade === 'B' ? '#8B5CF6' : grade === 'C' ? '#fb923c' : '#f87171';

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="final-score-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="final-score-title">Song Complete!</h2>

        <div className="final-grade" style={{ color: gradeColor, textShadow: `0 0 30px ${gradeColor}` }}>
          {grade}
        </div>

        <div className="final-stats">
          <div className="final-stat">
            <span className="final-stat-value">{score.accuracy}%</span>
            <span className="final-stat-label">Accuracy</span>
          </div>
          <div className="final-stat">
            <span className="final-stat-value">{score.hitNotes}</span>
            <span className="final-stat-label">Notes Hit</span>
          </div>
          <div className="final-stat">
            <span className="final-stat-value">{score.maxStreak}</span>
            <span className="final-stat-label">Best Streak</span>
          </div>
          <div className="final-stat">
            <span className="final-stat-value">{score.missedNotes}</span>
            <span className="final-stat-label">Missed</span>
          </div>
        </div>

        <button className="btn-primary" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
};
