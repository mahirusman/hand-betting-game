import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mahjong Hand Betting',
  description: 'A premium higher-or-lower hand betting game built with Mahjong tiles.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
