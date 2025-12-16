/**
 * Material Design Motion System
 * Based on Material Design 2 motion principles
 *
 * References:
 * - https://m2.material.io/design/motion
 * - https://m2.material.io/design/motion/understanding-motion.html
 * - https://m2.material.io/design/motion/choreography.html
 * - https://m2.material.io/design/navigation/navigation-transitions.html
 * - https://m2.material.io/design/interaction/selection.html
 *
 * Key Principles:
 * 1. Informative: Motion provides context and spatial relationships
 * 2. Focused: Motion guides attention without distraction
 * 3. Expressive: Motion reflects brand personality and quality
 * 4. Intentional: Motion supports usability and hierarchy
 */

// ============================================================================
// DURATION STANDARDS (ms)
// ============================================================================

export const duration = {
  // Small elements (icons, indicators, toggles)
  small: {
    enter: 100,
    exit: 75,
  },
  // Medium elements (cards, panels, chips)
  medium: {
    expand: 250,
    collapse: 200,
  },
  // Large elements (full panels, dialogs, sheets)
  large: {
    expand: 300,
    collapse: 250,
  },
} as const;

// ============================================================================
// EASING CURVES (CSS cubic-bezier)
// ============================================================================

export const easing = {
  // Standard easing - most common (elements that begin and end at rest)
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',

  // Emphasized easing - draws extra attention at end
  emphasized: 'cubic-bezier(0.0, 0.0, 0.2, 1)',

  // Decelerated easing - incoming elements
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',

  // Accelerated easing - exiting elements
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
} as const;

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export const transition = {
  // Panel expand/collapse
  panel: {
    expand: `all ${duration.medium.expand}ms ${easing.standard}`,
    collapse: `all ${duration.medium.collapse}ms ${easing.standard}`,
  },

  // Drawer open/close
  drawer: {
    open: `transform ${duration.medium.expand}ms ${easing.standard}`,
    close: `transform ${duration.medium.collapse}ms ${easing.accelerate}`,
  },

  // Sheet animations
  sheet: {
    expand: `transform ${duration.large.expand}ms ${easing.standard}, opacity ${duration.large.expand}ms ${easing.standard}`,
    collapse: `transform ${duration.large.collapse}ms ${easing.accelerate}, opacity ${duration.large.collapse}ms ${easing.accelerate}`,
  },

  // Tab indicator
  tab: {
    slide: `transform ${duration.medium.expand}ms ${easing.standard}`,
  },

  // Button interactions
  button: {
    hover: `all ${duration.small.enter}ms ${easing.standard}`,
    active: `transform ${duration.small.enter}ms ${easing.standard}`,
  },

  // Card hover elevation
  card: {
    hover: `transform 200ms ${easing.standard}, box-shadow 200ms ${easing.standard}`,
  },

  // Fade animations
  fade: {
    in: `opacity ${duration.medium.expand}ms ${easing.decelerate}`,
    out: `opacity ${duration.medium.collapse}ms ${easing.accelerate}`,
  },

  // Multi-Agent Grid transitions
  gridCard: {
    enter: `transform ${duration.medium.expand}ms ${easing.emphasized}, opacity ${duration.medium.expand}ms ${easing.decelerate}`,
    exit: `transform ${duration.medium.collapse}ms ${easing.accelerate}, opacity ${duration.medium.collapse}ms ${easing.accelerate}`,
    focus: `transform 200ms ${easing.standard}, box-shadow 200ms ${easing.standard}`,
    pulse: `box-shadow 2000ms ${easing.standard}, transform 2000ms ${easing.standard}`,
  },

  // Grid layout reflow animations
  gridLayout: {
    reorder: `transform ${duration.large.expand}ms ${easing.emphasized}`,
    expand: `all ${duration.large.expand}ms ${easing.emphasized}`,
    collapse: `all ${duration.large.collapse}ms ${easing.accelerate}`,
  },
} as const;

// ============================================================================
// NAVIGATION TRANSITIONS
// Reference: https://m2.material.io/design/navigation/navigation-transitions.html
// ============================================================================

export const navigation = {
  // Shared Axis - Horizontal (for lateral/tab navigation)
  sharedAxisX: {
    // Outgoing content (exit left)
    exit: {
      duration: duration.large.collapse,
      easing: easing.accelerate,
      transform: 'translateX(-30px)',
      opacity: 0,
    },
    // Incoming content (enter from right)
    enter: {
      duration: duration.large.expand,
      easing: easing.decelerate,
      transform: 'translateX(30px)',
      opacity: 0,
    },
  },

  // Shared Axis - Vertical (for hierarchical navigation)
  sharedAxisY: {
    // Outgoing content (exit up)
    exit: {
      duration: duration.large.collapse,
      easing: easing.accelerate,
      transform: 'translateY(-30px)',
      opacity: 0,
    },
    // Incoming content (enter from below)
    enter: {
      duration: duration.large.expand,
      easing: easing.decelerate,
      transform: 'translateY(30px)',
      opacity: 0,
    },
  },

  // Fade Through (for disconnected content)
  fadeThrough: {
    exit: {
      duration: 90,
      easing: easing.accelerate,
      opacity: 0,
    },
    enter: {
      duration: 210,
      easing: easing.decelerate,
      opacity: 0,
      delay: 90,
    },
  },

  // Container Transform (for expanding elements)
  containerTransform: {
    duration: duration.large.expand,
    easing: easing.emphasized,
  },

  // Material Design 3 Slide-in Panel (from right/left/bottom)
  slideInPanel: {
    fromRight: {
      duration: 400,
      easing: easing.emphasized,
      initial: { transform: 'translateX(100%)', opacity: 0 },
      animate: { transform: 'translateX(0)', opacity: 1 },
      exit: { transform: 'translateX(100%)', opacity: 0 },
    },
    fromLeft: {
      duration: 400,
      easing: easing.emphasized,
      initial: { transform: 'translateX(-100%)', opacity: 0 },
      animate: { transform: 'translateX(0)', opacity: 1 },
      exit: { transform: 'translateX(-100%)', opacity: 0 },
    },
    fromBottom: {
      duration: 400,
      easing: easing.emphasized,
      initial: { transform: 'translateY(100%)', opacity: 0 },
      animate: { transform: 'translateY(0)', opacity: 1 },
      exit: { transform: 'translateY(100%)', opacity: 0 },
    },
  },
} as const;

// ============================================================================
// INTERACTION PATTERNS
// Reference: https://m2.material.io/design/interaction/selection.html
// ============================================================================

export const interaction = {
  // Item selection (checkboxes, radio buttons)
  selection: {
    // Checkbox/radio check animation
    check: `transform ${duration.small.enter}ms ${easing.emphasized}`,

    // Selection highlight
    highlight: `background-color ${duration.small.enter}ms ${easing.standard}`,

    // Item activation
    activate: `all ${duration.small.enter}ms ${easing.standard}`,
  },

  // Touch/click ripple
  ripple: {
    duration: 600,
    easing: easing.decelerate,
  },

  // Hover states
  hover: {
    enter: `all ${duration.small.enter}ms ${easing.standard}`,
    exit: `all ${duration.small.exit}ms ${easing.standard}`,
  },

  // Focus states
  focus: {
    ring: `box-shadow ${duration.small.enter}ms ${easing.standard}`,
  },

  // Drag and drop
  drag: {
    pickup: `transform ${duration.small.enter}ms ${easing.emphasized}, box-shadow ${duration.small.enter}ms ${easing.emphasized}`,
    drop: `all ${duration.medium.collapse}ms ${easing.standard}`,
  },
} as const;

// ============================================================================
// ANIMATION KEYFRAMES
// ============================================================================

export const keyframes = {
  // Shimmer loading effect
  shimmer: `
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
  `,

  // Pulse effect for critical alerts
  criticalPulse: `
    @keyframes criticalPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.7); }
      50% { box-shadow: 0 0 0 8px rgba(255, 87, 34, 0); }
    }
  `,

  // Warning shimmer
  warningShimmer: `
    @keyframes warningShimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `,

  // Fade in up (for staggered list entry)
  fadeInUp: `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,

  // Fade through (for data updates)
  fadeThrough: `
    @keyframes fadeThrough {
      0% { opacity: 1; }
      40% { opacity: 0; }
      60% { opacity: 0; }
      100% { opacity: 1; }
    }
  `,

  // Ripple effect
  ripple: `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `,

  // Navigation transitions - Shared Axis X (lateral navigation)
  sharedAxisXExit: `
    @keyframes sharedAxisXExit {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-30px);
      }
    }
  `,
  sharedAxisXEnter: `
    @keyframes sharedAxisXEnter {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,

  // Navigation transitions - Shared Axis Y (hierarchical navigation)
  sharedAxisYExit: `
    @keyframes sharedAxisYExit {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-30px);
      }
    }
  `,
  sharedAxisYEnter: `
    @keyframes sharedAxisYEnter {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,

  // Navigation transitions - Fade Through
  fadeThroughExit: `
    @keyframes fadeThroughExit {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,
  fadeThroughEnter: `
    @keyframes fadeThroughEnter {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,

  // Selection check animation
  checkboxCheck: `
    @keyframes checkboxCheck {
      0% {
        transform: scale(0) rotate(-45deg);
      }
      50% {
        transform: scale(1.1) rotate(-45deg);
      }
      100% {
        transform: scale(1) rotate(-45deg);
      }
    }
  `,

  // Radio button fill
  radioFill: `
    @keyframes radioFill {
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
      }
    }
  `,

  // Item selection highlight
  selectionHighlight: `
    @keyframes selectionHighlight {
      0% {
        background-color: transparent;
      }
      50% {
        background-color: rgba(33, 150, 243, 0.12);
      }
      100% {
        background-color: rgba(33, 150, 243, 0.08);
      }
    }
  `,

  // Slide in from right (for panels)
  slideInRight: `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,

  // Slide out to right
  slideOutRight: `
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `,

  // Expand with scale (for card expansion)
  expandScale: `
    @keyframes expandScale {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,

  // Collapse with scale
  collapseScale: `
    @keyframes collapseScale {
      from {
        transform: scale(1);
        opacity: 1;
      }
      to {
        transform: scale(0.95);
        opacity: 0;
      }
    }
  `,

  // Backdrop fade
  backdropFadeIn: `
    @keyframes backdropFadeIn {
      from {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
      to {
        opacity: 1;
        backdrop-filter: blur(8px);
      }
    }
  `,

  backdropFadeOut: `
    @keyframes backdropFadeOut {
      from {
        opacity: 1;
        backdrop-filter: blur(8px);
      }
      to {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
    }
  `,

  // Multi-Agent Grid Animations

  // Main chat shrinks to grid card position
  shrinkToCard: `
    @keyframes shrinkToCard {
      from {
        transform: scale(1);
        opacity: 1;
      }
      to {
        transform: scale(0.95);
        opacity: 0.95;
      }
    }
  `,

  // New agent card enters with slide + fade
  cardEnter: `
    @keyframes cardEnter {
      from {
        opacity: 0;
        transform: translateX(50px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
  `,

  // Agent card exits with fade + collapse
  cardExit: `
    @keyframes cardExit {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.9);
      }
    }
  `,

  // Subtle scale up for focused card
  cardFocus: `
    @keyframes cardFocus {
      from {
        transform: scale(1);
      }
      to {
        transform: scale(1.02);
      }
    }
  `,

  // Attention pulse for when agent finishes
  cardPulse: `
    @keyframes cardPulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
        transform: scale(1);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(33, 150, 243, 0);
        transform: scale(1.01);
      }
    }
  `,

  // Smooth position transition for drag-drop reorder
  gridReorder: `
    @keyframes gridReorder {
      from {
        transform: translate(var(--from-x, 0), var(--from-y, 0));
      }
      to {
        transform: translate(0, 0);
      }
    }
  `,
} as const;

// ============================================================================
// CHOREOGRAPHY PATTERNS
// Reference: https://m2.material.io/design/motion/choreography.html
// ============================================================================

export const choreography = {
  // Sequencing - elements animate one after another
  sequence: {
    // Small delay between elements
    short: 25,
    // Medium delay between elements
    medium: 50,
    // Large delay between elements
    long: 100,
  },

  // Staggering - elements appear with consistent delay
  stagger: {
    // List items
    list: 50,
    // Cards
    cards: 100,
    // Metrics/stats
    metrics: 75,
    // Grid items
    grid: 80,
  },

  // Cascading - elements flow in wave pattern
  cascade: {
    // Subtle cascade
    subtle: {
      delay: 30,
      offset: 15,
    },
    // Prominent cascade
    prominent: {
      delay: 50,
      offset: 25,
    },
  },

  // Continuous - ongoing animation
  continuous: {
    // Breathing effect (subtle pulse)
    breathe: 2000,
    // Loading spinner
    spinner: 1400,
    // Progress indicator
    progress: 1000,
  },

  // Transformation sequence - multi-step animations
  transformation: {
    // Step 1 → Step 2 → Step 3 timing
    steps: [0, 150, 300],
    // Total duration
    total: 450,
  },
} as const;

// ============================================================================
// STAGGER DELAYS (for sequential animations)
// ============================================================================

export const stagger = {
  // List items (50ms between each)
  list: 50,

  // Cards (100ms between each)
  cards: 100,

  // Metrics (75ms between each)
  metrics: 75,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate staggered animation delay
 * @param index - Item index in list
 * @param delayMs - Base delay between items (default: 50ms)
 */
export function getStaggerDelay(index: number, delayMs: number = stagger.list): string {
  return `${index * delayMs}ms`;
}

/**
 * Generate cascading animation delay with offset
 * @param index - Item index
 * @param row - Row index (for grid layouts)
 * @param cascade - Cascade configuration (default: subtle)
 */
export function getCascadeDelay(
  index: number,
  row: number = 0,
  cascade: typeof choreography.cascade.subtle = choreography.cascade.subtle
): string {
  return `${index * cascade.delay + row * cascade.offset}ms`;
}

/**
 * Generate sequence delay for specific step
 * @param stepIndex - Step index in sequence
 * @param sequenceDelay - Delay type (default: medium)
 */
export function getSequenceDelay(
  stepIndex: number,
  sequenceDelay: number = choreography.sequence.medium
): string {
  return `${stepIndex * sequenceDelay}ms`;
}

/**
 * Create transition string
 * @param property - CSS property to transition
 * @param durationMs - Duration in milliseconds
 * @param easingCurve - Easing curve (default: standard)
 */
export function createTransition(
  property: string,
  durationMs: number,
  easingCurve: string = easing.standard
): string {
  return `${property} ${durationMs}ms ${easingCurve}`;
}

/**
 * Combine multiple transitions
 * @param transitions - Array of transition strings
 */
export function combineTransitions(...transitions: string[]): string {
  return transitions.join(', ');
}

/**
 * Create navigation transition style object
 * @param isEntering - Whether element is entering or exiting
 * @param axis - Transition axis (x or y, default: x)
 */
export function getNavigationTransition(
  isEntering: boolean,
  axis: 'x' | 'y' = 'x'
): {
  animation: string;
  animationDuration: string;
  animationTimingFunction: string;
  animationFillMode: string;
} {
  const axisTransition = axis === 'x' ? navigation.sharedAxisX : navigation.sharedAxisY;
  const animationType = isEntering ? 'Enter' : 'Exit';
  const keyframeName = `sharedAxis${axis.toUpperCase()}${animationType}`;

  return {
    animation: keyframeName,
    animationDuration: `${isEntering ? axisTransition.enter.duration : axisTransition.exit.duration}ms`,
    animationTimingFunction: isEntering ? axisTransition.enter.easing : axisTransition.exit.easing,
    animationFillMode: 'both',
  };
}

// ============================================================================
// CSS CLASS NAMES (for Tailwind)
// ============================================================================

export const motionClasses = {
  // Reduced motion support
  reduceMotion: 'motion-reduce:transition-none motion-reduce:animation-none',

  // GPU acceleration
  gpuAccelerated: 'transform-gpu will-change-transform',

  // Smooth transitions
  smooth: 'transition-all duration-200 ease-in-out',
} as const;
