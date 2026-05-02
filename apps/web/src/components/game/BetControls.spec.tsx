import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BetControls } from './BetControls';

describe('BetControls', () => {
  it('renders higher and lower buttons', () => {
    render(<BetControls disabled={false} onBet={vi.fn()} />);
    expect(screen.getByRole('button', { name: /higher/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lower/i })).toBeInTheDocument();
  });

  it('calls onBet with the selected direction', () => {
    const onBet = vi.fn();
    render(<BetControls disabled={false} onBet={onBet} />);
    fireEvent.click(screen.getByRole('button', { name: /higher/i }));
    fireEvent.click(screen.getByRole('button', { name: /lower/i }));
    expect(onBet).toHaveBeenNthCalledWith(1, 'higher');
    expect(onBet).toHaveBeenNthCalledWith(2, 'lower');
  });

  it('disables buttons', () => {
    render(<BetControls disabled onBet={vi.fn()} />);
    expect(screen.getByRole('button', { name: /higher/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /lower/i })).toBeDisabled();
  });
});
