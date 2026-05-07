import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Cpu } from 'lucide-react';

const LoadingScreen: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Analyzing text animation
      const tl = gsap.timeline({
        onComplete: onFinished
      });

      tl.fromTo('.loading-content', 
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 1, ease: 'power4.out' }
      )
      .to('.progress-inner', { width: '100%', duration: 3.5, ease: 'power2.inOut' }, '-=0.2')
      .to('.loading-screen', { opacity: 0, duration: 0.8, ease: 'power2.in' }, '+=0.2');

      // Particle floaters
      gsap.to('.particle', {
        y: -200,
        x: 'random(-100, 100)',
        opacity: 0,
        duration: 'random(3, 5)',
        repeat: -1,
        stagger: 0.1,
        ease: 'none'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [onFinished]);

  return (
    <div ref={containerRef} className="loading-screen">
       {[...Array(20)].map((_, i) => (
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

      <div className="loading-content">
        <div className="loading-icon-shell">
          <Cpu className="cpu-icon" size={48} />
        </div>
        <h2 className="loading-title">Sintonizzando <br /> il tuo lifestyle</h2>
        <div className="progress-outer">
          <div className="progress-inner"></div>
        </div>
        <p className="loading-sub">Analizziamo 24 parametri di compatibilità</p>
      </div>

      <style>{`
        .loading-screen {
          position: fixed;
          inset: 0;
          background: #05070a;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          overflow: hidden;
        }

        .loading-content {
          text-align: center;
          z-index: 2;
          width: 100%;
          max-width: 440px;
          padding: 0 40px;
        }

        .loading-icon-shell {
          margin-bottom: 40px;
          color: var(--primary-blue);
          filter: drop-shadow(0 0 20px var(--primary-blue));
          animation: pulse 2.5s infinite ease-in-out;
          display: flex;
          justify-content: center;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
          50% { transform: scale(1.1) rotate(10deg); opacity: 1; }
        }

        .loading-title {
          font-size: 2.2rem;
          line-height: 1.2;
          margin-bottom: 32px;
          font-family: var(--font-heading);
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .progress-outer {
          height: 2px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 100px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .progress-inner {
          height: 100%;
          width: 0%;
          background: linear-gradient(to right, var(--primary-blue), var(--primary-red));
          box-shadow: 0 0 20px var(--primary-blue);
        }

        .loading-sub {
          color: var(--text-muted);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-weight: 600;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          opacity: 0.3;
          filter: blur(1px);
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
