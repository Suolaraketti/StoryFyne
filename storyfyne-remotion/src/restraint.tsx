// ─── Restraint Engine ───────────────────────────────────────────────
// The #1 cause of cheap-looking video is too many simultaneous effects.
// This engine enforces hard limits so the output stays premium.
//
// Rules:
// 1. Max 1 animated UI element entering per frame
// 2. Statement scenes get ZERO ambient effects (no particles, no glow)
// 3. Cinematic effects are global and subtle — never per-element
// 4. Motion has weight (spring physics) — never random jitter
// 5. Most frames are static. Motion happens at boundaries.

export interface EffectBudget {
  ambientEffects: boolean;      // particles, floating orbs, etc.
  textAnimation: boolean;       // kinetic type, scramble, etc.
  cinematicOverlay: boolean;    // lens flare, light leak, etc.
  interactionSimulation: boolean; // finger tap, cursor, etc.
  physicsElements: boolean;     // gravity particles, ripples, etc.
  maxSimultaneousAnimations: number;
}

/** Returns the effect budget for a given scene type and template.
 *  Statement scenes get almost nothing — the text IS the effect.
 *  Evidence scenes get ONE animated element.
 *  Metric scenes get the number animation + maybe one accent.
 */
export function getEffectBudget(sceneType: string, template?: string): EffectBudget {
  // Default: maximum restraint
  const minimal: EffectBudget = {
    ambientEffects: false,
    textAnimation: false,
    cinematicOverlay: true, // global mood effects only
    interactionSimulation: false,
    physicsElements: false,
    maxSimultaneousAnimations: 1,
  };

  switch (sceneType) {
    case "statement":
    case "title":
    case "problem":
    case "solution":
      // Text-only scenes get ZERO extra motion. The typography entrance IS the motion.
      return {
        ...minimal,
        textAnimation: true, // ONE text entrance animation
        cinematicOverlay: true,
        maxSimultaneousAnimations: 1,
      };

    case "evidence":
    case "feature":
    case "benefit":
      // UI scenes get ONE element animating in, plus global mood
      return {
        ...minimal,
        cinematicOverlay: true,
        interactionSimulation: template?.includes("Demo") || template?.includes("phone") || false,
        maxSimultaneousAnimations: 2,
      };

    case "flow":
    case "process":
      // Workflow scenes get step animation only
      return {
        ...minimal,
        cinematicOverlay: true,
        maxSimultaneousAnimations: 2,
      };

    case "metric":
    case "stats":
      // Metric scenes get the counting number + maybe one accent
      return {
        ...minimal,
        textAnimation: true,
        cinematicOverlay: true,
        maxSimultaneousAnimations: 2,
      };

    case "lockup":
    case "cta":
      // Final frame gets minimal — brand lockup should feel confident
      return {
        ...minimal,
        cinematicOverlay: true,
        maxSimultaneousAnimations: 1,
      };

    default:
      return minimal;
  }
}

/** Checks if a specific effect category is allowed for this scene.
 *  Use this to conditionally render effects in templates.
 */
export function isEffectAllowed(
  budget: EffectBudget,
  category: keyof Omit<EffectBudget, "maxSimultaneousAnimations">
): boolean {
  return budget[category];
}

/** Global restraint defaults. These apply to ALL scenes regardless of type. */
export const GLOBAL_RESTRAINT = {
  /** No scene should have more than this many independently moving elements. */
  maxMovingElementsPerScene: 3,

  /** Ambient motion (floating, pulsing) is banned on text-heavy scenes. */
  banAmbientOnTextScenes: true,

  /** Glow effects must be subtle (< 20% opacity) and only on one element. */
  maxGlowOpacity: 0.2,

  /** Particle counts should be low. High counts look like screensavers. */
  maxParticleCount: 30,

  /** Transition effects should be 20-30 frames max. Longer feels slow. */
  maxTransitionFrames: 30,

  /** Only ONE text animation style per scene. No mixing kinetic + scramble + wave. */
  oneTextStylePerScene: true,
};
