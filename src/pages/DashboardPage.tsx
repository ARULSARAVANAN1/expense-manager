import DatePicker from "../components/DatePicker";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import SummaryCard from "../components/SummaryCard";
import { CategoryDonutChart, DailyExpenseChart } from "../components/FinanceCharts";
import { useAuth } from "../contexts/AuthContext";
import { getExpenses } from "../services/expense.service";
import { getCategories, getIncomes } from "../services/finance-data.service";
import { formatCurrency, formatDate, toDateKey } from "../utils.ts/finance";
import "./DashboardPage.css";

function DashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => toDateKey(new Date()).slice(0, 7));
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const expenses = useMemo(() => getExpenses(user?.id ?? ""), [user?.id]);
  const incomes = useMemo(() => getIncomes(user?.id ?? ""), [user?.id]);
  const categories = useMemo(() => getCategories(user?.id ?? "", "expense"), [user?.id]);
  const [year, monthNumber] = month.split("-").map(Number);
  const monthStart = new Date(year, monthNumber - 1, 1);
  const monthEnd = new Date(year, monthNumber, 0);
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(monthStart);
  const previousMonth = toDateKey(new Date(year, monthNumber - 2, 1)).slice(0, 7);
  const monthlyExpenses = expenses.filter((expense) => expense.date.startsWith(month));
  const total = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const incomeTotal = incomes.filter((income) => income.date.startsWith(month)).reduce((sum, income) => sum + income.amount, 0);
  const previousTotal = expenses.filter((expense) => expense.date.startsWith(previousMonth)).reduce((sum, expense) => sum + expense.amount, 0);
  const changeDetail = previousTotal
    ? `${((total - previousTotal) / previousTotal * 100).toFixed(1)}% vs last month`
    : "No spending last month";
  const today = new Date();
  const days = month === toDateKey(today).slice(0, 7) ? today.getDate() : monthEnd.getDate();
  const categoryTotals = categories.map((category) => ({
    ...category,
    total: monthlyExpenses.filter((expense) => expense.categoryId === category.id).reduce((sum, expense) => sum + expense.amount, 0),
  })).sort((a, b) => b.total - a.total);
  const topCategory = categoryTotals.find((category) => category.total > 0);
  const matching = monthlyExpenses.filter((expense) =>
    (!categoryId || expense.categoryId === categoryId)
    && (!search.trim() || `${expense.description} ${expense.notes ?? ""} ${expense.accountName}`.toLowerCase().includes(search.trim().toLowerCase())),
  ).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const visible = showAll ? matching : matching.slice(0, 5);
  const dateQuery = `from=${toDateKey(monthStart)}&to=${toDateKey(monthEnd)}`;

  function selectMonth(value: string) {
    if (!/^\d{4}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1000 || Number(value.slice(5)) < 1 || Number(value.slice(5)) > 12) return;
    setMonth(value);
    setCategoryId("");
    setExpandedId(null);
    setShowAll(false);
  }

  function moveMonth(offset: number) {
    selectMonth(toDateKey(new Date(year, monthNumber - 1 + offset, 1)).slice(0, 7));
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

      <section className="summary-grid dashboard-summary" aria-label={`${monthLabel} summary`}>
        <SummaryCard label="Monthly spending" value={formatCurrency(total)} detail={changeDetail} icon="expense" tone="red" valueTone="expense" detailTone={previousTotal && total !== previousTotal ? total > previousTotal ? "negative" : "positive" : undefined} />
        <SummaryCard label="Income" value={formatCurrency(incomeTotal)} detail="Received this month" icon="income" tone="green" valueTone="income" />
        <SummaryCard label="Transactions" value={String(monthlyExpenses.length)} detail="Expenses this month" icon="transactions" tone="purple" />
        <SummaryCard label="Daily average" value={formatCurrency(total / days)} detail={`${days} days in period`} icon="clock" tone="red" valueTone="expense" />
        <SummaryCard label="Top category" value={topCategory?.name ?? "No spending"} detail={topCategory ? `${formatCurrency(topCategory.total)} this month` : "Add your first expense"} icon="categories" tone="orange" detailTone={topCategory ? "expense" : undefined} />
      </section>

      <section className="content-card dashboard-activity" aria-labelledby="dashboard-activity-title">
        <div className="card-heading">
          <div><h3 id="dashboard-activity-title">Recent transactions <span className="activity-count">{monthlyExpenses.length}</span></h3><p>Explore your expenses for {monthLabel}. Select a transaction for a quick preview.</p></div>
          <Link className="text-link" to={`/app/expenses?${dateQuery}`}>View all <Icon name="next" size={15} /></Link>
        </div>
        <div className="activity-toolbar">
          <label className="search-field"><Icon name="search" size={17} /><input aria-label="Search recent transactions" placeholder="Search merchant, notes or account…" value={search} onChange={(event) => { setSearch(event.target.value); setShowAll(false); }} /></label>
          <select className="select-control" aria-label="Recent transaction category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setShowAll(false); }}>
            <option value="">All categories</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
          {(search || categoryId) && <button className="reset-button" onClick={() => { setSearch(""); setCategoryId(""); }}><Icon name="reset" size={14} />Clear</button>}
        </div>
        <div className="activity-list">
          {visible.map((expense) => {
            const category = categories.find((item) => item.id === expense.categoryId);
            const expanded = expense.id === expandedId;
            return (
              <article className={`activity-item${expanded ? " is-expanded" : ""}`} key={expense.id}>
                <button className="activity-trigger" type="button" aria-expanded={expanded} aria-controls={`preview-${expense.id}`} onClick={() => setExpandedId(expanded ? null : expense.id)}>
                  <span className="activity-category-icon" style={{ color: category?.color, backgroundColor: `${category?.color ?? "#64748b"}1c` }}><Icon name={category?.icon ?? "categories"} size={21} /></span>
                  <span className="activity-description"><strong>{expense.description}</strong><span>{expense.categoryName} <span aria-hidden="true">·</span> {expense.accountName}</span></span>
                  <span className="activity-date">{formatDate(expense.date)}</span>
                  <span className="activity-amount" data-finance-tone="expense">{formatCurrency(expense.amount)}<small data-finance-tone="expense">Expense</small></span>
                  <span className="activity-chevron"><Icon name="next" size={16} /></span>
                </button>
                {expanded && <div className="activity-preview" id={`preview-${expense.id}`}>
                  <dl><div><dt>Transaction date</dt><dd>{formatDate(expense.date)}</dd></div><div><dt>Payment method</dt><dd>{expense.accountName}</dd></div><div><dt>Notes</dt><dd>{expense.notes || "No notes added."}</dd></div></dl>
                  <div className="activity-preview-actions"><Link className="button button-secondary" to={`/app/expenses/${expense.id}`}>View details<Icon name="next" size={14} /></Link><Link className="button button-secondary" to={`/app/expenses/${expense.id}/edit`}><Icon name="edit" size={14} />Edit expense</Link></div>
                </div>}
              </article>
            );
          })}
          {!visible.length && <div className="empty-state"><span><Icon name="search" size={22} /></span><h3>{monthlyExpenses.length ? "No matching transactions" : "No expenses this month"}</h3><p>{monthlyExpenses.length ? "Try another search or category." : `Start tracking your spending for ${monthLabel}.`}</p>{!monthlyExpenses.length && <Link className="button button-primary" to="/app/expenses/new"><Icon name="plus" size={16} />Add expense</Link>}</div>}
        </div>
        {matching.length > 5 && <button className="activity-show-more" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer transactions" : `Show all ${matching.length} matching transactions`}<Icon name={showAll ? "back" : "next"} size={15} /></button>}
      </section>

      <section className="dashboard-month-charts" aria-label={`${monthLabel} spending charts`}>
        <article className="content-card">
          <div className="card-heading"><div><h3>Daily spending</h3><p>Day-by-day activity in {monthLabel}. Select a point to view expenses.</p></div><span className="chart-heading-icon blue"><Icon name="reports" /></span></div>
          <div className="dashboard-daily-chart"><DailyExpenseChart expenses={monthlyExpenses} month={month} /></div>
          <Link className="text-link dashboard-chart-link" to="/app/reports">Explore reports<Icon name="next" size={15} /></Link>
        </article>
        <article className="content-card">
          <div className="card-heading"><div><h3>Spending by category</h3><p>Where your money went in {monthLabel}</p></div><span className="chart-heading-icon purple"><Icon name="budget" /></span></div>
          <CategoryDonutChart expenses={monthlyExpenses} categories={categories} onSelect={(id) => { setCategoryId(id); setShowAll(false); document.getElementById("dashboard-activity-title")?.scrollIntoView({ block: "start" }); }} />
        </article>
      </section>
    </div>
  );
}

export default DashboardPage;
