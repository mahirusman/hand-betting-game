'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../hooks/useGame';
import { quickFade, springUnder400ms } from '../../hooks/useAnimations';
import { MahjongTile } from '../ui/MahjongTile';
import { LeaderboardCard } from './LeaderboardCard';

const previewTiles = [
  { id: 'number:bamboo:8#preview', valueKey: 'number:bamboo:8', kind: 'number' as const, suit: 'bamboo' as const, faceValue: 8, label: '8 Bamboo' },
  { id: 'dragon:red#preview', valueKey: 'dragon:red', kind: 'dragon' as const, dragon: 'red' as const, label: 'Red Dragon' },
  { id: 'wind:east#preview', valueKey: 'wind:east', kind: 'wind' as const, wind: 'east' as const, label: 'East Wind' },
  { id: 'number:dots:4#preview', valueKey: 'number:dots:4', kind: 'number' as const, suit: 'dots' as const, faceValue: 4, label: '4 Dots' },
];

export function LandingPage() {
  const router = useRouter();
  const startNewGame = useGameStore((state) => state.startNewGame);
  const isLoading = useGameStore((state) => state.isLoading);
  const error = useGameStore((state) => state.error);

  async function handlePlay() {
    await startNewGame();
    router.push('/game');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:py-14">
      <section className="w-full max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={quickFade}
          >
            <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-game-gold">
              Dark table · hand odds
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.95] text-game-text sm:text-7xl lg:text-8xl">
              Mahjong Hand
              <br />
              <span className="bg-gradient-to-r from-game-gold via-amber-200 to-game-gold bg-clip-text text-transparent">
                Betting
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Read the current hand, trust your nerve, and bet whether the next draw lands higher or
              lower. Every correct call adds a point, but a zero, a ten, or the third reshuffle ends the run.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                aria-label="Start a new game"
                disabled={isLoading}
                onClick={handlePlay}
                className="group relative inline-flex min-h-14 items-center gap-3 overflow-hidden rounded-xl border border-game-accent/70 bg-gradient-to-br from-game-accent to-indigo-600 px-8 py-4 font-display text-xl font-bold uppercase tracking-wider text-white shadow-[0_0_45px_-8px_rgba(108,99,255,0.65)] hover:shadow-[0_0_55px_-4px_rgba(108,99,255,0.85)] disabled:cursor-wait disabled:opacity-60"
              >
                <span aria-hidden className="text-2xl leading-none">▶</span>
                <span>{isLoading ? 'Dealing...' : 'New Game'}</span>
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-white/15 blur-xl transition-transform duration-700 group-hover:translate-x-[400%]"
                />
              </button>
              <p className="text-xs uppercase tracking-widest text-game-muted">
                Two tiles · hand total · higher or lower
              </p>
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-300">
                {error}
              </p>
            )}

            {/* Decorative tile preview row */}
            <div aria-hidden className="mt-12 flex items-center gap-4 overflow-hidden lg:mt-16">
              {previewTiles.map((tile, index) => (
                <motion.div
                  key={tile.id}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...springUnder400ms, delay: 0.15 + index * 0.08 }}
                  className="opacity-90"
                >
                  <MahjongTile tile={tile} compact />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Leaderboard */}
          <LeaderboardCard />
        </div>
      </section>
    </main>
  );
}
