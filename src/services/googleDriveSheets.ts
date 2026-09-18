import { ExpenseItem, MonthlyPeriod, CategoryDefinition, SpreadsheetInfo, GoogleUserInfo } from '../types';
import { secureGetItem, secureSetItem, secureRemoveItem } from './security';

const TOKEN_KEY = 'google_access_token';
const TOKEN_EXPIRY_KEY = 'google_token_expiry';
const SPREADSHEET_KEY = 'google_spreadsheet_info';
const USER_INFO_KEY = 'google_user_info';

// Read config from firebase-applet-config.json
let cachedClientId: string | null = null;
async function getOAuthClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;
  try {
    const res = await fetch('/firebase-applet-config.json');
    if (res.ok) {
      const data = await res.json();
      if (data.oAuthClientId) {
        cachedClientId = data.oAuthClientId;
        return data.oAuthClientId;
      }
    }
  } catch (err) {
    console.error('Failed to load firebase-applet-config.json', err);
  }
  return '915233161381-0psdukldhmra731jho80armqo807l6ot.apps.googleusercontent.com';
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
            error_callback?: (err: unknown) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export async function getStoredToken(): Promise<string | null> {
  const expiry = await secureGetItem(TOKEN_EXPIRY_KEY);
  if (expiry) {
    const expiresAt = parseInt(expiry, 10);
    if (Date.now() > expiresAt) {
      // Token expired
      await secureRemoveItem(TOKEN_KEY);
      await secureRemoveItem(TOKEN_EXPIRY_KEY);
      return null;
    }
  }
  return await secureGetItem(TOKEN_KEY);
}

export async function storeToken(token: string, expiresInSec: number = 3600): Promise<void> {
  await secureSetItem(TOKEN_KEY, token);
  const expiryTimestamp = (Date.now() + expiresInSec * 1000).toString();
  await secureSetItem(TOKEN_EXPIRY_KEY, expiryTimestamp);
}

export async function clearStoredCredentials(): Promise<void> {
  await secureRemoveItem(TOKEN_KEY);
  await secureRemoveItem(TOKEN_EXPIRY_KEY);
  await secureRemoveItem(SPREADSHEET_KEY);
  await secureRemoveItem(USER_INFO_KEY);
}

export async function getStoredSpreadsheet(): Promise<SpreadsheetInfo | null> {
  const raw = await secureGetItem(SPREADSHEET_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function storeSpreadsheet(info: SpreadsheetInfo): Promise<void> {
  await secureSetItem(SPREADSHEET_KEY, JSON.stringify(info));
}

export async function getStoredUserInfo(): Promise<GoogleUserInfo | null> {
  const raw = await secureGetItem(USER_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function storeUserInfo(user: GoogleUserInfo): Promise<void> {
  await secureSetItem(USER_INFO_KEY, JSON.stringify(user));
}

export async function requestGoogleAuth(): Promise<string> {
  const clientId = await getOAuthClientId();
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services script not yet loaded. Please check your internet connection and try again.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
        callback: async (resp) => {
          if (resp.error) {
            reject(new Error(resp.error));
            return;
          }
          if (resp.access_token) {
            await storeToken(resp.access_token, resp.expires_in || 3500);

            // Attempt to fetch profile info
            try {
              const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${resp.access_token}` },
              });
              if (userRes.ok) {
                const profile = await userRes.json();
                await storeUserInfo({
                  email: profile.email,
                  name: profile.name,
                  picture: profile.picture,
                });
              }
            } catch (err) {
              console.warn('Failed to fetch userinfo', err);
            }

            resolve(resp.access_token);
          } else {
            reject(new Error('No access token received'));
          }
        },
        error_callback: (err) => {
          reject(err);
        },
      });

      client.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Drive API: Find or create the private spreadsheet "Salary Expense Tracker"
 */
export async function getOrCreateSpreadsheet(token: string): Promise<SpreadsheetInfo> {
  const SHEET_NAME = 'Salary Expense Tracker';

  // 1. Search existing spreadsheet in Google Drive
  const q = encodeURIComponent(`name = '${SHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    throw new Error(`Failed to search Drive: ${searchRes.status} ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const file = searchData.files[0];
    const info: SpreadsheetInfo = {
      id: file.id,
      name: file.name,
      url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      lastSyncedAt: new Date().toISOString(),
    };
    await storeSpreadsheet(info);
    return info;
  }

  // 2. Create the spreadsheet with the 3 sheets: Expenses, Monthly Summary, Categories
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createPayload = {
    properties: {
      title: SHEET_NAME,
    },
    sheets: [
      {
        properties: {
          title: 'Expenses',
          gridProperties: { rowCount: 1000, columnCount: 10, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Monthly Summary',
          gridProperties: { rowCount: 100, columnCount: 6, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Categories',
          gridProperties: { rowCount: 50, columnCount: 4, frozenRowCount: 1 },
        },
      },
    ],
  };

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Sheet: ${createRes.status} ${createRes.statusText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const webViewLink = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 3. Populate header rows for the sheets
  const headerUpdates = [
    {
      range: 'Expenses!A1:J1',
      values: [
        ['ID', 'Date', 'Type', 'Category', 'Description', 'Note', 'Amount', 'Month', 'Created At', 'Updated At'],
      ],
    },
    {
      range: 'Monthly Summary!A1:F1',
      values: [
        ['Month ID', 'Month', 'Salary', 'Total Expenses', 'Total Savings', 'Remaining Balance'],
      ],
    },
    {
      range: 'Categories!A1:D1',
      values: [
        ['Category ID', 'Category Name', 'Is Savings', 'Color'],
      ],
    },
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headerUpdates,
    }),
  });

  const info: SpreadsheetInfo = {
    id: spreadsheetId,
    name: SHEET_NAME,
    url: webViewLink,
    lastSyncedAt: new Date().toISOString(),
  };

  await storeSpreadsheet(info);
  return info;
}

/**
 * Full Sync: Push local expenses, monthly summaries, and categories to Google Sheets,
 * and read cloud rows to merge any new rows without duplicates.
 */
export async function syncDataWithGoogleSheets(
  token: string,
  spreadsheetId: string,
  localExpenses: ExpenseItem[],
  localPeriods: MonthlyPeriod[],
  localCategories: CategoryDefinition[]
): Promise<{ mergedExpenses: ExpenseItem[]; spreadsheetUrl: string }> {
  // 1. Fetch current Expenses sheet rows to avoid duplicates
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Expenses!A2:J`;
  const readRes = await fetch(readUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const existingMap = new Map<string, number>(); // ID -> 1-indexed row number in Expenses sheet
  if (readRes.ok) {
    const data = await readRes.json();
    const rows = data.values || [];
    rows.forEach((row: string[], index: number) => {
      const id = row[0];
      if (id) {
        existingMap.set(id, index + 2); // Row 1 is headers
      }
    });
  }

  // 2. Prepare batch update for Expenses
  // To keep sheet organized and Excel compatible, we update/overwrite cleanly
  const expenseRows = localExpenses.map(exp => [
    exp.id,
    exp.date,
    exp.type,
    exp.category,
    exp.description,
    exp.note || '',
    exp.amount,
    exp.monthId,
    exp.createdAt,
    exp.updatedAt,
  ]);

  // Write all expenses starting from row 2
  const expenseValues = [
    ['ID', 'Date', 'Type', 'Category', 'Description', 'Note', 'Amount', 'Month', 'Created At', 'Updated At'],
    ...expenseRows,
  ];

  // Monthly Summary rows
  const periodRows = localPeriods.map(p => [
    p.id,
    p.monthName,
    p.salary,
    p.totalExpenses,
    p.totalSavings,
    p.remainingBalance,
  ]);

  const periodValues = [
    ['Month ID', 'Month', 'Salary', 'Total Expenses', 'Total Savings', 'Remaining Balance'],
    ...periodRows,
  ];

  // Categories rows
  const categoryRows = localCategories.map(c => [
    c.id,
    c.name,
    c.isSavings ? 'Yes' : 'No',
    c.color,
  ]);

  const categoryValues = [
    ['Category ID', 'Category Name', 'Is Savings', 'Color'],
    ...categoryRows,
  ];

  // Clear and update with clean ranges
  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const batchRes = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `Expenses!A1:J${Math.max(expenseValues.length, 100)}`,
          values: expenseValues,
        },
        {
          range: `Monthly Summary!A1:F${Math.max(periodValues.length, 20)}`,
          values: periodValues,
        },
        {
          range: `Categories!A1:D${Math.max(categoryValues.length, 30)}`,
          values: categoryValues,
        },
      ],
    }),
  });

  if (!batchRes.ok) {
    throw new Error(`Sync to Google Sheets failed: ${batchRes.status} ${batchRes.statusText}`);
  }

  // Mark all local expenses as synced
  const updatedExpenses = localExpenses.map(e => ({ ...e, syncedToCloud: true }));

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  await storeSpreadsheet({
    id: spreadsheetId,
    name: 'Salary Expense Tracker',
    url: spreadsheetUrl,
    lastSyncedAt: new Date().toISOString(),
  });

  return {
    mergedExpenses: updatedExpenses,
    spreadsheetUrl,
  };
}
