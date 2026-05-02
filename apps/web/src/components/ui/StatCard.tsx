'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { quickFade } from '../../hooks/useAnimations';

type Tone = 'default' | 'gold' | 'higher' | 'lower' | 'warning';

const toneClasses: Record<Tone, string> = {
  default: 'text-game-text',
  gold: 'text-game-gold drop-shadow-[0_0_12px_rgba(245,158,11,0.45)]',
  higher: 'text-green-300',
  lower: 'text-red-300',
  warning: 'text-amber-300',
};

const toneAccent: Record<Tone, string> = {
  default: 'before:bg-white/5',
  gold: 'before:bg-game-gold/60',
  higher: 'before:bg-game-higher/60',
  lower: 'before:bg-game-lower/60',
  warning: 'before:bg-amber-400/60',
};

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickFade}
      className={`stat-card relative overflow-hidden before:pointer-events-none before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-2xl ${toneAccent[tone]}`}
    >
      <p className="stat-label">{label}</p>
      <p className={`stat-value tabular-nums ${toneClasses[tone]}`}>{value}</p>
      {hint && (
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-game-muted">{hint}</p>
      )}
    </motion.div>
  );
}
