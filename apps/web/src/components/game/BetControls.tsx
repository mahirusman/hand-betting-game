import type { BetDirection } from '@tile-game/shared';

export function BetControls({
  disabled,
  onBet,
}: {
  disabled: boolean;
  onBet: (bet: BetDirection) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      <button
        aria-label="Bet that next hand is higher"
        disabled={disabled}
        onClick={() => onBet('higher')}
        className="group relative flex min-h-16 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-green-400/40 bg-gradient-to-br from-green-500/25 via-green-500/10 to-transparent px-6 py-4 font-display text-2xl font-bold uppercase tracking-wider text-green-200 shadow-[0_0_0_1px_rgba(34,197,94,0.18)] hover:border-green-300/70 hover:bg-green-500/20 hover:shadow-glow-higher disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:shadow-none"
      >
        <span
          aria-hidden
          className="text-3xl leading-none transition-transform duration-200 group-hover:-translate-y-0.5"
        >
          ▲
        </span>
        <span>Bet Higher</span>
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-x-12 -inset-y-8 rotate-12 bg-green-300/0 blur-2xl transition-colors duration-300 group-hover:bg-green-300/15"
        />
      </button>
      <button
        aria-label="Bet that next hand is lower"
        disabled={disabled}
        onClick={() => onBet('lower')}
        className="group relative flex min-h-16 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-red-400/40 bg-gradient-to-br from-red-500/25 via-red-500/10 to-transparent px-6 py-4 font-display text-2xl font-bold uppercase tracking-wider text-red-200 shadow-[0_0_0_1px_rgba(239,68,68,0.18)] hover:border-red-300/70 hover:bg-red-500/20 hover:shadow-glow-lower disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:shadow-none"
      >
        <span
          aria-hidden
          className="text-3xl leading-none transition-transform duration-200 group-hover:translate-y-0.5"
        >
          ▼
        </span>
        <span>Bet Lower</span>
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-x-12 -inset-y-8 -rotate-12 bg-red-300/0 blur-2xl transition-colors duration-300 group-hover:bg-red-300/15"
        />
      </button>
    </div>
  );
}
