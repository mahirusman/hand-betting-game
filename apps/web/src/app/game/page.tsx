'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GameBoard } from '../../components/game/GameBoard';
import { useGameStore } from '../../hooks/useGame';

export default function GamePage() {
  const router = useRouter();
  const gameId = useGameStore((state) => state.gameId);

  useEffect(() => {
    if (!gameId) {
      router.replace('/');
    }
  }, [gameId, router]);

  return <GameBoard />;
}
