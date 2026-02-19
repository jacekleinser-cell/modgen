
import { ModOption, FileData } from './types';

export const INITIAL_MODS: ModOption[] = [
  {
    id: 'unlimited_currency',
    name: 'Unlimited Currency',
    description: 'Sets detected currencies to max value (999,999,999)',
    category: 'currency',
    active: false,
  },
  {
    id: 'god_mode',
    name: 'God Mode',
    description: 'Invincibility and infinite stamina',
    category: 'gameplay',
    active: false,
  },
  {
    id: 'remove_ads',
    name: 'Remove Ads',
    description: 'Disables all interstitial and banner ads',
    category: 'utility',
    active: false,
  },
  {
    id: 'unlock_all',
    name: 'Unlock All Levels',
    description: 'Unlocks all campaign levels and DLC content',
    category: 'unlock',
    active: false,
  },
  {
    id: 'speed_hack',
    name: 'Speed Multiplier x2',
    description: 'Doubles the game logic update rate',
    category: 'gameplay',
    active: false,
  },
];

export const MOCK_FILES: FileData[] = [];
