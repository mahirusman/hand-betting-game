'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { GameOverReason, LeaderboardEntry } from '@tile-game/shared';
import { fetchLeaderboard } from '../../lib/api-client';
import { quickFade } from '../../hooks/useAnimations';

const reasonLabel: Record<GameOverReason, string> = {
  tile_value_zero: 'Zero tile',
  tile_value_ten: 'Ten tile',
  max_reshuffles: 'Reshuffled out',
};

function formatRelative(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  if (diffMs < 60_000) return 'just now';
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const podiumAccent: Record<number, string> = {
  0: 'text-game-gold',
  1: 'text-slate-200',
  2: 'text-amber-700',
};

export function LeaderboardCard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard()
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load leaderboard.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickFade}
      className="glass-card relative overflow-hidden p-6"
      aria-label="Top scores leaderboard"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gold-shimmer opacity-70" />
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-game-gold">
            Hall of fame
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase text-game-text">Top 5 Scores</h2>
        </div>
        <span aria-hidden className="text-3xl">
          🏆
        </span>
      </div>

      <ul className="mt-6 flex flex-col gap-2.5">
        {entries === null && error === null && (
          <SkeletonRows />
        )}
        {error && (
          <li className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </li>
        )}
        {entries && entries.length === 0 && (
          <li className="rounded-lg border border-game-border/60 bg-game-surface/40 px-4 py-6 text-center text-sm text-game-muted">
            No finished games yet — be the first.
          </li>
        )}
        {entries?.map((entry, index) => (
          <motion.li
            key={entry.gameId}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...quickFade, delay: index * 0.05 }}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-game-surface/45 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                aria-hidden
                className={`font-display text-2xl font-bold ${podiumAccent[index] ?? 'text-game-muted'}`}
              >
                #{index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-game-text">
                  {entry.handsPlayed} hand{entry.handsPlayed === 1 ? '' : 's'}
                </p>
                <p className="truncate text-[0.7rem] uppercase tracking-wider text-game-muted">
                  {entry.gameOverReason ? reasonLabel[entry.gameOverReason] : 'Finished'} ·{' '}
                  {formatRelative(entry.completedAt)}
                </p>
              </div>
            </div>
            <span className="font-display text-3xl font-bold text-game-gold tabular-nums">
              {entry.score}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.aside>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, idx) => (
        <li
          key={idx}
          className="h-14 animate-pulse rounded-lg border border-white/5 bg-game-surface/40"
          aria-hidden
        />
      ))}
    </>
  );
}
