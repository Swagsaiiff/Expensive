import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  ArrowRight,
  TrendingDown,
  PiggyBank,
  CheckCircle,
  Download,
  Trash2,
} from 'lucide-react';
import { MonthlyPeriod, ExpenseItem } from '../types';
import { formatCurrency, MONTH_NAMES } from '../constants';
import { calculateMonthFinancials, exportToCSV } from '../utils/calculations';

interface HistoryViewProps {
  periods: MonthlyPeriod[];
  allExpenses: ExpenseItem[];
  activeMonthId: string;
  onSelectMonth: (monthId: string) => void;
  onCreateNewMonth: (year: number, month: number, salary: number) => void;
  onDeleteMonth?: (monthId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  periods,
  allExpenses,
  activeMonthId,
  onSelectMonth,
  onCreateNewMonth,
}) => {
  const [showNewMonthModal, setShowNewMonthModal] = useState(false);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newMonth, setNewMonth] = useState<number>(new Date().getMonth() + 1);
  const [newSalary, setNewSalary] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Sort periods in reverse chronological order
  const sortedPeriods = [...periods].sort((a, b) => b.id.localeCompare(a.id));

  const handleCreateMonth = (e: React.FormEvent) => {
    e.preventDefault();
    const sal = parseFloat(newSalary);
    if (isNaN(sal) || sal < 0) {
      setError('Please enter a valid non-negative salary amount');
      return;
    }

    const mId = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    const exists = periods.some(p => p.id === mId);
    if (exists) {
      setError(`Period for ${MONTH_NAMES[newMonth - 1]} ${newYear} already exists`);
      return;
    }

    onCreateNewMonth(newYear, newMonth, sal);
    setShowNewMonthModal(false);
    setError('');
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Financial Periods
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Monthly History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between past months, inspect their complete financials, or export records.
          </p>
        </div>

        <button
          onClick={() => {
            setShowNewMonthModal(true);
            setError('');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Start New Month</span>
        </button>
      </div>

      {/* Grid of Month Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPeriods.map(p => {
          const calc = calculateMonthFinancials(p.id, periods, allExpenses);
          const isActive = p.id === activeMonthId;

          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-emerald-600 bg-white dark:bg-slate-900 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {p.monthName}
                    </h2>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                      Active View
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs sm:text-sm py-2">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Salary:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(calc.period.salary)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Expenses:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(calc.totalExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Savings:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(calc.totalSavings)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                    <span>Remaining:</span>
                    <span className={calc.remainingBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}>
                      {formatCurrency(calc.remainingBalance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onSelectMonth(p.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  <span>{isActive ? 'Current View' : 'Select Month'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const monthItems = allExpenses.filter(e => e.monthId === p.id);
                    exportToCSV(p.monthName, monthItems);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                  title="Export month CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start New Month Modal */}
      {showNewMonthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Create New Financial Month
            </h2>
            <p className="text-xs text-slate-500">
              Start a new tracking period without affecting previous monthly records.
            </p>

            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateMonth} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Month</label>
                  <select
                    value={newMonth}
                    onChange={e => setNewMonth(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Year</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={e => setNewYear(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Salary / Income for this month (৳ BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    required
                    value={newSalary}
                    onChange={e => setNewSalary(e.target.value)}
                    placeholder="e.g. 35000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewMonthModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition"
                >
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
