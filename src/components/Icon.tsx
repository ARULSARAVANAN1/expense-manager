import type { CSSProperties } from "react";

const paths = {
  profile: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2",
  lock: "M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4 M12 14v3",
  recurring: "M20 7a9 9 0 0 0-15-2L2 8 M2 3v5h5 M4 17a9 9 0 0 0 15 2l3-3 M22 21v-5h-5",
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  expense: "M7 4v16m0 0-4-4m4 4 4-4 M14 5h7M14 10h7M14 15h5",
  income: "M7 20V4m0 0L3 8m4-4 4 4 M14 9h7M14 14h7M14 19h5",
  reports: "M4 3v18h17 M8 16v-4m5 4V7m5 9V4",
  wallet: "M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v11H5a3 3 0 0 1-3-3V6 M16 12h6v5h-6z",
  categories: "M3 3h7v7H3z M17 2l5 5-5 5-5-5z M3 14h7v7H3z M14 14h7v7h-7z",
  budget: "M21 12a9 9 0 1 1-9-9 M12 3v9h9 M12 12l-6 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  logout: "M9 4H4v16h5 M10 12h11m0 0-4-4m4 4-4 4",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  plus: "M12 5v14M5 12h14",
  edit: "m15 4 5 5 M4 15 15 4a3.5 3.5 0 0 1 5 5L9 20l-6 1z",
  delete: "M3 6h18M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7m4-7v7",
  close: "m6 6 12 12M6 18 18 6",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6",
  back: "M20 12H4m0 0 6-6m-6 6 6 6",
  next: "M4 12h16m0 0-6-6m6 6-6 6",
  reset: "M3 10a9 9 0 1 1 1 7 M3 4v6h6",
  save: "M4 3h13l4 4v14H3V3z M7 3v6h10V3 M7 21v-8h10v8",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2",
  rupee: "M6 3h12M6 7h12 M6 3c10 0 10 8 0 8l10 10",
  transactions: "M3 7h17m0 0-4-4m4 4-4 4 M21 17H4m0 0 4-4m-4 4 4 4",
  food: "M4 3v6a3 3 0 0 0 6 0V3 M7 3v18 M20 21V3c-4 0-5 6-5 10h5",
  groceries: "M3 3h2l3 13h11l3-9H6 M10 21h.01M18 21h.01",
  transport: "M7 3h10a3 3 0 0 1 3 3v10H4V6a3 3 0 0 1 3-3z M4 10h16 M7 13h.01M17 13h.01 M7 16l-2 5m12-5 2 5",
  shopping: "M4 7h16l1 14H3z M8 7V5a4 4 0 0 1 8 0v2",
  bills: "m13 2-9 12h7l-1 8 10-12h-7z",
  health: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z",
  entertainment: "M3 5h18v16H3z M3 9h18M7 5l3 4m4-4 3 4 M10 13l5 3-5 3z",
  travel: "m21 3-5 10 2 7-2 2-4-7-5 3-3-2 7-4-7-4 2-2 7 2z",
  education: "m2 8 10-5 10 5-10 5z M6 10v7c4 3 8 3 12 0v-7 M22 8v9",
  salary: "M3 7h18v14H3z M8 7V3h8v4 M3 12a20 20 0 0 0 18 0 M10 12v3h4v-3",
  gift: "M3 8h18v4H3z M5 12v9h14v-9 M12 8v13 M12 8c-9 0-8-8-3-5l3 5c9 0 8-8 3-5z",
  sparkle: "m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z",
  warning: "m12 3 10 18H2z M12 9v5m0 3h.01",
  check: "m5 12 4 4L19 6",
} satisfies Record<string, string>;

const aliases: Record<string, keyof typeof paths> = {
  "↘": "expense", "↗": "income", "⇄": "transactions", "◷": "clock",
  "◈": "categories", "◉": "categories", "₹": "rupee", "＋": "plus",
  "🍽": "food", "🛒": "groceries", "🚇": "transport", "🛍": "shopping",
  "⚡": "bills", "✚": "health", "🎬": "entertainment", "✈": "travel",
  "📚": "education", "💼": "salary", "✦": "sparkle", "◇": "gift",
};

interface IconProps {
  name: string;
  size?: number;
  style?: CSSProperties;
}

export default function Icon({ name, size = 18, style }: IconProps) {
  const resolved = Object.hasOwn(paths, name) ? name as keyof typeof paths : aliases[name];
  if (!resolved) return <span aria-hidden="true" className="custom-icon" style={style}>{name}</span>;

  return (
    <svg className="ui-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={style}>
      <path d={paths[resolved]} />
    </svg>
  );
}
