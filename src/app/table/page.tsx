'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHorde } from '@/context/HordeContext';
import { HordeCardInstance } from '@/types/horde';
import { HordeCardTile } from '@/components/HordeCardTile';
import { CardContextMenu } from '@/components/CardContextMenu';

export default function HordeTablePage() {
  const router = useRouter();
  const { state, dispatch, hydrated } = useHorde();

  const [millInput, setMillInput] = useState(3);
  const [contextMenu, setContextMenu] = useState<{
    card: HordeCardInstance;
    x: number;
    y: number;
  } | null>(null);
  const [drawerTab, setDrawerTab] = useState<'logs' | 'graveyard' | 'exile'>(
    'logs'
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Carregando mesa da Horda...
      </div>
    );
  }

  if (state.phase === 'SETUP') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center text-zinc-100">
        <p className="text-lg text-zinc-300">
          Nenhuma partida ativa encontrada.
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-xl bg-emerald-500 px-5 py-2.5 font-bold text-zinc-950 hover:bg-emerald-400"
        >
          Voltar para Configuração
        </button>
      </div>
    );
  }

  const handleRightClick = (e: React.MouseEvent, card: HordeCardInstance) => {
    setContextMenu({
      card,
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              ← Setup
            </button>
            <div>
              <h1 className="text-sm font-bold text-zinc-100">
                {state.deckName}
              </h1>
              <p className="text-xs text-emerald-400">
                Turno Jogador: {state.playerTurnNumber} • Turno Horda:{' '}
                {state.hordeTurnNumber} • Fase: {state.phase}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5">
              Grimório:{' '}
              <strong className="text-base text-sky-400">
                {state.deck.length}
              </strong>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5">
              Na Mesa:{' '}
              <strong className="text-base text-emerald-400">
                {state.battlefield.length}
              </strong>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5">
              Cemitério:{' '}
              <strong className="text-base text-zinc-300">
                {state.graveyard.length}
              </strong>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5">
              Exílio:{' '}
              <strong className="text-base text-amber-400">
                {state.exile.length}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={state.history.length === 0}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
            >
              Desfazer
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'UNTAP_HORDE_BOARD' })}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Desvirar Mesa
            </button>
          </div>
        </div>
      </header>

      {state.phase === 'VICTORY' && (
        <div className="border-b border-emerald-500/40 bg-emerald-950/70 px-4 py-6 text-center">
          <h2 className="text-2xl font-extrabold text-emerald-300">
            Vitória! A Horda Zumbi foi derrotada!
          </h2>
          <p className="mt-1 text-sm text-zinc-300">
            O grimório da Horda está vazio e não restam permanentes no campo de
            batalha.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-4 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-400"
          >
            Jogar Novamente
          </button>
        </div>
      )}

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-4">
        <div className="space-y-6 lg:col-span-3">
          <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Controle de Turno
              </p>
              <div className="flex flex-wrap gap-2">
                {state.phase === 'PLAYER_TURN' && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'END_PLAYER_TURN' })}
                    className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-sky-400"
                  >
                    Encerrar Turno dos Jogadores
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => dispatch({ type: 'RESOLVE_HORDE_WAVE' })}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-400"
                >
                  Revelar Onda da Horda
                </button>

                <button
                  type="button"
                  onClick={() => dispatch({ type: 'HORDE_ATTACK_ALL' })}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400"
                >
                  Atacar com Tudo
                </button>

                {(state.phase === 'HORDE_COMBAT' ||
                  state.phase === 'HORDE_END') && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'END_HORDE_TURN' })}
                    className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-zinc-700"
                  >
                    Passar Vez para Jogadores
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Causar Dano à Horda (Mill)
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 5].map((dmg) => (
                  <button
                    type="button"
                    key={dmg}
                    onClick={() =>
                      dispatch({ type: 'MILL_HORDE', amount: dmg })
                    }
                    className="rounded-lg border border-red-800/60 bg-red-950/50 px-3 py-1.5 text-sm font-bold text-red-300 hover:bg-red-900/60"
                  >
                    -{dmg}
                  </button>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={millInput}
                    onChange={(e) => setMillInput(Number(e.target.value))}
                    className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: 'MILL_HORDE', amount: millInput })
                    }
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-500"
                  >
                    Mill
                  </button>
                </div>
              </div>
            </div>
          </section>

          {state.lastRevealedBatch.length > 0 && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Última Onda Revelada ({state.lastRevealedBatch.length} carta(s))
              </h2>
              <div className="flex flex-wrap gap-2">
                {state.lastRevealedBatch.map((card) => (
                  <span
                    key={card.instanceId}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                      card.isToken
                        ? 'border-zinc-700 bg-zinc-800/80 text-zinc-300'
                        : 'border-purple-500/50 bg-purple-950/50 text-purple-200'
                    }`}
                  >
                    {card.ptName || card.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">
                Campo de Batalha da Horda ({state.battlefield.length})
              </h2>
              <span className="text-xs text-zinc-400">
                Clique esquerdo: Virar • Botão direito: Destruir / Exilar / +1/+1
              </span>
            </div>

            {state.battlefield.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center text-sm text-zinc-500">
                Nenhuma permanente da Horda na mesa no momento.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {state.battlefield.map((card) => (
                  <HordeCardTile
                    key={card.instanceId}
                    card={card}
                    onLeftClick={(c) =>
                      dispatch({
                        type: 'BATTLEFIELD_CARD_ACTION',
                        instanceId: c.instanceId,
                        action: 'TOGGLE_TAP',
                      })
                    }
                    onRightClick={handleRightClick}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="flex h-[calc(100vh-7rem)] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="mb-3 flex gap-1 rounded-xl bg-zinc-950 p-1 text-xs">
            <button
              type="button"
              onClick={() => setDrawerTab('logs')}
              className={`flex-1 rounded-lg py-1.5 font-semibold ${
                drawerTab === 'logs'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Log ({state.logs.length})
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('graveyard')}
              className={`flex-1 rounded-lg py-1.5 font-semibold ${
                drawerTab === 'graveyard'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cemitério ({state.graveyard.length})
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('exile')}
              className={`flex-1 rounded-lg py-1.5 font-semibold ${
                drawerTab === 'exile'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Exílio ({state.exile.length})
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
            {drawerTab === 'logs' &&
              state.logs.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-2"
                >
                  <span className="text-[10px] text-zinc-500">
                    {entry.timestamp}
                  </span>
                  <p className="mt-0.5 text-zinc-200">{entry.message}</p>
                </div>
              ))}

            {drawerTab === 'graveyard' &&
              (state.graveyard.length === 0 ? (
                <p className="py-8 text-center text-zinc-500">
                  Cemitério vazio.
                </p>
              ) : (
                state.graveyard.map((card) => (
                  <div
                    key={card.instanceId}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-2"
                  >
                    <span className="truncate font-medium text-zinc-200">
                      {card.ptName || card.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: 'MOVE_CARD_ZONE',
                          instanceId: card.instanceId,
                          toZone: 'battlefield',
                        })
                      }
                      className="ml-2 shrink-0 rounded bg-emerald-900/50 px-2 py-0.5 text-[11px] text-emerald-300 hover:bg-emerald-800"
                    >
                      Reanimar
                    </button>
                  </div>
                ))
              ))}

            {drawerTab === 'exile' &&
              (state.exile.length === 0 ? (
                <p className="py-8 text-center text-zinc-500">Exílio vazio.</p>
              ) : (
                state.exile.map((card) => (
                  <div
                    key={card.instanceId}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-2"
                  >
                    <span className="truncate font-medium text-zinc-200">
                      {card.ptName || card.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: 'MOVE_CARD_ZONE',
                          instanceId: card.instanceId,
                          toZone: 'battlefield',
                        })
                      }
                      className="ml-2 shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-700"
                    >
                      Mesa
                    </button>
                  </div>
                ))
              ))}
          </div>
        </aside>
      </main>

      {contextMenu && (
        <CardContextMenu
          card={contextMenu.card}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAction={(instanceId, action) =>
            dispatch({
              type: 'BATTLEFIELD_CARD_ACTION',
              instanceId,
              action,
            })
          }
        />
      )}
    </div>
  );
}
