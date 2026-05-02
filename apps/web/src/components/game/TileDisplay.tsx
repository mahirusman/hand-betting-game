'use client';

import type { Hand, TileValueState } from '@tile-game/shared';
import { MahjongTile } from '../ui/MahjongTile';

/**
 * Big center panel for the active hand. When a previous hand is supplied we
 * render a small comparison hint so the player can see what they're betting
 * against without scrolling to the history.
 */
export function TileDisplay({
  hand,
  previousHand,
  tileValueState,
}: {
  hand: Hand;
  previousHand?: Hand | null;
  tileValueState: TileValueState;
}) {
  const diff = previousHand ? hand.totalValue - previousHand.totalValue : null;

  return (
    <section className="flex flex-col items-center gap-6 sm:gap-8">
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {hand.tiles.map((tile, index) => (
          <MahjongTile
            key={`${tile.id}-${index}`}
            tile={tile}
            // Stagger delay handled by spring; small index offset gives reveal feel.
            revealDelay={index * 0.08}
            tileValueState={tileValueState}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-game-muted">
          Current hand value
        </p>
        <p className="mt-1 font-display text-6xl font-bold leading-none text-game-text drop-shadow-[0_0_24px_rgba(108,99,255,0.25)] sm:text-7xl">
          {hand.totalValue}
        </p>

        {previousHand && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/5 bg-game-surface/60 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-game-muted">
            <span>Previous</span>
            <span className="font-display text-base font-bold text-game-text">
              {previousHand.totalValue}
            </span>
            {diff !== null && diff !== 0 && (
              <span
                className={`font-display text-sm font-bold ${
                  diff > 0 ? 'text-green-300' : 'text-red-300'
                }`}
              >
                {diff > 0 ? `▲ +${diff}` : `▼ ${diff}`}
              </span>
            )}
            {diff === 0 && (
              <span className="font-display text-sm font-bold text-amber-300">= Tie</span>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
