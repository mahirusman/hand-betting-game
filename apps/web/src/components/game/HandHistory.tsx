'use client';

import { motion } from 'framer-motion';
import type { HandHistoryEntry } from '@tile-game/shared';
import { MahjongTile } from '../ui/MahjongTile';
import { quickFade } from '../../hooks/useAnimations';

function resultStyles(entry: HandHistoryEntry) {
  if (entry.betCorrect === true) {
    return {
      ring: 'border-green-400/40 bg-green-500/5',
      label: 'Win',
      pill: 'bg-green-500/20 text-green-200 border-green-400/40',
    };
  }
  if (entry.betCorrect === false) {
    return {
      ring: 'border-red-400/40 bg-red-500/5',
      label: 'Loss',
      pill: 'bg-red-500/20 text-red-200 border-red-400/40',
    };
  }
  return {
    ring: 'border-game-border bg-game-card/55',
    label: 'Tie',
    pill: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
  };
}

export function HandHistory({ entries }: { entries: HandHistoryEntry[] }) {
  // Newest first — players read left to right starting from the latest hand.
  const visible = entries.slice(-5).reverse();

  return (
    <section aria-label="Previous hands" className="overflow-x-auto pb-1">
      <div className="flex min-h-36 gap-3">
        {visible.length === 0 ? (
          <p className="self-center text-sm text-game-muted">
            No previous hands yet — your bet history will land here.
          </p>
        ) : (
          visible.map((entry, index) => {
            const styles = resultStyles(entry);
            return (
              <motion.article
                key={entry.handIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...quickFade, delay: index * 0.04 }}
                className={`flex min-w-[10rem] flex-col items-center gap-2 rounded-xl border p-3 ${styles.ring}`}
              >
                <div className="flex justify-center gap-2">
                  {entry.hand.tiles.map((tile, i) => (
                    <MahjongTile key={`${entry.handIndex}-${tile.id}-${i}`} tile={tile} compact />
                  ))}
                </div>
                <p className="font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-game-muted">
                  Hand {entry.handIndex}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-bold tabular-nums">
                    {entry.hand.totalValue}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-display text-[0.6rem] font-bold uppercase tracking-wider ${styles.pill}`}
                  >
                    {entry.betPlaced ? `${entry.betPlaced} · ${styles.label}` : styles.label}
                  </span>
                </div>
              </motion.article>
            );
          })
        )}
      </div>
    </section>
  );
}
