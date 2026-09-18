import React, { useState } from 'react';
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  WifiOff,
  Cloud,
  ChevronRight,
  Plus,
  Edit2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { MonthCalculationResult } from '../utils/calculations';
import { CategoryDefinition, ExpenseItem, SyncStatus } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../constants';

interface DashboardViewProps {
  calculation: MonthCalculationResult;
  categories: CategoryDefinition[];
  syncStatus: SyncStatus;
  onOpenAddExpense: () => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onEditSalary: () => void;
  onManualSync: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  calculation,
  categories,
  syncStatus,
  onOpenAddExpense,
  onEditExpense,
  onEditSalary,
  onManualSync,
  onNavigateToTab,
}) => {
  const {
    period,
    totalExpenses,
    totalSavings,
    remainingBalance,
    categoryTotals,
    highestExpense,
    highestCategory,
    averageDailySpending,
    daysWithExpensesCount,
    totalTransactionCount,
  } = calculation;

  const categoryDefMap = new Map<string, CategoryDefinition>();
  categories.forEach(c => categoryDefMap.set(c.name, c));

  // Sort categories by expenditure
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const totalSpentOrSaved = totalExpenses + totalSavings;
  const recentTransactions = [...calculation.expenses, ...calculation.savings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <button
            onClick={onManualSync}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium"
            title="Synchronizing changes with Google Sheets..."
          >
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Syncing...</span>
          </button>
        );
      case 'offline':
        return (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 rounded-full text-xs font-medium"
            title="Working offline - changes safely saved locally"
          >
            <WifiOff className="w-3 h-3" />
            <span>Offline - saved locally</span>
          </div>
        );
      case 'failed':
        return (
          <button
            onClick={onManualSync}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full text-xs font-medium hover:bg-rose-500/20"
            title="Sync failed - Click to retry"
          >
            <AlertCircle className="w-3 h-3" />
            <span>Sync failed (retry)</span>
          </button>
        );
      case 'synced':
      default:
        return (
          <button
            onClick={onManualSync}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium hover:bg-emerald-500/20 transition"
            title="Synchronized with Google Sheets"
          >
            <Cloud className="w-3 h-3" />
            <span>Synced</span>
          </button>
        );
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
      {/* Month Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Monthly Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {period.monthName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {getSyncBadge()}
          <button
            id="quick-add-expense-btn"
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Key Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Salary Card */}
        <div
          id="card-salary"
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Salary / Income
            </span>
            <button
              onClick={onEditSalary}
              className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded-md transition"
              title="Edit salary for this month"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(period.salary)}
            </div>
            {period.startingBalance > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                + {formatCurrency(period.startingBalance)} carryover
              </p>
            )}
            {period.salary === 0 && (
              <button
                onClick={onEditSalary}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-1 block cursor-pointer"
              >
                + Set monthly salary
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-blue-500" />
            <span>Base monthly income</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div
          id="card-expenses"
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Spent
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>
              {period.salary > 0
                ? `${Math.min(100, Math.round((totalExpenses / period.salary) * 100))}% of salary`
                : `${calculation.expenses.length} records`}
            </span>
          </div>
        </div>

        {/* Savings Card */}
        <div
          id="card-savings"
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Savings
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(totalSavings)}
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>
              {period.salary > 0
                ? `${Math.round((totalSavings / period.salary) * 100)}% saved`
                : 'DPS & deposits'}
            </span>
          </div>
        </div>

        {/* Remaining Balance Card */}
        <div
          id="card-remaining"
          className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
            remainingBalance < 0
              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Remaining Balance
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                remainingBalance >= 0
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'bg-rose-100 dark:bg-rose-900/50 text-rose-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div
              className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight ${
                remainingBalance >= 0
                  ? 'text-slate-900 dark:text-white'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(remainingBalance)}
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {remainingBalance >= 0 ? 'Formula: Salary - Spent - Saved' : 'Over budget this month'}
          </div>
        </div>
      </div>

      {/* Monthly Spending Insights Section (Strictly factual neutral observations) */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Monthly Spending Insights
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Category breakdown: </span>
              {highestCategory
                ? `You spent ${formatCurrency(highestCategory.amount)} on ${highestCategory.name} this month.`
                : 'No expenses recorded for this month yet.'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Daily pace: </span>
              {`Your average daily spending is ${formatCurrency(averageDailySpending)} across ${daysWithExpensesCount} active days.`}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Single highest expense: </span>
              {highestExpense
                ? `Your highest expense was ${formatCurrency(highestExpense.amount)} for ${highestExpense.description} (${highestExpense.category}).`
                : 'No single expense recorded yet.'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Breakdown Section: Category Breakdown + Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols on desktop) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Spending Breakdown by Category
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sorted by total amount spent
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View Charts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No expenses recorded in {period.monthName} yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {sortedCategories.map(([catName, amt]) => {
                const def = categoryDefMap.get(catName);
                const percent = totalSpentOrSaved > 0 ? Math.round((amt / totalSpentOrSaved) * 100) : 0;
                const color = def?.color || '#3b82f6';
                return (
                  <div key={catName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          <CategoryIcon name={def?.iconName || 'Tag'} size={14} />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {catName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(amt)}
                        </span>
                        <span className="text-xs text-slate-400 font-mono w-9 text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Expenses List (5 cols on desktop) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Transactions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {totalTransactionCount} total transactions this month
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('expenses')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>All Expenses</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No recent transactions.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map(tx => {
                  const def = categoryDefMap.get(tx.category);
                  const color = def?.color || '#3b82f6';
                  return (
                    <div
                      key={tx.id}
                      onClick={() => onEditExpense(tx)}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/50 -mx-2 px-2 rounded-xl cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          <CategoryIcon name={def?.iconName || 'Tag'} size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {tx.description}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span>{tx.category}</span>
                            <span>•</span>
                            <span>{tx.date}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <p
                          className={`text-sm font-bold ${
                            tx.type === 'Savings'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {tx.type === 'Savings' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </p>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {tx.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigateToTab('expenses')}
              className="w-full py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              View Full Transaction History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
