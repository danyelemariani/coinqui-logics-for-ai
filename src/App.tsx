import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

import Hero from './components/Hero';
import Quiz from './components/Quiz';
import DiscoveryFeed from './components/DiscoveryFeed';
import MatchMoment from './components/MatchMoment';
import LoadingScreen from './components/LoadingScreen';
import ChatUI from './components/ChatUI';
import BiasDashboard from './components/BiasDashboard';
import './index.css';

type UserMode = 'CERCO' | 'OFFRO';
type AppState = 'HERO' | 'QUIZ' | 'CALCULATING' | 'DISCOVERY';

function App() {
  const [state, setState] = useState<AppState>('HERO');
  const [mode, setMode] = useState<UserMode>('CERCO');
  const [showMatch, setShowMatch] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [matchedItem, setMatchedItem] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);

  // Smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const handleStart = (selectedMode: UserMode) => { setMode(selectedMode); setState('QUIZ'); };
  const completeQuiz = (data: any) => { setQuizData(data); setState('CALCULATING'); };
  const finishLoading = () => setState('DISCOVERY');
  const goBack = () => setState('HERO');

  const triggerMatch = (item: any) => { setMatchedItem(item); setShowMatch(true); };

  const handleOpenChat = () => { setShowMatch(false); setShowChat(true); };
  const handleOpenDashboard = () => { setShowMatch(false); setShowDashboard(true); };
  const handleCloseDashboard = () => setShowDashboard(false);

  return (
    <div className="app-main">
      {state === 'HERO' && <Hero onStart={handleStart} />}

      {state === 'QUIZ' && (
        <Quiz mode={mode} onComplete={completeQuiz} onBack={goBack} />
      )}

      {state === 'CALCULATING' && (
        <LoadingScreen onFinished={finishLoading} />
      )}

      {state === 'DISCOVERY' && (
        <DiscoveryFeed
          mode={mode}
          onMatch={triggerMatch}
          quizData={quizData}
          onBack={goBack}
        />
      )}

      {showMatch && (
        <MatchMoment
          matchedItem={matchedItem}
          mode={mode}
          onClose={() => setShowMatch(false)}
          onOpenChat={handleOpenChat}
          onOpenDashboard={handleOpenDashboard}
        />
      )}

      {showChat && (
        <ChatUI
          recipient={matchedItem}
          mode={mode}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* BRIO Dashboard - shown as a full-screen overlay after a match */}
      {showDashboard && (
        <div className="dashboard-fullscreen" data-lenis-prevent>
          <div className="dashboard-fullscreen-inner">
            <div className="dashboard-topbar">
              <div className="dashboard-topbar-title">
                <span className="dashboard-breadcrumb">Match →</span>
                <span>Analisi</span>
              </div>
              <button className="dashboard-close-btn" onClick={handleCloseDashboard}>
                ✕ Chiudi
              </button>
            </div>
            <BiasDashboard onClose={handleCloseDashboard} />
          </div>
        </div>
      )}

      <style>{`
        .app-main {
          min-height: 100vh;
          width: 100%;
          background: var(--bg);
          color: white;
          overflow-x: hidden;
        }

        .dashboard-fullscreen {
          position: fixed;
          inset: 0;
          z-index: 3000;
          background: #05070a;
          overflow-y: auto;
        }

        .dashboard-fullscreen-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        .dashboard-topbar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(5, 7, 10, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
          margin-bottom: 8px;
        }

        .dashboard-topbar-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 16px;
        }

        .dashboard-breadcrumb {
          color: rgba(255,255,255,0.3);
          font-size: 13px;
          font-weight: 500;
        }

        .dashboard-close-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          padding: 8px 20px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
        }

        .dashboard-close-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
      `}</style>
    </div>
  );
}

export default App;
