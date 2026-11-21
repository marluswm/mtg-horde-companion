'use client';

import React, { useEffect, useRef } from 'react';
import {
  BattlefieldCardActionType,
  HordeCardInstance,
} from '@/types/horde';

interface CardContextMenuProps {
  card: HordeCardInstance;
  x: number;
  y: number;
  onClose: () => void;
  onAction: (instanceId: string, action: BattlefieldCardActionType) => void;
}

export function CardContextMenu({
  card,
  x,
  y,
  onClose,
  onAction,
}: CardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const safeX =
    typeof window !== 'undefined' ? Math.min(x, window.innerWidth - 240) : x;
  const safeY =
    typeof window !== 'undefined' ? Math.min(y, window.innerHeight - 360) : y;

  const trigger = (action: BattlefieldCardActionType) => {
    onAction(card.instanceId, action);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ top: safeY, left: safeX }}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-50 w-56 rounded-xl border border-zinc-700 bg-zinc-900/95 p-1.5 text-sm text-zinc-100 shadow-2xl backdrop-blur-md"
    >
      <div className="border-b border-zinc-800 px-2.5 py-1.5">
        <p className="truncate font-semibold text-emerald-400">
          {card.ptName || card.name}
        </p>
        <p className="truncate text-xs text-zinc-400">{card.typeLine}</p>
      </div>

      <div className="py-1">
        <button
          type="button"
          onClick={() => trigger('TOGGLE_TAP')}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left hover:bg-zinc-800"
        >
          <span>{card.tapped ? 'Desvirar (Untap)' : 'Virar (Tap)'}</span>
          <span className="text-xs text-zinc-500">Click</span>
        </button>

        <button
          type="button"
          onClick={() => trigger('DESTROY')}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-red-400 hover:bg-red-950/50"
        >
          <span>Destruir</span>
          <span className="text-xs text-zinc-500">Cemitério</span>
        </button>

        <button
          type="button"
          onClick={() => trigger('EXILE')}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-amber-400 hover:bg-amber-950/50"
        >
          <span>Exilar</span>
          <span className="text-xs text-zinc-500">Exílio</span>
        </button>

        <button
          type="button"
          onClick={() => trigger('TO_TOP_LIBRARY')}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sky-400 hover:bg-sky-950/50"
        >
          <span>Devolver ao Topo</span>
          <span className="text-xs text-zinc-500">Grimório</span>
        </button>

        <button
          type="button"
          onClick={() => trigger('TO_GRAVEYARD')}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left hover:bg-zinc-800"
        >
          <span>Sacrificar / Cemitério</span>
        </button>
      </div>

      <div className="border-t border-zinc-800 py-1">
        <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Marcadores +1/+1 ({card.plusOneCounters})
        </div>
        <div className="flex gap-1 px-2 py-1">
          <button
            type="button"
            onClick={() => trigger('ADD_COUNTER')}
            className="flex-1 rounded-md bg-emerald-900/50 py-1 text-center font-medium text-emerald-300 hover:bg-emerald-800/60"
          >
            +1/+1
          </button>
          <button
            type="button"
            onClick={() => trigger('REMOVE_COUNTER')}
            disabled={card.plusOneCounters === 0}
            className="flex-1 rounded-md bg-zinc-800 py-1 text-center font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
          >
            -1/-1
          </button>
          {card.plusOneCounters > 0 && (
            <button
              type="button"
              onClick={() => trigger('RESET_COUNTERS')}
              className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700"
            >
              0
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-1">
        <button
          type="button"
          onClick={() => trigger('CLONE')}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-purple-300 hover:bg-purple-950/40"
        >
          <span>Criar Cópia na Mesa</span>
          <span className="text-xs text-zinc-500">+1</span>
        </button>
      </div>
    </div>
  );
}
