'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { HordeEvent, HordeGameState } from '@/types/horde';
import { hordeReducer, INITIAL_HORDE_STATE } from '@/engine/hordeMachine';
import { fetchScryfallCardImage } from '@/services/scryfall';

const GAME_STORAGE_KEY = 'mtg_horde_active_game_v1';

interface HordeContextValue {
  state: HordeGameState;
  dispatch: React.Dispatch<HordeEvent>;
  hydrated: boolean;
}

const HordeContext = createContext<HordeContextValue | undefined>(undefined);

export function HordeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(hordeReducer, INITIAL_HORDE_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(GAME_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as HordeGameState;
        if (parsed && parsed.phase) {
          dispatch({ type: 'HYDRATE_STATE', payload: parsed });
        }
      }
    } catch {} finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated || state.phase === 'SETUP') return;

    const allCards = [
      ...state.battlefield,
      ...state.lastRevealedBatch,
      ...state.deck.slice(0, 15),
    ];

    const missingTemplates = new Map<string, { query: string; name: string }>();
    for (const card of allCards) {
      if (!card.imageUrl && !missingTemplates.has(card.templateId)) {
        missingTemplates.set(card.templateId, {
          query: card.scryfallQuery,
          name: card.name,
        });
      }
    }

    let cancelled = false;
    missingTemplates.forEach(async ({ query, name }, templateId) => {
      const imageUrl = await fetchScryfallCardImage(query, name);
      if (!cancelled && imageUrl) {
        dispatch({ type: 'SET_CARD_IMAGE', templateId, imageUrl });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    state.phase,
    state.battlefield.length,
    state.lastRevealedBatch.length,
    state.deck.length,
  ]);

  return (
    <HordeContext.Provider value={{ state, dispatch, hydrated }}>
      {children}
    </HordeContext.Provider>
  );
}

export function useHorde() {
  const ctx = useContext(HordeContext);
  if (!ctx) {
    throw new Error('useHorde deve ser usado dentro de HordeProvider');
  }
  return ctx;
}
