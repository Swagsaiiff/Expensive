import { CategoryDefinition } from './types';

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: 'cat-food', name: 'Food', iconName: 'Utensils', color: '#f97316' },
  { id: 'cat-transport', name: 'Transport', iconName: 'Bus', color: '#0ea5e9' },
  { id: 'cat-bills', name: 'Bills', iconName: 'Receipt', color: '#ef4444' },
  { id: 'cat-groceries', name: 'Groceries', iconName: 'ShoppingCart', color: '#10b981' },
  { id: 'cat-shopping', name: 'Shopping', iconName: 'ShoppingBag', color: '#ec4899' },
  { id: 'cat-entertainment', name: 'Entertainment', iconName: 'Film', color: '#8b5cf6' },
  { id: 'cat-technology', name: 'Technology', iconName: 'Laptop', color: '#6366f1' },
  { id: 'cat-mobile', name: 'Mobile & Internet', iconName: 'Smartphone', color: '#06b6d4' },
  { id: 'cat-health', name: 'Health', iconName: 'HeartPulse', color: '#f43f5e' },
  { id: 'cat-education', name: 'Education', iconName: 'GraduationCap', color: '#3b82f6' },
  { id: 'cat-travel', name: 'Travel', iconName: 'Plane', color: '#14b8a6' },
  { id: 'cat-snacks', name: 'Snacks', iconName: 'Coffee', color: '#d97706' },
  { id: 'cat-family', name: 'Family', iconName: 'Users', color: '#84cc16' },
  { id: 'cat-gifts', name: 'Gifts', iconName: 'Gift', color: '#a855f7' },
  { id: 'cat-savings', name: 'Savings', iconName: 'PiggyBank', color: '#059669', isSavings: true },
  { id: 'cat-other', name: 'Other', iconName: 'MoreHorizontal', color: '#6b7280' },
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatCurrency(amount: number, symbol: string = '৳'): string {
  if (isNaN(amount) || !isFinite(amount)) return `${symbol}0`;
  return `${symbol}${amount.toLocaleString('en-US')}`;
}

export function formatMonthId(year: number, month: number): string {
  const m = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${m}`;
}

export function parseMonthId(monthId: string): { year: number; month: number } {
  const parts = monthId.split('-');
  return {
    year: parseInt(parts[0], 10) || new Date().getFullYear(),
    month: parseInt(parts[1], 10) || (new Date().getMonth() + 1)
  };
}

export function getMonthDisplay(monthId: string): string {
  const { year, month } = parseMonthId(monthId);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}
