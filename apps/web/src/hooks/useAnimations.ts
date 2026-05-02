export const springUnder400ms = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
  mass: 0.7,
} as const;

export const quickFade = {
  duration: 0.28,
  ease: 'easeOut',
} as const;
