// app/src/conditionProfiles/index.ts

/**
 * Simple utilities for loading and validating condition profiles.
 * No external runtime dependencies – pure TypeScript.
 */

export interface AccessibilityPreset {
  fontSize: number;
  contrast: string;
  audioFirst: boolean;
  sessionLength: number;
  inputMode: string;
}

export interface ConditionProfile {
  id: string;
  displayName: string;
  targetPopulation: string;
  recommendedGames: string[];
  cognitiveDomains: string[];
  accessibilityPreset: AccessibilityPreset;
  metricsToShow: string[];
  safetyNotes: string;
  clinicalReviewStatus: 'unreviewed' | 'reviewed';
  additionalInfo?: Record<string, unknown>;
}

// Load all JSON files under `profiles/` using Vite's import.meta.glob.
// Vite will replace this with a map of paths to async import functions.
const profileModules = import.meta.glob('../../profiles/**/*.json', { eager: true }) as Record<
  string,
  ConditionProfile
>;

/** All profiles discovered at build time */
export const profiles: ConditionProfile[] = Object.values(profileModules);

/** Simple runtime validation – mirrors the schema but without external lib */
export function validateProfile(profile: unknown): profile is ConditionProfile {
  if (typeof profile !== 'object' || profile === null) return false;
  const p = profile as Record<string, unknown>;
  const requiredString = (key: string) => typeof p[key] === 'string';
  const requiredArray = (key: string) => Array.isArray(p[key]);
  const requiredNumber = (key: string) => typeof p[key] === 'number';
  const requiredBoolean = (key: string) => typeof p[key] === 'boolean';

  const basic =
    requiredString('id') &&
    requiredString('displayName') &&
    requiredString('targetPopulation') &&
    requiredArray('recommendedGames') &&
    requiredArray('cognitiveDomains') &&
    typeof p['accessibilityPreset'] === 'object' &&
    p['accessibilityPreset'] !== null &&
    requiredArray('metricsToShow') &&
    requiredString('safetyNotes') &&
    (p['clinicalReviewStatus'] === 'unreviewed' || p['clinicalReviewStatus'] === 'reviewed');

  if (!basic) return false;

  const ap = p['accessibilityPreset'] as Record<string, unknown>;
  const apValid =
    requiredNumber.call(ap, 'fontSize') &&
    requiredString.call(ap, 'contrast') &&
    requiredBoolean.call(ap, 'audioFirst') &&
    requiredNumber.call(ap, 'sessionLength') &&
    requiredString.call(ap, 'inputMode');
  return apValid;
}

/** Get a profile by its id */
export function getProfile(id: string): ConditionProfile | undefined {
  return profiles.find((p) => p.id === id);
}
