import { getExpenses, updateExpense } from "./expense.service";
import { getRecurringExpenses, storeRecurringExpenses } from "./recurring-expense.service";
import {
  expenseAccounts,
  expenseCategories,
  incomeCategories,
} from "../types/expense";
import type {
  Budget,
  Expense,
  ExpenseAccount,
  ExpenseCategory,
  ExpenseInput,
  FinanceCategory,
  Income,
} from "../types/expense";

const PREFIX = "expense_manager_";
const seededAccounts: ExpenseAccount[] = expenseAccounts.map((account) => ({ ...account }));
const defaultCategories: FinanceCategory[] = [
  ...expenseCategories.map((category) => ({ ...category, type: "expense" as const })),
  ...incomeCategories.map((category) => ({ ...category, type: "income" as const })),
];
const sampleIncomes = [
  { description: "Monthly salary", amount: 85000, categoryId: "salary", accountId: "hdfc", daysAgo: 3 },
  { description: "Design project", amount: 12500, categoryId: "freelance", accountId: "upi", daysAgo: 15 },
  { description: "Mutual fund dividend", amount: 1800, categoryId: "investment", accountId: "sbi", daysAgo: 26 },
  { description: "Monthly salary", amount: 85000, categoryId: "salary", accountId: "hdfc", daysAgo: 34 },
];

function key(userId: string, collection: string): string {
  return `${PREFIX}${collection}_${userId}`;
}

function readList<T>(userId: string, collection: string): T[] | null {
  const saved = localStorage.getItem(key(userId, collection));
  if (saved === null) return null;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("Stored data must be an array.");
    return parsed as T[];
  } catch (error) {
    console.error(`Unable to read saved ${collection}.`, error);
    throw new Error(`Saved ${collection} could not be loaded.`, { cause: error });
  }
}

function writeList<T>(userId: string, collection: string, records: T[]): void {
  localStorage.setItem(key(userId, collection), JSON.stringify(records));
}

function sampleIncomeRecords(): Income[] {
  const now = new Date();
  return sampleIncomes.map((item, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - item.daysAgo);
    const timestamp = date.toISOString();
    const category = incomeCategories.find((entry) => entry.id === item.categoryId);
    const account = seededAccounts.find((entry) => entry.id === item.accountId);
    return {
      id: `sample-income-${index + 1}`,
      description: item.description,
      amount: item.amount,
      categoryId: item.categoryId,
      categoryName: category?.name ?? "Other income",
      accountId: item.accountId,
      accountName: account?.name ?? "HDFC Bank",
      date: timestamp.slice(0, 10),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

export function getIncomes(userId: string): Income[] {
  const saved = readList<Income>(userId, "incomes");
  if (saved) return saved;
  const initial = sampleIncomeRecords();
  writeList(userId, "incomes", initial);
  return initial;
}

export function addIncome(userId: string, input: ExpenseInput): Income {
  const now = new Date().toISOString();
  const income: Income = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  writeList(userId, "incomes", [income, ...getIncomes(userId)]);
  return income;
}

export function updateIncome(userId: string, id: string, input: ExpenseInput): Income {
  const incomes = getIncomes(userId);
  const existing = incomes.find((income) => income.id === id);
  if (!existing) throw new Error("This income could not be found.");
  const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
  writeList(userId, "incomes", incomes.map((income) => income.id === id ? updated : income));
  return updated;
}

export function deleteIncome(userId: string, id: string): void {
  const incomes = getIncomes(userId);
  if (!incomes.some((income) => income.id === id)) throw new Error("This income could not be found.");
  writeList(userId, "incomes", incomes.filter((income) => income.id !== id));
}

export function getFinanceCategories(userId: string): FinanceCategory[] {
  const saved = readList<FinanceCategory>(userId, "categories");
  if (saved) return saved;
  writeList(userId, "categories", defaultCategories);
  return defaultCategories;
}

export function getCategories(userId: string, type: FinanceCategory["type"]): ExpenseCategory[] {
  return getFinanceCategories(userId).filter((category) => category.type === type);
}

export function saveCategory(userId: string, input: Omit<FinanceCategory, "id">, id?: string): FinanceCategory {
  const categories = getFinanceCategories(userId);
  if (categories.some((category) => category.type === input.type && category.name.trim().toLowerCase() === input.name.trim().toLowerCase() && category.id !== id)) {
    throw new Error("A category with this name already exists.");
  }
  if (id) {
    const existing = categories.find((category) => category.id === id);
    if (!existing) throw new Error("This category could not be found.");
    if (existing.type !== input.type && getRecurringExpenses(userId).some((schedule) => schedule.categoryId === id)) {
      throw new Error("This category is used by recurring expenses and its type cannot change.");
    }
    const updated = { ...existing, ...input };
    const updatedCategories = categories.map((category) => category.id === id ? updated : category);
    writeList(userId, "categories", updatedCategories);
    updateCategoryNames(userId, existing.type, id, updated.name);
    return updated;
  }
  const category: FinanceCategory = { ...input, id: crypto.randomUUID() };
  writeList(userId, "categories", [...categories, category]);
  return category;
}

function updateCategoryNames(userId: string, type: FinanceCategory["type"], id: string, name: string): void {
  if (type === "expense") {
    storeRecurringExpenses(userId, getRecurringExpenses(userId).map((schedule) => schedule.categoryId === id ? { ...schedule, categoryName: name } : schedule));
    const expenses = getExpenses(userId);
    expenses.forEach((expense) => {
      if (expense.categoryId === id) updateExpense(userId, expense.id, { ...expense, categoryName: name });
    });
    return;
  }
  const incomes = getIncomes(userId);
  writeList(userId, "incomes", incomes.map((income) => income.categoryId === id ? { ...income, categoryName: name, updatedAt: new Date().toISOString() } : income));
}

export function deleteCategory(userId: string, id: string): void {
  const categories = getFinanceCategories(userId);
  const category = categories.find((entry) => entry.id === id);
  if (!category) throw new Error("This category could not be found.");
  const records = category.type === "expense" ? getExpenses(userId) : getIncomes(userId);
  if (records.some((record) => record.categoryId === id) || getRecurringExpenses(userId).some((schedule) => schedule.categoryId === id)) {
    throw new Error("This category is used by transactions or recurring schedules and cannot be deleted.");
  }
  writeList(userId, "categories", categories.filter((entry) => entry.id !== id));
}

export function getAccounts(userId: string): ExpenseAccount[] {
  const saved = readList<ExpenseAccount>(userId, "accounts");
  if (saved) return saved;
  writeList(userId, "accounts", seededAccounts);
  return seededAccounts;
}

export function saveAccount(userId: string, name: string, id?: string): ExpenseAccount {
  const accounts = getAccounts(userId);
  if (accounts.some((account) => account.name.trim().toLowerCase() === name.trim().toLowerCase() && account.id !== id)) {
    throw new Error("An account with this name already exists.");
  }
  if (id) {
    const existing = accounts.find((account) => account.id === id);
    if (!existing) throw new Error("This account could not be found.");
    const updated = { ...existing, name: name.trim() };
    writeList(userId, "accounts", accounts.map((account) => account.id === id ? updated : account));
    updateAccountNames(userId, id, updated.name);
    return updated;
  }
  const account = { id: crypto.randomUUID(), name: name.trim() };
  writeList(userId, "accounts", [...accounts, account]);
  return account;
}

function updateAccountNames(userId: string, id: string, name: string): void {
  storeRecurringExpenses(userId, getRecurringExpenses(userId).map((schedule) => schedule.accountId === id ? { ...schedule, accountName: name } : schedule));
  const expenses = getExpenses(userId).map((expense) => expense.accountId === id ? { ...expense, accountName: name, updatedAt: new Date().toISOString() } : expense);
  writeList(userId, "expenses", expenses);
  const incomes = getIncomes(userId).map((income) => income.accountId === id ? { ...income, accountName: name, updatedAt: new Date().toISOString() } : income);
  writeList(userId, "incomes", incomes);
}

export function deleteAccount(userId: string, id: string): void {
  const accounts = getAccounts(userId);
  if (!accounts.some((account) => account.id === id)) throw new Error("This account could not be found.");
  const records: Expense[] = [...getExpenses(userId), ...getIncomes(userId)];
  if (records.some((record) => record.accountId === id) || getRecurringExpenses(userId).some((schedule) => schedule.accountId === id)) throw new Error("This account is linked to transactions or recurring schedules and cannot be deleted.");
  writeList(userId, "accounts", accounts.filter((account) => account.id !== id));
}

export function getBudgets(userId: string): Budget[] {
  return readList<Budget>(userId, "budgets") ?? [];
}

export function saveBudget(userId: string, input: Omit<Budget, "id">, id?: string): Budget {
  const budgets = getBudgets(userId);
  if (budgets.some((budget) => budget.month === input.month && budget.categoryId === input.categoryId && budget.id !== id)) {
    throw new Error("A budget already exists for this category and month.");
  }
  if (id && !budgets.some((budget) => budget.id === id)) throw new Error("This budget could not be found.");
  const saved = { ...input, id: id ?? crypto.randomUUID() };
  writeList(userId, "budgets", id ? budgets.map((budget) => budget.id === id ? saved : budget) : [saved, ...budgets]);
  return saved;
}

export function deleteBudget(userId: string, id: string): void {
  const budgets = getBudgets(userId);
  if (!budgets.some((budget) => budget.id === id)) throw new Error("This budget could not be found.");
  writeList(userId, "budgets", budgets.filter((budget) => budget.id !== id));
}
