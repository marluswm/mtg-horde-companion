export type Zone = 'library' | 'battlefield' | 'graveyard' | 'exile';

export type HordePhase =
  | 'SETUP'
  | 'PLAYER_TURN'
  | 'HORDE_REVEALING'
  | 'HORDE_COMBAT'
  | 'HORDE_END'
  | 'VICTORY';

export interface HordeCardTemplate {
  id: string;
  name: string;
  ptName: string;
  quantity: number;
  isToken: boolean;
  typeLine: string;
  power?: string | null;
  toughness?: string | null;
  manaCost: string;
  colors: string[];
  oracleText: string;
  scryfallQuery: string;
  defaultZone: 'library';
  zoneAfterCast: 'battlefield' | 'graveyard';
}

export interface HordeRulesConfig {
  stopOnNonTokenCount: number;
  hordeCreaturesHaveHaste: boolean;
  hordeMustAttack: boolean;
  damageToHordeCausesMill: boolean;
  startingPlayerPrepTurns: number;
  referencePlayerLife: number;
}

export interface HordeDeckPreset {
  id: string;
  name: string;
  theme: string;
  description: string;
  defaultRules: HordeRulesConfig;
  cards: HordeCardTemplate[];
}

export interface HordeCardInstance {
  instanceId: string;
  templateId: string;
  name: string;
  ptName: string;
  isToken: boolean;
  typeLine: string;
  power?: string | null;
  toughness?: string | null;
  manaCost: string;
  colors: string[];
  oracleText: string;
  scryfallQuery: string;
  imageUrl?: string;
  zone: Zone;
  zoneAfterCast: 'battlefield' | 'graveyard';
  tapped: boolean;
  plusOneCounters: number;
  summoningSickness: boolean;
}

export interface HordeLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type?: 'info' | 'combat' | 'mill' | 'cast' | 'action' | 'victory';
}

export type BattlefieldCardActionType =
  | 'DESTROY'
  | 'EXILE'
  | 'TO_TOP_LIBRARY'
  | 'TO_GRAVEYARD'
  | 'TOGGLE_TAP'
  | 'ADD_COUNTER'
  | 'REMOVE_COUNTER'
  | 'RESET_COUNTERS'
  | 'CLONE';

export interface HordeGameSnapshot {
  phase: HordePhase;
  hordeTurnNumber: number;
  playerTurnNumber: number;
  rules: HordeRulesConfig;
  deck: HordeCardInstance[];
  graveyard: HordeCardInstance[];
  exile: HordeCardInstance[];
  battlefield: HordeCardInstance[];
  lastRevealedBatch: HordeCardInstance[];
  logs: HordeLogEntry[];
}

export interface HordeGameState extends HordeGameSnapshot {
  deckName: string;
  history: HordeGameSnapshot[];
}

export type HordeEvent =
  | { type: 'HYDRATE_STATE'; payload: HordeGameState }
  | {
      type: 'START_GAME';
      deckName: string;
      templates: HordeCardTemplate[];
      rules: HordeRulesConfig;
    }
  | { type: 'END_PLAYER_TURN' }
  | { type: 'RESOLVE_HORDE_WAVE' }
  | { type: 'HORDE_ATTACK_ALL' }
  | { type: 'UNTAP_HORDE_BOARD' }
  | { type: 'END_HORDE_TURN' }
  | { type: 'MILL_HORDE'; amount: number }
  | {
      type: 'BATTLEFIELD_CARD_ACTION';
      instanceId: string;
      action: BattlefieldCardActionType;
    }
  | { type: 'MOVE_CARD_ZONE'; instanceId: string; toZone: Zone }
  | { type: 'SET_CARD_IMAGE'; templateId: string; imageUrl: string }
  | { type: 'UNDO' }
  | { type: 'RESET_GAME' };
