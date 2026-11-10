import DatePicker from "../components/DatePicker";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SummaryCard from "../components/SummaryCard";
import { CategoryDonutChart, ExpenseTrendChart, FinanceTooltip, TopCategoriesChart } from "../components/FinanceCharts";
import { useAuth } from "../contexts/AuthContext";
import { getExpenses } from "../services/expense.service";
import type { Expense } from "../types/expense";
import { formatCompactCurrency, formatCurrency, formatDate, toDateKey } from "../utils.ts/finance";
import { getCategories, getIncomes } from "../services/finance-data.service";

function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const expenses = useMemo(() => getExpenses(user?.id ?? ""), [user?.id]);
  const incomes = useMemo(() => getIncomes(user?.id ?? ""), [user?.id]);
  const categories = useMemo(() => getCategories(user?.id ?? "", "expense"), [user?.id]);
  const [period, setPeriod] = useState("3months");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const today = new Date();
  const start = new Date(today);
  if (period === "7days") start.setDate(today.getDate() - 6);
  else if (period === "month") start.setDate(1);
  else if (period === "lastmonth") start.setMonth(today.getMonth() - 1, 1);
  else if (period === "3months") start.setMonth(today.getMonth() - 2, 1);
  else if (period === "6months") start.setMonth(today.getMonth() - 5, 1);
  else if (period === "year") start.setMonth(0, 1);
  const startDate = period === "custom" ? customFrom : toDateKey(start);
  const endDate = period === "lastmonth"
    ? toDateKey(new Date(today.getFullYear(), today.getMonth(), 0))
    : period === "custom" ? customTo : toDateKey(today);
  const periodExpenses = expenses.filter((expense) => (!startDate || expense.date >= startDate) && (!endDate || expense.date <= endDate));
  const periodIncomes = incomes.filter((income) => (!startDate || income.date >= startDate) && (!endDate || income.date <= endDate));
  const filtered = periodExpenses.filter((expense) =>
    (!selectedCategory || expense.categoryId === selectedCategory)
    && (!selectedMonth || expense.date.startsWith(selectedMonth))
    && (!selectedDay || expense.date === selectedDay));
  const total = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const largest: Expense | undefined = periodExpenses.reduce<Expense | undefined>((best, expense) => !best || expense.amount > best.amount ? expense : best, undefined);
  const dailyData = Array.from({ length: Math.max(1, Math.ceil((new Date(`${endDate || toDateKey(today)}T00:00:00`).getTime() - new Date(`${startDate || toDateKey(today)}T00:00:00`).getTime()) / 86400000) + 1) }, (_, index) => {
    const date = new Date(`${startDate || toDateKey(today)}T00:00:00`);
    date.setDate(date.getDate() + index);
    const key = toDateKey(date);
    return { date: key, label: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date), amount: periodExpenses.filter((expense) => expense.date === key).reduce((sum, expense) => sum + expense.amount, 0) };
  });
  const categoryLabel = categories.find((category) => category.id === selectedCategory)?.name;

  function clearFilters() {
    setSelectedCategory(""); setSelectedMonth(""); setSelectedDay("");
  }

  function selectTrendMonth(key: string) {
    setSelectedMonth(selectedMonth === key ? "" : key);
    setSelectedDay("");
  }

  return (
    <>
      <PageHeader title="Reports & Insights" subtitle="Understand where your money goes." action={<div className="header-actions"><select className="select-control period-select" aria-label="Select report date range" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="7days">Last 7 days</option><option value="month">This month</option><option value="lastmonth">Last month</option><option value="3months">Last 3 months</option><option value="6months">Last 6 months</option><option value="year">This year</option><option value="custom">Custom range</option></select></div>} />
      {period === "custom" && <div className="custom-date-range"><label>From <DatePicker type="date" value={customFrom} onChange={(value) => setCustomFrom(value)} /></label><label>To <DatePicker type="date" value={customTo} onChange={(value) => setCustomTo(value)} /></label></div>}
      <section className="summary-grid">
        <SummaryCard label="Total expenses" value={formatCurrency(total)} detail="For selected period" icon="↘" tone="red" valueTone="expense" />
        <SummaryCard label="Income" value={formatCurrency(periodIncomes.reduce((sum, income) => sum + income.amount, 0))} detail={`${periodIncomes.length} income transactions`} icon="↗" tone="green" valueTone="income" />
        <SummaryCard label="Average daily spend" value={formatCurrency(total / Math.max(1, dailyData.length))} detail="Daily average" icon="◷" tone="red" valueTone="expense" />
        <SummaryCard label="Largest expense" value={largest ? formatCurrency(largest.amount) : formatCurrency(0)} detail={largest?.description ?? "No expenses yet"} icon="↗" tone="red" valueTone="expense" />
        <SummaryCard label="Transactions" value={String(periodExpenses.length)} detail="In this period" icon="⇄" tone="purple" />
      </section>
      <section className="charts-grid reports-charts">
        <article className="content-card"><div className="card-heading"><div><h3>Monthly expense trend</h3><p>Choose a month to filter transactions</p></div></div><div className="trend-chart"><ExpenseTrendChart expenses={periodExpenses} onSelect={selectTrendMonth} /></div></article>
        <article className="content-card"><div className="card-heading"><div><h3>Category breakdown</h3><p>Click a category to filter report activity</p></div></div><CategoryDonutChart expenses={periodExpenses} categories={categories} onSelect={(id) => { setSelectedCategory(selectedCategory === id ? "" : id); setSelectedDay(""); }} /></article>
        <article className="content-card"><div className="card-heading"><div><h3>Top spending categories</h3><p>Highest spending categories</p></div></div><TopCategoriesChart expenses={periodExpenses} categories={categories} onSelect={(id) => setSelectedCategory(selectedCategory === id ? "" : id)} /></article>
        <article className="content-card"><div className="card-heading"><div><h3>Daily spending pattern</h3><p>Daily totals across the selected period</p></div></div><div className="daily-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyData} margin={{ top: 8, right: 8, left: 3, bottom: 0 }}><CartesianGrid stroke="#eef0f4" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} minTickGap={22} interval="preserveStartEnd" tick={{ fill: "#68768b", fontSize: 11 }} /><YAxis width={64} axisLine={false} tickLine={false} tickMargin={7} tickFormatter={(value: number) => formatCompactCurrency(value)} tick={{ fill: "#68768b", fontSize: 11 }} /><Tooltip content={FinanceTooltip} cursor={{ fill: "var(--primary-soft)", opacity: 0.65 }} /><Bar dataKey="amount" name="Expenses" fill="var(--primary)" radius={[4, 4, 0, 0]} onClick={(data) => { const item = data as unknown as { date?: string; payload?: { date?: string } }; const day = item.date ?? item.payload?.date; if (day) setSelectedDay(selectedDay === day ? "" : day); }} /></BarChart></ResponsiveContainer></div></article>
      </section>
      <section className="content-card recent-card">
        <div className="card-heading"><div><h3>Transactions</h3><p>{selectedDay ? formatDate(selectedDay) : selectedMonth || categoryLabel ? `Filtered by ${[selectedMonth, categoryLabel].filter(Boolean).join(" · ")}` : "Transactions contributing to this report"}</p></div>{(selectedCategory || selectedMonth || selectedDay) && <button className="reset-button" onClick={clearFilters}>Clear filters ×</button>}</div>
        {filtered.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th className="align-right">Amount</th></tr></thead><tbody>{[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map((expense) => <tr key={expense.id} className="clickable-row" onClick={() => navigate(`/app/expenses/${expense.id}`)}><td data-label="Date">{formatDate(expense.date)}</td><td data-label="Description" className="expense-description">{expense.description}</td><td data-label="Category">{expense.categoryName}</td><td data-label="Account">{expense.accountName}</td><td data-label="Amount" className="align-right amount-cell">{formatCurrency(expense.amount)}</td></tr>)}</tbody></table></div> : <div className="empty-state"><span>◷</span><h3>No matching transactions</h3><p>Try changing the date range or clearing chart filters.</p><button className="button button-secondary" onClick={clearFilters}>Clear filters</button></div>}
      </section>
      <section className="content-card recent-card income-report-card">
        <div className="card-heading"><div><h3>Income transactions</h3><p>Income recorded during this date range</p></div><button className="text-link" onClick={() => navigate("/app/income")}>Manage income <span>→</span></button></div>
        {periodIncomes.length ? <div className="table-scroll"><table className="data-table income-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th className="align-right">Amount</th></tr></thead><tbody>{[...periodIncomes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((income) => <tr key={income.id}><td data-label="Date">{formatDate(income.date)}</td><td data-label="Description" className="expense-description">{income.description}</td><td data-label="Category">{income.categoryName}</td><td data-label="Account">{income.accountName}</td><td data-label="Amount" className="align-right amount-cell income-amount">{formatCurrency(income.amount)}</td></tr>)}</tbody></table></div> : <div className="empty-state"><span>↗</span><h3>No income for this period</h3><p>Record income to see it included in your reports.</p><button className="button button-primary" onClick={() => navigate("/app/income")}>Add income</button></div>}
      </section>
    </>
  );
}

export default ReportsPage;
