
/**
 * MockGenerator.ts
 * Generates N synthetic roommate profiles for bias/fairness simulation.
 * Includes a protected demographic attribute (age_group) not used in scoring.
 */

import type { RoommateProfile, LogicAtom } from './LogicEngine';
import { QualityMonitor } from './QualityMonitor';

const NAMES = [
  "Alessandro", "Beatrice", "Claudio", "Dania", "Edoardo",
  "Federica", "Giovanni", "Ilaria", "Luca", "Marta",
  "Nicolò", "Ornella", "Pietro", "Quirina", "Roberto",
  "Sara", "Tommaso", "Ursula", "Valentina", "Zeno"
];

const AGE_GROUPS: RoommateProfile['age_group'][] = ['student', 'young_professional', 'professional'];
const SOCIAL_VIBES = ['low', 'medium', 'high'] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class MockGenerator {
  static generateProfiles(count: number = 100): RoommateProfile[] {
    const profiles: RoommateProfile[] = [];

    for (let i = 0; i < count; i++) {
      const atoms: LogicAtom[] = [
        {
          key: 'smoker',
          value: Math.random() > 0.8,               // ~20% smokers
          label: 'Fumatore',
          category: 'lifestyle'
        },
        {
          key: 'smoking_allowed',
          value: Math.random() > 0.7,               // ~30% allow smoking
          label: 'Fumo ammesso',
          category: 'requirements'
        },
        {
          key: 'cleanliness',
          value: Math.floor(Math.random() * 100),   // 0–100 uniform
          label: 'Livello Pulizia',
          category: 'lifestyle'
        },
        {
          key: 'sleep_schedule',
          value: Math.random() > 0.5 ? 'early_bird' : 'night_owl',
          label: 'Sonno',
          category: 'lifestyle'
        },
        {
          key: 'social_vibe',
          value: pick(SOCIAL_VIBES),                // FIX: was always 'medium'
          label: 'Socialità',
          category: 'lifestyle'
        },
        {
          key: 'needs_silence',
          value: Math.random() > 0.5,
          label: 'Bisogno Silenzio',
          category: 'personality'
        }
      ];

      const report = QualityMonitor.evaluateProfile(
        { id: i, name: NAMES[i % NAMES.length] },
        atoms
      );

      profiles.push({
        id: `mock_${i}`,
        name: NAMES[i % NAMES.length] + ' ' + (i + 1),
        age_group: pick(AGE_GROUPS),               // protected attribute - not used in scoring
        atoms,
        metadata: {
          completeness: report.computational.completeness,
          consistency:  report.representational.consistency,
          reliability:  report.representational.reliability
        }
      });
    }

    return profiles;
  }
}
