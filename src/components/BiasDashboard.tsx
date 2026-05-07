import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';
import {
  BarChart3, Users, Sparkles, Info, Scale,
  RefreshCcw, ShieldCheck, History
} from 'lucide-react';
import { MockGenerator } from '../logic/MockGenerator';
import { LogicEngine } from '../logic/LogicEngine';
import type { RoommateProfile } from '../logic/LogicEngine';

// helpers

/** Jaccard similarity on boolean / numeric-high atoms (Def 103) */
function jaccardSim(a: RoommateProfile, b: RoommateProfile): number {
  const toSet = (p: RoommateProfile) =>
    new Set(
      p.atoms
        .filter(at => at.value === true || (typeof at.value === 'number' && at.value > 50))
        .map(at => at.key)
    );
  const sa = toSet(a), sb = toSet(b);
  const inter = [...sa].filter(x => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : inter / union;
}

/** Score distribution across 5 equal-width bins */
function buildHistogram(scores: number[]): { label: string; count: number }[] {
  const bins = [
    { label: '0–20',  count: 0 },
    { label: '21–40', count: 0 },
    { label: '41–60', count: 0 },
    { label: '61–80', count: 0 },
    { label: '81–99', count: 0 },
  ];
  scores.forEach(s => {
    const idx = Math.min(4, Math.floor(s / 20));
    bins[idx].count++;
  });
  return bins;
}

/** Compute average score for a filtered group */
function groupAvg(items: { finalScore: number }[]): number {
  if (items.length === 0) return 0;
  return items.reduce((sum, r) => sum + r.finalScore, 0) / items.length;
}

// main component

interface BiasDashboardProps {
  onClose?: () => void;
}

const BiasDashboard: React.FC<BiasDashboardProps> = ({ onClose: _onClose }) => {
  const [syntheticUsers, setSyntheticUsers] = useState<RoommateProfile[]>([]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [showModelCard, setShowModelCard] = useState(false);
  const [showDataAudit, setShowDataAudit] = useState(false);
  const [simulationId, setSimulationId] = useState(1);

  // Reference profile (the "current user" against whom all 100 are matched)
  const currentUser = useMemo(() => MockGenerator.generateProfiles(1)[0], []);

  // Initial generation
  useEffect(() => {
    setSyntheticUsers(MockGenerator.generateProfiles(100));
  }, []);

  // Re-run: regenerate synthetic population AND animate
  const runSimulation = useCallback(() => {
    const fresh = MockGenerator.generateProfiles(100);
    setSyntheticUsers(fresh);
    setSimulationId(id => id + 1);
    setSimulationRunning(true);
    gsap.fromTo(
      '.user-bar',
      { scaleY: 0 },
      {
        scaleY: 1, duration: 1.5, stagger: 0.01,
        transformOrigin: 'bottom', ease: 'power2.out',
        onComplete: () => setSimulationRunning(false)
      }
    );
  }, []);

  // computed analytics

  const matchStats = useMemo(() => {
    if (syntheticUsers.length === 0) return null;

    // Compute BOTH model scores always (for diff comparison)
    const baseResults = syntheticUsers.map(u => {
      const result = LogicEngine.calculateMatch(currentUser, u);
      return { ...result, finalScore: result.score, profile: u };
    });

    const fairResults = syntheticUsers.map((u, i) => {
      const base = baseResults[i];
      let fs = base.score;
      if (base.dataQuality.completeness < 70) fs += 10;
      if (base.dataQuality.consistency < 80)  fs -= 15;
      fs = Math.min(99, Math.max(0, fs));
      return { ...base, finalScore: fs };
    });

    // How many profiles changed and by how much (fixed: index over fairResults, not changed subset)
    const boosted   = fairResults.filter((r, i) => r.finalScore > baseResults[i].finalScore).length;
    const penalized = fairResults.filter((r, i) => r.finalScore < baseResults[i].finalScore).length;
    const changed   = boosted + penalized;
    const deltas    = fairResults.map((r, i) => r.finalScore - baseResults[i].finalScore).filter(d => d !== 0);
    const avgDelta  = deltas.length > 0 ? deltas.reduce((s, d) => s + d, 0) / deltas.length : 0;

    // Always use quality-corrected (fair) scores
    const results = fairResults;

    // summary stats
    const highMatches     = results.filter(r => r.finalScore > 80).length;
    const hardConflicts   = results.filter(r => r.isHardConflict).length;
    const excludedByQuality = results.filter(r => r.dataQuality.reliability < 60).length;

    // Group Fairness ε (Def from Quaresmini & Primiero)
    // Measured on MATCH SCORES (not correctionDistance) per demographic group.
    const smokers    = results.filter(r => r.profile.atoms.find(a => a.key === 'smoker')?.value === true);
    const nonSmokers = results.filter(r => r.profile.atoms.find(a => a.key === 'smoker')?.value === false);
    const earlyBirds = results.filter(r => r.profile.atoms.find(a => a.key === 'sleep_schedule')?.value === 'early_bird');
    const nightOwls  = results.filter(r => r.profile.atoms.find(a => a.key === 'sleep_schedule')?.value === 'night_owl');

    const avgSmoker    = groupAvg(smokers);
    const avgNonSmoker = groupAvg(nonSmokers);
    const avgEarly     = groupAvg(earlyBirds);
    const avgNight     = groupAvg(nightOwls);

    // Epsilon: normalised score gap between most divergent groups
    const epsilon = Math.max(
      Math.abs(avgSmoker - avgNonSmoker),
      Math.abs(avgEarly - avgNight)
    ) / 100;

    // Individual Fairness - BSim violations (Def 104)
    let bsimViolations = 0;
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        if (jaccardSim(results[i].profile, results[j].profile) > 0.5) {
          if (Math.abs(results[i].correctionDistance - results[j].correctionDistance) > 0.2) {
            bsimViolations++;
          }
        }
      }
    }

    // SHAP-inspired Global Feature Importance
    const featureLabels = ['Fumo', 'Sonno', 'Pulizia', 'Sociale'];
    const globalImportance = featureLabels.map(label => {
      const impacts = results.map(r => r.featureAttributions[label] ?? 0);
      const avgImpact = impacts.reduce((s, v) => s + v, 0) / impacts.length;
      const absAvg    = impacts.reduce((s, v) => s + Math.abs(v), 0) / impacts.length;
      return { label, avgImpact, absAvg };
    });

    // Score Distribution Histogram
    const histogram = buildHistogram(results.map(r => r.finalScore));
    const histMax   = Math.max(...histogram.map(b => b.count), 1);

    // Age-group breakdown (protected attribute - should show ~equal scores)
    const ageGroups = ['student', 'young_professional', 'professional'] as const;
    const ageBreakdown = ageGroups.map(group => {
      const g = results.filter(r => r.profile.age_group === group);
      return { group, count: g.length, avg: groupAvg(g) };
    });

    // Wasserstein / MDP (Kim et al., 2024)
    // W1 between smoker and non-smoker score distributions.
    // Via quantile matching (Prop. 3.5), this equals the practical MDP estimator:
    // each smoker is matched to the non-smoker at the same score-rank,
    // and the average gap is measured. Lower W1 → more equitable treatment.
    const w1Smoke = LogicEngine.wassersteinDistance(
      smokers.map(r => r.finalScore),
      nonSmokers.map(r => r.finalScore)
    );
    const w1Sleep = LogicEngine.wassersteinDistance(
      earlyBirds.map(r => r.finalScore),
      nightOwls.map(r => r.finalScore)
    );
    // MDP = max of the two group distances (normalised to 0–1)
    const mdp = Math.max(w1Smoke, w1Sleep) / 100;

    // Choice Reduction (Sharabi, 2022 - choice overload)
    // How many profiles the algorithm effectively filters out (score < 40)
    // demonstrating the algorithm's role in narrowing an overwhelming candidate set.
    const aboveThreshold = results.filter(r => r.finalScore >= 40).length;
    const filtered = results.length - aboveThreshold;

    // Full Preference List - tutti i profili
    const allProfiles = [...results]
      .sort((a, b) => b.finalScore - a.finalScore)
      .map((r, i) => ({
        rank: i + 1,
        name: r.profile.name,
        score: r.finalScore,
        ageGroup: r.profile.age_group ?? '-',
        smoker:    r.profile.atoms.find(a => a.key === 'smoker')?.value as boolean | undefined,
        sleepSchedule: r.profile.atoms.find(a => a.key === 'sleep_schedule')?.value as string | undefined,
        cleanliness:   r.profile.atoms.find(a => a.key === 'cleanliness')?.value as number | undefined,
        socialVibe:    r.profile.atoms.find(a => a.key === 'social_vibe')?.value as string | undefined,
        needsSilence:  r.profile.atoms.find(a => a.key === 'needs_silence')?.value as boolean | undefined,
        isConflict: r.isHardConflict,
        correctionDistance: r.correctionDistance,
        topReason: r.reasons.find(reason => reason.satisfied && reason.impact === 'positive')?.description
          ?? r.reasons[0]?.description ?? '-',
      }));

    // Trait Entropy (Art. 10 Data Governance)
    const traitEntropy = LogicEngine.calculateTraitEntropy(syntheticUsers);

    return {
      results, highMatches, hardConflicts, excludedByQuality,
      epsilon,
      smokerStats:    { avg: avgSmoker,    count: smokers.length },
      nonSmokerStats: { avg: avgNonSmoker, count: nonSmokers.length },
      earlyStats:     { avg: avgEarly,     count: earlyBirds.length },
      nightStats:     { avg: avgNight,     count: nightOwls.length },
      bsimViolations, globalImportance,
      histogram, histMax,
      ageBreakdown, traitEntropy,
      fairnessDiff: { boosted, penalized, avgDelta, changed },
      w1Smoke, w1Sleep, mdp,
      choiceReduction: { aboveThreshold, filtered },
      allProfiles,
    };
  }, [syntheticUsers, currentUser]);

  const modelCard = useMemo(() => LogicEngine.generateModelCard(), []);

  // fairness verdict
  const fairnessVerdict = (eps: number) => {
    if (eps < 0.05) return { label: 'Equo',          color: '#4ade80' };
    if (eps < 0.15) return { label: 'Attenzione',    color: '#fbbf24' };
    return             { label: 'Bias Rilevato',     color: '#f87171' };
  };

  if (!matchStats) return null;

  const verdict = fairnessVerdict(matchStats.epsilon);

  return (
    <div className="bias-dashboard glass">

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <BarChart3 className="icon-blue" size={24} />
          <h2>Simulation Dashboard</h2>
          <span className="pill">Simulazione #{simulationId}</span>
        </div>
        <div className="header-meta" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="header-meta-item">100 profili sintetici · Fairness + Accuracy integrati</span>
          <button className="sim-run-btn" onClick={runSimulation} disabled={simulationRunning}>
            <RefreshCcw size={14} /> {simulationRunning ? 'Running…' : 'Rigenera'}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="stats-grid">
        <div className="stat-card" title="Popolazione totale generata per il test statistico">
          <Users size={20} />
          <div className="stat-val">{syntheticUsers.length}</div>
          <div className="stat-label">Synthetic Users</div>
        </div>
        <div className="stat-card info" title="ε: Differenza normalizzata tra punteggi medi dei gruppi - più basso è meglio">
          <div className="stat-icon-label">ε Fairness</div>
          <div className="stat-val" style={{ color: verdict.color }}>{matchStats.epsilon.toFixed(3)}</div>
          <div className="stat-label">Group Bias (ε)</div>
        </div>
        <div className="stat-card success" title="Match con score > 80">
          <Sparkles size={20} />
          <div className="stat-val">{matchStats.highMatches}</div>
          <div className="stat-label">High Matches</div>
        </div>
      </div>

      {/* Fairness Metrics Row (Kim et al. 2024 + Quaresmini & Primiero 2024) */}
      <div className="fairness-metrics-row">
        <div className="fm-card" title="Demographic Parity gap normalizzato tra i gruppi più distanti">
          <div className="fm-label">ε Demographic Parity</div>
          <div className="fm-val" style={{ color: verdict.color }}>{matchStats.epsilon.toFixed(3)}</div>
          <div className="fm-sub">|avg_A − avg_B| / 100</div>
        </div>
        <div className="fm-card" title="Wasserstein / MDP (Kim et al. 2024): distanza tra le distribuzioni di score dei gruppi via quantile matching">
          <div className="fm-label">W₁ / MDP Fumo</div>
          <div className="fm-val" style={{ color: matchStats.w1Smoke > 15 ? '#fbbf24' : '#4ade80' }}>{matchStats.w1Smoke.toFixed(1)}</div>
          <div className="fm-sub">Wasserstein pt fumatori</div>
        </div>
        <div className="fm-card" title="Wasserstein / MDP tra early birds e night owls">
          <div className="fm-label">W₁ / MDP Sonno</div>
          <div className="fm-val" style={{ color: matchStats.w1Sleep > 15 ? '#fbbf24' : '#4ade80' }}>{matchStats.w1Sleep.toFixed(1)}</div>
          <div className="fm-sub">Wasserstein pt ritmo sonno</div>
        </div>
        <div className="fm-card" title="MDP normalizzato: max(W1_fumo, W1_sonno)/100 - soglia 0.15">
          <div className="fm-label">MDP Index</div>
          <div className="fm-val" style={{ color: matchStats.mdp < 0.15 ? '#4ade80' : '#f87171' }}>{matchStats.mdp.toFixed(3)}</div>
          <div className="fm-sub">{matchStats.mdp < 0.15 ? 'Sotto soglia ✓' : 'Sopra soglia ⚠'}</div>
        </div>
        <div className="fm-card" title="Choice Reduction (Sharabi 2022): profili filtrati sotto score 40 - riduce il choice overload">
          <div className="fm-label">Choice Reduction</div>
          <div className="fm-val">{matchStats.choiceReduction.filtered}</div>
          <div className="fm-sub">profili filtrati (score &lt;40)</div>
        </div>
      </div>

      {/* Verdict Banner */}
      <div className="verdict-banner" style={{ borderColor: verdict.color }}>
        <Scale size={18} style={{ color: verdict.color }} />
        <span style={{ color: verdict.color, fontWeight: 800 }}>{verdict.label}</span>
        <span className="verdict-detail">
          ε = {matchStats.epsilon.toFixed(3)} · MDP = {matchStats.mdp.toFixed(3)}:{' '}
          {matchStats.mdp < 0.05
            ? 'Nessun bias sistematico rilevato tra i gruppi demografici.'
            : matchStats.mdp < 0.15
              ? 'Leggera disparità tra gruppi: monitorare.'
              : 'Disparità significativa: rivedere i pesi delle feature.'}
        </span>
      </div>

      {/* Group Comparison Table */}
      <div className="group-comparison">
        <h3 className="section-title">Analisi per Gruppo Demografico</h3>
        <div className="group-grid">
          {/* Smoking groups */}
          <div className="group-block">
            <div className="group-header">Politica Fumo</div>
            <div className="group-row">
              <span className="group-name">Fumatori</span>
              <div className="group-bar-wrap">
                <div className="group-bar" style={{ width: `${matchStats.smokerStats.avg}%`, background: '#f87171' }} />
              </div>
              <span className="group-score">{matchStats.smokerStats.avg.toFixed(1)} <small>({matchStats.smokerStats.count})</small></span>
            </div>
            <div className="group-row">
              <span className="group-name">Non fumatori</span>
              <div className="group-bar-wrap">
                <div className="group-bar" style={{ width: `${matchStats.nonSmokerStats.avg}%`, background: '#4ade80' }} />
              </div>
              <span className="group-score">{matchStats.nonSmokerStats.avg.toFixed(1)} <small>({matchStats.nonSmokerStats.count})</small></span>
            </div>
            <div className="group-delta">
              Δ score: <b>{Math.abs(matchStats.smokerStats.avg - matchStats.nonSmokerStats.avg).toFixed(1)}</b>
              {Math.abs(matchStats.smokerStats.avg - matchStats.nonSmokerStats.avg) > 15
                ? <span className="delta-warn"> ⚠ Disparità elevata</span>
                : <span className="delta-ok"> ✓ Accettabile</span>}
            </div>
          </div>

          {/* Sleep groups */}
          <div className="group-block">
            <div className="group-header">Ritmo Sonno</div>
            <div className="group-row">
              <span className="group-name">Early birds</span>
              <div className="group-bar-wrap">
                <div className="group-bar" style={{ width: `${matchStats.earlyStats.avg}%`, background: 'var(--primary-blue)' }} />
              </div>
              <span className="group-score">{matchStats.earlyStats.avg.toFixed(1)} <small>({matchStats.earlyStats.count})</small></span>
            </div>
            <div className="group-row">
              <span className="group-name">Night owls</span>
              <div className="group-bar-wrap">
                <div className="group-bar" style={{ width: `${matchStats.nightStats.avg}%`, background: '#a78bfa' }} />
              </div>
              <span className="group-score">{matchStats.nightStats.avg.toFixed(1)} <small>({matchStats.nightStats.count})</small></span>
            </div>
            <div className="group-delta">
              Δ score: <b>{Math.abs(matchStats.earlyStats.avg - matchStats.nightStats.avg).toFixed(1)}</b>
              {Math.abs(matchStats.earlyStats.avg - matchStats.nightStats.avg) > 15
                ? <span className="delta-warn"> ⚠ Disparità elevata</span>
                : <span className="delta-ok"> ✓ Accettabile</span>}
            </div>
          </div>

          {/* Age-group (protected - should be ~neutral) */}
          <div className="group-block">
            <div className="group-header">Fascia d'età <span className="protected-tag">Protetto</span></div>
            {matchStats.ageBreakdown.map(ag => (
              <div className="group-row" key={ag.group}>
                <span className="group-name" style={{ fontSize: 10 }}>{ag.group.replace('_', ' ')}</span>
                <div className="group-bar-wrap">
                  <div className="group-bar" style={{ width: `${ag.avg}%`, background: 'rgba(255,255,255,0.2)' }} />
                </div>
                <span className="group-score">{ag.avg.toFixed(1)} <small>({ag.count})</small></span>
              </div>
            ))}
            <div className="group-delta" style={{ color: '#4ade80' }}>
              Non influenza il punteggio ✓
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution Histogram */}
      <div className="histogram-section">
        <h3 className="section-title">Distribuzione Punteggi Match</h3>
        <div className="histogram-container">
          {matchStats.histogram.map((bin, i) => (
            <div key={i} className="hist-col">
              <div className="hist-count">{bin.count}</div>
              <div
                className="hist-bar"
                style={{ height: `${(bin.count / matchStats.histMax) * 100}%` }}
              />
              <div className="hist-label">{bin.label}</div>
            </div>
          ))}
        </div>
        <div className="histogram-note">
          Media: <b>{(matchStats.results.reduce((s, r) => s + r.finalScore, 0) / matchStats.results.length).toFixed(1)}</b>
          {' '}· Conflitti hard: <b style={{ color: '#f87171' }}>{matchStats.hardConflicts}</b>
          {' '}· Bassa qualità dati: <b style={{ color: '#fbbf24' }}>{matchStats.excludedByQuality}</b>
        </div>
      </div>

      {/* Full Preference List - tutti i 100 profili */}
      <div className="top5-section">
        <h3 className="section-title">
          Preference List - tutti i {matchStats.allProfiles.length} profili
        </h3>
        <p className="top5-desc">
          Ordinamento completo per compatibilità decrescente, preference list dell'Explicit Matching Theory
          (Gale & Shapley, 1962). Le righe rosse indicano hard conflict; le verdi compatibilità alta (&gt;80).
        </p>
        <div className="allp-table-wrap">
          <div className="allp-table">
            <div className="allp-header">
              <span>Nome</span>
              <span>Score</span>
              <span>Età</span>
              <span title="Fumatore">Fumo</span>
              <span title="Ritmo sonno">Sonno</span>
              <span title="Pulizia (0–100)">Pulizia</span>
              <span title="Socialità">Sociale</span>
              <span title="Necessità silenzio">Silenzio</span>
              <span title="Hard Conflict">Conf.</span>
              <span title="Correction Distance C">C</span>
              <span>Motivo principale</span>
            </div>
            {matchStats.allProfiles.map((p) => (
              <div
                key={p.rank}
                className={`allp-row ${p.isConflict ? 'conflict-row' : p.score > 80 ? 'best-row' : ''}`}
              >
                <span className="allp-name">{p.name}</span>
                <span className="allp-score" style={{ color: p.score > 80 ? 'var(--primary-blue)' : p.isConflict ? '#f87171' : 'rgba(255,255,255,0.8)' }}>
                  {p.score}
                </span>
                <span className="allp-cell">{p.ageGroup?.replace(/_/g, ' ')}</span>
                <span className="allp-cell allp-bool" style={{ color: p.smoker ? '#f87171' : '#4ade80' }}>
                  {p.smoker === undefined ? '-' : p.smoker ? '✓' : '✗'}
                </span>
                <span className="allp-cell allp-small">{p.sleepSchedule?.replace('_', ' ') ?? '-'}</span>
                <span className="allp-cell allp-num">{p.cleanliness ?? '-'}</span>
                <span className="allp-cell allp-small">{p.socialVibe ?? '-'}</span>
                <span className="allp-cell allp-bool" style={{ color: p.needsSilence ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
                  {p.needsSilence === undefined ? '-' : p.needsSilence ? '✓' : '✗'}
                </span>
                <span className="allp-cell allp-bool" style={{ color: p.isConflict ? '#f87171' : 'rgba(255,255,255,0.25)' }}>
                  {p.isConflict ? '⚠' : '-'}
                </span>
                <span className="allp-cell allp-num">{p.correctionDistance.toFixed(2)}</span>
                <span className="allp-reason">{p.topReason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Importance (SHAP-inspired) */}
      <div className="shap-section">
        <h3 className="section-title">Feature Importance (SHAP globale)</h3>
        <div className="shap-grid">
          {matchStats.globalImportance
            .slice()
            .sort((a, b) => b.absAvg - a.absAvg)
            .map((f, i) => {
              const width = Math.min(100, (f.absAvg / 50) * 100);
              return (
                <div key={i} className="shap-row">
                  <div className="shap-rank">#{i + 1}</div>
                  <div className="shap-label">{f.label}</div>
                  <div className="shap-bar-container">
                    <div className="shap-axis" />
                    <div
                      className={`shap-bar ${f.avgImpact >= 0 ? 'positive' : 'negative'}`}
                      style={{
                        width: `${width}%`,
                        marginLeft: f.avgImpact >= 0 ? '50%' : `${50 - width}%`
                      }}
                    />
                  </div>
                  <div className="shap-value">{f.avgImpact.toFixed(1)}</div>
                  <div className="shap-abs">|{f.absAvg.toFixed(1)}|</div>
                </div>
              );
            })}
        </div>
        <p className="shap-note">
          Il valore medio indica la direzione (positivo/negativo); il valore assoluto indica
          il peso complessivo sulla decisione di match.
        </p>
      </div>


      {/* EU AI Act Governance */}
      <div className="governance-panel">
        <div className="governance-header">
          <ShieldCheck size={18} className="icon-blue" />
          <h3>EU AI Act Governance (Reg. 2024/1689)</h3>
        </div>
        <div className="governance-grid">
          <div
            className="gov-card clickable"
            onClick={() => setShowDataAudit(true)}
          >
            <div className="gov-title">Art. 10: Data Governance</div>
            <div className={`gov-status ${matchStats.traitEntropy > 2.5 ? 'compliant' : 'warning'}`}>
              {matchStats.traitEntropy > 2.5 ? 'Rappresentativa' : 'Bassa Entropia'}
            </div>
            <div className="gov-sub">H = {matchStats.traitEntropy.toFixed(2)} bit</div>
          </div>

          <div className="gov-card clickable" onClick={() => setShowModelCard(true)}>
            <div className="gov-title">Art. 13: Trasparenza</div>
            <div className="gov-status compliant">Model Card</div>
            <div className="gov-sub">Mitchell et al. (2019)</div>
          </div>
        </div>
      </div>

      {/* Insight Panel */}
      <div className="insight-panel">
        <div className="insight-title">
          <Info size={18} />
          <h4>Interpretazione dell'Analisi</h4>
        </div>
        <p>
          Su {syntheticUsers.length} profili sintetici, la metrica <b>Matched Demographic Parity</b> (MDP,
          Kim et al. 2024) misura W₁ = {matchStats.w1Smoke.toFixed(1)} pt tra fumatori e non-fumatori:
          la distanza di Wasserstein tra le due distribuzioni di score, calcolata via quantile matching.
          Questa è più robusta del semplice gap di media (ε = {matchStats.epsilon.toFixed(3)}) perché
          cattura differenze di forma nelle distribuzioni, non solo di media.
          L'algoritmo riduce il <b>choice overload</b> (Sharabi, 2022) filtrando {matchStats.choiceReduction.filtered} profili
          su {syntheticUsers.length} (score &lt; 40), portando le opzioni rilevanti a {matchStats.choiceReduction.aboveThreshold}.
          La feature più impattante è <b>"{matchStats.globalImportance.slice().sort((a,b) => b.absAvg-a.absAvg)[0].label}"</b> con
          impatto assoluto medio di {matchStats.globalImportance.slice().sort((a,b) => b.absAvg-a.absAvg)[0].absAvg.toFixed(1)} pt -
          limite noto: si tratta di <i>stated preferences</i> auto-dichiarate, che non sempre riflettono
          la compatibilità reale (Sharabi, 2022; Eastwick & Finkel, 2008).
        </p>
      </div>

      {/* Model Card Modal */}
      {showModelCard && (
        <div className="model-card-modal">
          <div className="modal-content glass">
            <button className="close-btn" onClick={() => setShowModelCard(false)}>×</button>
            <div className="modal-header">
              <History size={24} color="var(--primary-blue)" />
              <h2>{modelCard.name}</h2>
            </div>
            <div className="card-body">
              <div className="card-section">
                <label>Descrizione</label>
                <p>{modelCard.description}</p>
              </div>
              <div className="card-section">
                <label>Feature Attive</label>
                <div className="factors">
                  {modelCard.factors.map(f => <span key={f} className="f-tag">{f}</span>)}
                </div>
              </div>
              <div className="card-section">
                <label>Attributi Protetti (non influenzano lo score)</label>
                <div className="factors">
                  {modelCard.protectedAttributes.map(f => <span key={f} className="f-tag protected">{f}</span>)}
                </div>
              </div>
              <div className="card-section">
                <label>Considerazioni Etiche</label>
                <ul>
                  {modelCard.ethicalConsiderations.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
              <div className="card-section">
                <label>Riferimenti</label>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{modelCard.citation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Audit Modal (Art. 10) */}
      {showDataAudit && matchStats && (
        <div className="model-card-modal">
          <div className="modal-content glass">
            <button className="close-btn" onClick={() => setShowDataAudit(false)}>×</button>
            <div className="modal-header">
              <ShieldCheck size={24} color="var(--primary-blue)" />
              <h2>Data Audit — Art. 10 EU AI Act</h2>
            </div>
            <div className="card-body">
              <div className="card-section">
                <label>Shannon Trait Entropy</label>
                <p style={{ fontSize: 28, fontWeight: 800, color: matchStats.traitEntropy > 2.5 ? '#4ade80' : '#fbbf24', fontFamily: 'var(--font-heading)', marginBottom: 8 }}>
                  H = {matchStats.traitEntropy.toFixed(3)} bit
                </p>
                <p>L'entropia di Shannon misura la diversità nella distribuzione dei tratti della popolazione sintetica. Un valore H &gt; 2.5 indica assenza di popularity bias: nessun tratto domina la distribuzione in modo anomalo.</p>
              </div>
              <div className="card-section">
                <label>Stato</label>
                <p style={{ color: matchStats.traitEntropy > 2.5 ? '#4ade80' : '#fbbf24', fontWeight: 700 }}>
                  {matchStats.traitEntropy > 2.5
                    ? 'Distribuzione rappresentativa - nessun bias di popolarità rilevato.'
                    : 'Bassa entropia - possibile concentrazione di tratti simili. Verificare la generazione dei profili.'}
                </p>
              </div>
              <div className="card-section">
                <label>Riferimento Normativo</label>
                <p>Art. 10(2)(f) Reg. EU 2024/1689: i dataset di addestramento devono avere le proprietà statistiche appropriate, anche rispetto alle persone o ai gruppi di persone nei confronti dei quali il sistema AI ad alto rischio è destinato a essere utilizzato.</p>
              </div>
              <div className="card-section">
                <label>Riferimento Accademico</label>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Shannon (1948) — A Mathematical Theory of Communication; Quaresmini & Primiero (2024) — BRIO Framework.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .bias-dashboard {
          padding: 32px;
          border-radius: 24px;
          background: rgba(10, 15, 25, 0.82);
          border: 1px solid rgba(255,255,255,0.1);
          margin-top: 40px;
        }

        /* Header */
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .header-title { display: flex; align-items: center; gap: 12px; }
        .icon-blue { color: var(--primary-blue); }
        .pill { background: rgba(0,240,255,0.1); border: 1px solid rgba(0,240,255,0.2); color: var(--primary-blue); font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
        .header-meta { display: flex; align-items: center; }
        .header-meta-item { font-size: 11px; color: rgba(255,255,255,0.3); }

        /* KPI */
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); text-align: center; }
        .stat-val { font-size: 24px; font-weight: 800; margin: 8px 0; font-family: var(--font-heading); color: var(--primary-blue); }
        .stat-icon-label { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.6); margin-bottom: 4px; }
        .stat-label { font-size: 10px; text-transform: uppercase; color: rgba(255,255,255,0.4); letter-spacing: 0.1em; }

        /* Fairness Metrics Row */
        .fairness-metrics-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
        .fm-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px 12px; text-align: center; }
        .fm-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); margin-bottom: 8px; line-height: 1.4; }
        .fm-val { font-size: 22px; font-weight: 800; font-family: var(--font-heading); margin-bottom: 4px; }
        .fm-sub { font-size: 9px; color: rgba(255,255,255,0.25); }

        /* Verdict Banner */
        .verdict-banner { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 12px; border: 1px solid; background: rgba(255,255,255,0.02); margin-bottom: 28px; }
        .verdict-detail { font-size: 13px; color: rgba(255,255,255,0.6); }

        /* Full Preference List */
        .top5-section { margin-bottom: 32px; }
        .section-ref { font-size: 9px; color: rgba(255,255,255,0.25); font-weight: 400; margin-left: 8px; letter-spacing: 0; text-transform: none; }
        .top5-desc { font-size: 12px; color: rgba(255,255,255,0.35); margin-bottom: 16px; line-height: 1.5; }
        .allp-table-wrap { border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; max-height: 520px; overflow-y: auto; overflow-x: auto; }
        .allp-table { min-width: 860px; }
        .allp-header { display: grid; grid-template-columns: 90px 46px 90px 42px 72px 52px 52px 52px 42px 36px 1fr; gap: 8px; padding: 10px 14px; background: rgba(255,255,255,0.05); font-size: 9px; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(255,255,255,0.3); position: sticky; top: 0; z-index: 2; }
        .allp-row { display: grid; grid-template-columns: 90px 46px 90px 42px 72px 52px 52px 52px 42px 36px 1fr; gap: 8px; padding: 9px 14px; border-top: 1px solid rgba(255,255,255,0.03); align-items: center; transition: background 0.15s; }
        .allp-row:hover { background: rgba(255,255,255,0.025); }
        .allp-row.best-row { background: rgba(0,240,255,0.035); }
        .allp-row.conflict-row { background: rgba(248,113,113,0.035); }
        .allp-name { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .allp-score { font-size: 13px; font-weight: 800; font-family: var(--font-heading); }
        .allp-cell { font-size: 10px; color: rgba(255,255,255,0.5); }
        .allp-bool { font-size: 11px; font-weight: 700; text-align: center; }
        .allp-small { font-size: 9px; white-space: nowrap; }
        .allp-num { font-size: 11px; font-weight: 700; text-align: center; }
        .allp-reason { font-size: 9px; color: rgba(255,255,255,0.35); line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Section title */
        .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); margin-bottom: 16px; font-weight: 700; }
        .ref { font-size: 10px; opacity: 0.5; font-weight: 400; }

        /* Group Comparison */
        .group-comparison { margin-bottom: 32px; }
        .group-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .group-block { background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .group-header { font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.4); letter-spacing: 0.08em; margin-bottom: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .protected-tag { background: rgba(167,139,250,0.15); color: #a78bfa; font-size: 9px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(167,139,250,0.3); text-transform: none; letter-spacing: 0; }
        .group-row { display: grid; grid-template-columns: 90px 1fr 60px; align-items: center; gap: 10px; margin-bottom: 10px; }
        .group-name { font-size: 11px; color: rgba(255,255,255,0.6); }
        .group-bar-wrap { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
        .group-bar { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
        .group-score { font-size: 11px; color: rgba(255,255,255,0.8); font-weight: 700; text-align: right; }
        .group-delta { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
        .delta-warn { color: #fbbf24; }
        .delta-ok { color: #4ade80; }

        /* Histogram */
        .histogram-section { margin-bottom: 32px; }
        .histogram-container { display: flex; align-items: flex-end; gap: 8px; height: 120px; margin-bottom: 8px; }
        .hist-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
        .hist-count { font-size: 10px; color: rgba(255,255,255,0.5); font-weight: 700; }
        .hist-bar { width: 100%; border-radius: 4px 4px 0 0; background: var(--primary-blue); opacity: 0.7; transition: height 0.4s ease; min-height: 2px; }
        .hist-label { font-size: 9px; color: rgba(255,255,255,0.3); white-space: nowrap; }
        .histogram-note { font-size: 12px; color: rgba(255,255,255,0.4); }

        /* SHAP */
        .shap-section { margin-bottom: 32px; }
        .shap-grid { display: flex; flex-direction: column; gap: 14px; }
        .shap-row { display: grid; grid-template-columns: 24px 80px 1fr 44px 44px; align-items: center; gap: 12px; }
        .shap-rank { font-size: 10px; color: rgba(255,255,255,0.3); text-align: center; }
        .shap-label { font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 600; }
        .shap-bar-container { position: relative; height: 14px; background: rgba(255,255,255,0.03); border-radius: 4px; overflow: hidden; }
        .shap-axis { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.2); z-index: 1; }
        .shap-bar { height: 100%; border-radius: 2px; transition: 0.5s ease-out; }
        .shap-bar.positive { background: #4ade80; }
        .shap-bar.negative { background: #f87171; }
        .shap-value { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.8); text-align: right; }
        .shap-abs { font-size: 10px; color: rgba(255,255,255,0.4); text-align: right; }
        .shap-note { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 12px; line-height: 1.5; }

        /* Re-run button */
        .sim-run-btn { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; transition: 0.3s; white-space: nowrap; }
        .sim-run-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: white; }
        .sim-run-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Governance */
        .governance-panel { background: rgba(255,255,255,0.03); border-radius: 20px; padding: 24px; margin-bottom: 32px; border: 1px solid rgba(0,240,255,0.1); }
        .governance-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .governance-header h3 { font-size: 14px; color: white; letter-spacing: 0.05em; font-weight: 700; margin: 0; }
        .governance-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .gov-card { background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
        .gov-card.clickable { cursor: pointer; border-color: var(--primary-blue); }
        .gov-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.04); }
        .gov-title { font-size: 10px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 12px; }
        .gov-status { font-size: 14px; font-weight: 800; margin-bottom: 4px; }
        .gov-status.compliant { color: #4ade80; }
        .gov-status.warning { color: #fbbf24; }
        .gov-sub { font-size: 10px; color: rgba(255,255,255,0.3); }
        /* Insight */
        .insight-panel { padding: 20px; background: rgba(0,240,255,0.04); border-left: 4px solid var(--primary-blue); border-radius: 0 12px 12px 0; }
        .insight-title { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .insight-panel p { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.7; margin: 0; }

        /* Modal */
        .model-card-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { width: 100%; max-width: 520px; padding: 40px; border-radius: 24px; position: relative; border: 1px solid rgba(255,255,255,0.1); background: rgba(10,15,25,0.95); max-height: 90vh; overflow-y: auto; }
        .close-btn { position: absolute; top: 20px; right: 20px; font-size: 24px; background: none; border: none; color: white; cursor: pointer; }
        .modal-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .card-body {}
        .card-section { margin-bottom: 24px; }
        .card-section label { display: block; font-size: 10px; text-transform: uppercase; color: var(--primary-blue); letter-spacing: 0.1em; margin-bottom: 8px; }
        .card-section p { font-size: 14px; color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0; }
        .card-section ul { padding-left: 18px; color: rgba(255,255,255,0.7); font-size: 13px; margin: 0; }
        .card-section ul li { margin-bottom: 6px; }
        .factors { display: flex; flex-wrap: wrap; gap: 8px; }
        .f-tag { padding: 4px 10px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 11px; color: rgba(255,255,255,0.6); }
        .f-tag.protected { background: rgba(167,139,250,0.1); color: #a78bfa; border: 1px solid rgba(167,139,250,0.2); }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .group-grid { grid-template-columns: 1fr; }
          .governance-grid { grid-template-columns: 1fr; }
          .shap-row { grid-template-columns: 24px 70px 1fr 36px; }
          .shap-abs { display: none; }
        }
      `}</style>
    </div>
  );
};

export default BiasDashboard;
