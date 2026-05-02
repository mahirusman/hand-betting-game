import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Tile } from '@tile-game/shared';
import { MahjongTile } from './MahjongTile';

const bambooSix: Tile = {
  id: 'number:bamboo:6#1',
  valueKey: 'number:bamboo:6',
  kind: 'number',
  suit: 'bamboo',
  faceValue: 6,
  label: '6 Bamboo',
};

const redDragon: Tile = {
  id: 'dragon:red#1',
  valueKey: 'dragon:red',
  kind: 'dragon',
  dragon: 'red',
  label: 'Red Dragon',
};

describe('MahjongTile', () => {
  it('renders a Mahjong number tile with its face value and label', () => {
    render(<MahjongTile tile={bambooSix} />);

    expect(screen.getByLabelText('6 Bamboo, value 6')).toBeInTheDocument();
    expect(screen.getByText(/6 Bamboo =/)).toBeInTheDocument();
  });

  it('renders a dynamic Dragon tile value from tile state', () => {
    render(<MahjongTile tile={redDragon} tileValueState={{ 'dragon:red': 8 }} />);

    expect(screen.getByLabelText('Red Dragon, value 8')).toBeInTheDocument();
    expect(screen.getByText('red')).toBeInTheDocument();
  });
});
