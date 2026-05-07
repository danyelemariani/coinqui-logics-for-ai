import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ChevronRight } from 'lucide-react';

const Hero: React.FC<{ onStart: (mode: 'CERCO' | 'OFFRO') => void }> = ({ onStart }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(bgRef.current, 
        { scale: 1.1, filter: 'blur(10px) brightness(0.5)' },
        { scale: 1, filter: 'blur(0px) brightness(0.7)', duration: 2.5, ease: 'power2.out' }
      );
      gsap.fromTo('.reveal', 
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: 'power4.out', delay: 0.5 }
      );
      gsap.to('.floater', {
        y: -15, x: 10, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut',
        stagger: { each: 0.5, from: 'random' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="hero-section">
      <div ref={bgRef} className="hero-bg" style={{ backgroundImage: 'url("/room-industrial.png")' }} />
      <div className="hero-overlay" />
      
      <div className="hero-top-nav reveal">
        <img src="/coinqui-logo.png" alt="Coinqui Logo" className="top-logo" />
        <span className="top-brand">Coinqui</span>
      </div>
      <div className="container hero-container">
        <div className="hero-content">
          {/* Removed redundant badge */}
          
          <h1 className="reveal">
            Trova non solo <br />
            <span className="gradient-text-blue">uno spazio,</span> <br />
            ma <span className="gradient-text-red">l'equilibrio.</span>
          </h1>
          
          <p className="reveal">
            Il matching intelligente che connette persone e spazi <br />
            in base al tuo vero stile di vita.
          </p>

          <div className="hero-actions reveal">
            <button className="btn-choice ceramic-btn" onClick={() => onStart('CERCO')}>
              <div className="btn-content">
                <span className="btn-label">Cerco Casa</span>
                <span className="btn-desc">Trova la tua stanza ideale</span>
              </div>
              <ChevronRight size={20} />
            </button>
            <button className="btn-choice glass-btn" onClick={() => onStart('OFFRO')}>
              <div className="btn-content">
                <span className="btn-label">Offro Casa</span>
                <span className="btn-desc">Trova il coinquilino perfetto</span>
              </div>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="hero-visual reveal">
          <div className="floater card-float glass">
            <div className="user-dot blue"></div>
            <span>Match 98%</span>
          </div>
          <div className="floater card-float glass second">
            <div className="user-dot red"></div>
            <span>Stesso Ritmo</span>
          </div>
        </div>
      </div>

      <style>{`
        .hero-section { position: relative; height: 100vh; width: 100%; display: flex; align-items: center; overflow: hidden; background: #000; }
        .hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 1; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(5,7,10,0.92) 0%, rgba(5,7,10,0.4) 100%); z-index: 2; }
        .hero-top-nav { position: absolute; top: 40px; left: 60px; z-index: 10; display: flex; align-items: center; gap: 20px; }
        .top-logo { width: 64px; height: 64px; border-radius: 16px; box-shadow: 0 15px 40px rgba(0,240,255,0.3); border: 2px solid rgba(255,255,255,0.1); }
        .top-brand { font-size: 2rem; font-weight: 800; letter-spacing: -0.04em; font-family: var(--font-heading); color: #fff; }
        .hero-container { position: relative; z-index: 3; display: grid; grid-template-columns: 1.2fr 1fr; align-items: center; gap: 40px; margin-top: 40px; }
        .hero-content { max-width: 600px; }
        .badge { display: inline-flex; align-items: center; gap: 15px; padding: 12px 28px 12px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 32px; backdrop-filter: blur(4px); font-weight: 800; color: #fff; }
        .badge-logo { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.2); }
        h1 { font-size: clamp(3rem, 6vw, 4.5rem); line-height: 1.1; margin-bottom: 24px; }
        p { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 40px; max-width: 480px; }
        .hero-actions { display: flex; flex-direction: column; gap: 16px; }
        .btn-choice { position: relative; padding: 20px 32px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; text-align: left; transition: var(--transition-smooth); width: 100%; max-width: 400px; }
        .btn-choice .btn-content { display: flex; flex-direction: column; gap: 4px; }
        .btn-label { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.01em; }
        .btn-desc { font-size: 0.9rem; opacity: 0.6; font-weight: 400; }
        .ceramic-btn { background: #fff; color: #000; }
        .glass-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; backdrop-filter: blur(10px); }
        .btn-choice:hover { transform: translateX(10px) scale(1.02); }
        .ceramic-btn:hover { background: var(--primary-blue); color: #fff; box-shadow: 0 20px 40px rgba(0,240,255,0.3); }
        .glass-btn:hover { background: rgba(255,255,255,0.1); border-color: #fff; }
        .hero-visual { position: relative; height: 400px; }
        .card-float { position: absolute; padding: 20px 30px; display: flex; align-items: center; gap: 15px; font-weight: 600; font-family: var(--font-heading); font-size: 1.2rem; white-space: nowrap; }
        .card-float.second { top: 150px; left: 100px; }
        .user-dot { width: 12px; height: 12px; border-radius: 50%; }
        .user-dot.blue { background: var(--primary-blue); box-shadow: 0 0 15px var(--primary-blue); }
        .user-dot.red { background: var(--primary-red); box-shadow: 0 0 15px var(--primary-red); }
        @media (max-width: 968px) {
          .hero-container { grid-template-columns: 1fr; text-align: center; }
          .hero-content { margin: 0 auto; }
          .hero-actions { justify-content: center; }
          .hero-visual { display: none; }
          p { margin: 0 auto 40px; }
        }
      `}</style>
    </div>
  );
};

export default Hero;
