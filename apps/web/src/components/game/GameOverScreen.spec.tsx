import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HandHistoryEntry } from '@tile-game/shared';
import { GameOverScreen } from './GameOverScreen';

const history: HandHistoryEntry[] = [
  {
    hand: {
      tiles: [],
      totalValue: 8,
    },
    handIndex: 1,
    betPlaced: 'higher',
    betCorrect: true,
    betResult: 'correct',
  },
];

describe('GameOverScreen', () => {
  it('renders score and reason copy', () => {
    render(
      <GameOverScreen
        score={9}
        reason="max_reshuffles"
        handHistory={history}
        handsPlayed={2}
        currentHand={{ tiles: [], totalValue: 7 }}
        onPlayAgain={vi.fn()}
        onBackHome={vi.fn()}
      />,
    );

    expect(screen.getByText('Final Score')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText(/third reshuffle/i)).toBeInTheDocument();
  });

  it('fires action callbacks', () => {
    const onPlayAgain = vi.fn();
    const onBackHome = vi.fn();

    render(
      <GameOverScreen
        score={3}
        reason={null}
        handHistory={[]}
        handsPlayed={1}
        currentHand={{ tiles: [], totalValue: 5 }}
        onPlayAgain={onPlayAgain}
        onBackHome={onBackHome}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /start a new game/i }));
    fireEvent.click(screen.getByRole('button', { name: /back to home/i }));

    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    expect(onBackHome).toHaveBeenCalledTimes(1);
  });
});
