
/**
 * QualityMonitor.ts
 * Implements the 4 Dimensions of Data Quality from Prof. Giuseppe Primiero's research.
 */

import type { RoommateProfile, LogicAtom } from './LogicEngine';

export interface QualityReport {
  // Computational Interpretation (Def p. 119)
  computational: {
    completeness: number;
    timeliness: number;
  };
  // Representational Interpretation (Def p. 123)
  representational: {
    consistency: number;
    reliability: number;
  };
  overallScore: number;
  issues: string[];
}

export class QualityMonitor {
  static evaluateProfile(_profile: Partial<RoommateProfile>, atoms: LogicAtom[]): QualityReport {
    const requiredKeys = ['cleanliness', 'sleep_schedule', 'smoker', 'social_vibe'];
    const presentKeys = atoms.filter(a => requiredKeys.includes(a.key) && a.value !== undefined && a.value !== null);
    
    // Computational factors: purely structural
    const completeness = (presentKeys.length / requiredKeys.length) * 100;
    const timeliness = 95; // Assume data IS fresh for this mock
    
    // Representational factors: meaning and relationship to world
    let consistency = 100;
    if (atoms.find(a => a.key === 'needs_silence')?.value === true && atoms.find(a => a.key === 'social_vibe')?.value === 'high') {
      // Skewed representation detection
      consistency = 70;
    }
    
    // Reliability as weighted aggregate (Representational bias proxy)
    const reliability = (completeness * 0.4) + (consistency * 0.6);
    
    return { 
      computational: { completeness, timeliness },
      representational: { consistency, reliability },
      overallScore: (completeness + consistency + timeliness + reliability) / 4, 
      issues: [] 
    };
  }
}
