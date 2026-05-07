# Coinqui — AI-Powered Roommate Matching Platform

> **Logics for AI** — Final Project  
> A proof-theoretic, fairness-aware roommate matching system grounded in the BRIO framework (Quaresmini & Primiero, 2024).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Getting Started](#getting-started)
4. [Application Flow](#application-flow)
5. [Core Algorithm — The Logic Engine](#core-algorithm--the-logic-engine)
   - [Profile Representation as Logical Atoms](#profile-representation-as-logical-atoms)
   - [Hard Constraints](#hard-constraints)
   - [Soft Rules and Weighted Impacts](#soft-rules-and-weighted-impacts)
   - [User-Declared Importance Weights](#user-declared-importance-weights)
   - [Score Computation](#score-computation)
   - [Correction Distance (C)](#correction-distance-c)
   - [Informational Confidence (ξ)](#informational-confidence-ξ)
   - [SHAP-Inspired Feature Attributions](#shap-inspired-feature-attributions)
6. [Data Quality — QualityMonitor](#data-quality--qualitymonitor)
7. [Fairness & Bias Analytics — BiasDashboard](#fairness--bias-analytics--biasdashboard)
   - [Group Fairness — Epsilon (ε)](#group-fairness--epsilon-ε)
   - [Wasserstein Distance / MDP (Kim et al. 2024)](#wasserstein-distance--mdp-kim-et-al-2024)
   - [Individual Fairness — BSim (Def 104)](#individual-fairness--bsim-def-104)
   - [Shannon Entropy (Art. 10 EU AI Act)](#shannon-entropy-art-10-eu-ai-act)
   - [Choice Reduction (Sharabi, 2022)](#choice-reduction-sharabi-2022)
   - [Preference List (Gale & Shapley, 1962)](#preference-list-gale--shapley-1962)
   - [Age-Group Breakdown — Protected Attributes](#age-group-breakdown--protected-attributes)
8. [Synthetic Population — MockGenerator](#synthetic-population--mockgenerator)
9. [Theoretical Foundations & References](#theoretical-foundations--references)
10. [Project Structure](#project-structure)
11. [EU AI Act Compliance Notes](#eu-ai-act-compliance-notes)

---

## Project Overview

**Coinqui** is a mobile-first web application that connects people looking for a room (`CERCO`) with people offering one (`OFFRO`). Unlike simple filter-based platforms, Coinqui uses a **proof-theoretic logical engine** to compute compatibility scores based on lifestyle atoms, hard incompatibilities, and user-declared preference weights.

The project is built as a demonstration of applied logic in AI systems, specifically addressing:

- **Bias** — systematic disparities in scores across demographic groups
- **Risk** — hard logical conflicts that make cohabitation infeasible
- **Opacity** — explainability of every score through per-feature attributions

This maps directly to the **BRIO framework** introduced by Quaresmini & Primiero (2024).

---

## Technology Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Animations | GSAP 3 |
| Smooth Scroll | Lenis |
| Icons | Lucide React |
| Logic Engine | Pure TypeScript (no ML dependencies) |
| Styling | Inline CSS-in-JS (scoped per component) |

The matching and fairness analysis pipeline is implemented in **pure TypeScript** with no external AI/ML libraries — and this is a deliberate design choice, not a limitation.

A statistical ML model would have made this system a black box: scores would be hard to explain, hard constraints (e.g. a smoker in a no-smoking flat) could theoretically be overridden by the model's weights, and fairness metrics could not be formally grounded in definitions from the literature. With a proof-theoretic logic engine, every score is **exactly explainable** (feature attributions are precise, not SHAP approximations), hard constraints are **logically guaranteed** to never be violated, and fairness properties can be **formally measured and cited** — ε, W₁, BSim, Correction Distance all map directly to definitions in Quaresmini & Primiero (2024).

This is precisely the argument the BRIO framework makes: for high-stakes domains like housing access, transparency and formal correctness matter more than raw predictive power.

In a future production-ready version of Coinqui, ML components could be integrated — for example, to learn user preference weights from historical behaviour, to rank candidates beyond the rule-based score, or to detect emerging compatibility patterns at scale. The logical engine would remain as the hard-constraint layer and fairness auditor, with ML operating on top of it.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/danyelemariani/coinqui-logics-for-ai.git
cd coinqui-logics-for-ai

# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

The app runs at `http://localhost:5173` by default.

---

## Application Flow

```
Landing Page
    |
    |-- CERCO (Looking for a room)
    |       |
    |       +-- Quiz (10 steps: role, gender, age, smoke, pets,
    |               sleep, cleanliness, social, budget, weights)
    |                       |
    |                       +-- DiscoveryFeed (cards sorted by match score)
    |                               |
    |                               |-- Like / Dislike swipe cards
    |                               |-- Detail overlay (full room info)
    |                               |-- Analytics icon --> BiasDashboard
    |                               +-- Match Moment (triggers on 2nd like)
    |                                       +-- ChatUI (contextual conversation)
    |
    +-- OFFRO (Offering a room)
            +-- Same quiz flow adapted for hosts
```

The quiz collects both **categorical preferences** (lifestyle answers) and **importance weights** (0-100 sliders for cleanliness, silence, social life, shared interests), which directly influence the score calculation.

---

## Core Algorithm — The Logic Engine

**File:** `src/logic/LogicEngine.ts`

The engine is the heart of the project. It translates two user profiles into a compatibility score using a structured sequence of logical predicates.

### Profile Representation as Logical Atoms

Every profile is represented as a set of **logical atoms**:

```typescript
interface LogicAtom {
  key: string;                                        // e.g. 'smoker', 'cleanliness'
  value: boolean | number | string;                   // typed value
  label: string;                                      // human-readable label
  category: 'lifestyle' | 'personality' | 'requirements';
}
```

This is analogous to a **propositional database**: each atom is a ground fact about the individual. The match computation is essentially a proof search over these facts, checking whether pairs satisfy or violate a set of rules.

### Hard Constraints

Hard constraints represent **logical incompatibilities** — situations where cohabitation is structurally impossible regardless of user preferences.

#### Smoking Conflict

```
Predicate: NOT(I_me(Smokes) AND NOT(I_room(SmokeAllowed)))
Impact:    -100 (if violated)  |  +15 (if satisfied)
```

If a user is a smoker (`smoker = true`) and the room does not allow smoking (`smoking_allowed = false`), the match receives a critical penalty of **-100 points**. This is a **weight-independent** constraint: no user preference can attenuate it. It models an absolute binary incompatibility in the information state.

#### Cleanliness Critical Conflict

```
Predicate: |V(Clean_me) - V(Clean_other)| <= 20
Impact:    +15 (aligned)  |  -10 (moderate delta)  |  -100 (delta > 50, critical)
```

Cleanliness is represented as a continuous value 0-100. A delta above 50 is treated as a **critical conflict** (analogous to a hard constraint), penalizing the match by -100. This reflects the empirical finding that extreme cleanliness mismatches are a primary driver of roommate conflict.

### Soft Rules and Weighted Impacts

Soft rules contribute positive or negative impacts that **can be modulated** by user-declared weights.

#### Sleep Schedule Synergy

```
Predicate: I_me(Sleep) <-> I_other(Sleep)
Impact:    +15 (same schedule)  |  +5 (either is flexible)  |  -10 (conflict)
```

`flexible` is treated as **neutral-positive** (+5) because a person with a flexible schedule is genuinely compatible with any rhythm. This avoids the logical error of penalizing adaptable individuals as if they were mismatched.

#### Social / Silence Compatibility

```
Predicate: NOT(I_me(NeedsSilence) AND I_other(SocialVibe=High))
Impact:    -20 (conflict)  |  +10 (synergy)  |  +5 (neutral)
```

If a user needs silence and their potential roommate has a high social vibe, this is a soft conflict (-20). Unlike smoking, this is not absolute: some people tolerate it, so the user's silence weight can reduce the penalty.

### User-Declared Importance Weights

The quiz final step collects four sliders (0-100):

| Weight | Affects |
|---|---|
| `cleanliness` | Scales the cleanliness soft impact |
| `silence` | Scales the silence side of social/silence rule |
| `social` | Scales the social side of social/silence rule |
| `hobbies` | Reserved for future rule extensions |

**Normalisation formula:**

```
multiplier = weight / 50
```

- `weight = 50` → multiplier `1.0` (neutral, no change to impact)
- `weight = 100` → multiplier `2.0` (doubles the impact)
- `weight = 0` → multiplier `0.0` (ignores the dimension entirely)

**Critical rule: hard conflicts (impact <= -50) are NEVER attenuated by weights.** The guard is:

```typescript
const cleanImpact = cleanRes.impact <= -50
  ? cleanRes.impact                    // hard conflict: weight ignored
  : cleanRes.impact * wClean;          // soft impact: weight applied
```

This preserves the logical integrity of absolute incompatibilities while still allowing users to express nuanced preferences on soft dimensions.

### Score Computation

```
rawScore = 50 + smokeImpact + sleepImpact + cleanImpact + socialImpact
score    = clamp(round(rawScore), 1, 99)
```

The baseline is **50** (neutral), representing the prior assumption of moderate compatibility. Each rule then shifts the score up or down. The final score is clamped to **[1, 99]** — never 0% (no data) and never 100% (absolute certainty is epistemically unjustified).

### Correction Distance (C)

Defined in Quaresmini & Primiero (2024), Definition 99:

```typescript
correctionDistance = clamp(avgCompleteness * 0.55 + avgConsistency * 0.45, 0, 1)
```

The correction distance measures **how much we need to correct our inference** due to data quality issues. A value close to 1 means reliable data and trustworthy scores; a value close to 0 means the score should be treated with caution. It combines completeness (structural quality) and consistency (representational quality) with empirically weighted coefficients.

### Informational Confidence (ξ)

Defined in Quaresmini & Primiero (2024), Definition 95:

```typescript
confidence = (me.metadata.completeness + other.metadata.completeness) / 200
```

Confidence ξ represents the **epistemic weight** of the match inference — how well-supported the conclusion is by available information. It is the mean completeness of both profiles, normalised to [0, 1].

### SHAP-Inspired Feature Attributions

Every match result carries a `featureAttributions` record:

```typescript
featureAttributions: {
  'Fumo':    smokeImpact,    // exact contribution of the smoking rule
  'Sonno':   sleepImpact,    // exact contribution of the sleep rule
  'Pulizia': cleanImpact,    // weight-adjusted contribution
  'Sociale': socialImpact,   // weight-adjusted contribution
}
```

This provides **per-feature explainability** analogous to SHAP (SHapley Additive exPlanations) values, without requiring a trained model. Because the engine is fully rule-based, the attribution is exact (not approximate): each number is the precise delta that feature contributed to the final score.

---

## Data Quality — QualityMonitor

**File:** `src/logic/QualityMonitor.ts`

Implements the **4 Dimensions of Data Quality** from Prof. Giuseppe Primiero's research:

```
+-------------------------------------------------------+
|  Computational Interpretation (Def p. 119)            |
|    Completeness: fraction of required atoms present    |
|    Timeliness:   assumed fresh (95) for live data      |
+-------------------------------------------------------+
|  Representational Interpretation (Def p. 123)         |
|    Consistency:  100, reduced to 70 if contradictory   |
|                  atoms detected (e.g. needs_silence    |
|                  AND social_vibe=high simultaneously)  |
|    Reliability:  completeness*0.4 + consistency*0.6    |
+-------------------------------------------------------+
```

**Contradiction detection:** If a profile declares both `needs_silence = true` and `social_vibe = 'high'`, the consistency score drops to 70. This is a representational inconsistency — the information misrepresents the actual state of the world in a logically contradictory way.

The quality report is attached to every profile's `metadata` and feeds into the Correction Distance used in the match score.

---

## Fairness & Bias Analytics — BiasDashboard

**File:** `src/components/BiasDashboard.tsx`

Accessible via the chart icon in the discovery feed, the dashboard runs a **live simulation** over 100 synthetic profiles matched against the current user. It implements multiple fairness metrics from the academic literature.

### Group Fairness — Epsilon (ε)

```
ε = max( |avg_smokers - avg_nonSmokers|, |avg_earlyBirds - avg_nightOwls| ) / 100
```

ε measures the **normalised score gap** between the most disparate demographic groups. Three thresholds are applied:

| ε value | Verdict |
|---|---|
| < 0.05 | Equo (Fair) |
| 0.05 to 0.15 | Attenzione (Monitor) |
| > 0.15 | Bias Rilevato (Bias Detected) |

This is computed on **match scores** (the output), not on protected attributes (the input), in line with the outcome-based fairness definitions in Quaresmini & Primiero (2024).

### Wasserstein Distance / MDP (Kim et al. 2024)

The dashboard computes **W1 (1D Wasserstein / Earth Mover's Distance)** between the score distributions of two groups:

```
W1(P, Q) = integral |F_P(x) - F_Q(x)| dx
```

Computed via **quantile matching** (Proposition 3.5, Kim et al. 2024):

```typescript
static wassersteinDistance(a: number[], b: number[]): number {
  // Sort both arrays, resample to equal size via linear interpolation,
  // then average the absolute quantile differences.
  // Mathematically equivalent to W1 in 1D (Rachev & Ruschendorf, 1998).
}
```

This doubles as the **Matched Demographic Parity (MDP)** estimator when the transport map is the quantile/rank map. Computed for two group pairs:

- **W1 Fumo**: smokers vs. non-smokers score distributions
- **W1 Sonno**: early birds vs. night owls score distributions
- **MDP Index**: `max(W1_smoke, W1_sleep) / 100` — normalised to [0, 1]

### Individual Fairness — BSim (Def 104)

**Blind Similarity** checks that similar profiles receive similar correction distances:

```
For all pairs (i, j):
  if Jaccard(profile_i, profile_j) > 0.5
  then |C_i - C_j| should be <= 0.2
```

Jaccard similarity is computed over the **boolean and high-valued numeric atoms** of each profile:

```typescript
function jaccardSim(a: RoommateProfile, b: RoommateProfile): number {
  // Atoms included if: value === true OR (numeric AND value > 50)
  // Returns: intersection_size / union_size
}
```

Violations are counted. A high violation count indicates that the correction distance penalises similar profiles differently — a form of individual unfairness that the BRIO framework explicitly targets.

### Shannon Entropy (Art. 10 EU AI Act)

```
H(traits) = - sum( p_k * log2(p_k) )
```

Computed over all `key:value` atom pairs across the synthetic population. Higher entropy means a more diverse trait distribution, i.e., less **popularity bias** — the dataset does not over-represent certain lifestyle patterns. This is reported as the **Trait Entropy** metric and relates to the EU AI Act's Article 10 requirements on training data governance.

### Choice Reduction (Sharabi, 2022)

Profiles with a final score below 40 are considered effectively filtered out. The dashboard reports:

- **Above threshold (score >= 40):** profiles that remain as viable candidates
- **Filtered (score < 40):** profiles eliminated by the algorithm

This demonstrates the algorithm's role in reducing **choice overload** (Sharabi, 2022), narrowing an overwhelming candidate set to a manageable, relevant subset without requiring users to manually apply filters.

### Preference List (Gale & Shapley, 1962)

The dashboard renders the **full preference list** of all 100 synthetic profiles, sorted by compatibility score in descending order. Each entry shows:

- Rank, name, final score
- Age group, smoking status, sleep schedule, cleanliness level, social vibe
- Whether the pair is a hard conflict (highlighted in red)
- Top matching reason extracted from feature attributions

This implements the **Explicit Matching Theory** ordering (Gale & Shapley, 1962), providing a complete and fully transparent ranking over the candidate pool.

### Age-Group Breakdown — Protected Attributes

The protected attribute `age_group` (`student` / `young_professional` / `professional`) is tracked for demographic parity analysis. It is **deliberately excluded from scoring** — the engine never reads it during match computation — to prevent direct discrimination. The dashboard shows the average score per age group to verify that the algorithm produces equitable outcomes despite not using age as a feature.

---

## Synthetic Population — MockGenerator

**File:** `src/logic/MockGenerator.ts`

Generates N synthetic profiles for the fairness simulation. Each profile contains:

| Atom | Type | Distribution |
|---|---|---|
| `smoker` | boolean | ~20% true |
| `smoking_allowed` | boolean | ~30% true |
| `cleanliness` | number 0-100 | Uniform random |
| `sleep_schedule` | 'early_bird' / 'night_owl' | 50/50 |
| `social_vibe` | 'low' / 'medium' / 'high' | Uniform random |
| `needs_silence` | boolean | 50/50 |
| `age_group` | 'student' / 'young_professional' / 'professional' | Uniform — **protected attribute, never scored** |

After generating atoms, `QualityMonitor.evaluateProfile()` is called to compute `metadata` (completeness, consistency, reliability), which feeds directly into the Correction Distance used in fairness analysis.

---

## Theoretical Foundations & References

| Reference | Used For |
|---|---|
| **Quaresmini & Primiero (2024)** — *Information-Theoretic Fairness* | BRIO framework (Bias, Risk, Opacity); Correction Distance C (Def 99); Informational Confidence ξ (Def 95); Blind Similarity BSim (Def 103-104) |
| **Primiero (2023)** — *On the Foundations of Computing* | 4-dimension data quality model: Computational (pp. 119) and Representational (pp. 123) interpretations |
| **Kim et al. (2024)** | Wasserstein Distance as MDP estimator; quantile matching equivalence (Proposition 3.5); Matched Demographic Parity |
| **Mitchell et al. (2019)** — *Model Cards for Model Reporting* | Model card structure and ethical considerations |
| **Gale & Shapley (1962)** | Preference list ordering in Explicit Matching Theory |
| **Sharabi (2022)** | Choice overload in algorithmic matching; Choice Reduction metric |
| **Rachev & Rüschendorf (1998)** | Mathematical equivalence of quantile matching and W1 in 1D |
| **EU AI Act, Annex III** | High-risk system classification (housing access); Art. 10 (data governance); transparency obligations |

---

## Project Structure

```
coinqui-app/
├── public/
│   ├── coinqui-logo.png
│   ├── generic-avatar.png
│   └── room-eco.png
├── src/
│   ├── App.tsx                    # Root router: Landing -> Quiz -> Discovery -> Match -> Chat
│   ├── logic/
│   │   ├── LogicEngine.ts         # Core proof-theoretic matching engine (BRIO)
│   │   ├── QualityMonitor.ts      # 4-dimension data quality evaluation (Primiero)
│   │   └── MockGenerator.ts       # Synthetic profile generation for fairness simulation
│   └── components/
│       ├── Quiz.tsx               # 10-step onboarding (preferences + importance weights)
│       ├── DiscoveryFeed.tsx      # Swipe feed with scores from LogicEngine
│       ├── BiasDashboard.tsx      # Full fairness analytics dashboard
│       ├── MatchMoment.tsx        # Match celebration screen
│       ├── MatchExplainer.tsx     # Per-match score explainability panel
│       └── ChatUI.tsx             # Contextual chat with matched user
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## EU AI Act Compliance Notes

Coinqui is designed as a **high-risk AI system** under EU AI Act Annex III (access to housing services). The following design decisions directly address compliance requirements:

| Requirement | Implementation |
|---|---|
| **Transparency** | Every score comes with per-feature attributions (SHAP-style) and human-readable reason strings |
| **Data Governance (Art. 10)** | Shannon Entropy monitoring for dataset diversity; QualityMonitor for per-profile data quality |
| **Non-discrimination** | Protected attribute `age_group` is tracked and analysed but never used in scoring |
| **Human Oversight** | All matches are suggestions; the final decision is always the user's |
| **Explainability** | MatchExplainer component surfaces the exact logical reasoning behind every score |
| **Auditability** | BiasDashboard provides real-time fairness metrics across every simulation run |
| **Score Bounds** | Scores clamped to [1, 99] — the system never claims absolute certainty (100%) |

---

*Built with React 19 + TypeScript + Vite. Logic engine implemented entirely in TypeScript — no external AI/ML frameworks.*
