import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Tag, FileText, Check, AlertCircle } from 'lucide-react';
import { ExpenseItem, CategoryDefinition, ExpenseType } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt' | 'syncedToCloud'>, existingId?: string) => void;
  categories: CategoryDefinition[];
  onAddCategory: (cat: CategoryDefinition) => void;
  initialExpense?: ExpenseItem | null;
  defaultDate?: string;
  defaultMonthId: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  onAddCategory,
  initialExpense,
  defaultDate,
  defaultMonthId,
}) => {
  const [type, setType] = useState<ExpenseType>('Expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Food');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>('#3b82f6');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialExpense) {
      setType(initialExpense.type);
      setAmount(initialExpense.amount.toString());
      setCategory(initialExpense.category);
      setDescription(initialExpense.description);
      setDate(initialExpense.date);
      setNote(initialExpense.note || '');
    } else {
      setType('Expense');
      setAmount('');
      setCategory(categories[0]?.name || 'Food');
      setDescription('');
      const today = new Date();
      const monthPart = defaultMonthId.split('-');
      const todayMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      if (defaultDate) {
        setDate(defaultDate);
      } else if (todayMonthStr === defaultMonthId) {
        setDate(today.toISOString().split('T')[0]);
      } else {
        setDate(`${monthPart[0]}-${monthPart[1]}-01`);
      }
      setNote('');
    }
    setError('');
    setIsCreatingCategory(false);
  }, [isOpen, initialExpense, categories, defaultDate, defaultMonthId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a brief description (e.g., Lunch, Taxi, Electricity bill)');
      return;
    }

    if (!date) {
      setError('Please choose a valid date');
      return;
    }

    // Determine monthId from date
    const dateParts = date.split('-');
    const derivedMonthId = `${dateParts[0]}-${dateParts[1]}`;

    onSave(
      {
        type,
        amount: Math.round(parsedAmount * 100) / 100,
        category,
        description: description.trim(),
        date,
        note: note.trim() || undefined,
        monthId: derivedMonthId,
      },
      initialExpense ? initialExpense.id : undefined
    );
    onClose();
  };

  const handleCreateCustomCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: CategoryDefinition = {
      id: `custom-cat-${Date.now()}`,
      name: newCatName.trim(),
      iconName: 'Tag',
      color: newCatColor,
      isCustom: true,
      isSavings: type === 'Savings',
    };
    onAddCategory(newCat);
    setCategory(newCat.name);
    setNewCatName('');
    setIsCreatingCategory(false);
  };

  const selectedCategoryDef = categories.find(c => c.name === category);

  return (
    <div id="expense-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        id="expense-modal-card"
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${type === 'Savings' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialExpense ? 'Edit Transaction' : 'Add New Record'}
            </h2>
          </div>
          <button
            id="close-expense-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle: Expense vs Savings */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl">
            <button
              id="type-expense-btn"
              type="button"
              onClick={() => setType('Expense')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                type === 'Expense'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              id="type-savings-btn"
              type="button"
              onClick={() => {
                setType('Savings');
                setCategory('Savings');
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                type === 'Savings'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Savings / DPS
            </button>
          </div>

          {/* Amount Input with Currency Symbol */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Amount (৳ BDT) *
            </label>
            <div className="relative rounded-2xl shadow-inner bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 transition">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 dark:text-slate-500">
                ৳
              </span>
              <input
                id="expense-amount-input"
                type="number"
                step="any"
                inputMode="decimal"
                autoFocus
                required
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-transparent pl-12 pr-4 py-3.5 text-2xl font-bold text-slate-900 dark:text-white focus:outline-none placeholder-slate-300 dark:placeholder-slate-700"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Description *
            </label>
            <div className="relative">
              <input
                id="expense-desc-input"
                type="text"
                required
                placeholder="e.g., Office lunch, CNG fare, Supermarket"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Category
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Custom Category
              </button>
            </div>

            {isCreatingCategory && (
              <div className="mb-3 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Create a custom category</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    title="Choose color"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomCategory}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Grid of category chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {categories.map(cat => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.name);
                      if (cat.isSavings) setType('Savings');
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.iconName} size={15} />
                    </div>
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Date *
            </label>
            <div className="relative">
              <input
                id="expense-date-input"
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Optional Note / Memo
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Shared with Shakil, invoice #412"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="submit-expense-form-btn"
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold shadow-lg shadow-emerald-600/25 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {initialExpense ? 'Save Changes' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
