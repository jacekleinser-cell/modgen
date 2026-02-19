export interface FileData {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: Date;
  status: 'clean' | 'analyzing' | 'ready' | 'patched';
}

export interface ModOption {
  id: string;
  name: string;
  description: string;
  category: 'currency' | 'gameplay' | 'unlock' | 'utility';
  active: boolean;
  detectedCurrencies?: string[]; // New field for dynamic currency detection
}

export interface PatchLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'code';
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  STORE = 'STORE',
  SETTINGS = 'SETTINGS',
}