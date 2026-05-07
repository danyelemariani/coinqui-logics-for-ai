import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowLeft, Check, Sliders } from 'lucide-react';

interface QuizProps {
  mode: 'CERCO' | 'OFFRO';
  onComplete: (answers: any) => void;
  onBack: () => void;
}

const Quiz: React.FC<QuizProps> = ({ mode, onComplete, onBack }) => {
  const steps = [
    {
      id: 'role',
      question: mode === 'OFFRO' ? 'Chi vive in casa?' : 'Chi sei?',
      type: 'choice' as const,
      options: [
        { label: 'Studente', value: 'students', icon: '🎓' },
        { label: 'Professionista', value: 'professionals', icon: '💼' },
        { label: 'Mix', value: 'mix', icon: '🔄' }
      ]
    },
    {
      id: 'gender',
      question: 'Cosa preferisci per la convivenza?',
      type: 'choice' as const,
      options: [
        { label: 'Ambiente Misto', value: 'mixed', icon: '⚤' },
        { label: 'Solo Ragazze', value: 'female', icon: '👩' },
        { label: 'Solo Ragazzi', value: 'male', icon: '👨' }
      ]
    },
    {
      id: 'age',
      question: 'In che fascia d\'età rientri?',
      type: 'choice' as const,
      options: [
        { label: '18-24 anni', value: 'gen_z', icon: '⚡' },
        { label: '25-30 anni', value: 'young_pro', icon: '🏙️' },
        { label: '31-40 anni', value: 'adult', icon: '👔' },
        { label: '40+', value: 'senior', icon: '🍷' }
      ]
    },
    {
      id: 'smoke',
      question: 'Cosa ne pensi del fumo?',
      type: 'choice' as const,
      options: [
        { label: 'Non fumatore', value: 'no_smoke', icon: '🚭' },
        { label: 'Fumatore (solo fuori)', value: 'outside', icon: '🍃' },
        { label: 'Fumatore', value: 'smoker', icon: '🚬' }
      ]
    },
    {
      id: 'pets',
      question: 'Hai o accetti animali?',
      type: 'choice' as const,
      options: [
        { label: 'Amo gli animali', value: 'pets_ok', icon: '🐾' },
        { label: 'Preferisco di no', value: 'no_pets', icon: '🙅' },
        { label: 'Solo piccoli (es. gatti)', value: 'small_pets', icon: '🐱' }
      ]
    },
    {
      id: 'sleep',
      question: 'Ritmo della casa?',
      type: 'choice' as const,
      options: [
        { label: 'Mattiniero', value: 'early_bird', icon: '☀️' },
        { label: 'Nottambulo', value: 'night_owl', icon: '🌙' },
        { label: 'Equilibrato', value: 'flexible', icon: '🌓' }
      ]
    },
    {
      id: 'clean',
      question: 'Livello di ordine?',
      type: 'choice' as const,
      options: [
        { label: 'Chirurgico', value: 'very_tidy', icon: '✨' },
        { label: 'Equilibrato', value: 'average', icon: '🏠' },
        { label: 'Rilassato', value: 'relaxed', icon: '🍕' }
      ]
    },
    {
      id: 'social',
      question: 'Vita sociale in casa?',
      type: 'choice' as const,
      options: [
        { label: 'Tranquilla', value: 'quiet', icon: '📚' },
        { label: 'Ogni tanto amici', value: 'sometimes', icon: '🍷' },
        { label: 'Molto sociale', value: 'social', icon: '🎉' }
      ]
    },
    ...(mode === 'CERCO' ? [
      {
        id: 'budget',
        question: 'Il tuo budget massimo?',
        type: 'choice' as const,
        options: [
          { label: 'Entro 400€', value: 'low', icon: '💶' },
          { label: 'Entro 600€', value: 'mid', icon: '💳' },
          { label: 'Oltre 600€', value: 'high', icon: '💎' }
        ]
      }
    ] : [
      {
        id: 'room_type',
        question: 'Che stanza offri?',
        type: 'choice' as const,
        options: [
          { label: 'Singola', value: 'single', icon: '🛏️' },
          { label: 'Doppia', value: 'double', icon: '👥' },
          { label: 'Posto Letto', value: 'bed', icon: '📍' }
        ]
      }
    ]),
    {
      id: 'weights',
      question: 'Quanto contano per te?',
      type: 'weights' as const,
      options: []
    }
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [weights, setWeights] = useState({ cleanliness: 50, silence: 50, social: 50, hobbies: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  useEffect(() => {
    gsap.fromTo('.step-counter, .quiz-card h2', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
    );
    if (currentStepData.type === 'choice') {
      gsap.fromTo('.option-card',
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.4)', delay: 0.3 }
      );
    }
    if (currentStepData.type === 'weights') {
      gsap.fromTo('.weight-row',
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
      );
    }
  }, [currentStep]);

  const advanceStep = (newAnswers: any) => {
    if (currentStep < totalSteps - 1) {
      gsap.to(cardRef.current, {
        x: -50, opacity: 0, duration: 0.4, ease: 'power2.in',
        onComplete: () => {
          setCurrentStep(currentStep + 1);
          gsap.fromTo(cardRef.current, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
        }
      });
    } else {
      gsap.to('.quiz-page', {
        opacity: 0, duration: 0.8,
        onComplete: () => onComplete({ ...newAnswers, weights })
      });
    }
  };

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [currentStepData.id]: value };
    setAnswers(newAnswers);
    setTimeout(() => advanceStep(newAnswers), 300);
  };

  const handleWeightsConfirm = () => {
    advanceStep({ ...answers, weights });
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      gsap.to(cardRef.current, {
        x: 50, opacity: 0, duration: 0.4, ease: 'power2.in',
        onComplete: () => {
          setCurrentStep(currentStep - 1);
          gsap.fromTo(cardRef.current, { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
        }
      });
    } else {
      onBack();
    }
  };

  const weightLabels: Record<string, string> = {
    cleanliness: 'Ordine & Pulizia',
    silence: 'Silenzio & Tranquillità',
    social: 'Vita Sociale',
    hobbies: 'Interessi in Comune'
  };

  return (
    <div className="quiz-page">
      <div className="quiz-bg-dots"></div>
      <div className="quiz-progress">
        <div className="progress-bar" style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }} />
      </div>

      <div ref={cardRef} className="quiz-card glass">
        <button className="back-btn" onClick={handlePrev}>
          <ArrowLeft size={20} />
        </button>

        <div className="step-indicator">
          <span className="step-counter">{String(currentStep + 1).padStart(2, '0')}</span>
          <div className="step-divider"></div>
          <span className="step-total">{String(totalSteps).padStart(2, '0')}</span>
        </div>
        
        <h2>{currentStepData.question}</h2>

        {currentStepData.type === 'choice' && (
          <div className="options-grid">
            {currentStepData.options.map((opt) => (
              <button 
                key={opt.value}
                className={`option-card ${answers[currentStepData.id] === opt.value ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="option-icon">{opt.icon}</span>
                <span className="option-label">{opt.label}</span>
                <div className="check-indicator"><Check size={16} /></div>
              </button>
            ))}
          </div>
        )}

        {currentStepData.type === 'weights' && (
          <div className="weights-container">
            <p className="weights-desc">Regola l'importanza di ogni criterio nel calcolo dell'affinità.</p>
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="weight-row">
                <div className="weight-label">
                  <span>{weightLabels[key]}</span>
                  <span className="weight-value">{value}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={value} 
                  onChange={(e) => setWeights(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="weight-slider"
                />
              </div>
            ))}
            <button className="confirm-weights-btn" onClick={handleWeightsConfirm}>
              <Sliders size={18} />
              Calcola la mia affinità
            </button>
          </div>
        )}
      </div>

      <style>{`
        .quiz-page { height: 100vh; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #05070a; padding: 20px; overflow: hidden; position: relative; }
        .quiz-bg-dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(0,240,255,0.05) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.5; }
        .quiz-progress { position: fixed; top: 0; left: 0; width: 100%; height: 4px; background: rgba(255,255,255,0.05); z-index: 10; }
        .progress-bar { height: 100%; background: linear-gradient(to right, var(--primary-blue), var(--primary-red)); transition: width 0.8s cubic-bezier(0.23,1,0.32,1); box-shadow: 0 0 20px var(--primary-blue); }
        .quiz-card { width: 100%; max-width: 520px; padding: 80px 40px 60px; position: relative; text-align: center; z-index: 2; }
        .back-btn { position: absolute; top: 30px; left: 30px; color: var(--text-muted); transition: var(--transition-smooth); background: none; border: none; cursor: pointer; }
        .back-btn:hover { color: white; transform: translateX(-4px); }
        .step-indicator { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 24px; }
        .step-counter { font-size: 18px; font-weight: 700; color: var(--primary-blue); font-family: var(--font-heading); }
        .step-divider { width: 40px; height: 1px; background: rgba(255,255,255,0.1); }
        .step-total { font-size: 14px; color: var(--text-muted); font-weight: 500; }
        h2 { font-size: 2.5rem; margin-bottom: 48px; line-height: 1.2; }
        .options-grid { display: grid; gap: 20px; }
        .option-card { padding: 24px 32px; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); display: flex; align-items: center; gap: 24px; color: white; transition: var(--transition-smooth); position: relative; text-align: left; cursor: pointer; }
        .option-card:hover { background: rgba(255,255,255,0.05); transform: translateY(-2px); border-color: var(--primary-blue); }
        .option-card.selected { border-color: var(--primary-blue); background: rgba(0,240,255,0.08); box-shadow: 0 10px 30px rgba(0,240,255,0.1); }
        .option-icon { font-size: 28px; }
        .option-label { font-size: 1.2rem; font-weight: 600; }
        .check-indicator { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; opacity: 0.3; transition: 0.3s; }
        .option-card.selected .check-indicator { background: var(--primary-blue); border-color: var(--primary-blue); opacity: 1; color: #000; }

        .weights-container { text-align: left; }
        .weights-desc { font-size: 0.95rem; color: var(--text-muted); margin-bottom: 40px; text-align: center; }
        .weight-row { margin-bottom: 28px; }
        .weight-label { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .weight-value { color: var(--primary-blue); font-family: var(--font-heading); }
        .weight-slider { width: 100%; -webkit-appearance: none; appearance: none; height: 6px; background: rgba(255,255,255,0.08); border-radius: 100px; outline: none; cursor: pointer; }
        .weight-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: var(--primary-blue); cursor: pointer; box-shadow: 0 0 12px rgba(0,240,255,0.4); border: 3px solid #0a0c10; }
        .weight-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: var(--primary-blue); cursor: pointer; border: 3px solid #0a0c10; }
        .confirm-weights-btn { margin-top: 40px; width: 100%; padding: 20px; background: #fff; color: #000; border-radius: 16px; font-weight: 800; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 12px; text-transform: uppercase; letter-spacing: 0.05em; transition: 0.3s; cursor: pointer; border: none; }
        .confirm-weights-btn:hover { background: var(--primary-blue); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,240,255,0.3); }

        @media (max-width: 480px) {
          .quiz-card { padding: 60px 24px 40px; }
          h2 { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
};

export default Quiz;
