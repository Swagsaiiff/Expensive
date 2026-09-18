import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { ExpenseItem, CategoryDefinition } from '../types';
import { formatCurrency, MONTH_NAMES } from '../constants';
import { CategoryIcon } from './CategoryIcon';

interface CalendarViewProps {
  expenses: ExpenseItem[];
  categories: CategoryDefinition[];
  monthId: string;
  onSelectDate: (dateStr: string) => void;
  onOpenAddExpenseWithDate: (dateStr: string) => void;
  onEditExpense: (expense: ExpenseItem) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  expenses,
  categories,
  monthId,
  onOpenAddExpenseWithDate,
  onEditExpense,
}) => {
  const [yearStr, monthStr] = monthId.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const categoryDefMap = new Map<string, CategoryDefinition>();
  categories.forEach(c => categoryDefMap.set(c.name, c));

  // Compute days in month
  const totalDays = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Sun

  // Map expenses to days
  const dailyExpensesMap: Record<number, ExpenseItem[]> = {};
  const dailyTotalsMap: Record<number, number> = {};

  expenses.forEach(item => {
    const itemDate = new Date(item.date);
    if (itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month) {
      const day = itemDate.getDate();
      if (!dailyExpensesMap[day]) dailyExpensesMap[day] = [];
      dailyExpensesMap[day].push(item);
      dailyTotalsMap[day] = (dailyTotalsMap[day] || 0) + item.amount;
    }
  });

  const selectedDateStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const selectedDayExpenses = dailyExpensesMap[selectedDay] || [];
  const selectedDayTotal = dailyTotalsMap[selectedDay] || 0;

  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Daily Financial Calendar
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {MONTH_NAMES[month - 1]} {year}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tap on any day to view transactions or log an expense for that date.
          </p>
        </div>
        <button
          onClick={() => onOpenAddExpenseWithDate(selectedDateStr)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add on {selectedDateStr}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (7 cols on desktop) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          {/* Day of week labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDayLabels.map(day => (
              <div key={day} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Blank offset tiles for first day of week */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[60px] sm:min-h-[75px] rounded-xl bg-slate-50/50 dark:bg-slate-950/30 opacity-40" />
            ))}

            {/* Month days */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const isSelected = selectedDay === day;
              const hasExpenses = !!dailyTotalsMap[day];
              const dayTotal = dailyTotalsMap[day] || 0;
              const count = dailyExpensesMap[day]?.length || 0;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[60px] sm:min-h-[75px] p-1.5 sm:p-2 rounded-xl flex flex-col justify-between text-left transition relative border ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-white shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {day}
                    </span>
                    {count > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    )}
                  </div>

                  {hasExpenses ? (
                    <div className="mt-1">
                      <p className="text-[10px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 truncate">
                        {formatCurrency(dayTotal)}
                      </p>
                      <p className="text-[9px] text-slate-400 hidden sm:block">
                        {count} {count === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-300 dark:text-slate-600 hidden sm:block">
                      -
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel (5 cols on desktop) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Selected Day
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {MONTH_NAMES[month - 1]} {selectedDay}, {year}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Day's Total
                </span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(selectedDayTotal)}
                </p>
              </div>
            </div>

            {selectedDayExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">No expenses on this day</p>
                <p className="text-xs text-slate-400">
                  Nothing was spent or saved on this date.
                </p>
                <button
                  onClick={() => onOpenAddExpenseWithDate(selectedDateStr)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log an expense for {selectedDay}</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto pr-1">
                {selectedDayExpenses.map(item => {
                  const def = categoryDefMap.get(item.category);
                  const color = def?.color || '#3b82f6';
                  return (
                    <div
                      key={item.id}
                      onClick={() => onEditExpense(item)}
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
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {item.description}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.category} {item.note ? `• "${item.note}"` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <p
                          className={`text-xs sm:text-sm font-bold ${
                            item.type === 'Savings'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {item.type === 'Savings' ? '+' : '-'} {formatCurrency(item.amount)}
                        </p>
                        <span className="text-[9px] text-slate-400 uppercase">
                          {item.type}
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
              onClick={() => onOpenAddExpenseWithDate(selectedDateStr)}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record for {MONTH_NAMES[month - 1]} {selectedDay}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
