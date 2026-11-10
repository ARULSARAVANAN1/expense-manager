import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { Expense, ExpenseCategory } from "../types/expense";
import { expenseCategories } from "../types/expense";
import { formatCompactCurrency, formatCurrency, formatDate } from "../utils.ts/finance";
import { getCategoryColor, getCategoryStyle } from "../utils.ts/category-style";
import Icon from "./Icon";

interface ChartProps {
  expenses: Expense[];
  categories?: ExpenseCategory[];
  onSelect?: (value: string) => void;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  return reducedMotion;
}

function recentMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      key: monthKey(date),
      name: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
      fullName: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(date),
    };
  });
}

export function FinanceTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const firstItem = payload[0];
  const datum = firstItem.payload;
  const title = datum && typeof datum === "object" && "fullName" in datum
    ? String(datum.fullName)
    : datum && typeof datum === "object" && "date" in datum
      ? formatDate(String(datum.date))
      : String(label ?? firstItem.name ?? "");

  return (
    <div className="chart-tooltip">
      <strong className="chart-tooltip-title">{title}</strong>
      {payload.map((item, index) => (
        <div className="chart-tooltip-value" key={`${String(item.name)}-${index}`}>
          <span><i style={{ backgroundColor: item.color ?? item.fill ?? "var(--primary)" }} />{String(item.name ?? "Amount")}</span>
          <b data-finance-tone="expense">{formatCurrency(Number(item.value ?? 0))}</b>
        </div>
      ))}
    </div>
  );
}

export function ExpenseTrendChart({ expenses, onSelect }: ChartProps) {
  const months = recentMonths().map((month) => ({ ...month, amount: 0 }));
  expenses.forEach((expense) => {
    const month = months.find((item) => item.key === expense.date.slice(0, 7));
    if (month) month.amount += expense.amount;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={months} margin={{ top: 8, right: 8, left: 3, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={8} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
        <YAxis width={64} axisLine={false} tickLine={false} tickMargin={7} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} tickFormatter={(value: number) => formatCompactCurrency(value)} />
        <Tooltip content={FinanceTooltip} cursor={{ fill: "var(--primary-soft)", opacity: 0.65 }} />
        <Bar dataKey="amount" name="Expenses" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={38} cursor={onSelect ? "pointer" : "default"} onClick={(data) => {
          const item = data as unknown as { key?: string; payload?: { key?: string } };
          const key = item.key ?? item.payload?.key;
          if (key) onSelect?.(key);
        }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DailyExpenseChart({ expenses, month, onSelect }: { expenses: Expense[]; month: string; onSelect?: (date: string) => void }) {
  const navigate = useNavigate();
  const gradientId = useId();
  const reducedMotion = usePrefersReducedMotion();
  const [year, monthNumber] = month.split("-").map(Number);
  const days = new Date(year, monthNumber, 0).getDate();
  const totals = new Map<string, number>();
  expenses.forEach((expense) => totals.set(expense.date, (totals.get(expense.date) ?? 0) + expense.amount));
  const data = Array.from({ length: days }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    return { date, day: index + 1, amount: totals.get(date) ?? 0 };
  });
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 16, right: 16, left: 3, bottom: 8 }}
        onClick={(state) => {
          if (state.activeTooltipIndex == null) return;
          const day = data[Number(state.activeTooltipIndex)];
          if (day) {
            if (onSelect) onSelect(day.date);
            else navigate(`/app/expenses?from=${day.date}&to=${day.date}`);
          }
        }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="day" axisLine={false} tickLine={false} minTickGap={12} tickMargin={8} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
        <YAxis width={64} axisLine={false} tickLine={false} tickMargin={7} tickFormatter={formatCompactCurrency} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
        <Tooltip content={FinanceTooltip} cursor={{ stroke: "var(--primary-border)", strokeDasharray: "4 4" }} />
        <Area type="monotone" dataKey="amount" name="Expenses" stroke="var(--primary)" strokeWidth={3}
          fill={`url(#${gradientId})`} dot={false}
          isAnimationActive={!reducedMotion} animationDuration={550} animationEasing="ease-out"
          activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 3 }} cursor="pointer" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonutChart({ expenses, categories = expenseCategories, onSelect }: ChartProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const amounts = categories.map((category) => ({
    ...category,
    amount: expenses.filter((expense) => expense.categoryId === category.id).reduce((sum, expense) => sum + expense.amount, 0),
    count: expenses.filter((expense) => expense.categoryId === category.id).length,
  })).filter((category) => category.amount > 0).sort((a, b) => b.amount - a.amount);
  const total = amounts.reduce((sum, category) => sum + category.amount, 0);
  const activeCategory = amounts.find((category) => category.id === activeId);
  const centerAmount = activeCategory?.amount ?? total;
  const thousandsFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  const formatCategoryAmount = (amount: number) => amount >= 1000
    ? `${thousandsFormatter.format(amount / 1000)}k`
    : formatCurrency(amount);
  const centerValue = activeCategory || total > 9999
    ? formatCategoryAmount(centerAmount)
    : formatCurrency(total);

  if (!amounts.length) {
    return <div className="empty-state"><span><Icon name="budget" size={24} /></span><h3>No spending yet</h3><p>Category insights will appear when you add expenses for this period.</p></div>;
  }

  return (
    <div className="donut-wrap category-breakdown">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={amounts} dataKey="amount" nameKey="name" innerRadius="67%" outerRadius="88%" paddingAngle={3} stroke="none"
              isAnimationActive={!reducedMotion} animationDuration={550} animationEasing="ease-out"
              onMouseEnter={(_, index) => setActiveId(amounts[index]?.id ?? null)}
              onMouseLeave={() => setActiveId(null)}
              onClick={(_, index) => { const category = amounts[index]; if (category) onSelect?.(category.id); }}>
              {amounts.map((category) => <Cell key={category.id} fill={getCategoryColor(category)} opacity={activeCategory && activeCategory.id !== category.id ? 0.3 : 1} cursor={onSelect ? "pointer" : "default"} />)}
            </Pie>
            <Tooltip content={FinanceTooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <span>{activeCategory?.name ?? "Total spending"}</span>
          <strong data-finance-tone="expense" tabIndex={0} data-tooltip-id="app-tooltip" data-tooltip-content={formatCurrency(centerAmount)} aria-label={formatCurrency(centerAmount)}>{centerValue}</strong>
          {activeCategory && <small>{`${(activeCategory.amount / total * 100).toFixed(1)}% of total`}</small>}
        </div>
      </div>
      <p className="category-interaction-hint"><Icon name="search" size={14} />{onSelect ? "Hover to explore · Select a category to view transactions" : "Hover to explore your spending"}</p>
      <div className="category-legend">
        {amounts.map((category) => (
          <button type="button" className={`category-legend-row${activeId === category.id ? " is-highlighted" : ""}`} key={category.id}
            data-tooltip-id="app-tooltip" data-tooltip-content={`${category.name}: ${formatCurrency(category.amount)}`}
            onMouseEnter={() => setActiveId(category.id)} onMouseLeave={() => setActiveId(null)}
            onFocus={() => setActiveId(category.id)} onBlur={() => setActiveId(null)}
            aria-label={`${category.name}: ${formatCurrency(category.amount)}, ${(category.amount / total * 100).toFixed(1)}% of spending${onSelect ? ". View transactions" : ""}`}
            onClick={() => onSelect?.(category.id)}>
            <span className="legend-category-icon" style={getCategoryStyle(category)}><Icon name={category.icon} size={19} /></span>
            <span className="category-row-content">
              <span className="category-row-heading"><span className="legend-name">{category.name}</span><strong>{formatCategoryAmount(category.amount)}</strong></span>
              <span className="category-share-track"><span style={{ width: `${category.amount / total * 100}%`, backgroundColor: getCategoryColor(category) }} /></span>
              <span className="category-row-meta"><span>{category.count} transaction{category.count === 1 ? "" : "s"}</span><small>{(category.amount / total * 100).toFixed(1)}%</small></span>
            </span>
            {onSelect && <Icon name="next" size={16} />}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TopCategoriesChart({ expenses, categories = expenseCategories, onSelect }: ChartProps) {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const data = categories.map((category) => ({
    ...category,
    amount: expenses.filter((expense) => expense.categoryId === category.id).reduce((sum, expense) => sum + expense.amount, 0),
  })).filter((category) => category.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 6);

  return (
    <div className="top-categories">
      {data.length ? data.map((category) => (
        <button className="top-category-row" key={category.id} onClick={() => onSelect?.(category.id)}>
          <span className="top-category-name"><Icon name={category.icon} size={16} style={{ color: getCategoryColor(category) }} />{category.name}</span>
          <span className="top-category-track"><i style={{ width: `${Math.max(4, category.amount / data[0].amount * 100)}%`, background: getCategoryColor(category) }} /></span>
          <strong data-finance-tone="expense">{formatCurrency(category.amount)}</strong>
          <small>{total ? Math.round(category.amount / total * 100) : 0}%</small>
        </button>
      )) : <div className="chart-empty">No category spending to show.</div>}
    </div>
  );
}
