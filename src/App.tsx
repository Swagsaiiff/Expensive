import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Calendar,
  BarChart3,
  History,
  Settings,
  Plus,
  Moon,
  Sun,
  Cloud,
  RefreshCw,
  Wallet,
  ChevronDown,
} from 'lucide-react';
import {
  MonthlyPeriod,
  ExpenseItem,
  CategoryDefinition,
  AppSettings,
  SyncStatus,
  GoogleUserInfo,
  SpreadsheetInfo,
} from './types';
import {
  getLocalPeriods,
  saveLocalPeriods,
  getLocalExpenses,
  saveLocalExpenses,
  getLocalCategories,
  saveLocalCategories,
  getLocalSettings,
  saveLocalSettings,
  clearAllLocalData,
  getPendingSyncQueue,
  addToPendingSyncQueue,
  removeFromPendingSyncQueue,
} from './services/storage';
import {
  getStoredToken,
  getStoredUserInfo,
  getStoredSpreadsheet,
  requestGoogleAuth,
  clearStoredCredentials,
  getOrCreateSpreadsheet,
  syncDataWithGoogleSheets,
} from './services/googleDriveSheets';
import { calculateMonthFinancials } from './utils/calculations';
import { formatMonthId, MONTH_NAMES } from './constants';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { CalendarView } from './components/CalendarView';
import { ReportsView } from './components/ReportsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ExpenseModal } from './components/ExpenseModal';
import { SalaryModal } from './components/SalaryModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'calendar' | 'reports' | 'history' | 'settings'>('dashboard');

  // Application Data States
  const [periods, setPeriods] = useState<MonthlyPeriod[]>(() => getLocalPeriods());
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => getLocalExpenses());
  const [categories, setCategories] = useState<CategoryDefinition[]>(() => getLocalCategories());
  const [settings, setSettings] = useState<AppSettings>(() => getLocalSettings());

  // Active Month ID: Defaults to latest month or current date month
  const [activeMonthId, setActiveMonthId] = useState<string>(() => {
    const localP = getLocalPeriods();
    if (localP.length > 0) {
      // Find matching current year/month or first
      const now = new Date();
      const currentMId = formatMonthId(now.getFullYear(), now.getMonth() + 1);
      const match = localP.find(p => p.id === currentMId);
      return match ? match.id : localP[0].id;
    }
    return '2026-09';
  });

  // Google OAuth and Cloud state
  const [userInfo, setUserInfo] = useState<GoogleUserInfo | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  // Initialize theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Load Google credentials from secure store on mount
  useEffect(() => {
    const initAuth = async () => {
      const u = await getStoredUserInfo();
      const s = await getStoredSpreadsheet();
      const token = await getStoredToken();
      if (u) setUserInfo(u);
      if (s) setSpreadsheetInfo(s);
      if (token) setSyncStatus('synced');
    };
    initAuth();
  }, []);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('idle');
      triggerCloudSync();
    };
    const handleOffline = () => {
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Current month calculation
  const currentCalculation = calculateMonthFinancials(activeMonthId, periods, expenses);

  // Cloud Synchronization function
  const triggerCloudSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    try {
      const token = await getStoredToken();
      if (!token) {
        // Not connected to Google
        return;
      }

      setSyncStatus('syncing');
      let currentSheet = await getStoredSpreadsheet();
      if (!currentSheet) {
        currentSheet = await getOrCreateSpreadsheet(token);
        setSpreadsheetInfo(currentSheet);
      }

      const syncResult = await syncDataWithGoogleSheets(
        token,
        currentSheet.id,
        expenses,
        periods,
        categories
      );

      setExpenses(syncResult.mergedExpenses);
      saveLocalExpenses(syncResult.mergedExpenses);
      setSyncStatus('synced');
      setSyncNotification('Synchronized with Google Sheets');
      setTimeout(() => setSyncNotification(null), 3000);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncStatus('failed');
    }
  }, [expenses, periods, categories]);

  // Save changes locally and queue sync
  const handleSaveExpense = (
    expenseData: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt' | 'syncedToCloud'>,
    existingId?: string
  ) => {
    let updatedExpenses: ExpenseItem[];
    const now = new Date().toISOString();

    if (existingId) {
      // Edit existing
      updatedExpenses = expenses.map(item =>
        item.id === existingId
          ? {
              ...item,
              ...expenseData,
              updatedAt: now,
              syncedToCloud: false,
            }
          : item
      );
      addToPendingSyncQueue(existingId);
    } else {
      // Add new
      const newId = `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newItem: ExpenseItem = {
        id: newId,
        ...expenseData,
        createdAt: now,
        updatedAt: now,
        syncedToCloud: false,
      };
      updatedExpenses = [newItem, ...expenses];
      addToPendingSyncQueue(newId);
    }

    // Ensure period exists for this expense's monthId
    const targetMonthId = expenseData.monthId;
    let updatedPeriods = [...periods];
    if (!updatedPeriods.some(p => p.id === targetMonthId)) {
      const [y, m] = targetMonthId.split('-');
      const yNum = parseInt(y, 10);
      const mNum = parseInt(m, 10);
      const newPeriod: MonthlyPeriod = {
        id: targetMonthId,
        monthName: `${MONTH_NAMES[mNum - 1]} ${yNum}`,
        year: yNum,
        month: mNum,
        salary: 0,
        startingBalance: 0,
        totalExpenses: 0,
        totalSavings: 0,
        remainingBalance: 0,
        createdAt: now,
        updatedAt: now,
      };
      updatedPeriods.push(newPeriod);
      setPeriods(updatedPeriods);
      saveLocalPeriods(updatedPeriods);
    }

    setExpenses(updatedExpenses);
    saveLocalExpenses(updatedExpenses);

    // Attempt automatic background sync
    triggerCloudSync();
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveLocalExpenses(updated);
    triggerCloudSync();
  };

  const handleUpdateSalary = (newSalary: number, newStartingBalance: number) => {
    const updated = periods.map(p => {
      if (p.id === activeMonthId) {
        return {
          ...p,
          salary: newSalary,
          startingBalance: newStartingBalance,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setPeriods(updated);
    saveLocalPeriods(updated);
    triggerCloudSync();
  };

  const handleStartNewMonth = (year: number, month: number, salary: number) => {
    const id = formatMonthId(year, month);
    const newP: MonthlyPeriod = {
      id,
      monthName: `${MONTH_NAMES[month - 1]} ${year}`,
      year,
      month,
      salary,
      startingBalance: 0,
      totalExpenses: 0,
      totalSavings: 0,
      remainingBalance: salary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newP, ...periods];
    setPeriods(updated);
    saveLocalPeriods(updated);
    setActiveMonthId(id);
    setActiveTab('dashboard');
    triggerCloudSync();
  };

  const handleAddCategory = (newCat: CategoryDefinition) => {
    const updated = [...categories, newCat];
    setCategories(updated);
    saveLocalCategories(updated);
  };

  const handleDeleteCategory = (catId: string) => {
    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    saveLocalCategories(updated);
  };

  const handleConnectGoogle = async () => {
    try {
      setSyncStatus('syncing');
      const token = await requestGoogleAuth();
      const u = await getStoredUserInfo();
      if (u) setUserInfo(u);

      const sheet = await getOrCreateSpreadsheet(token);
      setSpreadsheetInfo(sheet);

      // Perform initial sync
      await triggerCloudSync();
    } catch (err: any) {
      console.error('Google Auth / Drive setup failed:', err);
      setSyncStatus('failed');
      alert(`Could not connect Google Account: ${err.message || err}`);
    }
  };

  const handleSignOutGoogle = async () => {
    await clearStoredCredentials();
    setUserInfo(null);
    setSpreadsheetInfo(null);
    setSyncStatus('idle');
  };

  const handleExportAllData = () => {
    const backup = {
      appName: 'Salary & Expense Tracker',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      periods,
      expenses,
      categories,
      settings,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SalaryExpenseTracker_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.expenses && parsed.periods) {
          setPeriods(parsed.periods);
          saveLocalPeriods(parsed.periods);
          setExpenses(parsed.expenses);
          saveLocalExpenses(parsed.expenses);
          if (parsed.categories) {
            setCategories(parsed.categories);
            saveLocalCategories(parsed.categories);
          }
          alert('Backup restored successfully!');
          triggerCloudSync();
        } else {
          alert('Invalid backup file structure.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearLocalData = () => {
    clearAllLocalData();
    const freshPeriods = getLocalPeriods();
    const freshExpenses = getLocalExpenses();
    const freshCategories = getLocalCategories();
    setPeriods(freshPeriods);
    setExpenses(freshExpenses);
    setCategories(freshCategories);
    setActiveMonthId(freshPeriods[0]?.id || '2026-09');
  };

  const activePeriod = periods.find(p => p.id === activeMonthId) || periods[0];

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 font-bold text-lg">
              ৳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  Salary & Expense
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Tracker
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Personal Salary Budget & Spend Log
              </p>
            </div>
          </div>

          {/* Top Right Controls: Month Selector + Theme Toggle + Cloud Sync Icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Month Quick Selector */}
            <div className="relative">
              <select
                id="top-month-selector"
                value={activeMonthId}
                onChange={e => setActiveMonthId(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.monthName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={() => {
                const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
                const nextSettings = { ...settings, theme: nextTheme as 'light' | 'dark' };
                setSettings(nextSettings);
                saveLocalSettings(nextSettings);
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle theme"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Cloud Sync trigger button */}
            <button
              id="header-sync-btn"
              onClick={triggerCloudSync}
              className={`p-2 rounded-xl border transition ${
                syncStatus === 'syncing'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                  : syncStatus === 'synced'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
              title="Sync with Google Sheets"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Sync Toast Notification */}
      {syncNotification && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-1 px-4 text-center animate-in fade-in duration-200">
          {syncNotification}
        </div>
      )}

      {/* Desktop Main Navigation Bar */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 py-1">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'expenses', label: 'Expenses', icon: Receipt },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'history', label: 'Monthly History', icon: History },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-desktop-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => {
              setEditingExpense(null);
              setModalDefaultDate(undefined);
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            calculation={currentCalculation}
            categories={categories}
            syncStatus={syncStatus}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setModalDefaultDate(undefined);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={exp => {
              setEditingExpense(exp);
              setIsExpenseModalOpen(true);
            }}
            onEditSalary={() => setIsSalaryModalOpen(true)}
            onManualSync={triggerCloudSync}
            onNavigateToTab={tab => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses.filter(e => e.monthId === activeMonthId)}
            categories={categories}
            monthName={activePeriod?.monthName || 'Current Month'}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setModalDefaultDate(undefined);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={exp => {
              setEditingExpense(exp);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            expenses={expenses.filter(e => e.monthId === activeMonthId)}
            categories={categories}
            monthId={activeMonthId}
            onSelectDate={dateStr => {
              setModalDefaultDate(dateStr);
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenAddExpenseWithDate={dateStr => {
              setModalDefaultDate(dateStr);
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={exp => {
              setEditingExpense(exp);
              setIsExpenseModalOpen(true);
            }}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            periods={periods}
            allExpenses={expenses}
            categories={categories}
            currentMonthId={activeMonthId}
            onSelectMonth={mId => setActiveMonthId(mId)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            periods={periods}
            allExpenses={expenses}
            activeMonthId={activeMonthId}
            onSelectMonth={mId => {
              setActiveMonthId(mId);
              setActiveTab('dashboard');
            }}
            onCreateNewMonth={handleStartNewMonth}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={s => {
              setSettings(s);
              saveLocalSettings(s);
            }}
            userInfo={userInfo}
            spreadsheetInfo={spreadsheetInfo}
            syncStatus={syncStatus}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onConnectGoogle={handleConnectGoogle}
            onSignOutGoogle={handleSignOutGoogle}
            onManualSync={triggerCloudSync}
            onExportAllData={handleExportAllData}
            onImportData={handleImportData}
            onClearLocalData={handleClearLocalData}
          />
        )}
      </main>

      {/* Mobile Floating Action Button: Add Record */}
      <div className="fixed bottom-20 right-5 z-40 md:hidden">
        <button
          id="mobile-floating-add-btn"
          onClick={() => {
            setEditingExpense(null);
            setModalDefaultDate(undefined);
            setIsExpenseModalOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-emerald-600/40 transition cursor-pointer"
          title="Add new expense or savings"
          aria-label="Add expense"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1 flex items-center justify-around">
        {[
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'expenses', label: 'Expenses', icon: Receipt },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'history', label: 'History', icon: History },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-mobile-${item.id}`}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition cursor-pointer min-w-[50px] ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        categories={categories}
        onAddCategory={handleAddCategory}
        initialExpense={editingExpense}
        defaultDate={modalDefaultDate}
        defaultMonthId={activeMonthId}
      />

      {/* Salary Modal (Edit Income) */}
      <SalaryModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        monthName={activePeriod?.monthName || 'This Month'}
        currentSalary={activePeriod?.salary || 0}
        currentStartingBalance={activePeriod?.startingBalance || 0}
        onSaveSalary={handleUpdateSalary}
      />
    </div>
  );
}
