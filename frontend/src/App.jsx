import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Upload from './screens/Upload';
import Review from './screens/Review';
import History from './screens/History';
import SymbolLibrary from './screens/SymbolLibrary';
import Benchmark from './screens/Benchmark';
import Settings from './screens/Settings';
import { api } from './api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('electroscan_user');
    return saved ? JSON.parse(saved) : {
      username: 'parth',
      name: 'Parth Kala',
      email: 'parth@electroscan.ai',
      role: 'Lead Estimator'
    };
  });

  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectCount, setProjectCount] = useState(1);
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    refreshProjectCounts();
  }, [currentScreen]);

  const refreshProjectCounts = async () => {
    try {
      const stats = await api.getStats();
      setProjectCount(stats.total_drawings || 1);
      setPendingReviews(stats.pending_reviews || 0);

      // Auto-assign sample project if none selected
      if (!activeProjectId) {
        const projs = await api.getProjects();
        if (projs.length > 0) {
          setActiveProjectId(projs[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('electroscan_token');
    localStorage.removeItem('electroscan_user');
    setUser(null);
  };

  const handleOpenProject = (projId) => {
    setActiveProjectId(projId);
    setCurrentScreen('review');
  };

  const handleTakeoffReady = (projId) => {
    setActiveProjectId(projId);
    setCurrentScreen('review');
    refreshProjectCounts();
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        projectCount={projectCount}
        pendingReviews={pendingReviews}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar user={user} onLogout={handleLogout} />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {currentScreen === 'dashboard' && (
            <Dashboard
              user={user}
              onNavigate={setCurrentScreen}
              onOpenProject={handleOpenProject}
            />
          )}

          {currentScreen === 'upload' && (
            <Upload onTakeoffReady={handleTakeoffReady} />
          )}

          {currentScreen === 'review' && (
            <Review projectId={activeProjectId} user={user} />
          )}

          {currentScreen === 'history' && (
            <History
              onOpenProject={handleOpenProject}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'symbols' && <SymbolLibrary />}

          {currentScreen === 'benchmark' && (
            <Benchmark activeProjectId={activeProjectId} />
          )}

          {currentScreen === 'settings' && <Settings user={user} />}
        </main>
      </div>
    </div>
  );
}
