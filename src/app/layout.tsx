import type { Metadata } from 'next';
import './globals.css';
import { HordeProvider } from '@/context/HordeContext';

export const metadata: Metadata = {
  title: 'Simulador de Horda Zumbi — MTG Horde Companion',
  description:
    'Simulador de Horda para Magic: The Gathering focado em playtest com deck físico na mesa.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <HordeProvider>{children}</HordeProvider>
      </body>
    </html>
  );
}
