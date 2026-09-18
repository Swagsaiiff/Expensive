import { MonthlyPeriod, ExpenseItem, CategoryDefinition, AppSettings } from '../types';
import { DEFAULT_CATEGORIES, formatMonthId, MONTH_NAMES } from '../constants';

const PERIODS_KEY = 'set_monthly_periods';
const EXPENSES_KEY = 'set_expense_items';
const CATEGORIES_KEY = 'set_categories';
const SETTINGS_KEY = 'set_app_settings';
const PENDING_SYNC_KEY = 'set_pending_sync_queue';

export function getLocalSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return {
    currency: 'BDT',
    currencySymbol: '৳',
    theme: 'light',
    autoSync: true,
  };
}

export function saveLocalSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getLocalCategories(): CategoryDefinition[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveLocalCategories(cats: CategoryDefinition[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
}

export function getLocalPeriods(): MonthlyPeriod[] {
  try {
    const raw = localStorage.getItem(PERIODS_KEY);
    if (raw) {
      const parsed: MonthlyPeriod[] = JSON.parse(raw);
      if (parsed.length > 0) {
        // Sanitize any previously seeded dummy values
        const sanitized = parsed.map(p => {
          if (p.salary === 25000 && p.totalExpenses === 8450 && p.totalSavings === 5000) {
            return {
              ...p,
              salary: 0,
              startingBalance: 0,
              totalExpenses: 0,
              totalSavings: 0,
              remainingBalance: 0,
            };
          }
          return p;
        });
        return sanitized;
      }
    }
  } catch (e) {
    console.error(e);
  }

  // Current month: starts clean with 0 until user sets their salary
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const id = formatMonthId(year, month);
  const initialPeriod: MonthlyPeriod = {
    id,
    monthName: `${MONTH_NAMES[month - 1]} ${year}`,
    year,
    month,
    salary: 0,
    startingBalance: 0,
    totalExpenses: 0,
    totalSavings: 0,
    remainingBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveLocalPeriods([initialPeriod]);
  return [initialPeriod];
}

export function saveLocalPeriods(periods: MonthlyPeriod[]): void {
  localStorage.setItem(PERIODS_KEY, JSON.stringify(periods));
}

export function getLocalExpenses(): ExpenseItem[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (raw) {
      const parsed: ExpenseItem[] = JSON.parse(raw);
      // Remove any previously injected dummy demo records
      const realExpenses = parsed.filter(
        item => !['exp-1', 'exp-2', 'exp-3', 'exp-4', 'exp-5', 'exp-6'].includes(item.id)
      );
      if (realExpenses.length !== parsed.length) {
        saveLocalExpenses(realExpenses);
      }
      return realExpenses;
    }
  } catch (e) {
    console.error(e);
  }

  // Clean empty expenses list - user adds their own transactions
  return [];
}

export function saveLocalExpenses(expenses: ExpenseItem[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function getPendingSyncQueue(): string[] {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToPendingSyncQueue(expenseId: string): void {
  const current = getPendingSyncQueue();
  if (!current.includes(expenseId)) {
    current.push(expenseId);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(current));
  }
}

export function removeFromPendingSyncQueue(expenseId: string): void {
  const current = getPendingSyncQueue().filter(id => id !== expenseId);
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(current));
}

export function clearAllLocalData(): void {
  localStorage.removeItem(PERIODS_KEY);
  localStorage.removeItem(EXPENSES_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(PENDING_SYNC_KEY);
}
