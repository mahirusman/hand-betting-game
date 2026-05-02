'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.32, ease: 'easeOut' });
    return controls.stop;
  }, [motionValue, value]);

  return <motion.span aria-live="polite">{rounded}</motion.span>;
}
