import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { sanitizeAmount } from '../utils/calculations';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthName: string;
  currentSalary: number;
  currentStartingBalance: number;
  onSaveSalary: (newSalary: number, newStartingBalance: number) => void;
}

export const SalaryModal: React.FC<SalaryModalProps> = ({
  isOpen,
  onClose,
  monthName,
  currentSalary,
  currentStartingBalance,
  onSaveSalary,
}) => {
  const [salaryInput, setSalaryInput] = useState<string>(
    currentSalary > 0 ? currentSalary.toString() : ''
  );
  const [startingBalanceInput, setStartingBalanceInput] = useState<string>(
    currentStartingBalance > 0 ? currentStartingBalance.toString() : ''
  );

  React.useEffect(() => {
    if (isOpen) {
      setSalaryInput(currentSalary > 0 ? currentSalary.toString() : '');
      setStartingBalanceInput(currentStartingBalance > 0 ? currentStartingBalance.toString() : '');
    }
  }, [isOpen, currentSalary, currentStartingBalance]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sal = sanitizeAmount(salaryInput);
    const startBal = sanitizeAmount(startingBalanceInput);
    onSaveSalary(sal, startBal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Edit Monthly Salary
            </h2>
            <p className="text-xs text-slate-500">{monthName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Salary / Net Income (৳ BDT) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                ৳
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                autoFocus
                required
                placeholder="e.g. 35000"
                value={salaryInput}
                onChange={e => setSalaryInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Carryover / Starting Balance (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                ৳
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={startingBalanceInput}
                onChange={e => setStartingBalanceInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Update Salary</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
