'use client';

import { motion } from 'framer-motion';
import type { GameOverReason, Hand, HandHistoryEntry } from '@tile-game/shared';
import { quickFade } from '../../hooks/useAnimations';

const reasonCopy: Record<GameOverReason, string> = {
  tile_value_zero: 'A zero-value tile hit the table.',
  tile_value_ten: 'A value-ten tile ended the run.',
  max_reshuffles: 'The draw pile reached its third reshuffle.',
};

interface GameOverStats {
  handsPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  highestHand: number;
}

function summarize(history: HandHistoryEntry[], handsPlayed: number, currentHand: Hand | null): GameOverStats {
  const stats: GameOverStats = {
    handsPlayed,
    wins: 0,
    losses: 0,
    ties: 0,
    highestHand: currentHand?.totalValue ?? 0,
  };
  for (const entry of history) {
    if (entry.betCorrect === true) stats.wins += 1;
    else if (entry.betCorrect === false) stats.losses += 1;
    else stats.ties += 1;
    if (entry.hand.totalValue > stats.highestHand) {
      stats.highestHand = entry.hand.totalValue;
    }
  }
  return stats;
}

export function GameOverScreen({
  score,
  reason,
  handHistory,
  handsPlayed,
  currentHand,
  onPlayAgain,
  onBackHome,
}: {
  score: number;
  reason: GameOverReason | null;
  handHistory: HandHistoryEntry[];
  handsPlayed: number;
  currentHand: Hand | null;
  onPlayAgain: () => void;
  onBackHome: () => void;
}) {
  const stats = summarize(handHistory, handsPlayed, currentHand);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={quickFade}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="glass-card relative w-full max-w-lg overflow-hidden p-8 text-center"
      >
        {/* Decorative glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-game-lower/15 blur-3xl"
        />
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gold-shimmer opacity-70" />

        <p className="font-display text-xs font-bold uppercase tracking-[0.4em] text-game-lower">
          Game Over
        </p>
        <h2
          id="game-over-title"
          className="mt-3 font-display text-4xl font-bold uppercase leading-none text-game-text sm:text-5xl"
        >
          Final Score
        </h2>
        <p className="mt-3 font-display text-7xl font-bold leading-none text-game-gold drop-shadow-[0_0_24px_rgba(245,158,11,0.45)] sm:text-8xl">
          {score}
        </p>
        <p className="mt-4 text-sm text-game-muted">
          {reason ? reasonCopy[reason] : 'The table is closed.'}
        </p>

        {/* Stats summary */}
        <dl className="mt-7 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
          <SummaryStat label="Hands" value={stats.handsPlayed} />
          <SummaryStat label="Wins" value={stats.wins} tone="higher" />
          <SummaryStat label="Losses" value={stats.losses} tone="lower" />
          <SummaryStat label="Top hand" value={stats.highestHand} tone="gold" />
        </dl>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            aria-label="Start a new game"
            onClick={onPlayAgain}
            className="group relative inline-flex min-h-14 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl border border-game-accent/70 bg-gradient-to-br from-game-accent to-indigo-600 px-5 py-3 font-display text-lg font-bold uppercase tracking-wider text-white shadow-[0_0_35px_-8px_rgba(108,99,255,0.65)] hover:shadow-[0_0_45px_-4px_rgba(108,99,255,0.85)]"
          >
            <span aria-hidden>↻</span>
            <span>Play Again</span>
          </button>
          <button
            aria-label="Back to home"
            onClick={onBackHome}
            className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-game-border/80 bg-game-surface/60 px-5 py-3 font-display text-lg font-bold uppercase tracking-wider text-game-text hover:border-game-accent hover:text-white"
          >
            <span aria-hidden>←</span>
            <span>Back to Home</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const toneMap: Record<'default' | 'higher' | 'lower' | 'gold', string> = {
  default: 'text-game-text',
  higher: 'text-green-300',
  lower: 'text-red-300',
  gold: 'text-game-gold',
};

function SummaryStat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'higher' | 'lower' | 'gold';
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-game-surface/60 px-3 py-3">
      <dt className="font-display text-[0.6rem] font-bold uppercase tracking-[0.22em] text-game-muted">
        {label}
      </dt>
      <dd className={`mt-1 font-display text-2xl font-bold tabular-nums ${toneMap[tone]}`}>{value}</dd>
    </div>
  );
}
