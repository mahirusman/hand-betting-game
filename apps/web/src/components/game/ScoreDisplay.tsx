import { AnimatedNumber } from '../ui/AnimatedNumber';
import { StatCard } from '../ui/StatCard';

/**
 * Dashboard-style stats row. Shown above the main hand panel on the game screen.
 * Reshuffle warns at 2/3 to nudge the player about the impending game over.
 */
export function ScoreDisplay({
  score,
  drawPileCount,
  reshuffleCount,
  discardPileCount,
}: {
  score: number;
  drawPileCount: number;
  reshuffleCount: number;
  discardPileCount: number;
}) {
  const reshuffleTone = reshuffleCount >= 2 ? 'lower' : reshuffleCount >= 1 ? 'warning' : 'default';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <StatCard label="Score" tone="gold" value={<AnimatedNumber value={score} />} hint="Correct calls" />
      <StatCard
        label="Draw Pile"
        value={drawPileCount}
        hint={drawPileCount <= 4 ? 'Reshuffle imminent' : 'Tiles remaining'}
      />
      <StatCard
        label="Discard Pile"
        value={discardPileCount}
        hint="Resolved tiles"
      />
      <StatCard
        label="Reshuffles"
        tone={reshuffleTone}
        value={`${reshuffleCount}/3`}
        hint={reshuffleCount >= 2 ? 'Last chance' : 'Used / max'}
      />
    </div>
  );
}
