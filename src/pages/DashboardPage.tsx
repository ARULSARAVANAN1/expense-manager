import DatePicker from "../components/DatePicker";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import SummaryCard from "../components/SummaryCard";
import QuickExpense from "../components/QuickExpense";
import MonthlyInsights from "../components/MonthlyInsights";
import MonthlyAiSummary from "../components/MonthlyAiSummary";
import { CategoryDonutChart, DailyExpenseChart } from "../components/FinanceCharts";
import { useAuth } from "../contexts/AuthContext";
import { getExpenses } from "../services/expense.service";
import { getBudgets, getCategories, getIncomes } from "../services/finance-data.service";
import { formatCurrency, formatDate, toDateKey } from "../utils.ts/finance";
import type { Budget, Expense, ExpenseCategory, Income } from "../types/expense";
import "./DashboardPage.css";
import { getCategoryStyle } from "../utils.ts/category-style";

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? "";
  const [month, setMonth] = useState(() => toDateKey(new Date()).slice(0, 7));
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getExpenses(),
      getIncomes(),
      getCategories("expense"),
      getBudgets(),
    ]).then(([nextExpenses, nextIncomes, nextCategories, nextBudgets]) => {
      if (!active) return;
      setExpenses(nextExpenses);
      setIncomes(nextIncomes);
      setCategories(nextCategories);
      setBudgets(nextBudgets);
      setLoadError("");
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Unable to load dashboard data.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [userId, reload]);
  const [year, monthNumber] = month.split("-").map(Number);
  const monthStart = new Date(year, monthNumber - 1, 1);
  const monthEnd = new Date(year, monthNumber, 0);
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(monthStart);
  const previousMonth = toDateKey(new Date(year, monthNumber - 2, 1)).slice(0, 7);
  const previousMonthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, monthNumber - 2, 1));
  const today = new Date();
  const firstName = user?.name.trim().split(/\s+/)[0];
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";
  const isCurrentMonth = month === toDateKey(today).slice(0, 7);
  const days = isCurrentMonth ? today.getDate() : monthEnd.getDate();
  const comparisonDays = isCurrentMonth ? Math.min(days, new Date(year, monthNumber - 1, 0).getDate()) : new Date(year, monthNumber - 1, 0).getDate();
  const monthlyExpenses = expenses.filter((expense) => expense.date.startsWith(month));
  const total = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const incomeTotal = incomes.filter((income) => income.date.startsWith(month)).reduce((sum, income) => sum + income.amount, 0);
  const previousTotal = expenses.filter((expense) => expense.date.startsWith(previousMonth) && Number(expense.date.slice(8, 10)) <= comparisonDays).reduce((sum, expense) => sum + expense.amount, 0);
  const spendingChange = previousTotal ? (total - previousTotal) / previousTotal * 100 : null;
  const comparisonLabel = isCurrentMonth ? `the first ${comparisonDays} days of ${previousMonthLabel}` : previousMonthLabel;
  const changeDetail = spendingChange !== null
    ? spendingChange === 0
      ? `Same as ${isCurrentMonth ? "the same point last month" : "last month"}`
      : `${Math.abs(spendingChange).toFixed(1)}% ${spendingChange > 0 ? "above" : "below"} ${isCurrentMonth ? "same point last month" : "last month"}`
    : "No comparable spending last month";
  const categoryTotals = categories.map((category) => ({
    ...category,
    total: monthlyExpenses.filter((expense) => expense.categoryId === category.id).reduce((sum, expense) => sum + expense.amount, 0),
  })).sort((a, b) => b.total - a.total);
  const topCategory = categoryTotals.find((category) => category.total > 0);
  const spendingInsight = spendingChange === null
    ? topCategory
      ? `${topCategory.name} is your top category at ${formatCurrency(topCategory.total)}. There is no comparable spending recorded for ${previousMonthLabel}.`
      : "Add an expense to start your monthly spending snapshot."
    : spendingChange === 0
      ? `Your spending matches ${comparisonLabel}.`
      : `You have spent ${Math.abs(spendingChange).toFixed(1)}% ${spendingChange < 0 ? "less" : "more"} than ${comparisonLabel}.`;
  const matching = monthlyExpenses.filter((expense) =>
    (!categoryId || expense.categoryId === categoryId)
    && (!selectedDate || expense.date === selectedDate)
    && (!search.trim() || `${expense.description} ${expense.notes ?? ""} ${expense.accountName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase())),
  ).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const visible = showAll ? matching : matching.slice(0, 5);
  const dateQuery = `from=${toDateKey(monthStart)}&to=${toDateKey(monthEnd)}`;

  function selectMonth(value: string) {
    if (!/^\d{4}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1000 || Number(value.slice(5)) < 1 || Number(value.slice(5)) > 12) return;
    setMonth(value);
    setCategoryId("");
    setSelectedDate("");
    setExpandedId(null);
    setShowAll(false);
  }

  function moveMonth(offset: number) {
    selectMonth(toDateKey(new Date(year, monthNumber - 1 + offset, 1)).slice(0, 7));
  }

  function selectCategory(id: string) {
    const params = new URLSearchParams({ category: id, from: toDateKey(monthStart), to: toDateKey(monthEnd) });
    navigate(`/app/expenses?${params.toString()}#expense-list`);
  }

  function selectDate(date: string) {
    setCategoryId("");
    setSelectedDate(date);
    setExpandedId(null);
    setShowAll(false);
    document.getElementById("dashboard-activity-title")?.scrollIntoView({ block: "start" });
  }

  return (
    <div className="monthly-dashboard">
      <PageHeader title="Dashboard" subtitle={`Your money at a glance · ${monthLabel}`} action={
        <div className="header-actions">
          <div className="dashboard-month-picker">
            <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}><Icon name="back" size={16} /></button>
            <DatePicker required type="month" min="1000-01" max="9999-12" aria-label="Dashboard month" value={month} onChange={(value) => selectMonth(value)} />
            <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}><Icon name="next" size={16} /></button>
          </div>
          <Link className="button button-primary" to="/app/expenses/new"><Icon name="plus" />Add expense</Link>
        </div>
      } />

      <aside className="dashboard-insight" aria-label={`${monthLabel} spending insight`}>
        <span className="dashboard-insight-icon"><Icon name="sparkle" size={19} /></span>
        <div className="dashboard-insight-copy">
          <strong>{loading ? "Your spending snapshot" : `${greeting}${firstName ? `, ${firstName}` : ""}`}</strong>
          <span>{loading ? "Updating your monthly overview…" : loadError ? "Your monthly spending snapshot could not be updated." : spendingInsight}</span>
        </div>
        <a className="text-link" href="#dashboard-activity-title">Explore activity<Icon name="next" size={15} /></a>
      </aside>

      <section className="summary-grid dashboard-summary" aria-label={`${monthLabel} summary`} aria-busy={loading}>
        <SummaryCard loading={loading} unavailable={!!loadError} surfaceTone="income" label="Income" value={formatCurrency(incomeTotal)} detail="Received this month" icon="income" tone="green" valueTone="income" />
        <SummaryCard loading={loading} unavailable={!!loadError} surfaceTone="expense" label="Monthly spending" value={formatCurrency(total)} detail={changeDetail} icon="expense" tone="red" valueTone="expense" detailTone={previousTotal && total !== previousTotal ? total > previousTotal ? "negative" : "positive" : undefined} />
        <SummaryCard loading={loading} unavailable={!!loadError} surfaceTone={incomeTotal >= total ? "income" : "expense"} label="Balance" value={formatCurrency(incomeTotal - total)} detail="Monthly income minus expenses" icon="wallet" tone={incomeTotal >= total ? "green" : "red"} valueTone={incomeTotal === total ? undefined : incomeTotal > total ? "positive" : "negative"} />
        <SummaryCard loading={loading} unavailable={!!loadError} surfaceTone="purple" label="Transactions" value={String(monthlyExpenses.length)} detail="Expenses this month" icon="transactions" tone="purple" />
        <SummaryCard loading={loading} unavailable={!!loadError} surfaceTone="expense" label="Daily average" value={formatCurrency(total / days)} detail={`${days} days in period`} icon="clock" tone="red" valueTone="expense" />
        <SummaryCard loading={loading} unavailable={!!loadError} surfaceTone="warning" label="Top category" value={topCategory?.name ?? "No spending"} detail={topCategory ? `${formatCurrency(topCategory.total)} this month` : "Add your first expense"} icon="categories" tone="orange" detailTone={topCategory ? "expense" : undefined} />
      </section>

      <MonthlyAiSummary key={`${userId}-${month}`} month={month} />
      <QuickExpense />
      {loadError && <div className="inline-error" role="alert">{loadError}<button className="button button-secondary" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Retry</button></div>}
      {loading && <p role="status">Loading your finance data…</p>}
      <section className="content-card dashboard-activity" aria-labelledby="dashboard-activity-title">
        <div className="card-heading">
          <div><h3 id="dashboard-activity-title">Recent transactions <span className="activity-count">{matching.length}</span></h3><p>{selectedDate ? `Showing expenses for ${formatDate(selectedDate)}` : `Explore your expenses for ${monthLabel}. Select a transaction for a quick preview.`}{categoryId ? ` · ${categories.find((category) => category.id === categoryId)?.name ?? "Selected category"}` : ""}</p></div>
          <Link className="text-link" to={`/app/expenses?${dateQuery}`}>View all <Icon name="next" size={15} /></Link>
        </div>
        <div className="activity-toolbar">
          <label className="search-field"><Icon name="search" size={17} /><input aria-label="Search recent transactions" placeholder="Search merchant, notes or account…" value={search} onChange={(event) => { setSearch(event.target.value); setShowAll(false); }} /></label>
          <select className="select-control" aria-label="Recent transaction category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setShowAll(false); }}>
            <option value="">All categories</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
          {(search || categoryId || selectedDate) && <button className="reset-button" onClick={() => { setSearch(""); setCategoryId(""); setSelectedDate(""); setShowAll(false); }}><Icon name="reset" size={14} />Clear</button>}
        </div>
        <div className="activity-list">
          {visible.map((expense) => {
            const category = categories.find((item) => item.id === expense.categoryId);
            const expanded = expense.id === expandedId;
            return (
              <article className={`activity-item${expanded ? " is-expanded" : ""}`} key={expense.id}>
                <button className="activity-trigger" type="button" aria-expanded={expanded} aria-controls={`preview-${expense.id}`} onClick={() => setExpandedId(expanded ? null : expense.id)}>
                  <span className="activity-category-icon" style={getCategoryStyle(category)}><Icon name={category?.icon ?? "categories"} size={21} /></span>
                  <span className="activity-description"><strong>{expense.description}</strong><span>{expense.categoryName} <span aria-hidden="true">·</span> {expense.accountName ?? "No account"}</span></span>
                  <span className="activity-date">{formatDate(expense.date)}</span>
                  <span className="activity-amount" data-finance-tone="expense">{formatCurrency(expense.amount)}<small data-finance-tone="expense">Expense</small></span>
                  <span className="activity-chevron"><Icon name="next" size={16} /></span>
                </button>
                {expanded && <div className="activity-preview" id={`preview-${expense.id}`}>
                  <dl><div><dt>Transaction date</dt><dd>{formatDate(expense.date)}</dd></div><div><dt>Payment method</dt><dd>{expense.accountName ?? "No account"}</dd></div><div><dt>Notes</dt><dd>{expense.notes || "No notes added."}</dd></div></dl>
                  <div className="activity-preview-actions"><Link className="button button-secondary" to={`/app/expenses/${expense.id}`}>View details<Icon name="next" size={14} /></Link><Link className="button button-secondary" to={`/app/expenses/${expense.id}/edit`}><Icon name="edit" size={14} />Edit expense</Link></div>
                </div>}
              </article>
            );
          })}
          {!visible.length && <div className="empty-state"><span><Icon name="search" size={22} /></span><h3>{monthlyExpenses.length ? "No matching transactions" : "No expenses this month"}</h3><p>{monthlyExpenses.length ? "Try another search, date, or category." : `Start tracking your spending for ${monthLabel}.`}</p>{!monthlyExpenses.length && <Link className="button button-primary" to="/app/expenses/new"><Icon name="plus" size={16} />Add expense</Link>}</div>}
        </div>
        {matching.length > 5 && <button className="activity-show-more" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer transactions" : `Show all ${matching.length} matching transactions`}<Icon name={showAll ? "back" : "next"} size={15} /></button>}
      </section>

      <MonthlyInsights key={month} month={month} expenses={expenses} incomes={incomes} categories={categories} budgets={budgets}>
        <section className="dashboard-month-charts" aria-label={`${monthLabel} spending charts`}>
          <article className="content-card">
            <div className="card-heading"><div><h3>Daily spending</h3><p>Day-by-day activity in {monthLabel}. Select a point to view expenses.</p></div><span className="chart-heading-icon blue"><Icon name="reports" /></span></div>
            <div className="dashboard-daily-chart"><DailyExpenseChart expenses={monthlyExpenses} month={month} onSelect={selectDate} /></div>
            <Link className="text-link dashboard-chart-link" to="/app/reports">Explore reports<Icon name="next" size={15} /></Link>
          </article>
          <article className="content-card">
            <div className="card-heading"><div><h3>Spending by category</h3><p>Where your money went in {monthLabel}</p></div><span className="chart-heading-icon purple"><Icon name="budget" /></span></div>
            <CategoryDonutChart expenses={monthlyExpenses} categories={categories} onSelect={selectCategory} />
          </article>
        </section>
      </MonthlyInsights>
    </div>
  );
}

export default DashboardPage;
