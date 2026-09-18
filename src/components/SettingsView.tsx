import React, { useState } from 'react';
import {
  UserCheck,
  Cloud,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Plus,
  Coins,
  LogOut,
  FolderSync,
} from 'lucide-react';
import {
  AppSettings,
  CategoryDefinition,
  GoogleUserInfo,
  SpreadsheetInfo,
  SyncStatus,
  ExpenseItem,
  MonthlyPeriod,
} from '../types';
import { CategoryIcon } from './CategoryIcon';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  userInfo: GoogleUserInfo | null;
  spreadsheetInfo: SpreadsheetInfo | null;
  syncStatus: SyncStatus;
  categories: CategoryDefinition[];
  onAddCategory: (cat: CategoryDefinition) => void;
  onDeleteCategory: (id: string) => void;
  onConnectGoogle: () => void;
  onSignOutGoogle: () => void;
  onManualSync: () => void;
  onExportAllData: () => void;
  onImportData: (file: File) => void;
  onClearLocalData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  userInfo,
  spreadsheetInfo,
  syncStatus,
  categories,
  onAddCategory,
  onDeleteCategory,
  onConnectGoogle,
  onSignOutGoogle,
  onManualSync,
  onExportAllData,
  onImportData,
  onClearLocalData,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [isSavingsCat, setIsSavingsCat] = useState(false);

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat: CategoryDefinition = {
      id: `cat-custom-${Date.now()}`,
      name: newCatName.trim(),
      iconName: isSavingsCat ? 'PiggyBank' : 'Tag',
      color: newCatColor,
      isCustom: true,
      isSavings: isSavingsCat,
    };
    onAddCategory(newCat);
    setNewCatName('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Preferences & Configuration
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage Google Drive integration, appearance, categories, and private data backups.
        </p>
      </div>

      {/* 1. Google Account & Cloud Sync Status */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Google Sheets & Drive Integration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Private cloud synchronization for "Salary Expense Tracker"
              </p>
            </div>
          </div>

          {userInfo ? (
            <button
              onClick={onSignOutGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={onConnectGoogle}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Connect Google Account</span>
            </button>
          )}
        </div>

        {/* Status display */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Google Account:</span>
              {userInfo ? (
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {userInfo.email}
                </span>
              ) : (
                <span className="text-slate-400 italic">Not connected (Local-first mode)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Status:</span>
              <span className="font-semibold uppercase tracking-wider font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {syncStatus}
              </span>
            </div>
          </div>

          {spreadsheetInfo && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Connected Spreadsheet:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {spreadsheetInfo.name}
                </span>
              </div>
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Open in Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Sync action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={onManualSync}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Now</span>
            </button>
            <span className="text-[11px] text-slate-400">
              All financial data is saved locally first. Token is encrypted at rest using AES-GCM.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Appearance & General Preferences */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Display & Appearance
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme Selector */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.theme === 'dark' ? (
                <Moon className="w-4 h-4 text-purple-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Theme
              </span>
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  settings.theme === 'light'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  settings.theme === 'dark'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Primary Currency */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Currency
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
              Bangladeshi Taka (৳ BDT)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Management */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Manage Categories ({categories.length})
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Categories define your spending classification and reporting metrics.
        </p>

        {/* Add custom category form */}
        <form onSubmit={handleAddNewCategory} className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <input
            type="text"
            placeholder="New Category Name (e.g. Pet Care, Charity)"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            className="flex-1 min-w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <input
            type="color"
            value={newCatColor}
            onChange={e => setNewCatColor(e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
            title="Category color"
          />
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isSavingsCat}
              onChange={e => setIsSavingsCat(e.target.checked)}
              className="rounded text-emerald-600"
            />
            <span>Is Savings</span>
          </label>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Add Category
          </button>
        </form>

        {/* List of existing categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  <CategoryIcon name={cat.iconName} size={14} />
                </div>
                <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                  {cat.name}
                </span>
              </div>
              {cat.isCustom && (
                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat.id)}
                  className="text-slate-400 hover:text-rose-500 p-1 transition"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Data Backup, Export, Import & Clear */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Data Portability & Maintenance
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Export JSON backup */}
          <button
            onClick={onExportAllData}
            className="p-3.5 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-start gap-1 text-left transition"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Export Full Backup</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Download JSON file with all transactions and month periods.
            </span>
          </button>

          {/* Import JSON backup */}
          <label className="p-3.5 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-start gap-1 text-left transition cursor-pointer">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Upload className="w-4 h-4 text-blue-500" />
              <span>Import Data</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Restore local records from a previously saved JSON backup.
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Clear local storage */}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-3.5 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200/60 dark:border-rose-900/40 flex flex-col items-start gap-1 text-left transition"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              <Trash2 className="w-4 h-4" />
              <span>Clear Local Data</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Wipes local device cache. Cloud spreadsheet remains intact.
            </span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Clear Local Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Clear Local Data?
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              This will erase local browser records and restore the initial state. Your private Google Sheets spreadsheet in Google Drive will NOT be deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearLocalData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                Yes, Clear Local Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
