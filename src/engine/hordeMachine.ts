import {
  HordeCardInstance,
  HordeCardTemplate,
  HordeEvent,
  HordeGameSnapshot,
  HordeGameState,
  HordeLogEntry,
} from '@/types/horde';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createLog(
  message: string,
  type: HordeLogEntry['type'] = 'info'
): HordeLogEntry {
  const now = new Date();
  const timestamp = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return {
    id: generateId(),
    timestamp,
    message,
    type,
  };
}

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function expandTemplatesToInstances(
  templates: HordeCardTemplate[]
): HordeCardInstance[] {
  const instances: HordeCardInstance[] = [];
  for (const tpl of templates) {
    for (let i = 0; i < tpl.quantity; i++) {
      instances.push({
        instanceId: generateId(),
        templateId: tpl.id,
        name: tpl.name,
        ptName: tpl.ptName,
        isToken: tpl.isToken,
        typeLine: tpl.typeLine,
        power: tpl.power ?? null,
        toughness: tpl.toughness ?? null,
        manaCost: tpl.manaCost,
        colors: tpl.colors,
        oracleText: tpl.oracleText,
        scryfallQuery: tpl.scryfallQuery,
        zone: 'library',
        zoneAfterCast: tpl.zoneAfterCast,
        tapped: false,
        plusOneCounters: 0,
        summoningSickness: false,
      });
    }
  }
  return instances;
}

export function checkVictory(state: {
  deck: HordeCardInstance[];
  battlefield: HordeCardInstance[];
}): boolean {
  return state.deck.length === 0 && state.battlefield.length === 0;
}

export function isCreature(card: HordeCardInstance): boolean {
  return card.typeLine.toLowerCase().includes('creature');
}

export const INITIAL_HORDE_STATE: HordeGameState = {
  deckName: 'Horda Zumbi Clássica',
  phase: 'SETUP',
  hordeTurnNumber: 0,
  playerTurnNumber: 1,
  rules: {
    stopOnNonTokenCount: 1,
    hordeCreaturesHaveHaste: true,
    hordeMustAttack: true,
    damageToHordeCausesMill: true,
    startingPlayerPrepTurns: 3,
    referencePlayerLife: 20,
  },
  deck: [],
  graveyard: [],
  exile: [],
  battlefield: [],
  lastRevealedBatch: [],
  logs: [],
  history: [],
};

function takeSnapshot(state: HordeGameState): HordeGameSnapshot {
  return {
    phase: state.phase,
    hordeTurnNumber: state.hordeTurnNumber,
    playerTurnNumber: state.playerTurnNumber,
    rules: { ...state.rules },
    deck: state.deck.map((c) => ({ ...c })),
    graveyard: state.graveyard.map((c) => ({ ...c })),
    exile: state.exile.map((c) => ({ ...c })),
    battlefield: state.battlefield.map((c) => ({ ...c })),
    lastRevealedBatch: state.lastRevealedBatch.map((c) => ({ ...c })),
    logs: [...state.logs],
  };
}

function pushHistory(state: HordeGameState): HordeGameSnapshot[] {
  const snap = takeSnapshot(state);
  return [...state.history.slice(-19), snap];
}

export function hordeReducer(
  state: HordeGameState,
  event: HordeEvent
): HordeGameState {
  switch (event.type) {
    case 'HYDRATE_STATE': {
      return {
        ...INITIAL_HORDE_STATE,
        ...event.payload,
        rules: {
          ...INITIAL_HORDE_STATE.rules,
          ...(event.payload.rules ?? {}),
        },
        deck: Array.isArray(event.payload.deck) ? event.payload.deck : [],
        graveyard: Array.isArray(event.payload.graveyard)
          ? event.payload.graveyard
          : [],
        exile: Array.isArray(event.payload.exile) ? event.payload.exile : [],
        battlefield: Array.isArray(event.payload.battlefield)
          ? event.payload.battlefield
          : [],
        lastRevealedBatch: Array.isArray(event.payload.lastRevealedBatch)
          ? event.payload.lastRevealedBatch
          : [],
        logs: Array.isArray(event.payload.logs) ? event.payload.logs : [],
        history: Array.isArray(event.payload.history)
          ? event.payload.history
          : [],
      };
    }

    case 'START_GAME': {
      const expanded = expandTemplatesToInstances(event.templates);
      const shuffled = shuffleArray(expanded);
      const initialPhase =
        event.rules.startingPlayerPrepTurns > 0
          ? 'PLAYER_TURN'
          : 'HORDE_REVEALING';

      return {
        deckName: event.deckName,
        phase: initialPhase,
        hordeTurnNumber: 0,
        playerTurnNumber: 1,
        rules: event.rules,
        deck: shuffled,
        graveyard: [],
        exile: [],
        battlefield: [],
        lastRevealedBatch: [],
        logs: [
          createLog(
            `Partida iniciada contra "${event.deckName}" (${shuffled.length} cartas no grimório).`,
            'info'
          ),
          event.rules.startingPlayerPrepTurns > 0
            ? createLog(
                `Jogadores têm ${event.rules.startingPlayerPrepTurns} turno(s) de preparação antes da Horda agir.`,
                'info'
              )
            : createLog('A Horda começa atacando imediatamente!', 'combat'),
        ],
        history: [],
      };
    }

    case 'END_PLAYER_TURN': {
      if (state.phase !== 'PLAYER_TURN') return state;
      const history = pushHistory(state);
      const nextPlayerTurn = state.playerTurnNumber + 1;
      const stillInPrep =
        state.playerTurnNumber < state.rules.startingPlayerPrepTurns;

      if (stillInPrep) {
        return {
          ...state,
          history,
          playerTurnNumber: nextPlayerTurn,
          logs: [
            createLog(
              `Turno ${state.playerTurnNumber} dos jogadores encerrado (Preparação: ${state.playerTurnNumber}/${state.rules.startingPlayerPrepTurns}).`,
              'info'
            ),
            ...state.logs,
          ],
        };
      }

      const untappedBoard = state.battlefield.map((c) => ({
        ...c,
        tapped: false,
        summoningSickness: false,
      }));

      return {
        ...state,
        history,
        phase: 'HORDE_REVEALING',
        playerTurnNumber: nextPlayerTurn,
        battlefield: untappedBoard,
        logs: [
          createLog(
            `Turno dos jogadores encerrado. Iniciando Turno ${state.hordeTurnNumber + 1} da Horda!`,
            'info'
          ),
          ...state.logs,
        ],
      };
    }

    case 'RESOLVE_HORDE_WAVE': {
      if (
        state.phase !== 'HORDE_REVEALING' &&
        state.phase !== 'PLAYER_TURN'
      ) {
        return state;
      }

      const history = pushHistory(state);
      const remainingDeck = [...state.deck];
      const nextBattlefield = state.battlefield.map((c) => ({
        ...c,
        tapped: false,
        summoningSickness: false,
      }));
      const nextGraveyard = [...state.graveyard];
      const revealedBatch: HordeCardInstance[] = [];

      let nonTokensFound = 0;
      let tokensCount = 0;

      while (
        remainingDeck.length > 0 &&
        nonTokensFound < state.rules.stopOnNonTokenCount
      ) {
        const topCard = remainingDeck.shift()!;
        const preparedCard: HordeCardInstance = {
          ...topCard,
          tapped: false,
          summoningSickness: !state.rules.hordeCreaturesHaveHaste,
        };

        revealedBatch.push(preparedCard);

        if (preparedCard.isToken) {
          tokensCount++;
          nextBattlefield.push({
            ...preparedCard,
            zone: 'battlefield',
          });
        } else {
          nonTokensFound++;
          if (preparedCard.zoneAfterCast === 'battlefield') {
            nextBattlefield.push({
              ...preparedCard,
              zone: 'battlefield',
            });
          } else {
            nextGraveyard.unshift({
              ...preparedCard,
              zone: 'graveyard',
            });
          }
        }
      }

      const castNames = revealedBatch
        .filter((c) => !c.isToken)
        .map((c) => c.ptName || c.name)
        .join(', ');

      const newLogs = [...state.logs];
      if (revealedBatch.length === 0) {
        newLogs.unshift(
          createLog('O grimório da Horda está vazio! Nenhuma carta revelada.', 'info')
        );
      } else {
        newLogs.unshift(
          createLog(
            `Onda da Horda: ${tokensCount} ficha(s) entrou(aram) em jogo${
              castNames ? ` e conjurado: ${castNames}` : ''
            }.`,
            'cast'
          )
        );
      }

      const won = checkVictory({
        deck: remainingDeck,
        battlefield: nextBattlefield,
      });

      return {
        ...state,
        history,
        phase: won ? 'VICTORY' : 'HORDE_COMBAT',
        deck: remainingDeck,
        battlefield: nextBattlefield,
        graveyard: nextGraveyard,
        lastRevealedBatch: revealedBatch,
        logs: won
          ? [
              createLog(
                'Vitória! A Horda não possui mais cartas nem permanentes!',
                'victory'
              ),
              ...newLogs,
            ]
          : newLogs,
      };
    }

    case 'HORDE_ATTACK_ALL': {
      const history = pushHistory(state);
      let attackersCount = 0;
      let totalPower = 0;

      const updatedBattlefield = state.battlefield.map((card) => {
        const canAttack =
          isCreature(card) &&
          !card.tapped &&
          (!card.summoningSickness || state.rules.hordeCreaturesHaveHaste);

        if (canAttack) {
          attackersCount++;
          const basePower = parseInt(card.power ?? '0', 10) || 0;
          totalPower += Math.max(0, basePower + card.plusOneCounters);
          return { ...card, tapped: true };
        }
        return card;
      });

      return {
        ...state,
        history,
        phase: 'HORDE_END',
        battlefield: updatedBattlefield,
        logs: [
          attackersCount > 0
            ? createLog(
                `Combate da Horda: ${attackersCount} criatura(s) atacando (Poder base somado: ${totalPower}, sem contar bônus de Lords).`,
                'combat'
              )
            : createLog('A Horda não possui criaturas aptas para atacar.', 'combat'),
          ...state.logs,
        ],
      };
    }

    case 'UNTAP_HORDE_BOARD': {
      const history = pushHistory(state);
      return {
        ...state,
        history,
        battlefield: state.battlefield.map((c) => ({ ...c, tapped: false })),
        logs: [createLog('Permanentes da Horda desviradas.', 'action'), ...state.logs],
      };
    }

    case 'END_HORDE_TURN': {
      const history = pushHistory(state);
      const nextHordeTurn = state.hordeTurnNumber + 1;
      const won = checkVictory(state);

      return {
        ...state,
        history,
        hordeTurnNumber: nextHordeTurn,
        phase: won ? 'VICTORY' : 'PLAYER_TURN',
        logs: [
          won
            ? createLog('Vitória! A Horda foi derrotada!', 'victory')
            : createLog(
                `Turno ${nextHordeTurn} da Horda encerrado. Vez dos jogadores!`,
                'info'
              ),
          ...state.logs,
        ],
      };
    }

    case 'MILL_HORDE': {
      const amount = Math.max(0, Math.floor(event.amount));
      if (amount === 0 || state.deck.length === 0) return state;

      const history = pushHistory(state);
      const remainingDeck = [...state.deck];
      const milledCards = remainingDeck.splice(0, amount).map((c) => ({
        ...c,
        zone: 'graveyard' as const,
      }));

      const nextGraveyard = [...milledCards.reverse(), ...state.graveyard];
      const won = checkVictory({
        deck: remainingDeck,
        battlefield: state.battlefield,
      });

      const milledSummary = milledCards
        .map((c) => c.ptName || c.name)
        .slice(0, 5)
        .join(', ');

      return {
        ...state,
        history,
        deck: remainingDeck,
        graveyard: nextGraveyard,
        phase: won ? 'VICTORY' : state.phase,
        logs: [
          ...(won
            ? [
                createLog(
                  'Vitória! O grimório e a mesa da Horda estão vazios!',
                  'victory'
                ),
              ]
            : []),
          createLog(
            `Horda sofreu ${milledCards.length} de dano (Mill): ${milledSummary}${
              milledCards.length > 5 ? '...' : ''
            }.`,
            'mill'
          ),
          ...state.logs,
        ],
      };
    }

    case 'BATTLEFIELD_CARD_ACTION': {
      const target = state.battlefield.find(
        (c) => c.instanceId === event.instanceId
      );
      if (!target) return state;

      const history = pushHistory(state);
      let nextBattlefield = [...state.battlefield];
      const nextGraveyard = [...state.graveyard];
      const nextExile = [...state.exile];
      const nextDeck = [...state.deck];
      let logMessage = '';

      switch (event.action) {
        case 'DESTROY':
        case 'TO_GRAVEYARD': {
          nextBattlefield = nextBattlefield.filter(
            (c) => c.instanceId !== target.instanceId
          );
          if (!target.isToken) {
            nextGraveyard.unshift({
              ...target,
              zone: 'graveyard',
              tapped: false,
              plusOneCounters: 0,
            });
          }
          logMessage = `${target.ptName || target.name} foi ${
            event.action === 'DESTROY' ? 'destruído(a)' : 'enviado(a) ao cemitério'
          }${target.isToken ? ' (ficha removida)' : ''}.`;
          break;
        }

        case 'EXILE': {
          nextBattlefield = nextBattlefield.filter(
            (c) => c.instanceId !== target.instanceId
          );
          if (!target.isToken) {
            nextExile.unshift({
              ...target,
              zone: 'exile',
              tapped: false,
              plusOneCounters: 0,
            });
          }
          logMessage = `${target.ptName || target.name} foi exilado(a).`;
          break;
        }

        case 'TO_TOP_LIBRARY': {
          nextBattlefield = nextBattlefield.filter(
            (c) => c.instanceId !== target.instanceId
          );
          if (!target.isToken) {
            nextDeck.unshift({
              ...target,
              zone: 'library',
              tapped: false,
              plusOneCounters: 0,
            });
          }
          logMessage = `${target.ptName || target.name} voltou para o topo do grimório da Horda.`;
          break;
        }

        case 'TOGGLE_TAP': {
          nextBattlefield = nextBattlefield.map((c) =>
            c.instanceId === target.instanceId
              ? { ...c, tapped: !c.tapped }
              : c
          );
          logMessage = `${target.ptName || target.name} foi ${
            !target.tapped ? 'virado(a)' : 'desvirado(a)'
          }.`;
          break;
        }

        case 'ADD_COUNTER': {
          nextBattlefield = nextBattlefield.map((c) =>
            c.instanceId === target.instanceId
              ? { ...c, plusOneCounters: c.plusOneCounters + 1 }
              : c
          );
          logMessage = `Marcador +1/+1 adicionado em ${target.ptName || target.name}.`;
          break;
        }

        case 'REMOVE_COUNTER': {
          nextBattlefield = nextBattlefield.map((c) =>
            c.instanceId === target.instanceId
              ? { ...c, plusOneCounters: Math.max(0, c.plusOneCounters - 1) }
              : c
          );
          logMessage = `Marcador +1/+1 removido de ${target.ptName || target.name}.`;
          break;
        }

        case 'RESET_COUNTERS': {
          nextBattlefield = nextBattlefield.map((c) =>
            c.instanceId === target.instanceId
              ? { ...c, plusOneCounters: 0 }
              : c
          );
          logMessage = `Marcadores zerados em ${target.ptName || target.name}.`;
          break;
        }

        case 'CLONE': {
          const cloneInstance: HordeCardInstance = {
            ...target,
            instanceId: generateId(),
            isToken: true,
            tapped: false,
          };
          nextBattlefield.push(cloneInstance);
          logMessage = `Cópia de ${target.ptName || target.name} criada no campo de batalha.`;
          break;
        }
      }

      const won = checkVictory({
        deck: nextDeck,
        battlefield: nextBattlefield,
      });

      return {
        ...state,
        history,
        deck: nextDeck,
        battlefield: nextBattlefield,
        graveyard: nextGraveyard,
        exile: nextExile,
        phase: won ? 'VICTORY' : state.phase,
        logs: [
          ...(won
            ? [
                createLog(
                  'Vitória! Todas as ameaças da Horda foram eliminadas!',
                  'victory'
                ),
              ]
            : []),
          createLog(logMessage, 'action'),
          ...state.logs,
        ],
      };
    }

    case 'MOVE_CARD_ZONE': {
      const history = pushHistory(state);
      let foundCard: HordeCardInstance | undefined;

      const filterOut = (list: HordeCardInstance[]) =>
        list.filter((c) => {
          if (c.instanceId === event.instanceId) {
            foundCard = c;
            return false;
          }
          return true;
        });

      const deck = filterOut(state.deck);
      const battlefield = filterOut(state.battlefield);
      const graveyard = filterOut(state.graveyard);
      const exile = filterOut(state.exile);

      if (!foundCard) return state;

      const moved: HordeCardInstance = {
        ...foundCard,
        zone: event.toZone,
        tapped: false,
      };

      if (event.toZone === 'library') deck.unshift(moved);
      if (event.toZone === 'battlefield') battlefield.push(moved);
      if (event.toZone === 'graveyard' && !moved.isToken) graveyard.unshift(moved);
      if (event.toZone === 'exile' && !moved.isToken) exile.unshift(moved);

      const won = checkVictory({ deck, battlefield });

      return {
        ...state,
        history,
        deck,
        battlefield,
        graveyard,
        exile,
        phase: won ? 'VICTORY' : state.phase,
        logs: [
          createLog(
            `${moved.ptName || moved.name} movido(a) para ${event.toZone}.`,
            'action'
          ),
          ...state.logs,
        ],
      };
    }

    case 'SET_CARD_IMAGE': {
      const applyImg = (list: HordeCardInstance[]) =>
        list.map((c) =>
          c.templateId === event.templateId
            ? { ...c, imageUrl: event.imageUrl }
            : c
        );

      return {
        ...state,
        deck: applyImg(state.deck),
        battlefield: applyImg(state.battlefield),
        graveyard: applyImg(state.graveyard),
        exile: applyImg(state.exile),
        lastRevealedBatch: applyImg(state.lastRevealedBatch),
      };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...previous,
        deckName: state.deckName,
        history: state.history.slice(0, -1),
        logs: [createLog('Última ação desfeita.', 'info'), ...previous.logs],
      };
    }

    case 'RESET_GAME': {
      return INITIAL_HORDE_STATE;
    }

    default:
      return state;
  }
}
