import { MonthlyPeriod, ExpenseItem } from '../types';
import { formatMonthId, MONTH_NAMES } from '../constants';

export interface MonthCalculationResult {
  period: MonthlyPeriod;
  expenses: ExpenseItem[];
  savings: ExpenseItem[];
  totalExpenses: number;
  totalSavings: number;
  remainingBalance: number;
  categoryTotals: Record<string, number>;
  dailyTotals: Record<string, number>;
  highestExpense: ExpenseItem | null;
  highestCategory: { name: string; amount: number } | null;
  averageDailySpending: number;
  daysWithExpensesCount: number;
  totalTransactionCount: number;
}

export function sanitizeAmount(val: number | string | undefined | null): number {
  if (val === undefined || val === null) return 0;
  const parsed = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
}

export function calculateMonthFinancials(
  monthId: string,
  periods: MonthlyPeriod[],
  allExpenses: ExpenseItem[]
): MonthCalculationResult {
  let period = periods.find(p => p.id === monthId);
  const [yStr, mStr] = monthId.split('-');
  const year = parseInt(yStr, 10) || new Date().getFullYear();
  const month = parseInt(mStr, 10) || (new Date().getMonth() + 1);

  if (!period) {
    period = {
      id: monthId,
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
  }

  // Filter items for this month
  const monthItems = allExpenses.filter(e => e.monthId === monthId);
  const expenseItems = monthItems.filter(e => e.type === 'Expense');
  const savingsItems = monthItems.filter(e => e.type === 'Savings');

  let totalExpenses = 0;
  const categoryTotals: Record<string, number> = {};
  const dailyTotals: Record<string, number> = {};
  let highestExpense: ExpenseItem | null = null;

  for (const exp of expenseItems) {
    const amt = sanitizeAmount(exp.amount);
    totalExpenses += amt;

    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
    dailyTotals[exp.date] = (dailyTotals[exp.date] || 0) + amt;

    if (!highestExpense || amt > highestExpense.amount) {
      highestExpense = exp;
    }
  }

  let totalSavings = 0;
  for (const sav of savingsItems) {
    const amt = sanitizeAmount(sav.amount);
    totalSavings += amt;
    categoryTotals[sav.category] = (categoryTotals[sav.category] || 0) + amt;
  }

  const salary = sanitizeAmount(period.salary);
  const startingBalance = sanitizeAmount(period.startingBalance);
  
  // Formula: Remaining = Salary + StartingBalance - Expenses - Savings
  // User spec: Remaining = Salary - Expenses - Savings
  const rawRemaining = (salary + startingBalance) - totalExpenses - totalSavings;
  const remainingBalance = Math.round(rawRemaining * 100) / 100;

  // Highest category
  let highestCategory: { name: string; amount: number } | null = null;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (!highestCategory || amt > highestCategory.amount) {
      highestCategory = { name: cat, amount: amt };
    }
  }

  // Days in this month
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysWithExpensesCount = Object.keys(dailyTotals).length;
  // If current month, calculate daily average based on passed days or days with expenses
  const averageDailySpending = daysInMonth > 0 ? Math.round((totalExpenses / daysInMonth) * 100) / 100 : 0;

  const updatedPeriod: MonthlyPeriod = {
    ...period,
    salary,
    startingBalance,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    remainingBalance,
    updatedAt: new Date().toISOString(),
  };

  return {
    period: updatedPeriod,
    expenses: expenseItems,
    savings: savingsItems,
    totalExpenses: updatedPeriod.totalExpenses,
    totalSavings: updatedPeriod.totalSavings,
    remainingBalance,
    categoryTotals,
    dailyTotals,
    highestExpense,
    highestCategory,
    averageDailySpending,
    daysWithExpensesCount,
    totalTransactionCount: monthItems.length,
  };
}

export function exportToCSV(monthName: string, items: ExpenseItem[]): void {
  const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount (BDT)', 'Note', 'Month ID'];
  const rows = items.map(item => [
    `"${item.id}"`,
    `"${item.date}"`,
    `"${item.type}"`,
    `"${item.category.replace(/"/g, '""')}"`,
    `"${item.description.replace(/"/g, '""')}"`,
    item.amount,
    `"${(item.note || '').replace(/"/g, '""')}"`,
    `"${item.monthId}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Salary_Expenses_${monthName.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
