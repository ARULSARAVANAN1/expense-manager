import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Expense } from "../types/expense";
import { formatCompactCurrency, formatCurrency, toDateKey } from "../utils.ts/finance";
import { DailyExpenseChart, FinanceTooltip } from "./FinanceCharts";
import DatePicker from "./DatePicker";

export default function ExpenseAnalysis({ expenses, onSelect }: { expenses: Expense[]; onSelect: (from: string, to: string) => void }) {
  const [mode, setMode] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(toDateKey(new Date()).slice(0, 7));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const period = mode === "month" ? month : year;
  const selected = expenses.filter((expense) => expense.date.startsWith(period));
  const total = selected.reduce((sum, expense) => sum + expense.amount, 0);
  const months = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    const date = new Date(Number(year), index, 1);
    return {
      key, name: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
      fullName: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(date),
      amount: selected.filter((expense) => expense.date.startsWith(key)).reduce((sum, expense) => sum + expense.amount, 0),
    };
  });
  return <section className="content-card expense-analysis">
    <div className="card-heading"><div><h3>Expense analysis</h3><p>Explore all expenses by day or month, independently of the expense list filters.</p></div></div>
    <div className="analysis-toolbar">
      <div className="analysis-modes" role="group" aria-label="Expense analysis period">
        <button type="button" aria-pressed={mode === "month"} onClick={() => setMode("month")}>Monthly</button>
        <button type="button" aria-pressed={mode === "year"} onClick={() => setMode("year")}>Yearly</button>
      </div>
      {mode === "month" ? <DatePicker required type="month" aria-label="Analysis month" value={month} onChange={(value) => { if (value) setMonth(value); }} /> : <DatePicker required type="year" aria-label="Analysis year" value={year} onChange={(value) => { if (value) setYear(value); }} />}
      <strong data-finance-tone="expense">{formatCurrency(total)} <small>in {period}</small></strong>
    </div>
    {selected.length ? <div className="expense-analysis-chart">
      {mode === "month" ? <DailyExpenseChart expenses={selected} month={month} onSelect={(date) => onSelect(date, date)} /> :
        <ResponsiveContainer width="100%" height="100%"><BarChart data={months} margin={{ top: 16, right: 12, left: 3, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 4" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--chart-axis)" }} />
          <YAxis width={64} axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} tick={{ fontSize: 12, fill: "var(--chart-axis)" }} />
          <Tooltip content={FinanceTooltip} cursor={{ fill: "var(--danger-soft)" }} />
          <Bar dataKey="amount" name="Expenses" fill="var(--danger)" radius={[6, 6, 0, 0]} maxBarSize={38} cursor="pointer" onClick={(_, index) => {
            const item = months[index];
            if (item) onSelect(`${item.key}-01`, toDateKey(new Date(Number(year), index + 1, 0)));
          }} />
        </BarChart></ResponsiveContainer>}
    </div> : <div className="empty-state"><h3>No expenses in {period}</h3><p>Select another period to explore your expenses.</p></div>}
    <p className="field-hint">Select a day or monthly bar to filter the expense list below.</p>
  </section>;
}
