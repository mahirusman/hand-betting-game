'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { HISTORY_VISIBLE } from '@tile-game/shared';
import { BetControls } from './BetControls';
import { GameOverScreen } from './GameOverScreen';
import { HandHistory } from './HandHistory';
import { ScoreDisplay } from './ScoreDisplay';
import { TileDisplay } from './TileDisplay';
import { useGameStore } from '../../hooks/useGame';
import { quickFade } from '../../hooks/useAnimations';

export function GameBoard() {
  const router = useRouter();
  // Per-slice selectors so unrelated state changes don't re-render the whole board.
  const gameState = useGameStore((state) => state.gameState);
  const isLoading = useGameStore((state) => state.isLoading);
  const error = useGameStore((state) => state.error);
  const placeBet = useGameStore((state) => state.placeBet);
  const exitGame = useGameStore((state) => state.exitGame);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const clearError = useGameStore((state) => state.clearError);

  if (!gameState) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-center">
        <p className="font-display text-2xl font-bold uppercase text-game-muted">
          Preparing the table...
        </p>
      </main>
    );
  }

  async function playAgain() {
    await startNewGame();
  }

  function exit() {
    exitGame();
    router.push('/');
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-7">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={quickFade}
          className="glass-card flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-game-accent/40 to-indigo-700/40 text-lg shadow-inner"
            >
              ◳
            </span>
            <div>
              <p className="font-display text-[0.65rem] font-bold uppercase tracking-[0.3em] text-game-gold">
                Live session
              </p>
              <h1 className="font-display text-lg font-bold uppercase tracking-wider text-game-text">
                Mahjong Hand Betting
              </h1>
            </div>
          </div>
          <button
            aria-label="Exit current game"
            onClick={exit}
            className="self-start rounded-lg border border-game-border/80 bg-game-surface/60 px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-game-text hover:border-game-accent hover:text-white sm:self-auto"
          >
            Exit
          </button>
        </motion.header>

        {/* ── Stats row ──────────────────────────────────────── */}
        <ScoreDisplay
          score={gameState.score}
          drawPileCount={gameState.drawPileCount}
          discardPileCount={gameState.discardPileCount}
          reshuffleCount={gameState.reshuffleCount}
        />

        {/* ── Error banner ───────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={quickFade}
              className="flex items-center justify-between rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              <span>{error}</span>
              <button
                aria-label="Dismiss error"
                onClick={clearError}
                className="font-display font-bold uppercase"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main hand panel ────────────────────────────────── */}
        <section className="glass-card relative overflow-hidden p-5 sm:p-10">
          {/* Decorative corner glow */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-game-accent/15 blur-3xl"
          />

          <AnimatePresence mode="wait">
            {gameState.currentHand && (
              <motion.div
                key={`${gameState.updatedAt}-${gameState.currentHand.totalValue}`}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={quickFade}
                className="relative"
              >
                <TileDisplay
                  hand={gameState.currentHand}
                  previousHand={gameState.previousHand}
                  tileValueState={gameState.tileValueState}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {gameState.lastBetResult && (
              <motion.div
                key={`${gameState.lastBetResult}-${gameState.updatedAt}`}
                initial={{ scale: 0.82, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.05, opacity: 0 }}
                transition={quickFade}
                className={`relative mx-auto mt-6 w-fit rounded-full border px-6 py-2 font-display text-xl font-bold uppercase tracking-wider ${
                  gameState.lastBetResult === 'correct'
                    ? 'border-green-400/40 bg-green-500/15 text-green-200 shadow-[0_0_30px_-5px_rgba(34,197,94,0.45)]'
                    : gameState.lastBetResult === 'tie'
                      ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                      : 'border-red-400/40 bg-red-500/15 text-red-200 shadow-[0_0_30px_-5px_rgba(239,68,68,0.45)]'
                }`}
              >
                {gameState.lastBetResult === 'correct'
                  ? '✓ Correct'
                  : gameState.lastBetResult === 'tie'
                    ? '= Tie'
                    : '✗ Wrong'}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Bet controls ───────────────────────────────────── */}
        <BetControls
          disabled={isLoading || gameState.gameOver}
          onBet={(bet) => {
            void placeBet(bet);
          }}
        />

        {/* ── Recent hands ───────────────────────────────────── */}
        <section className="glass-card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-game-text">
              Recent Hands
            </h2>
            <span className="font-display text-[0.65rem] font-bold uppercase tracking-[0.25em] text-game-muted">
              Last {Math.min(HISTORY_VISIBLE, gameState.handHistory.length)} of{' '}
              {gameState.handsPlayed - 1}
            </span>
          </div>
          <HandHistory entries={gameState.handHistory} />
        </section>
      </div>

      <AnimatePresence>
        {gameState.gameOver && (
          <GameOverScreen
            score={gameState.score}
            reason={gameState.gameOverReason}
            handHistory={gameState.handHistory}
            handsPlayed={gameState.handsPlayed}
            currentHand={gameState.currentHand}
            onPlayAgain={() => {
              void playAgain();
            }}
            onBackHome={exit}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
