"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ZOMBIE_HORDE_PRESETS } from "@/data/zombieHordeDeck";
import { useHorde } from "@/context/HordeContext";

export default function HomePage() {
  const router = useRouter();
  const { state, dispatch } = useHorde();

  const [selectedPresetId, setSelectedPresetId] = useState(
    ZOMBIE_HORDE_PRESETS[0].id,
  );
  const preset =
    ZOMBIE_HORDE_PRESETS.find((p) => p.id === selectedPresetId) ||
    ZOMBIE_HORDE_PRESETS[0];

  const [prepTurns, setPrepTurns] = useState(
    preset.defaultRules.startingPlayerPrepTurns,
  );
  const [nonTokenStop, setNonTokenStop] = useState(
    preset.defaultRules.stopOnNonTokenCount,
  );
  const [hasteEnabled, setHasteEnabled] = useState(
    preset.defaultRules.hordeCreaturesHaveHaste,
  );

  const handlePresetChange = (id: string) => {
    setSelectedPresetId(id);
    const next = ZOMBIE_HORDE_PRESETS.find((p) => p.id === id);
    if (next) {
      setPrepTurns(next.defaultRules.startingPlayerPrepTurns);
      setNonTokenStop(next.defaultRules.stopOnNonTokenCount);
      setHasteEnabled(next.defaultRules.hordeCreaturesHaveHaste);
    }
  };

  const totalCards = preset.cards.reduce((acc, c) => acc + c.quantity, 0);
  const totalTokens = preset.cards
    .filter((c) => c.isToken)
    .reduce((acc, c) => acc + c.quantity, 0);

  const handleStart = () => {
    dispatch({
      type: "START_GAME",
      deckName: preset.name,
      templates: preset.cards,
      rules: {
        ...preset.defaultRules,
        startingPlayerPrepTurns: prepTurns,
        stopOnNonTokenCount: nonTokenStop,
        hordeCreaturesHaveHaste: hasteEnabled,
      },
    });
    router.push("/table");
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2 border-b border-zinc-800 pb-6">
          <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            MTG Horde Companion • Jogo Físico + Mesa Virtual de Horda Zumbi (by
            Mibeira)
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Deck test Simulador de Horda Zumbi
          </h1>
          <p className="text-zinc-400">
            Jogue com seu deck físico na mesa enquanto o sistema controla o
            grimório, hordas, ataques e permanentes da horda em tempo real.
          </p>
        </header>

        {state.phase !== "SETUP" && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-700/50 bg-emerald-950/30 p-4">
            <div>
              <p className="font-semibold text-emerald-300">
                Você tem uma partida em andamento ({state.deckName})
              </p>
              <p className="text-xs text-zinc-400">
                Grimório: {state.deck.length} cartas • Mesa:{" "}
                {state.battlefield.length} permanentes
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/table")}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-400"
            >
              Voltar para a Mesa
            </button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="text-lg font-bold">Configurar Partida</h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Deck da Horda
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
              >
                {ZOMBIE_HORDE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-400">{preset.description}</p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-zinc-300">
                <span className="rounded bg-zinc-800 px-2 py-1">
                  Total: <strong>{totalCards}</strong> cartas
                </span>
                <span className="rounded bg-zinc-800 px-2 py-1">
                  Fichas: <strong>{totalTokens}</strong>
                </span>
                <span className="rounded bg-zinc-800 px-2 py-1">
                  Mágicas/Criaturas: <strong>{totalCards - totalTokens}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Turnos de Preparação
                </label>
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={prepTurns}
                  onChange={(e) => setPrepTurns(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Não-fichas por Onda
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={nonTokenStop}
                  onChange={(e) => setNonTokenStop(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={hasteEnabled}
                onChange={(e) => setHasteEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500"
              />
              Criaturas da Horda têm Ímpeto (Haste)
            </label>

            <button
              type="button"
              onClick={handleStart}
              className="w-full rounded-xl bg-emerald-500 py-3.5 text-base font-extrabold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Iniciar Partida e Ir para a Mesa
            </button>
          </section>

          <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-lg font-bold">Regras Rápidas da Horda</h2>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              <li>
                <strong className="text-emerald-400">• Mana Infinita:</strong> A
                Horda paga qualquer custo e ignora impostos de mana.
              </li>
              <li>
                <strong className="text-emerald-400">• Turno da Horda:</strong>{" "}
                Revela cartas do topo; todas as fichas entram em jogo até
                revelar <strong>{nonTokenStop}</strong> carta(s) não-ficha.
              </li>
              <li>
                <strong className="text-emerald-400">• Combate:</strong>{" "}
                Criaturas da Horda atacam todos os turnos se puderem e não
                bloqueiam (ou apenas criaturas com Defensor / Defender
                bloqueiam).
              </li>
              <li>
                <strong className="text-emerald-400">• Dano = Mill:</strong>{" "}
                Como a Horda não tem vida, atacar diretamente a Horda faz com
                que ela mill do topo do grimório uma quantidade de cartas igual
                ao dano causado.
              </li>
              <li>
                <strong className="text-emerald-400">
                  • Controles na Mesa:
                </strong>{" "}
                Use o <strong>botão direito</strong> sobre qualquer carta da
                Horda para destruir, exilar, devolver ao topo ou adicionar
                marcadores +1/+1.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
