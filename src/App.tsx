import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { TopBar } from './components/TopBar';
import { SongLibrary } from './components/SongLibrary';
import { PracticeView } from './components/PracticeView';
import { Settings } from './components/Settings';
import { SongEditor } from './components/SongEditor';

export default function App() {
  const currentView = useStore((s) => s.currentView);
  const theme = useStore((s) => s.settings.theme);

  // Apply theme class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={`app-root ${theme}`}>
      {/* Mobile warning */}
      <div className="mobile-warning">
        <div className="mobile-warning-content">
          <span className="mobile-warning-icon">🎹</span>
          <h2>KeyFlow works best on desktop</h2>
          <p>For the full experience with keyboard input and the falling notes view, please open on a desktop or tablet.</p>
        </div>
      </div>

      <div className="app-shell">
        <TopBar />

        <main className="app-main">
          {currentView === 'library' ? <SongLibrary /> : <PracticeView />}
        </main>
      </div>

      <Settings />
      <SongEditor />
    </div>
  );
}
