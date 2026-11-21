'use client';

import React from 'react';
import { HordeCardInstance } from '@/types/horde';

interface HordeCardTileProps {
  card: HordeCardInstance;
  onLeftClick: (card: HordeCardInstance) => void;
  onRightClick: (e: React.MouseEvent, card: HordeCardInstance) => void;
}

export function HordeCardTile({
  card,
  onLeftClick,
  onRightClick,
}: HordeCardTileProps) {
  const hasStats = card.power !== null && card.toughness !== null;
  const computedPower = hasStats
    ? (parseInt(card.power || '0', 10) || 0) + card.plusOneCounters
    : null;
  const computedToughness = hasStats
    ? (parseInt(card.toughness || '0', 10) || 0) + card.plusOneCounters
    : null;

  return (
    <div
      onClick={() => onLeftClick(card)}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick(e, card);
      }}
      title="Clique esquerdo para virar/desvirar • Botão direito para ações (Destruir, Exilar, Marcadores...)"
      className={`group relative cursor-pointer select-none rounded-xl border transition-all duration-200 ${
        card.tapped
          ? 'rotate-3 border-amber-500/60 opacity-80'
          : 'border-zinc-700/80 hover:-translate-y-1 hover:border-emerald-500/70'
      } bg-zinc-900 shadow-lg`}
    >
      {card.tapped && (
        <span className="absolute left-2 top-2 z-20 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-950 shadow">
          Virada
        </span>
      )}

      {card.plusOneCounters > 0 && (
        <span className="absolute right-2 top-2 z-20 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-extrabold text-zinc-950 shadow">
          +{card.plusOneCounters}/+{card.plusOneCounters}
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRightClick(e, card);
        }}
        className="absolute bottom-2 left-2 z-20 rounded-md bg-zinc-950/85 px-2 py-0.5 text-xs text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-800"
      >
        Ações
      </button>

      {card.imageUrl ? (
        <div className="relative aspect-[5/7] w-full overflow-hidden rounded-xl">
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {hasStats && (
            <div className="absolute bottom-2 right-2 rounded-md border border-zinc-600 bg-zinc-950/90 px-2 py-0.5 text-xs font-bold text-white shadow">
              {computedPower}/{computedToughness}
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-[5/7] w-full flex-col justify-between rounded-xl bg-gradient-to-b from-zinc-800 via-zinc-900 to-black p-3">
          <div>
            <div className="flex items-start justify-between gap-1">
              <h4 className="text-xs font-bold leading-tight text-zinc-100">
                {card.ptName || card.name}
              </h4>
              {card.manaCost && (
                <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                  {card.manaCost}
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] font-medium text-emerald-400">
              {card.typeLine}
            </p>
          </div>

          <p className="line-clamp-5 text-[11px] leading-snug text-zinc-300">
            {card.oracleText}
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              {card.isToken ? 'Ficha' : 'Carta'}
            </span>
            {hasStats && (
              <span className="rounded border border-zinc-600 bg-zinc-950 px-2 py-0.5 text-xs font-bold text-white">
                {computedPower}/{computedToughness}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
