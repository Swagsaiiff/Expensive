export interface MonthlyPeriod {
  id: string; // e.g. "2026-09"
  monthName: string; // e.g. "September 2026"
  year: number;
  month: number; // 1-12
  salary: number;
  startingBalance: number;
  totalExpenses: number;
  totalSavings: number;
  remainingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseType = 'Expense' | 'Savings';

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  type: ExpenseType;
  category: string;
  description: string;
  amount: number;
  note?: string;
  monthId: string; // e.g. "2026-09"
  createdAt: string;
  updatedAt: string;
  syncedToCloud?: boolean;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  iconName: string;
  color: string;
  isCustom?: boolean;
  isSavings?: boolean;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'failed' | 'idle';

export interface GoogleUserInfo {
  email: string;
  name?: string;
  picture?: string;
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  lastSyncedAt?: string;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  theme: 'light' | 'dark' | 'system';
  autoSync: boolean;
}
