import type { Budget, Expense, ExpenseCategory, Income } from "../types/expense";
import type { RecurringExpense } from "../services/recurring-expense.service";
import { toDateKey } from "./finance";

export function monthDays(month: string) {
  const [year, number] = month.split("-").map(Number);
  return new Date(year, number, 0).getDate();
}

export function monthlyInsights(
  month: string, expenses: Expense[], incomes: Income[], budgets: Budget[],
  schedules: RecurringExpense[], categories: ExpenseCategory[], today = toDateKey(new Date()),
) {
  const monthly = expenses.filter((item) => item.date.startsWith(month));
  const total = monthly.reduce((sum, item) => sum + item.amount, 0);
  const income = incomes.filter((item) => item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
  const groups = new Map<string, { name: string; spent: number; budget: number; upcoming: number }>();
  const group = (id: string, name: string) => {
    if (!groups.has(id)) groups.set(id, { name, spent: 0, budget: 0, upcoming: 0 });
    return groups.get(id)!;
  };
  monthly.forEach((item) => { group(item.categoryId, item.categoryName).spent += item.amount; });
  budgets.filter((item) => item.month === month).forEach((item) => { group(item.categoryId, item.categoryName).budget += item.amount; });
  schedules.forEach((schedule) => {
    const date = `${month}-${String(Math.min(Number(schedule.date.slice(8)), monthDays(month))).padStart(2, "0")}`;
    if (date < schedule.date || (schedule.endMonth && month > schedule.endMonth)
      || (schedule.completedThrough && schedule.completedThrough >= month)
      || monthly.some((item) => item.id === `recurring-${schedule.id}-${month}`)) return;
    group(schedule.categoryId, schedule.categoryName).upcoming += schedule.amount;
  });
  const allocations = [...groups.entries()].map(([id, value]) => ({
    id, ...value, remaining: Math.max(0, value.budget - value.spent),
    available: Math.max(0, value.budget - value.spent - value.upcoming),
  }));
  const upcoming = allocations.reduce((sum, item) => sum + item.upcoming, 0);
  const reserve = allocations.reduce((sum, item) => sum + Math.max(item.remaining, item.upcoming), 0);
  const balance = income - total - reserve;
  const remainingDays = month < today.slice(0, 7) ? 0
    : month === today.slice(0, 7) ? Math.max(1, monthDays(month) - Number(today.slice(8)) + 1) : monthDays(month);
  const [year, number] = month.split("-").map(Number);
  const previousMonth = toDateKey(new Date(year, number - 2, 1)).slice(0, 7);
  const cutoff = month === today.slice(0, 7) ? Number(today.slice(8)) : monthDays(previousMonth);
  const previous = expenses.filter((item) => item.date.startsWith(previousMonth) && Number(item.date.slice(8)) <= cutoff);
  const comparison = month === today.slice(0, 7) ? monthly.filter((item) => item.date <= today) : monthly;
  const previousTotal = previous.reduce((sum, item) => sum + item.amount, 0);
  const comparisonTotal = comparison.reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = allocations.filter((item) => item.spent > 0).sort((a, b) => b.spent - a.spent);
  const largest = monthly.reduce<Expense | undefined>((best, item) => !best || item.amount > best.amount ? item : best, undefined);
  const alerts: { id: string; tone: "warning" | "negative"; title: string; detail: string }[] = [];
  allocations.forEach((item) => {
    if (item.budget > 0 && item.spent / item.budget >= 0.8) alerts.push({
      id: `budget-${item.id}`, tone: item.spent >= item.budget ? "negative" : "warning",
      title: `${item.name}: ${Math.round(item.spent / item.budget * 100)}% of budget used`,
      detail: item.spent >= item.budget ? "Your recorded spending has reached or exceeded this category limit." : "Less than 20% of this category budget remains.",
    });
    const baseline = previous.filter((entry) => entry.categoryId === item.id).reduce((sum, entry) => sum + entry.amount, 0);
    const current = comparison.filter((entry) => entry.categoryId === item.id).reduce((sum, entry) => sum + entry.amount, 0);
    if (month <= today.slice(0, 7) && baseline >= 500 && current >= baseline * 1.5) alerts.push({
      id: `spike-${item.id}`, tone: "warning", title: `${item.name} spending is up ${Math.round((current / baseline - 1) * 100)}%`,
      detail: `Compared with ${month === today.slice(0, 7) ? "the same elapsed days of" : "the full"} previous month; previous spending was at least INR 500.`,
    });
  });
  if (monthly.length >= 5) {
    const amounts = monthly.map((item) => item.amount).sort((a, b) => a - b);
    const middle = Math.floor(amounts.length / 2);
    const median = amounts.length % 2 ? amounts[middle] : (amounts[middle - 1] + amounts[middle]) / 2;
    monthly.filter((item) => item.amount >= 1000 && item.amount > median * 3).forEach((item) => alerts.push({
      id: `large-${item.id}`, tone: "warning", title: `Large expense: ${item.description}`,
      detail: "At least INR 1,000 and more than 3 times this month's median transaction. This is a review prompt, not a fraud warning.",
    }));
  }
  return { monthly, total, income, allocations, reserve, upcoming, balance, remainingDays, categoryTotals, largest, alerts,
    previousTotal, comparisonTotal, categories };
}

export function parseQuickExpense(command: string, today = toDateKey(new Date())) {
  const match = command.trim().match(/^(.+?)\s+(?:₹|INR\s*)?(\d+(?:\.\d{1,2})?)(?:\s+(today|yesterday|\d{4}-\d{2}-\d{2}))?$/i);
  if (!match || !match[1].trim() || !Number.isFinite(Number(match[2])) || Number(match[2]) <= 0) {
    throw new Error('Use "Lunch 250 yesterday" or "Groceries 1840 2026-11-10". Amount must be positive with up to 2 decimal places.');
  }
  let date = today;
  if (match[3]?.toLowerCase() === "yesterday") {
    const value = new Date(`${today}T00:00:00`);
    value.setDate(value.getDate() - 1);
    date = toDateKey(value);
  } else if (match[3] && match[3].toLowerCase() !== "today") {
    date = match[3];
    const value = new Date(`${date}T00:00:00`);
    if (!Number.isFinite(value.getTime()) || toDateKey(value) !== date || Number(date.slice(0, 4)) < 1000) throw new Error("Enter a valid calendar date in YYYY-MM-DD format.");
  }
  return { description: match[1].trim(), amount: match[2], date };
}

export function equalShares(amount: number, participants: number) {
  const cents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(cents) || participants < 2 || !Number.isInteger(participants) || cents < participants) {
    throw new Error("Enter an amount with at least one paisa per participant, including yourself.");
  }
  const base = Math.floor(cents / participants);
  return Array.from({ length: participants }, (_, index) => (base + (index < cents % participants ? 1 : 0)) / 100);
}
