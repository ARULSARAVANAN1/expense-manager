import type { CSSProperties } from "react";
import type { ExpenseCategory } from "../types/expense";

const categoryTokens: Record<string, string> = {
  food: "food",
  fooddining: "food",
  groceries: "groceries",
  transport: "transport",
  transportation: "transport",
  shopping: "shopping",
  bills: "bills",
  billsutilities: "bills",
  health: "health",
  healthcare: "health",
  entertainment: "entertainment",
  travel: "travel",
  education: "education",
  other: "other",
  others: "other",
  salary: "salary",
  freelance: "freelance",
  investment: "investment",
  investments: "investment",
  gifts: "gift-income",
  giftincome: "gift-income",
  otherincome: "other-income",
};

export function getCategoryColor(category?: ExpenseCategory): string {
  if (!category) return "var(--category-default)";
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");
  const token = categoryTokens[normalize(category.name)] ?? categoryTokens[normalize(category.id)];
  return token ? `var(--category-${token})` : category.color;
}

export function getCategoryStyle(category?: ExpenseCategory): CSSProperties {
  const color = getCategoryColor(category);
  return {
    color,
    backgroundColor: `color-mix(in srgb, ${color} 12%, var(--surface))`,
  };
}
