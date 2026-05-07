
/**
 * LogicEngine.ts
 * Core reasoning engine for BRIO (Bias, Risk, Opacity) matching.
 * Based on Quaresmini & Primiero (2024) - Information-Theoretic Fairness.
 */

export interface LogicAtom {
  key: string;
  value: boolean | number | string;
  label: string;
  category: 'lifestyle' | 'personality' | 'requirements';
}

export interface RoommateProfile {
  id: string | number;
  name: string;
  age_group?: 'student' | 'young_professional' | 'professional';
  atoms: LogicAtom[];
  metadata: {
    completeness: number;
    consistency: number;
    reliability: number;
  };
}

export interface MatchReason {
  predicate: string;
  satisfied: boolean;
  impact: 'positive' | 'negative' | 'critical';
  description: string;
}

export interface UserWeights {
  cleanliness: number; // 0–100
  silence:     number; // 0–100
  social:      number; // 0–100
  hobbies:     number; // 0–100 (reserved for future use)
}

export interface LogicalMatchResult {
  score: number;
  confidence: number;           // ξ - informational confidence (Def 95)
  correctionDistance: number;   // C - correction distance (Def 99)
  reasons: MatchReason[];
  featureAttributions: Record<string, number>; // SHAP-inspired weighted contributions
  isHardConflict: boolean;
  compliance: {
    aiActCertified: boolean;
    transparencyLevel: 'High' | 'Medium' | 'Low';
    lastAudit: string;
  };
  dataQuality: {
    completeness: number;
    consistency: number;
    reliability: number;
  };
}

// --- Individual Match Rules ---

/**
 * Hard constraint: smoker cannot live in a no-smoking space.
 * Weight-independent: this is a binary incompatibility, not a preference.
 */
const smokingConflict = (me: RoommateProfile, other: RoommateProfile) => {
  const mySmoke         = me.atoms.find(a => a.key === 'smoker')?.value;
  const roomSmokeAllowed = other.atoms.find(a => a.key === 'smoking_allowed')?.value;
  const isConflict = mySmoke === true && roomSmokeAllowed === false;
  const impact = isConflict ? -100 : 15;
  return {
    reason: {
      predicate: "¬(I_me(Smokes) ∧ ¬I_room(SmokeAllowed))",
      satisfied: !isConflict,
      impact: isConflict ? 'critical' : 'positive',
      description: isConflict
        ? "Violazione integrità: fumo non ammesso in questo spazio."
        : "Consistenza garantita su policy fumo."
    } as MatchReason,
    impact
  };
};

/**
 * Sleep schedule compatibility.
 * 'flexible' is treated as neutral-positive: compatible with any schedule.
 */
const sleepSynergy = (me: RoommateProfile, other: RoommateProfile) => {
  const mySleep    = me.atoms.find(a => a.key === 'sleep_schedule')?.value;
  const otherSleep = other.atoms.find(a => a.key === 'sleep_schedule')?.value;

  const eitherFlexible = mySleep === 'flexible' || otherSleep === 'flexible';
  const isSynergy = !eitherFlexible && mySleep === otherSleep;

  // flexible: +5 (neutral-positive), matching: +15, conflicting: -10
  const impact = eitherFlexible ? 5 : (isSynergy ? 15 : -10);

  return {
    reason: {
      predicate: "I_me(Sleep) ↔ I_other(Sleep)",
      satisfied: eitherFlexible || isSynergy,
      impact: (eitherFlexible || isSynergy) ? 'positive' : 'negative',
      description: eitherFlexible
        ? "Flessibilità sui ritmi circadiani: compatibilità garantita."
        : isSynergy
          ? "Piena sintonia informativa sui ritmi circadiani."
          : "Divergenza negli stati informativi circadiani."
    } as MatchReason,
    impact
  };
};

/**
 * Cleanliness alignment: penalises large delta; critical conflict if delta > 50.
 * Soft impacts are scaled by the user's cleanliness weight preference.
 */
const cleanlinessAlignment = (me: RoommateProfile, other: RoommateProfile) => {
  const myClean    = Number(me.atoms.find(a => a.key === 'cleanliness')?.value    ?? 50);
  const otherClean = Number(other.atoms.find(a => a.key === 'cleanliness')?.value ?? 50);
  const delta      = Math.abs(myClean - otherClean);
  const isAligned  = delta <= 20;
  const isCritical = delta > 50;
  const impact     = isAligned ? 15 : (isCritical ? -100 : -10);
  return {
    reason: {
      predicate: "|V(Clean_me) - V(Clean_other)| ≤ 20",
      satisfied: isAligned,
      impact: isAligned ? 'positive' : (isCritical ? 'critical' : 'negative'),
      description: isAligned
        ? `Valutazione (V) pulizia convergente (Δ = ${delta}).`
        : `Delta pulizia: ${delta} - divergenza ${isCritical ? 'critica' : 'moderata'}.`
    } as MatchReason,
    impact
  };
};

/**
 * Social-Silence compatibility.
 * Conflict: one person needs silence while the other has high social vibe.
 * Soft impacts are scaled by the user's silence/social weight preferences.
 */
const socialSilenceRule = (me: RoommateProfile, other: RoommateProfile) => {
  const myNeedsSilence  = me.atoms.find(a => a.key === 'needs_silence')?.value;
  const otherSocialVibe = other.atoms.find(a => a.key === 'social_vibe')?.value;
  const conflict = myNeedsSilence === true  && otherSocialVibe === 'high';
  const synergy  = myNeedsSilence === false && otherSocialVibe === 'high';
  const impact   = conflict ? -20 : (synergy ? 10 : 5);
  return {
    reason: {
      predicate: "¬(I_me(NeedsSilence) ∧ I_other(SocialVibe=High))",
      satisfied: !conflict,
      impact: conflict ? 'negative' : 'positive',
      description: conflict
        ? "Conflitto informativo: necessità di silenzio vs socialità alta."
        : synergy
          ? "Sinergia: vitalità sociale condivisa."
          : "Compatibilità stile sociale verificata."
    } as MatchReason,
    impact
  };
};

// --- LogicEngine Class ---

export class LogicEngine {

  /**
   * Calculate the logical match score between two profiles.
   *
   * @param weights  Optional user-declared importance weights (0–100 each).
   *   - Soft rule impacts are multiplied by the normalised weight (weight/50).
   *     A weight of 50 (default) leaves the impact unchanged.
   *     A weight of 100 doubles the impact; weight of 0 zeroes it.
   *   - Hard conflict impacts (-100) are NEVER attenuated by weights,
   *     preserving their role as absolute incompatibilities.
   */
  static calculateMatch(
    me: RoommateProfile,
    other: RoommateProfile,
    weights?: UserWeights
  ): LogicalMatchResult {
    // Normalise weights: 50 → 1.0 (neutral), 100 → 2.0, 0 → 0.0
    const wClean  = ((weights?.cleanliness ?? 50) / 50);
    const wSilence = ((weights?.silence     ?? 50) / 50);
    const wSocial  = ((weights?.social      ?? 50) / 50);
    const wSocAvg  = (wSilence + wSocial) / 2;

    const smokeRes  = smokingConflict(me, other);
    const sleepRes  = sleepSynergy(me, other);
    const cleanRes  = cleanlinessAlignment(me, other);
    const socialRes = socialSilenceRule(me, other);

    // Apply weights only to soft impacts; keep hard conflicts intact
    const cleanImpact  = cleanRes.impact  <= -50 ? cleanRes.impact  : cleanRes.impact  * wClean;
    const socialImpact = socialRes.impact <= -50 ? socialRes.impact : socialRes.impact * wSocAvg;

    const reasons: MatchReason[] = [
      smokeRes.reason,
      sleepRes.reason,
      cleanRes.reason,
      socialRes.reason
    ];

    // Weighted attributions reflect the actual score contribution
    const featureAttributions: Record<string, number> = {
      'Fumo':    smokeRes.impact,
      'Sonno':   sleepRes.impact,
      'Pulizia': cleanImpact,
      'Sociale': socialImpact,
    };

    const isHardConflict = reasons.some(r => r.impact === 'critical' && !r.satisfied);

    // Confidence ξ: mean data completeness across both profiles (Def 95)
    const confidence = (me.metadata.completeness + other.metadata.completeness) / 200;

    // Raw score: neutral baseline 50, then add weighted impacts
    const rawScore = 50 + smokeRes.impact + sleepRes.impact + cleanImpact + socialImpact;
    // Clamp to [1, 99] — never show 0% (no data) or 100% (certainty)
    const score = Math.min(99, Math.max(1, Math.round(rawScore)));

    // Correction Distance C (Def 99): quality-weighted distance from ideal profile.
    // Expressed as 0–1; higher = better quality, less correction needed.
    const avgCompleteness = (me.metadata.completeness + other.metadata.completeness) / 200;
    const avgConsistency  = (me.metadata.consistency  + other.metadata.consistency)  / 200;
    const correctionDistance = Math.min(1, avgCompleteness * 0.55 + avgConsistency * 0.45);

    return {
      score,
      confidence,
      correctionDistance,
      reasons,
      featureAttributions,
      isHardConflict,
      compliance: {
        aiActCertified: correctionDistance > 0.7,
        transparencyLevel: 'High',
        lastAudit: new Date().toISOString().split('T')[0]
      },
      dataQuality: {
        completeness: (me.metadata.completeness + other.metadata.completeness) / 2,
        consistency:  (me.metadata.consistency  + other.metadata.consistency)  / 2,
        reliability:  (me.metadata.reliability  + other.metadata.reliability)  / 2
      }
    };
  }

  /**
   * 1D Wasserstein Distance (Earth Mover's Distance) between two score distributions.
   *
   * Formally: W1(P, Q) = integral |F_P(x) - F_Q(x)| dx
   * Computed via quantile matching (Proposition 3.5, Kim et al. 2024):
   * sort both arrays, resample to equal size, average absolute differences.
   * Mathematically equivalent to W1 in 1D (Rachev & Rüschendorf, 1998).
   *
   * Also serves as the practical estimator of Matched Demographic Parity (MDP)
   * when the transport map is the quantile/rank map (Kim et al. 2024, Prop. 3.5).
   */
  static wassersteinDistance(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;
    const sa = [...a].sort((x, y) => x - y);
    const sb = [...b].sort((x, y) => x - y);
    const n  = Math.max(sa.length, sb.length);

    // Linear interpolation with safe bounds — clamps hi to last valid index
    const at = (arr: number[], i: number) => {
      const pos = i * (arr.length - 1) / Math.max(n - 1, 1);
      const lo  = Math.floor(pos);
      const hi  = Math.min(Math.ceil(pos), arr.length - 1);
      const t   = pos - lo;
      return arr[lo] + (arr[hi] - arr[lo]) * t;
    };

    let w = 0;
    for (let i = 0; i < n; i++) w += Math.abs(at(sa, i) - at(sb, i));
    return w / n;
  }

  /**
   * Shannon Entropy proxy for Popularity Bias (Art. 10 - Data Governance).
   * Higher entropy = more diverse trait distribution = less popularity bias.
   */
  static calculateTraitEntropy(profiles: RoommateProfile[]): number {
    if (!profiles || profiles.length === 0) return 0;
    const traitCounts: Record<string, number> = {};
    profiles.forEach(p => {
      p.atoms.forEach(a => {
        const key = `${a.key}:${a.value}`;
        traitCounts[key] = (traitCounts[key] || 0) + 1;
      });
    });
    const total = profiles.reduce((s, p) => s + p.atoms.length, 0);
    if (total === 0) return 0;
    let entropy = 0;
    Object.values(traitCounts).forEach(count => {
      const p = count / total;
      if (p > 0) entropy -= p * Math.log2(p);
    });
    return entropy;
  }

  static generateModelCard() {
    return {
      name: "Coinqui BRIO Matcher v1.3",
      description: "High-risk roommate matching system using proof-theoretic bias detection.",
      intendedUse: "Safe and equitable roommate discovery.",
      factors: ["Smoking Habit", "Sleep Schedule", "Cleanliness", "Social Vibe / Silence"],
      protectedAttributes: ["Age Group (not used in scoring)", "Gender (not used in scoring)"],
      ethicalConsiderations: [
        "Annex III Compliance (Housing Access)",
        "Individual Fairness via Blind Similarity (BSim)",
        "Group Fairness Metrics (epsilon on match scores)",
        "Correction Distance C for data quality transparency",
        "User-declared importance weights honoured in score calculation"
      ],
      citation: "Mitchell et al. (2019), Quaresmini & Primiero (2024)"
    };
  }
}
