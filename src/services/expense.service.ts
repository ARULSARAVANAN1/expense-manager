import {
  expenseAccounts,
  expenseCategories,
} from "../types/expense";
import type { Expense, ExpenseInput } from "../types/expense";
import { getRecurringExpenses, reconcileRecurringExpenses, storeRecurringExpenses } from "./recurring-expense.service";
import { getExpenseSplits } from "./split-expense.service";

const STORAGE_PREFIX = "expense_manager_expenses_";

const sampleExpenses = [
  ["Groceries from Nature's Basket", 1840, "groceries", "upi", 1],
  ["Lunch at The Table", 780, "food", "credit", 2],
  ["Monthly electricity bill", 2350, "bills", "hdfc", 4],
  ["Metro recharge", 600, "transport", "sbi", 6],
  ["Weekend movie tickets", 950, "entertainment", "credit", 8],
  ["Pharmacy essentials", 420, "health", "cash", 11],
  ["Coffee with friends", 540, "food", "upi", 14],
  ["Household supplies", 1260, "groceries", "hdfc", 18],
  ["New running shoes", 3299, "shopping", "credit", 23],
  ["Cab to the airport", 890, "transport", "upi", 31],
  ["Online course subscription", 1499, "education", "sbi", 39],
  ["Dinner at Olive", 2150, "food", "credit", 47],
  ["Weekend trip hotel", 4800, "travel", "hdfc", 64],
  ["Water bill", 720, "bills", "sbi", 81],
  ["Supermarket run", 2380, "groceries", "upi", 96],
  ["Concert tickets", 2750, "entertainment", "credit", 111],
  ["Doctor consultation", 900, "health", "cash", 132],
  ["Home decor", 1670, "shopping", "hdfc", 151],
  ["Train tickets", 1820, "travel", "sbi", 174],
];

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function createSampleExpenses(): Expense[] {
  const now = new Date();
  return sampleExpenses.map(([description, amount, categoryId, accountId, daysAgo], index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - Number(daysAgo));
    const isoDate = date.toISOString();
    const category = expenseCategories.find((item) => item.id === categoryId);
    const account = expenseAccounts.find((item) => item.id === accountId);
    return {
      id: `sample-${index + 1}`,
      description: String(description),
      amount: Number(amount),
      categoryId: String(categoryId),
      categoryName: category?.name ?? "Others",
      accountId: String(accountId),
      accountName: account?.name ?? "UPI",
      date: isoDate.slice(0, 10),
      createdAt: isoDate,
      updatedAt: isoDate,
    };
  });
}

export function getExpenses(userId: string): Expense[] {
  const key = storageKey(userId);
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const expenses: unknown = JSON.parse(stored);
      if (!Array.isArray(expenses)) {
        throw new Error("Stored expenses must be an array.");
      }
      return applyRecurringExpenses(userId, expenses as Expense[]);
    } catch (error) {
      console.error("Unable to read saved expenses.", error);
      throw new Error("Your saved expenses could not be loaded. Please clear the app's local expense data and try again.", { cause: error });
    }
  }
  const seeded = createSampleExpenses();
  saveExpenses(userId, seeded);
  return applyRecurringExpenses(userId, seeded);
}

function applyRecurringExpenses(userId: string, expenses: Expense[]): Expense[] {
  const result = reconcileRecurringExpenses(getRecurringExpenses(userId), expenses);
  if (result.changed) {
    saveExpenses(userId, result.expenses);
    storeRecurringExpenses(userId, result.schedules);
  }
  return result.expenses;
}

function saveExpenses(userId: string, expenses: Expense[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(expenses));
}

export function addExpense(userId: string, input: ExpenseInput): Expense {
  const now = new Date().toISOString();
  const expense: Expense = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  saveExpenses(userId, [expense, ...getExpenses(userId)]);
  return expense;
}

export function updateExpense(userId: string, id: string, input: ExpenseInput): Expense {
  const expenses = getExpenses(userId);
  const existing = expenses.find((expense) => expense.id === id);
  if (!existing) {
    throw new Error("This expense could not be found.");
  }
  if (input.amount !== existing.amount && getExpenseSplits(userId).some((split) => split.expenseId === id)) {
    throw new Error("Remove this expense's shared split before changing its amount. This protects participant balances.");
  }
  const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
  saveExpenses(userId, expenses.map((expense) => expense.id === id ? updated : expense));
  return updated;
}

export function deleteExpense(userId: string, id: string): void {
  if (getExpenseSplits(userId).some((split) => split.expenseId === id)) {
    throw new Error("Remove this expense's shared split before deleting the expense.");
  }
  const expenses = getExpenses(userId);
  if (!expenses.some((expense) => expense.id === id)) {
    throw new Error("This expense could not be found.");
  }
  saveExpenses(userId, expenses.filter((expense) => expense.id !== id));
}
