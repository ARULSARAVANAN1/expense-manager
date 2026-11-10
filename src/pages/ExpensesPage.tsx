import DatePicker from "../components/DatePicker";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import LoadingButton from "../components/LoadingButton";
import SummaryCard from "../components/SummaryCard";
import ExpenseAnalysis from "../components/ExpenseAnalysis";
import { useAuth } from "../contexts/AuthContext";
import { deleteExpense, getExpenses } from "../services/expense.service";
import { getAccounts, getCategories } from "../services/finance-data.service";
import type { Expense, ExpenseAccount, ExpenseCategory } from "../types/expense";
import { formatCurrency, formatDate } from "../utils.ts/finance";
import { getCategoryStyle } from "../utils.ts/category-style";

const PAGE_SIZE = 8;

function ExpensesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = user?.id ?? "";
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [accounts, setAccounts] = useState<ExpenseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [account, setAccount] = useState("");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(typeof location.state?.message === "string" ? location.state.message : "");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([
      getExpenses(),
      getCategories("expense"),
      getAccounts(),
    ]).then(([nextExpenses, nextCategories, nextAccounts]) => {
      if (!active) return;
      setExpenses(nextExpenses);
      setCategories(nextCategories);
      setAccounts(nextAccounts);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load expenses.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const contextualExpenses = expenses.filter((expense) => {
    const query = search.trim().toLowerCase();
    return (!query || expense.description.toLowerCase().includes(query) || (expense.notes ?? "").toLowerCase().includes(query))
      && (!category || expense.categoryId === category)
      && (!account || expense.accountId === account);
  });
  const filtered = contextualExpenses.filter((expense) => (!from || expense.date >= from) && (!to || expense.date <= to)).sort((a, b) => {
    if (sort === "oldest") return a.date.localeCompare(b.date);
    if (sort === "highest") return b.amount - a.amount;
    if (sort === "lowest") return a.amount - b.amount;
    return b.date.localeCompare(a.date);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = filtered.reduce((sum, expense) => sum + expense.amount, 0);

  function resetFilters() {
    setSearch(""); setCategory(""); setAccount(""); setFrom(""); setTo(""); setSort("newest"); setPage(1);
  }

  async function confirmDelete() {
    if (!pendingDelete || !user || deleting) return;
    setDeleting(true);
    try {
      await deleteExpense(pendingDelete.id);
      setExpenses(await getExpenses());
      setPendingDelete(null);
      setToast("Expense deleted successfully.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete expense.");
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader title="Expenses" subtitle="Track and manage your spending." action={<div className="header-actions"><Link className="button button-secondary" to="/app/recurring"><Icon name="clock" />Recurring</Link><Link className="button button-primary" to="/app/expenses/new"><Icon name="plus" />Add expense</Link></div>} />
      {toast && <div className="toast-message" role="status">{toast}<button onClick={() => setToast("")} aria-label="Dismiss notification">×</button></div>}
      {error && <div className="inline-error" role="alert">{error}</div>}
      {loading && <p role="status">Loading expenses…</p>}
      <section className="summary-grid summary-grid-three">
        <SummaryCard label="Total expenses" value={formatCurrency(total)} detail="Across filtered transactions" icon="↘" tone="red" valueTone="expense" />
        <SummaryCard label="Transactions" value={String(filtered.length)} detail="Matching transactions" icon="⇄" tone="purple" />
        <SummaryCard label="Average expense" value={formatCurrency(filtered.length ? total / filtered.length : 0)} detail="Per transaction" icon="◷" tone="red" valueTone="expense" />
      </section>
      <ExpenseAnalysis expenses={contextualExpenses} onSelect={(start, end) => { setFrom(start); setTo(end); setPage(1); }} />
      <section className="content-card expenses-list-card">
        <div className="filter-toolbar">
          <label className="search-field"><Icon name="search" /><input aria-label="Search expenses" placeholder="Search expenses..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
          <select className="select-control" aria-label="Filter by category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select className="select-control" aria-label="Filter by account" value={account} onChange={(event) => { setAccount(event.target.value); setPage(1); }}><option value="">All accounts</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <div className="date-range-filters">
            <label className="date-range-field"><span>From</span><DatePicker aria-label="Start date" type="date" value={from} onChange={(value) => { setFrom(value); setPage(1); }} /></label>
            <label className="date-range-field"><span>To</span><DatePicker aria-label="End date" type="date" value={to} onChange={(value) => { setTo(value); setPage(1); }} /></label>
          </div>
          <select className="select-control sort-select" aria-label="Sort expenses" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select>
          <button className="reset-button" type="button" onClick={resetFilters}><Icon name="reset" size={14} />Reset</button>
        </div>
        {visible.length ? <>
          <div className="table-scroll"><table className="data-table expenses-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th className="align-right">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {visible.map((expense) => {
              const info = categories.find((item) => item.id === expense.categoryId);
              return <tr key={expense.id} className="clickable-row" onClick={() => navigate(`/app/expenses/${expense.id}`)}>
                <td data-label="Date">{formatDate(expense.date)}</td><td data-label="Description"><span className="table-description">{expense.description}</span>{expense.notes && <small className="table-note">{expense.notes}</small>}</td>
                <td data-label="Category"><span className="category-chip"><span className="category-chip-icon" style={getCategoryStyle(info)}><Icon name={info?.icon ?? "categories"} size={16} /></span>{expense.categoryName}</span></td>
                <td data-label="Account">{expense.accountName ?? "No account"}</td><td data-label="Amount" className="align-right amount-cell">{formatCurrency(expense.amount)}</td>
                <td><div className="row-actions"><button className="row-action" type="button" title="Edit expense" onClick={(event) => { event.stopPropagation(); navigate(`/app/expenses/${expense.id}/edit`); }} aria-label={`Edit ${expense.description}`}><Icon name="edit" size={15} /></button><button className="row-action delete-row-action" type="button" title="Delete expense" onClick={(event) => { event.stopPropagation(); setPendingDelete(expense); }} aria-label={`Delete ${expense.description}`}><Icon name="delete" size={15} /></button></div></td>
              </tr>;
            })}
          </tbody></table></div>
          <div className="table-footer"><span>Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} expenses</span><div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button><span>{page} / {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage(page + 1)}>→</button></div></div>
        </> : <div className="empty-state"><span>⌕</span><h3>No expenses found</h3><p>Try adjusting your filters or add a new expense.</p><button className="button button-secondary" onClick={resetFilters}>Reset filters</button></div>}
      </section>
      {pendingDelete && <div className="dialog-backdrop" role="presentation" onClick={() => { if (!deleting) setPendingDelete(null); }}><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title" onClick={(event) => event.stopPropagation()}><div className="dialog-icon">!</div><h3 id="delete-title">Delete this expense?</h3><p>Are you sure you want to delete “{pendingDelete.description}”? This action cannot be undone.</p><div className="dialog-actions"><button className="button button-secondary" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</button><LoadingButton className="button button-danger" loading={deleting} loadingText="Deleting..." onClick={confirmDelete}>Delete expense</LoadingButton></div></section></div>}
    </>
  );
}

export default ExpensesPage;
