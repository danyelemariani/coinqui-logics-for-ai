import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { MapPin, X, Euro, Sparkles, Heart, ArrowLeft, Sun, Wifi, Wind, Droplets, Tv, Coffee, BookOpen, Waves, Home, Thermometer, ShieldCheck, BarChart2 } from 'lucide-react';
import MatchExplainer from './MatchExplainer';
import BiasDashboard from './BiasDashboard';
import { LogicEngine } from '../logic/LogicEngine';
import type { RoommateProfile, LogicalMatchResult } from '../logic/LogicEngine';
import { QualityMonitor } from '../logic/QualityMonitor';

interface DiscoveryFeedProps {
  mode: 'CERCO' | 'OFFRO';
  onMatch: (item: any) => void;
  quizData?: any;
  onBack: () => void;
}

// Icon mapper for amenities
const amenityIcons: Record<string, any> = {
  'Wi-Fi': Wifi,
  'Wi-Fi Fibra': Wifi,
  'Wi-Fi Incluso': Wifi,
  'Lavatrice': Waves,
  'Lavastoviglie': Droplets,
  'Riscaldamento autonomo': Thermometer,
  'Aria condizionata': Wind,
  'Balcone privato': Sun,
  'Terrazza condivisa': Sun,
  'Zona studio silenziosa': BookOpen,
  'Lucernario': Sun,
  'Luce Naturale': Sun,
  'Balcone': Sun,
  'Soffitti Alti': Home,
  'Cucina Grande': Coffee,
  'Terrazza': Sun,
  'Atmosfera Boho': Home,
  'Vista Panoramica': Sun,
  'Mansarda': Home,
};

const mockRooms = [
  {
    id: 1,
    title: "Singola Luminosa con Balcone",
    zone: "Porta Nuova",
    price: 450,
    image: "/room-eco.png",
    owner: {
      name: "Marco",
      age: 24,
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
      job: "Visual Designer : Freelance",
      bio: "Amo il silenzio per lavorare, ma non disdegno una serata film il venerdì. Cerco qualcuno che rispetti gli spazi comuni e ami la luce naturale.",
      tags: ["Non fumatore", "Silenzioso", "Lavora da casa"],
      personality: "creative",
      sleep: "early_bird",
      clean: "very_tidy"
    },
    gallery: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800"
    ],
    match: 0,
    tags: ["Luce Naturale", "Wi-Fi Incluso", "Balcone"],
    amenities: ["Wi-Fi", "Lavatrice", "Riscaldamento autonomo", "Balcone privato"],
    rules: ["Non fumatori in casa", "Silenzio dopo le 23", "Pulizia spazi comuni settimanale"],
    description: "Stanza singola di 16mq in appartamento recentemente ristrutturato. Pavimento in parquet, ampia finestra con vista cortile interno. Zona tranquilla ma ben collegata con metro e tram.",
    affinityData: { cleanliness: 95, silence: 88, social: 35, hobbies: 72 }
  },
  {
    id: 2,
    title: "Stanza nel Loft Industriale",
    zone: "Brera",
    price: 520,
    image: "/room-industrial.png",
    owner: {
      name: "Giulia",
      age: 27,
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
      job: "Founder Startup Tech",
      bio: "Casa aperta, cucina condivisa, spesso si mangia tutti insieme. Cerco persone dinamiche che portino energia positiva. Il weekend organizziamo cene e aperitivi.",
      tags: ["Cucina condivisa", "Sport mattutino", "Viaggiatrice"],
      personality: "energetic",
      sleep: "early_bird",
      clean: "average"
    },
    gallery: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800"
    ],
    match: 0,
    tags: ["Soffitti Alti", "Cucina Grande", "Terrazza"],
    amenities: ["Wi-Fi Fibra", "Lavastoviglie", "Terrazza condivisa", "Aria condizionata"],
    rules: ["Ospiti benvenuti", "Pulizia turni", "Spese divise equamente"],
    description: "Doppia uso singola in loft con soffitti di 4 metri. Ambiente industrial chic, mattoni a vista e travi in ferro. Zona centralissima, a 5 minuti dalla fermata Lanza.",
    affinityData: { cleanliness: 68, silence: 45, social: 92, hobbies: 88 }
  },
  {
    id: 3,
    title: "Camera con Vista Tetti",
    zone: "Isola",
    price: 480,
    image: "/room-boho.png",
    owner: {
      name: "Alice",
      age: 23,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      job: "Studentessa Cinema : IULM",
      bio: "La casa è il mio rifugio creativo. Ho una collezione di vinili e piante ovunque. Cerco qualcuno che ami le serate cinema e non si lamenti della musica la domenica.",
      tags: ["Musica dal vivo", "Cinefila", "Nottambula"],
      personality: "bohemian",
      sleep: "night_owl",
      clean: "relaxed"
    },
    gallery: [
      "https://images.unsplash.com/photo-1505693413171-2936696ac101?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1522444195799-478538b28823?auto=format&fit=crop&q=80&w=800"
    ],
    match: 0,
    tags: ["Atmosfera Boho", "Vista Panoramica", "Mansarda"],
    amenities: ["Wi-Fi", "Lavatrice", "Zona studio silenziosa", "Lucernario"],
    rules: ["Tolleranza reciproca", "Niente fumo dentro", "Libertà totale"],
    description: "Mansarda luminosissima con lucernario e vista sui tetti di Isola. 14mq con armadio a muro e zona studio. L'appartamento ha un'energia unica, pieno di piante e libri.",
    affinityData: { cleanliness: 55, silence: 60, social: 85, hobbies: 95 }
  }
];


const mockCandidates = [
  {
    id: 1,
    name: "Luca",
    age: 25,
    role: "Chef & Food Designer",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800",
    bio: "Cerco una casa dove la cucina sia sacra. Sono molto ordinato e amo le piante. Di giorno lavoro, la sera sperimento ricette nuove. Non fumo e non faccio tardi.",
    gallery: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800"
    ],
    match: 0,
    tags: ["Ordinato", "Cucina Gourmet", "Non fumatore"],
    personality: "structured",
    description: "Amo sperimentare in cucina e cerco una casa dove il rispetto degli spazi sia sacro. Il weekend mi piace cucinare per gli amici.",
    affinityData: { cleanliness: 98, silence: 85, social: 40, hobbies: 92 }
  },
  {
    id: 2,
    name: "Sofia",
    age: 23,
    role: "Studentessa di Architettura",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800",
    bio: "Studio tanto e ho bisogno di un ambiente tranquillo. Il weekend però esco e mi piace fare sport. Cerco una convivenza rispettosa e serena.",
    gallery: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800"
    ],
    match: 0,
    tags: ["Silenziosa", "Sportiva", "Mattiniera"],
    personality: "intellectual",
    description: "Cerco un ambiente stimolante ma tranquillo per via dei miei studi. Amo lo sport all'aria aperta e le passeggiate.",
    affinityData: { cleanliness: 88, silence: 95, social: 35, hobbies: 78 }
  },
  {
    id: 3,
    name: "Davide",
    age: 29,
    role: "Musicista & Produttore",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    bio: "Faccio musica come professione, quindi ho bisogno di libertà creativa. Cerco una convivenza rilassata, niente regole assurde. Caffè e dischi in vinile sono le mie passioni.",
    gallery: [
      "https://images.unsplash.com/photo-1514525253361-bee8d488f764?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800"
    ],
    match: 0,
    tags: ["Creativo", "Socievole", "Nottambulo"],
    personality: "vibey",
    description: "Lavoro da casa e ho sempre musica in sottofondo. Cerco una convivenza rilassata dove sentirsi liberi.",
    affinityData: { cleanliness: 55, silence: 30, social: 95, hobbies: 98 }
  }
];

// Adapter to map existing data to BRIO RoommateProfile
// Handles both quiz answers (keys: smoke, sleep, clean, social) and card data (affinityData, tags, etc.)
function mapToProfile(item: any, isMe: boolean = false): RoommateProfile {
  // Cleanliness: quiz answer → numeric, card → use affinityData or clean label
  const cleanVal = isMe
    ? (item.clean === 'very_tidy' ? 95 : item.clean === 'average' ? 65 : 35)
    : (item.affinityData?.cleanliness ?? (item.clean === 'very_tidy' ? 95 : item.clean === 'average' ? 65 : 35));

  // Smoker: quiz uses smoke:'smoker'/'outside'/'no_smoke'; cards use tags
  const smokerVal = isMe
    ? (item.smoke === 'smoker')
    : (item.tags?.includes('Fumatore') ?? false);

  // Social vibe: quiz uses social:'social'/'sometimes'/'quiet'; cards use affinityData.social
  const socialNum = isMe ? null : (item.affinityData?.social ?? 50);
  const socialVal = isMe
    ? (item.social === 'social' ? 'high' : item.social === 'sometimes' ? 'medium' : 'low')
    : (socialNum > 70 ? 'high' : socialNum < 35 ? 'low' : 'medium');

  // Needs silence: quiz uses social:'quiet'; cards use affinityData.silence
  const needsSilenceVal = isMe
    ? (item.social === 'quiet')
    : ((item.affinityData?.silence ?? 50) > 70);

  // smoking_allowed: does this space/person allow smoking?
  // For quiz user: they allow smoking if they smoke (rule checks OTHER.smoking_allowed, so this rarely matters)
  // For room/candidate: false if owner has 'Non fumatore' tag OR rules ban smoking
  const smokingAllowedVal = isMe
    ? (item.smoke === 'smoker')
    : !(
        item.tags?.includes('Non fumatore') ||
        item.owner?.tags?.includes('Non fumatore') ||
        item.rules?.some((r: string) => /fumo|fumator/i.test(r))
      );

  const atoms = [
    { key: 'cleanliness',    value: cleanVal,       label: 'Pulizia',    category: 'lifestyle' as const },
    { key: 'sleep_schedule', value: item.sleep || item.sleep_schedule || 'early_bird', label: 'Sonno', category: 'lifestyle' as const },
    { key: 'smoker',         value: smokerVal,       label: 'Fumatore',   category: 'lifestyle' as const },
    { key: 'smoking_allowed',value: smokingAllowedVal, label: 'Fumo OK',  category: 'requirements' as const },
    { key: 'social_vibe',    value: socialVal,       label: 'Socialità',  category: 'lifestyle' as const },
    { key: 'needs_silence',  value: needsSilenceVal, label: 'Silenzio',   category: 'personality' as const },
  ];
  
  const report = QualityMonitor.evaluateProfile({ id: item.id, name: item.name || item.owner?.name }, atoms);
  
  return {
    id: item.id,
    name: item.name || item.owner?.name,
    atoms,
    metadata: {
      completeness: report.computational.completeness,
      consistency: report.representational.consistency,
      reliability: report.representational.reliability
    }
  };
}

function calculateLogicMatch(item: any, quizData: any): LogicalMatchResult {
  const me = mapToProfile(quizData, true);
  const other = mapToProfile(item);
  return LogicEngine.calculateMatch(me, other, quizData?.weights);
}

function getAmenityIcon(name: string) {
  const IconComponent = amenityIcons[name] || Home;
  return <IconComponent size={15} />;
}

const DiscoveryFeed: React.FC<DiscoveryFeedProps> = ({ mode, onMatch, quizData, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [showBiasDashboard, setShowBiasDashboard] = useState(false);
  const [currentGalleryIdx, setCurrentGalleryIdx] = useState(0);
  const likeCountRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const hostSectionRef = useRef<HTMLDivElement>(null);
  
  const rawItems = mode === 'CERCO' ? mockRooms : mockCandidates;
  
  const items = rawItems.map(item => {
    const logicResult = calculateLogicMatch(item, quizData);
    return {
      ...item,
      logicResult,
      match: logicResult.score
    };
  }).sort((a, b) => b.match !== a.match ? b.match - a.match : a.id - b.id);

  const currentItem = items[currentIndex % items.length];

  useEffect(() => {
    gsap.fromTo(cardRef.current, 
      { y: 60, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power4.out' }
    );
  }, [currentIndex]);

  const handleAction = (type: 'like' | 'dislike') => {
    gsap.to(cardRef.current, {
      x: type === 'like' ? 500 : -500,
      opacity: 0,
      rotation: type === 'like' ? 15 : -15,
      y: 50,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        if (type === 'like') {
          likeCountRef.current += 1;
          if (likeCountRef.current >= 2) {
            onMatch(currentItem);
          }
        }
        setCurrentIndex((prev) => prev + 1);
        setCurrentGalleryIdx(0);
        gsap.set(cardRef.current, { x: 0, rotation: 0, y: 0, opacity: 0 });
      }
    });
  };

  const openDetail = (scrollToHost = false) => {
    setShowDetail(true);
    setCurrentGalleryIdx(0);
    setTimeout(() => {
      if (detailRef.current) {
        gsap.fromTo(detailRef.current, 
          { y: '100%' },
          { y: '0%', duration: 0.7, ease: 'power4.out', onComplete: () => {
            if (scrollToHost && hostSectionRef.current) {
              detailRef.current?.scrollTo({
                top: hostSectionRef.current.offsetTop - 100,
                behavior: 'smooth'
              });
            }
          }}
        );
      }
    }, 10);
  };

  const closeDetail = () => {
    if (detailRef.current) {
      gsap.to(detailRef.current, {
        y: '100%', duration: 0.5, ease: 'power3.in',
        onComplete: () => setShowDetail(false)
      });
    }
  };

  return (
    <div className="discovery-page">
      <div className="grid-bg"></div>
      
      <nav className="discovery-nav">
        <div className={`nav-logo ${!showDetail ? 'interactive' : ''}`} onClick={() => !showDetail && onBack()}>
          <img src="/coinqui-logo.png" alt="Coinqui Logo" />
          <h2>{mode === 'CERCO' ? 'Trova Stanza' : 'Candidati'}</h2>
        </div>
        <div className="nav-actions">
          <div className={`glass-icon ${showBiasDashboard ? 'active' : ''}`} onClick={() => setShowBiasDashboard(!showBiasDashboard)}>
            <BarChart2 size={18} />
          </div>
          <div className="glass-icon"><Sparkles size={18} /></div>
          <div className="user-avatar-nav">
            <img src="/generic-avatar.png" alt="TU" />
          </div>
        </div>
      </nav>

      <div className="feed-container">
        <div ref={cardRef} className="roommate-card glass">
          <div className="card-image" style={{ backgroundImage: `url(${currentItem.image})` }}>
            {mode === 'CERCO' && (
              <>
                <div className="price-tag">
                  <Euro size={14} />
                  <span>{(currentItem as any).price}/mese</span>
                </div>
                <div className="owner-avatar-bubble glass interactive" onClick={(e) => { e.stopPropagation(); openDetail(true); }}>
                  <div className="avatar-img" style={{ backgroundImage: `url(${(currentItem as any).owner.image})` }} />
                  <div className="owner-status">
                    <div className="status-dot"></div>
                    <span>{(currentItem as any).owner.name}</span>
                  </div>
                </div>
              </>
            )}
            <div className="match-tag">
              <Sparkles size={14} />
              <span>{currentItem.match}% Affinità</span>
            </div>
          </div>
          
          <div className="card-info" onClick={() => openDetail()}>
            <div className="info-header">
              <h3>{mode === 'CERCO' ? (currentItem as any).title : (currentItem as any).name + ', ' + (currentItem as any).age}</h3>
              {mode === 'CERCO' && <div className="zone-pill"><MapPin size={12} /> {(currentItem as any).zone}</div>}
              {mode === 'OFFRO' && <span className="user-role">{(currentItem as any).role}</span>}
            </div>
            <div className="tags-container">
              {currentItem.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <p className="description-preview">{currentItem.description.substring(0, 110)}...</p>
            <div className="tap-hint">Tocca per dettagli</div>
          </div>

          <div className="card-actions">
            <button className="action-btn dislike" onClick={() => handleAction('dislike')}><X size={28} /></button>
            <button className="action-btn like" onClick={() => handleAction('like')}><Heart size={28} fill="currentColor" /></button>
          </div>
        </div>
      </div>

      {/* DETAIL OVERLAY - outside feed-container for proper z-index */}
      {showDetail && (
          <div ref={detailRef} className="detail-overlay" style={{ transform: 'translateY(100%)' }} data-lenis-prevent>
            {/* Top bar with back */}
            <div className="detail-topbar">
              <button className="back-detail-btn" onClick={closeDetail}>
                <ArrowLeft size={20} />
                <span>Indietro</span>
              </button>
              <div className="detail-topbar-match">
                <Sparkles size={14} /> {currentItem.match}%
              </div>
            </div>

            {/* Gallery */}
            <div className="detail-hero">
              <div className="gallery-main" style={{ backgroundImage: `url(${currentGalleryIdx === 0 ? currentItem.image : currentItem.gallery[currentGalleryIdx - 1]})` }} />
              <div className="gallery-thumbs">
                <div className={`thumb ${currentGalleryIdx === 0 ? 'active' : ''}`} style={{ backgroundImage: `url(${currentItem.image})` }} onClick={() => setCurrentGalleryIdx(0)} />
                {currentItem.gallery.map((img, idx) => (
                  <div key={img} className={`thumb ${currentGalleryIdx === idx + 1 ? 'active' : ''}`} style={{ backgroundImage: `url(${img})` }} onClick={() => setCurrentGalleryIdx(idx + 1)} />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="detail-content">
              {/* Header */}
              <div className="detail-header">
                <h2 className="detail-title">{mode === 'CERCO' ? (currentItem as any).title : (currentItem as any).name + ', ' + (currentItem as any).age}</h2>
                {mode === 'CERCO' && (
                  <div className="detail-meta-row clickable-host" onClick={() => {
                  if (hostSectionRef.current) {
                    detailRef.current?.scrollTo({ top: hostSectionRef.current.offsetTop - 100, behavior: 'smooth' });
                  }
                }}>
                  <div className="header-host-pill">
                    <div className="header-host-avatar" style={{ backgroundImage: `url(${(currentItem as any).owner.image})` }} />
                    <span>{(currentItem as any).owner.name}</span>
                  </div>
                  <span className="detail-meta-item"><MapPin size={14} /> {(currentItem as any).zone}</span>
                  <span className="detail-meta-item"><Euro size={14} /> {(currentItem as any).price}€/mese</span>
                </div>
                )}
                {mode === 'OFFRO' && <div className="detail-meta-row"><span className="detail-meta-item">{(currentItem as any).role}</span></div>}
                <div className="match-pill"><Sparkles size={14} /> {currentItem.match}% Compatibilità Lifestyle</div>
              </div>

              <div className="detail-divider" />

              {/* Description */}
              <div className="detail-section">
                <h4>{mode === 'CERCO' ? '📍 La Stanza' : '👤 Chi sono'}</h4>
                <p className="detail-desc">{currentItem.description}</p>
              </div>

              <div className="detail-divider" />

              {/* Amenities with icons (rooms only) */}
              {mode === 'CERCO' && (
                <>
                  <div className="detail-section">
                    <h4>🏠 Servizi Inclusi</h4>
                    <div className="amenities-grid">
                      {(currentItem as any).amenities?.map((a: string) => (
                        <div key={a} className="amenity-item">
                          {getAmenityIcon(a)}
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-divider" />

                  <div className="detail-section">
                    <h4>📋 Regole della Casa</h4>
                    <div className="rules-list">
                      {(currentItem as any).rules?.map((r: string) => (
                        <div key={r} className="rule-item">
                          <ShieldCheck size={14} />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-divider" />
                </>
              )}

              {/* Host / Person */}
              <div className="detail-section" ref={hostSectionRef}>
                <h4>{mode === 'CERCO' ? '🧑 Chi vive qui' : '💬 Su di me'}</h4>
                {mode === 'CERCO' ? (
                  <div className="host-card">
                    <div className="host-card-top">
                      <div className="host-avatar" style={{ backgroundImage: `url(${(currentItem as any).owner.image})` }} />
                      <div>
                        <strong>{(currentItem as any).owner.name}, {(currentItem as any).owner.age}</strong>
                        <span className="host-job">{(currentItem as any).owner.job}</span>
                      </div>
                    </div>
                    <p className="host-bio">{(currentItem as any).owner.bio}</p>
                    <div className="tags-container">
                      {(currentItem as any).owner.tags.map((t: string) => <span key={t} className="tag host-tag">{t}</span>)}
                    </div>
                  </div>
                ) : (
                  <div className="host-card">
                    <p className="host-bio">{(currentItem as any).bio}</p>
                    <div className="tags-container">
                      {currentItem.tags.map(t => <span key={t} className="tag host-tag">{t}</span>)}
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-divider" />

              {/* AI Insights */}
              <div className="detail-section">
                <MatchExplainer 
                  result={(currentItem as any).logicResult} 
                  recipientName={mode === 'CERCO' ? (currentItem as any).owner.name : (currentItem as any).name} 
                />
              </div>

              {/* Bottom action bar */}
              <div className="detail-bottom-actions">
                <button className="detail-dislike-btn" onClick={() => { closeDetail(); setTimeout(() => handleAction('dislike'), 600); }}>
                  <X size={22} />
                  <span>Passa</span>
                </button>
                <button className="detail-like-btn" onClick={() => { closeDetail(); setTimeout(() => handleAction('like'), 600); }}>
                  <Heart size={22} fill="currentColor" />
                  <span>Mi Interessa</span>
                </button>
              </div>
            </div>
          </div>
        )}

      {showBiasDashboard && (
        <div className="dashboard-overlay" onClick={() => setShowBiasDashboard(false)}>
          <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
            <BiasDashboard />
            <button className="close-dash-btn" onClick={() => setShowBiasDashboard(false)}>Chiudi Dashboard</button>
          </div>
        </div>
      )}

      <style>{`
        .discovery-page { height: 100vh; width: 100%; background: #05070a; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .grid-bg { position: absolute; inset: 0; background-image: radial-gradient(rgba(0,240,255,0.05) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.5; }
        .discovery-nav { padding: 24px 40px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10; }
        .nav-logo { display: flex; align-items: center; gap: 12px; transition: 0.3s; }
        .nav-logo.interactive { cursor: pointer; }
        .nav-logo.interactive:hover { transform: translateX(5px); opacity: 0.8; }
        .nav-logo img { width: 32px; height: 32px; border-radius: 8px; }
        .discovery-nav h2 { font-size: 1.5rem; background: linear-gradient(to right, var(--primary-blue), #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-actions { display: flex; gap: 12px; align-items: center; }
        .glass-icon { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: 0.3s; }
        .glass-icon:hover { background: rgba(255,255,255,0.15); }
        .user-avatar-nav { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(255,255,255,0.2); }
        .user-avatar-nav img { width: 100%; height: 100%; object-fit: cover; }
        .feed-container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; z-index: 5; }
        .roommate-card { width: 100%; max-width: 420px; height: 620px; padding: 0; overflow: hidden; display: flex; flex-direction: column; border-radius: 32px; box-shadow: 0 40px 80px rgba(0,0,0,0.6); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); cursor: pointer; }
        .card-image { height: 55%; width: 100%; background-size: cover; background-position: center; position: relative; }
        .price-tag { position: absolute; top: 20px; left: 20px; background: #fff; color: #000; padding: 8px 16px; border-radius: 100px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .match-tag { position: absolute; bottom: 20px; left: 20px; background: var(--primary-blue); padding: 6px 14px; border-radius: 100px; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; z-index: 5; color: #000; }
        .owner-avatar-bubble { position: absolute; bottom: 20px; right: 20px; padding: 6px 14px 6px 6px; border-radius: 100px; display: flex; align-items: center; gap: 10px; z-index: 5; }
        .avatar-img { width: 32px; height: 32px; border-radius: 50%; background-size: cover; background-position: center; border: 2px solid #fff; flex-shrink: 0; }
        .owner-avatar-bubble.interactive { cursor: pointer; transition: 0.3s; }
        .owner-avatar-bubble.interactive:hover { transform: scale(1.05); background: rgba(255,255,255,0.15); box-shadow: 0 5px 20px rgba(0,240,255,0.2); }
        
        .clickable-host { cursor: pointer; transition: 0.3s; border-radius: 12px; padding: 4px; margin-left: -4px; }
        .clickable-host:hover { background: rgba(255,255,255,0.05); }
        .header-host-pill { display: flex; align-items: center; gap: 8px; background: rgba(0,240,255,0.1); padding: 4px 12px; border-radius: 100px; border: 1px solid rgba(0,240,255,0.2); }
        .header-host-avatar { width: 20px; height: 20px; border-radius: 50%; background-size: cover; background-position: center; border: 1px solid white; }
        .header-host-pill span { font-size: 12px; font-weight: 700; color: var(--primary-blue); }
        .status-dot { position: absolute; top: 6px; left: 6px; width: 8px; height: 8px; background: #4ade80; border-radius: 50%; border: 2px solid #000; }
        .card-info { padding: 24px; flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .info-header { display: flex; justify-content: space-between; align-items: center; }
        .info-header h3 { font-size: 1.4rem; font-weight: 700; }
        .zone-pill { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
        .user-role { font-size: 13px; color: var(--primary-blue); font-weight: 600; }
        .tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag { padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .description-preview { font-size: 0.9rem; color: rgba(255,255,255,0.5); line-height: 1.5; }
        .tap-hint { font-size: 11px; color: var(--primary-blue); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-top: auto; }
        .card-actions { padding: 0 24px 24px; display: flex; justify-content: space-between; align-items: center; }
        .action-btn { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.3s cubic-bezier(0.23,1,0.32,1); border: none; cursor: pointer; }
        .action-btn.dislike { background: rgba(255,255,255,0.05); color: var(--primary-red); border: 1px solid rgba(255,31,94,0.2); }
        .action-btn.like { background: #fff; color: #000; box-shadow: 0 10px 30px rgba(255,255,255,0.2); }
        .action-btn:hover { transform: scale(1.1); }
        .action-btn.like:hover { background: var(--primary-blue); color: white; }

        /* ===== DETAIL OVERLAY ===== */
        .detail-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: #05070a;
          display: flex; flex-direction: column;
          overflow-y: auto;
          will-change: transform;
        }

        .detail-topbar {
          position: sticky; top: 0; z-index: 1050;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px;
          background: #05070a;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .back-detail-btn {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: white;
          font-size: 14px; font-weight: 600; cursor: pointer;
          padding: 12px 20px; border-radius: 14px;
          transition: 0.3s;
        }
        .back-detail-btn:hover { background: rgba(255,255,255,0.1); transform: translateX(-4px); }

        .detail-topbar-match {
          display: flex; align-items: center; gap: 6px;
          color: var(--primary-blue); font-weight: 800; font-size: 14px;
          font-family: var(--font-heading);
        }

        .detail-hero { height: 50vh; display: flex; gap: 8px; padding: 8px; flex-shrink: 0; }
        .gallery-main { flex: 1; border-radius: 20px; background-size: cover; background-position: center; transition: 0.4s ease; }
        .gallery-thumbs { width: 90px; display: flex; flex-direction: column; gap: 8px; }
        .thumb { flex: 1; border-radius: 12px; background-size: cover; background-position: center; cursor: pointer; opacity: 0.4; transition: 0.3s; border: 2px solid transparent; }
        .thumb:hover { opacity: 0.7; }
        .thumb.active { opacity: 1; border-color: var(--primary-blue); }

        .detail-content { padding: 32px 40px 180px; max-width: 800px; margin: 0 auto; width: 100%; }

        .detail-header { margin-bottom: 8px; }
        .detail-title { font-size: 2.2rem; margin-bottom: 12px; line-height: 1.2; }
        .detail-meta-row { display: flex; gap: 20px; margin-bottom: 16px; }
        .detail-meta-item { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-muted); }
        .match-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; background: rgba(0,240,255,0.08); color: var(--primary-blue); border-radius: 100px; font-weight: 700; font-size: 13px; border: 1px solid rgba(0,240,255,0.15); }

        .detail-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 32px 0; }

        .detail-section { margin-bottom: 0; }
        .detail-section h4 { font-size: 14px; font-weight: 700; margin-bottom: 16px; color: white; letter-spacing: 0; text-transform: none; }
        .detail-desc { font-size: 1rem; line-height: 1.8; color: rgba(255,255,255,0.65); }

        .tag.host-tag { background: rgba(0,240,255,0.06); color: var(--primary-blue); border: 1px solid rgba(0,240,255,0.12); }

        /* Amenities */
        .amenities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .amenity-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: rgba(255,255,255,0.75);
          padding: 12px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          transition: 0.2s;
        }
        .amenity-item:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
        .amenity-item svg { color: var(--primary-blue); flex-shrink: 0; }

        /* Rules */
        .rules-list { display: flex; flex-direction: column; gap: 10px; }
        .rule-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: rgba(255,255,255,0.6);
          padding: 10px 0;
        }
        .rule-item svg { color: #4ade80; flex-shrink: 0; }

        /* Host card */
        .host-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 24px; }
        .host-card-top { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .host-avatar { width: 56px; height: 56px; border-radius: 50%; background-size: cover; background-position: center; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.1); }
        .host-card-top strong { display: block; font-size: 16px; margin-bottom: 2px; }
        .host-job { font-size: 12px; color: var(--text-muted); }
        .host-bio { font-size: 0.95rem; line-height: 1.7; color: rgba(255,255,255,0.55); margin-bottom: 16px; }

        /* Bottom action bar in detail */
        .detail-bottom-actions {
          display: flex; gap: 16px;
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .detail-dislike-btn, .detail-like-btn {
          flex: 1;
          padding: 18px 24px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          font-weight: 700; font-size: 15px;
          cursor: pointer; border: none;
          transition: 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .detail-dislike-btn {
          background: rgba(255,255,255,0.04);
          color: var(--text-muted);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .detail-dislike-btn:hover { background: rgba(255,31,94,0.1); color: var(--primary-red); border-color: rgba(255,31,94,0.2); }

        .detail-like-btn {
          background: #fff;
          color: #000;
        }
        .detail-like-btn:hover { background: var(--primary-blue); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,240,255,0.3); }

        .glass-icon.active { background: var(--primary-blue); color: #000; }
        
        /* Dashboard Overlay */
        .dashboard-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .dashboard-modal { width: 100%; max-width: 1000px; max-height: 90vh; overflow-y: auto; position: relative; }
        .close-dash-btn { margin-top: 20px; width: 100%; padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 12px; cursor: pointer; font-weight: 700; transition: 0.3s; }
        .close-dash-btn:hover { background: rgba(255,255,255,0.1); color: var(--primary-red); }

        @media (max-width: 768px) {
          .detail-content { padding: 24px 20px 100px; }
          .detail-title { font-size: 1.8rem; }
          .detail-hero { height: 35vh; }
          .amenities-grid { grid-template-columns: 1fr; }
          .gallery-thumbs { width: 60px; }
        }
      `}</style>
    </div>
  );
};

export default DiscoveryFeed;
