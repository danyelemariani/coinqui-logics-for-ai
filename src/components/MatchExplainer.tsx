import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Sparkles, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import type { LogicalMatchResult } from '../logic/LogicEngine';

interface MatchExplainerProps {
  result: LogicalMatchResult;
  recipientName: string;
}

const MatchExplainer: React.FC<MatchExplainerProps> = ({ result, recipientName }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.xai-card', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      });
      gsap.from('.quality-pill', {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        delay: 0.5,
        ease: 'back.out(2)'
      });
    }, containerRef);
    return () => ctx.revert();
  }, [result]);

  return (
    <div ref={containerRef} className="match-explainer-container">
      <div className="xai-header">
        <Sparkles size={18} className="xai-glow" />
        <h4>Giudizio Logico (Manganini & Primiero, 2023b)</h4>
      </div>
      
      <div className="quality-badges">
        <div className="quality-pill completeness" title="ξ: Grado di confidenza informazionale (Floridi, 2006a)">
          <span>Confidenza (ξ): {result.confidence.toFixed(2)}</span>
        </div>
        <div className="quality-pill consistency" title="C: Metrica di distanza dal benchmark correttivo (Manganini & Primiero, 2023b)">
          <span>Dist. Correzione (C): {result.correctionDistance.toFixed(2)}</span>
        </div>
      </div>

      {result.compliance.aiActCertified && (
        <div className="compliance-badge" title={`Data Audit: ${result.compliance.lastAudit}`}>
          <ShieldCheck size={14} />
          <span>EU AI ACT CERTIFIED (ART. 13)</span>
        </div>
      )}

      <p className="xai-desc">
        Inference relation ( |∼ ) basata sui predicati informazionali di {recipientName}.
      </p>

      <div className="logical-reasons">
        {result.reasons.map((r, i) => (
          <div key={i} className={`reason-card ${r.impact} ${!r.satisfied ? 'not-satisfied' : ''}`}>
            <div className="reason-header">
              {r.satisfied ? <ShieldCheck size={14} /> : (r.impact === 'critical' ? <AlertCircle size={14} /> : <Info size={14} />)}
              <span className="predicate-code">{r.predicate}</span>
            </div>
            <p className="reason-desc">{r.description}</p>
          </div>
        ))}
      </div>

      <style>{`
        .match-explainer-container { margin-top: 8px; display: flex; flex-direction: column; gap: 16px; }
        .xai-header { display: flex; align-items: center; gap: 10px; }
        .xai-header h4 { font-size: 11px; letter-spacing: 0.15em; font-weight: 800; text-transform: uppercase; color: var(--primary-blue); margin-bottom: 0; }
        .xai-glow { color: var(--primary-blue); filter: drop-shadow(0 0 8px var(--primary-blue)); }
        .xai-desc { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.5; margin: 0; }
        
        .quality-badges { display: flex; gap: 8px; }
        .quality-pill { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .quality-pill.completeness { background: rgba(0, 240, 255, 0.1); color: var(--primary-blue); border: 1px solid rgba(0, 240, 255, 0.2); }
        .quality-pill.consistency { background: rgba(168, 85, 247, 0.1); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.2); }

        .compliance-badge { display: flex; align-items: center; gap: 6px; background: rgba(74, 222, 128, 0.1); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.2); align-self: flex-start; padding: 4px 10px; border-radius: 6px; font-size: 9px; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 8px; }

        .logical-reasons { display: flex; flex-direction: column; gap: 10px; }
        .reason-card { padding: 12px 16px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
        .reason-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .predicate-code { font-family: 'Fira Code', monospace; font-size: 10px; color: rgba(255,255,255,0.6); }
        .reason-desc { font-size: 12px; color: rgba(255,255,255,0.8); margin: 0; }

        .reason-card.positive { border-left: 3px solid #4ade80; }
        .reason-card.negative { border-left: 3px solid #fbbf24; }
        .reason-card.critical.not-satisfied { border-left: 3px solid #f87171; background: rgba(248, 113, 113, 0.05); }
        
        .reason-card.not-satisfied .predicate-code { color: #f87171; }
      `}</style>
    </div>
  );
};

export default MatchExplainer;
