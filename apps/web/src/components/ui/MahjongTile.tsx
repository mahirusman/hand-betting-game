'use client';

import { motion } from 'framer-motion';
import type { Tile, TileValueState } from '@tile-game/shared';
import { calcTileValue } from '@tile-game/shared';
import { springUnder400ms } from '../../hooks/useAnimations';

function suitGlyph(tile: Tile): string {
  if (tile.kind === 'dragon') {
    if (tile.dragon === 'red') return '中';
    if (tile.dragon === 'green') return '發';
    return '白';
  }

  if (tile.kind === 'wind') {
    return {
      east: '東',
      south: '南',
      west: '西',
      north: '北',
    }[tile.wind ?? 'east'];
  }

  if (tile.suit === 'bamboo') return '🀐';
  if (tile.suit === 'dots') return '●';
  return '萬';
}

function tone(tile: Tile, value: number): string {
  if (value >= 10) return 'text-red-700';
  if (value <= 1) return 'text-emerald-700';
  if (tile.kind === 'dragon' && tile.dragon === 'red') return 'text-red-700';
  if (tile.kind === 'dragon' && tile.dragon === 'green') return 'text-emerald-700';
  if (tile.kind === 'wind') return 'text-indigo-800';
  return 'text-slate-900';
}

function kindLabel(tile: Tile): string {
  if (tile.kind === 'number') return tile.suit ?? 'number';
  return tile.kind;
}

export function MahjongTile({
  tile,
  compact = false,
  revealDelay = 0,
  tileValueState = {},
}: {
  tile: Tile;
  compact?: boolean;
  revealDelay?: number;
  tileValueState?: TileValueState;
}) {
  const value = calcTileValue(tile, tileValueState);
  const tileTone = tone(tile, value);

  return (
    <motion.figure
      initial={{ y: -24, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ ...springUnder400ms, delay: revealDelay }}
      whileHover={{ y: -3, scale: 1.025 }}
      className="flex flex-col items-center gap-2"
    >
      <div
        className={`relative overflow-hidden rounded-xl border border-amber-100/80 bg-gradient-to-br from-[#fff7df] via-[#f4e6c4] to-[#d8bd82] shadow-tile transition-shadow duration-200 hover:shadow-[0_24px_55px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] ${
          compact ? 'h-24 w-14' : 'h-40 w-24 sm:h-48 sm:w-28'
        }`}
        aria-label={`${tile.label}, value ${value}`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-2 h-1/2 rounded-lg bg-white/35 blur-sm"
        />
        <span className={`absolute right-2 top-1.5 font-display text-xs font-bold ${tileTone}`}>
          {value}
        </span>
        <div className="relative grid h-full place-items-center px-2 py-5 text-center">
          {tile.kind === 'number' && (
            <div className="flex flex-col items-center">
              <span className={`font-display text-5xl font-bold leading-none ${tileTone}`}>
                {tile.faceValue}
              </span>
              <span className={`mt-1 text-2xl leading-none ${tileTone}`}>{suitGlyph(tile)}</span>
            </div>
          )}
          {tile.kind !== 'number' && (
            <div className="flex flex-col items-center">
              <span className={`font-display text-4xl font-bold leading-none ${tileTone}`}>
                {suitGlyph(tile)}
              </span>
              {!compact && (
                <span className={`mt-2 font-display text-sm font-bold uppercase ${tileTone}`}>
                  {tile.kind === 'dragon' ? tile.dragon : tile.wind}
                </span>
              )}
            </div>
          )}
        </div>
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-1 text-center font-display text-[0.55rem] font-bold uppercase tracking-[0.18em] text-amber-900/55"
        >
          {kindLabel(tile)}
        </span>
      </div>
      {!compact && (
        <figcaption className="max-w-28 text-center font-display text-xs font-bold uppercase tracking-[0.14em] text-game-muted">
          {tile.label} = <span className="text-game-text">{value}</span>
        </figcaption>
      )}
    </motion.figure>
  );
}
