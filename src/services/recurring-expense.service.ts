import type { Expense, ExpenseInput } from "../types/expense";
import { toDateKey } from "../utils.ts/finance";

export interface RecurringExpense extends ExpenseInput {
  id: string;
  endMonth: string;
  completedThrough?: string;
}

const key = (userId: string) => `expense_manager_recurring_${userId}`;

export function getRecurringExpenses(userId: string): RecurringExpense[] {
  const saved = localStorage.getItem(key(userId));
  if (!saved) return [];
  try {
    const records: unknown = JSON.parse(saved);
    if (!Array.isArray(records) || !records.every((item) =>
      item && typeof item.id === "string" && typeof item.date === "string"
      && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Number.isFinite(item.amount) && item.amount > 0
      && typeof item.endMonth === "string")) throw new Error("Invalid recurring expense data.");
    return records;
  } catch (error) {
    console.error("Unable to load recurring expenses.", error);
    throw new Error("Saved recurring expenses could not be loaded.", { cause: error });
  }
}

export function storeRecurringExpenses(userId: string, records: RecurringExpense[]) {
  localStorage.setItem(key(userId), JSON.stringify(records));
}

export function saveRecurringExpense(userId: string, input: ExpenseInput & { endMonth: string }, id?: string) {
  if (!Number.isFinite(input.amount) || input.amount <= 0 || !input.description.trim()
    || !/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !Number.isFinite(new Date(`${input.date}T00:00:00`).getTime())
    || !input.categoryId || !input.accountId
    || (input.endMonth && (!/^\d{4}-\d{2}$/.test(input.endMonth) || input.endMonth < input.date.slice(0, 7)))) {
    throw new Error("Enter a valid amount, description, category, account, start date, and end month.");
  }
  const records = getRecurringExpenses(userId);
  const existing = records.find((item) => item.id === id);
  if (id && !existing) throw new Error("This recurring expense could not be found.");
  if (existing && existing.date !== input.date) throw new Error("The start date cannot change. Create a new schedule instead.");
  const record = { ...input, id: existing?.id ?? crypto.randomUUID(), completedThrough: existing?.completedThrough };
  storeRecurringExpenses(userId, existing ? records.map((item) => item.id === id ? record : item) : [...records, record]);
}

export function deleteRecurringExpense(userId: string, id: string) {
  const records = getRecurringExpenses(userId);
  if (!records.some((item) => item.id === id)) throw new Error("This recurring expense could not be found.");
  storeRecurringExpenses(userId, records.filter((item) => item.id !== id));
}

export function reconcileRecurringExpenses(records: RecurringExpense[], expenses: Expense[], today = toDateKey(new Date())) {
  const generated: Expense[] = [];
  const ids = new Set(expenses.map((expense) => expense.id));
  const schedules = records.map((schedule) => {
    const startMonth = schedule.date.slice(0, 7);
    let month = schedule.completedThrough ?? startMonth;
    if (schedule.completedThrough) month = nextMonth(month);
    let completedThrough = schedule.completedThrough;
    const lastMonth = schedule.endMonth && schedule.endMonth < today.slice(0, 7) ? schedule.endMonth : today.slice(0, 7);
    while (month <= lastMonth) {
      const [year, monthNumber] = month.split("-").map(Number);
      const day = Math.min(Number(schedule.date.slice(8)), new Date(year, monthNumber, 0).getDate());
      const date = `${month}-${String(day).padStart(2, "0")}`;
      if (date > today) break;
      const id = `recurring-${schedule.id}-${month}`;
      if (!ids.has(id)) {
        const now = new Date().toISOString();
        generated.push({
          id, description: schedule.description, amount: schedule.amount,
          categoryId: schedule.categoryId, categoryName: schedule.categoryName,
          accountId: schedule.accountId, accountName: schedule.accountName,
          notes: schedule.notes, date, createdAt: now, updatedAt: now,
        });
        ids.add(id);
      }
      completedThrough = month;
      month = nextMonth(month);
    }
    return { ...schedule, completedThrough };
  });
  return { expenses: [...generated, ...expenses], schedules, changed: schedules.some((schedule, index) => schedule.completedThrough !== records[index].completedThrough) };
}

function nextMonth(month: string) {
  const [year, number] = month.split("-").map(Number);
  return number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, "0")}`;
}
