import type { Expense } from "../types/expense";
import { equalShares } from "../utils.ts/insights";

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  description: string;
  amount: number;
  date: string;
  ownShare: number;
  people: { id: string; name: string; share: number; settled: boolean }[];
}

const storageKey = (userId: string) => `expense_manager_splits_${userId}`;

function isSplit(value: unknown): value is ExpenseSplit {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ExpenseSplit>;
  return typeof record.id === "string" && typeof record.expenseId === "string"
    && typeof record.description === "string" && typeof record.date === "string"
    && typeof record.amount === "number" && Number.isFinite(record.amount) && record.amount > 0
    && typeof record.ownShare === "number" && Number.isFinite(record.ownShare) && record.ownShare > 0
    && Array.isArray(record.people) && record.people.length > 0
    && record.people.every((person) => person && typeof person.id === "string" && typeof person.name === "string"
      && typeof person.share === "number" && Number.isFinite(person.share) && person.share > 0 && typeof person.settled === "boolean")
    && Math.round((record.ownShare + record.people.reduce((sum, person) => sum + person.share, 0)) * 100) === Math.round(record.amount * 100);
}

export function getExpenseSplits(userId: string): ExpenseSplit[] {
  const saved = localStorage.getItem(storageKey(userId));
  if (saved === null) return [];
  try {
    const records: unknown = JSON.parse(saved);
    if (!Array.isArray(records) || !records.every(isSplit)) throw new Error("Invalid shared-expense data.");
    return records;
  } catch (error) {
    console.error("Unable to load shared expenses.", error);
    throw new Error("Your shared expenses could not be loaded.", { cause: error });
  }
}

function store(userId: string, records: ExpenseSplit[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(records));
}

export function createExpenseSplit(userId: string, expense: Expense, names: string[]) {
  const records = getExpenseSplits(userId);
  if (records.some((record) => record.expenseId === expense.id)) throw new Error("This expense already has a split.");
  const people = names.map((name) => name.trim());
  if (!people.length || people.length > 20 || people.some((name) => !name || name.length > 60)
    || new Set(people.map((name) => name.toLowerCase())).size !== people.length
    || people.some((name) => name.toLowerCase() === "me")) {
    throw new Error('Enter 1 to 20 unique participant names, excluding yourself. "Me" is reserved for your share.');
  }
  const shares = equalShares(expense.amount, people.length + 1);
  const split: ExpenseSplit = {
    id: crypto.randomUUID(), expenseId: expense.id, description: expense.description,
    date: expense.date, amount: expense.amount, ownShare: shares[0],
    people: people.map((name, index) => ({ id: crypto.randomUUID(), name, share: shares[index + 1], settled: false })),
  };
  store(userId, [split, ...records]);
}

export function setSplitSettled(userId: string, splitId: string, personId: string, settled: boolean) {
  const records = getExpenseSplits(userId);
  if (!records.some((record) => record.id === splitId && record.people.some((person) => person.id === personId))) {
    throw new Error("This participant could not be found.");
  }
  store(userId, records.map((record) => record.id !== splitId ? record : {
    ...record, people: record.people.map((person) => person.id === personId ? { ...person, settled } : person),
  }));
}

export function deleteExpenseSplit(userId: string, id: string) {
  const records = getExpenseSplits(userId);
  if (!records.some((record) => record.id === id)) throw new Error("This split could not be found.");
  store(userId, records.filter((record) => record.id !== id));
}
