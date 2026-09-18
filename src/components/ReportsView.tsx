import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
} from 'lucide-react';
import { MonthCalculationResult, calculateMonthFinancials, exportToCSV } from '../utils/calculations';
import { MonthlyPeriod, ExpenseItem, CategoryDefinition } from '../types';
import { formatCurrency } from '../constants';
import { CategoryIcon } from './CategoryIcon';

interface ReportsViewProps {
  periods: MonthlyPeriod[];
  allExpenses: ExpenseItem[];
  categories: CategoryDefinition[];
  currentMonthId: string;
  onSelectMonth: (monthId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  periods,
  allExpenses,
  categories,
  currentMonthId,
  onSelectMonth,
}) => {
  const [selectedMonthId, setSelectedMonthId] = useState<string>(currentMonthId);
  const [compareMonthId, setCompareMonthId] = useState<string>(() => {
    // Pick the previous period if available
    const sorted = [...periods].sort((a, b) => b.id.localeCompare(a.id));
    const idx = sorted.findIndex(p => p.id === currentMonthId);
    if (idx !== -1 && idx + 1 < sorted.length) {
      return sorted[idx + 1].id;
    }
    return sorted[0]?.id || currentMonthId;
  });

  const categoryDefMap = new Map<string, CategoryDefinition>();
  categories.forEach(c => categoryDefMap.set(c.name, c));

  const mainCalculation = calculateMonthFinancials(selectedMonthId, periods, allExpenses);
  const compareCalculation = calculateMonthFinancials(compareMonthId, periods, allExpenses);

  const sortedCategories = Object.entries(mainCalculation.categoryTotals).sort((a, b) => b[1] - a[1]);
  const totalExpenditure = mainCalculation.totalExpenses + mainCalculation.totalSavings;

  // Daily spending chart data
  const [yearStr, monthStr] = selectedMonthId.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const dailyBars: { day: number; amount: number }[] = [];
  let maxDailyAmount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const amt = mainCalculation.dailyTotals[dStr] || 0;
    if (amt > maxDailyAmount) maxDailyAmount = amt;
    dailyBars.push({ day: d, amount: amt });
  }

  // Generate SVG Donut slices
  let cumulativeAngle = 0;
  const donutSlices = sortedCategories.map(([catName, amt]) => {
    const fraction = totalExpenditure > 0 ? amt / totalExpenditure : 0;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    const color = categoryDefMap.get(catName)?.color || '#3b82f6';
    return { catName, amt, fraction, angle, startAngle, color };
  });

  const handleExportReport = () => {
    const filtered = allExpenses.filter(e => e.monthId === selectedMonthId);
    exportToCSV(mainCalculation.period.monthName, filtered);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
      {/* Top Header & Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Analytics & Reports
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Spending & Budget Insights
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <select
            value={selectedMonthId}
            onChange={e => {
              setSelectedMonthId(e.target.value);
              onSelectMonth(e.target.value);
            }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.monthName}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Salary</span>
          <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(mainCalculation.period.salary)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Expenses</span>
          <p className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(mainCalculation.totalExpenses)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Savings</span>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(mainCalculation.totalSavings)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Remaining Balance</span>
          <p className={`text-lg sm:text-xl font-bold mt-1 ${mainCalculation.remainingBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
            {formatCurrency(mainCalculation.remainingBalance)}
          </p>
        </div>
      </div>

      {/* Charts Section: 1. Donut Pie Chart + 2. Daily Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Category Breakdown
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Relative share of total spending
                </p>
              </div>
              <PieIcon className="w-5 h-5 text-slate-400" />
            </div>

            {totalExpenditure === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No spending data for this period
              </div>
            ) : (
              <div className="space-y-6">
                {/* SVG Visual Donut */}
                <div className="flex items-center justify-center pt-2">
                  <div className="relative w-44 h-44">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {donutSlices.map((slice, idx) => {
                        const radius = 38;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDasharray = `${(slice.fraction * circumference)} ${circumference}`;
                        const strokeDashoffset = -((slice.startAngle / 360) * circumference);

                        return (
                          <circle
                            key={slice.catName}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth="15"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-300 hover:opacity-80"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Total Spent
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(totalExpenditure)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {donutSlices.map(slice => (
                    <div key={slice.catName} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {slice.catName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(slice.amt)}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px] w-9 text-right">
                          {Math.round(slice.fraction * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Spending Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Daily Spending Pattern
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every day of {mainCalculation.period.monthName}
                </p>
              </div>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>

            {/* Bar chart container */}
            <div className="h-48 sm:h-56 flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
              {dailyBars.map(item => {
                const heightPercent = maxDailyAmount > 0 ? (item.amount / maxDailyAmount) * 100 : 0;
                return (
                  <div
                    key={item.day}
                    className="flex-1 min-w-[12px] flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip on hover */}
                    {item.amount > 0 && (
                      <div className="absolute -top-7 hidden group-hover:flex items-center justify-center bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap z-10 pointer-events-none">
                        Day {item.day}: {formatCurrency(item.amount)}
                      </div>
                    )}
                    <div
                      className={`w-full rounded-t transition-all ${
                        item.amount > 0
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800/60'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-1">
              <span>Day 1</span>
              <span>Day 15</span>
              <span>Day {daysInMonth}</span>
            </div>
          </div>

          {/* Daily stats footer */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Average / Day</span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(mainCalculation.averageDailySpending)}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Active Days</span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {mainCalculation.daysWithExpensesCount} days
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Max Single Day</span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(maxDailyAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Month Comparison Section (Unbiased side-by-side data visualization) */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Side-by-Side Month Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Directly compare expenditures and savings between two financial periods
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Compare with:</span>
            <select
              value={compareMonthId}
              onChange={e => setCompareMonthId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.monthName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Month A */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {mainCalculation.period.monthName}
              </span>
              <span className="text-xs font-mono text-slate-400">Period A</span>
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Salary:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(mainCalculation.period.salary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expenses:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(mainCalculation.totalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Savings:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(mainCalculation.totalSavings)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Remaining Balance:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(mainCalculation.remainingBalance)}</span>
              </div>
            </div>
          </div>

          {/* Month B */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {compareCalculation.period.monthName}
              </span>
              <span className="text-xs font-mono text-slate-400">Period B</span>
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Salary:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(compareCalculation.period.salary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expenses:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(compareCalculation.totalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Savings:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(compareCalculation.totalSavings)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Remaining Balance:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(compareCalculation.remainingBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <span>
            Expense difference ({mainCalculation.period.monthName} vs {compareCalculation.period.monthName}):
          </span>
          <span className="font-bold font-mono">
            {mainCalculation.totalExpenses >= compareCalculation.totalExpenses ? '+' : '-'}
            {formatCurrency(Math.abs(mainCalculation.totalExpenses - compareCalculation.totalExpenses))}
          </span>
        </div>
      </div>
    </div>
  );
};
