import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MessageCircle, Sparkles, BarChart3 } from 'lucide-react';

interface MatchMomentProps {
  mode: 'CERCO' | 'OFFRO';
  matchedItem: any;
  onClose: () => void;
  onOpenChat: () => void;
  onOpenDashboard?: () => void;
}

const MatchMoment: React.FC<MatchMomentProps> = ({ mode, matchedItem, onClose, onOpenChat, onOpenDashboard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const recipient = mode === 'CERCO' ? matchedItem.owner : matchedItem;
  const userThumb = "/generic-avatar.png";

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8 });
      
      gsap.from('.match-title', {
        scale: 0.8,
        opacity: 0,
        duration: 1.2,
        ease: 'elastic.out(1, 0.5)',
        delay: 0.2
      });

      gsap.from('.match-card', {
        y: 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: 'power4.out',
        delay: 0.5
      });

      // Ping animation for the connection line
      gsap.to('.sparkle-icon-mini', {
        scale: 1.5,
        repeat: -1,
        yoyo: true,
        duration: 0.8,
        ease: 'sine.inOut'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="match-moment-overlay">
      <div className="aura-pulse"></div>
      
      {[...Array(30)].map((_, i) => (
        <div 
          key={i} 
          className="particle" 
          style={{ 
            left: `${Math.random() * 100}%`, 
            top: `${Math.random() * 100 + 100}%`,
            background: i % 2 === 0 ? 'var(--primary-blue)' : 'var(--primary-red)'
          }} 
        />
      ))}

      <div className="match-content">
        <div className="match-icon-shell">
          <Sparkles size={48} className="sparkle-icon" />
        </div>
        
        <h1 className="match-title">MATCH!</h1>
        <p className="match-subtitle">Alta compatibilità con {recipient.name}. Inizia la conversazione.</p>

        <div className="match-cards-container">
          <div className="match-avatar-card match-card">
            <div className="avatar" style={{ backgroundImage: `url(${userThumb})` }}></div>
            <span className="name-label">Tu</span>
          </div>
          <div className="match-connection-line match-card">
            <Sparkles size={24} className="sparkle-icon-mini" />
          </div>
          <div className="match-avatar-card match-card">
            <div className="avatar" style={{ backgroundImage: `url(${recipient.image})` }}></div>
            <span className="name-label">{recipient.name}</span>
          </div>
        </div>

        <div className="match-actions">
          <button className="btn-chat" onClick={onOpenChat}>
            <MessageCircle size={22} />
            Inizia la Conversazione
          </button>
          {onOpenDashboard && (
            <button className="btn-analysis" onClick={onOpenDashboard}>
              <BarChart3 size={16} />
              Vedi Analisi
            </button>
          )}
          <button className="btn-skip" onClick={onClose}>
            Continua l'esplorazione
          </button>
        </div>
      </div>

      <style>{`
        .match-moment-overlay {
          position: fixed;
          inset: 0;
          z-index: 2500;
          background: radial-gradient(circle at center, #0f172a 0%, #05070a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .aura-pulse {
          position: absolute;
          width: 400px;
          height: 400px;
          background: var(--primary-blue);
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
          animation: aura-anim 4s infinite ease-in-out;
        }

        @keyframes aura-anim {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.3); opacity: 0.2; }
        }

        .match-content { text-align: center; position: relative; z-index: 10; width: 100%; max-width: 600px; }

        .match-icon-shell { color: var(--primary-blue); margin-bottom: 24px; filter: drop-shadow(0 0 20px var(--primary-blue)); }

        .match-title {
          font-size: 3.5rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          background: linear-gradient(to right, #fff, var(--primary-blue));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
        }

        .match-subtitle { color: var(--text-muted); font-size: 1.1rem; margin-bottom: 64px; letter-spacing: 0.05em; }

        .match-cards-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          margin-bottom: 80px;
        }

        .avatar {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          border: 4px solid var(--primary-blue);
          box-shadow: 0 0 40px rgba(0, 240, 255, 0.3);
          position: relative;
        }

        .name-label { display: block; margin-top: 16px; font-weight: 700; font-family: var(--font-heading); text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; color: var(--text-muted); }

        .sparkle-icon-mini { color: var(--primary-blue); filter: drop-shadow(0 0 10px var(--primary-blue)); }

        .btn-chat {
          background: #fff;
          color: #000;
          padding: 20px 48px;
          border-radius: 100px;
          font-weight: 800;
          font-family: var(--font-heading);
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: 0.4s;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          margin: 0 auto;
        }

        .btn-chat:hover { transform: translateY(-4px) scale(1.02); background: var(--primary-blue); color: #000; box-shadow: 0 20px 50px rgba(0, 240, 255, 0.4); }

        .btn-analysis { margin-top: 16px; display: flex; align-items: center; gap: 8px; background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.25); color: var(--primary-blue); padding: 12px 28px; border-radius: 100px; font-weight: 700; font-size: 13px; letter-spacing: 0.05em; transition: 0.3s; cursor: pointer; }
        .btn-analysis:hover { background: rgba(0,240,255,0.15); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,240,255,0.15); }
        .btn-skip { margin-top: 16px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.2em; opacity: 0.6; transition: 0.3s; }
        .btn-skip:hover { opacity: 1; color: white; }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          opacity: 0.15;
          animation: particle-rise 4s infinite linear;
        }

        @keyframes particle-rise {
          to { transform: translateY(-300px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default MatchMoment;
