import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SummaryCard from "../components/SummaryCard";
import Icon from "../components/Icon";
import { useAuth } from "../contexts/AuthContext";
import { getExpenses } from "../services/expense.service";
import { createExpenseSplit, deleteExpenseSplit, getExpenseSplits, setSplitSettled, type ExpenseSplit } from "../services/split-expense.service";
import { equalShares } from "../utils.ts/insights";
import { formatCurrency, formatDate } from "../utils.ts/finance";
import "./SplitExpensesPage.css";

export default function SplitExpensesPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [splits, setSplits] = useState(() => getExpenseSplits(userId));
  const [expenses] = useState(() => getExpenses(userId));
  const [expenseId, setExpenseId] = useState("");
  const [names, setNames] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState<ExpenseSplit | null>(null);
  const available = expenses.filter((expense) => !splits.some((split) => split.expenseId === expense.id)).sort((a, b) => b.date.localeCompare(a.date));
  const expense = available.find((item) => item.id === expenseId);
  const participants = names.split(",").map((name) => name.trim()).filter(Boolean);
  const canPreview = expense && participants.length > 0 && participants.length <= 20 && Math.round(expense.amount * 100) >= participants.length + 1;
  const preview = canPreview ? equalShares(expense.amount, participants.length + 1) : [];
  const outstanding = splits.reduce((sum, split) => sum + split.people.filter((person) => !person.settled).reduce((sum, person) => sum + person.share, 0), 0);
  const received = splits.reduce((sum, split) => sum + split.people.filter((person) => person.settled).reduce((sum, person) => sum + person.share, 0), 0);

  function act(action: () => void, message: string) {
    try { action(); setSplits(getExpenseSplits(userId)); setError(""); setNotice(message); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to update shared expenses."); }
  }
  return <>
    <PageHeader title="Shared expenses" subtitle="Split a payment you made equally, including your own share." />
    {error && <div className="inline-error" role="alert">{error}</div>}
    {notice && <div className="toast-message" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
    <section className="summary-grid summary-grid-three">
      <SummaryCard label="Owed to you" value={formatCurrency(outstanding)} detail="Unsettled shares, not available cash" icon="transactions" tone="orange" valueTone={outstanding > 0 ? "warning" : undefined} />
      <SummaryCard label="Marked repaid" value={formatCurrency(received)} detail="Manually confirmed, not income records" icon="check" tone="green" valueTone="positive" />
      <SummaryCard label="Shared payments" value={String(splits.length)} detail="Original expenses counted once" icon="expense" tone="blue" />
    </section>
    <div className="management-layout">
      <section className="content-card">
        <div className="card-heading"><div><h3>Your shared payments</h3><p>The full payment stays in expenses. Repayments only update this tracker; they never create income or change safe-to-spend.</p></div></div>
        {splits.length ? splits.map((split) => <article className="shared-payment" key={split.id}>
          <div className="shared-payment-heading"><div><Link className="text-link" to={`/app/expenses/${split.expenseId}`}>{split.description}</Link><p>{formatDate(split.date)} · Paid by you</p></div><button className="row-action delete-row-action" aria-label={`Remove split for ${split.description}`} onClick={() => setDeleting(split)}><Icon name="delete" size={16} /></button></div>
          <p>Total <strong>{formatCurrency(split.amount)}</strong> · Your share {formatCurrency(split.ownShare)}</p>
          <ul className="shared-participants">{split.people.map((person) => <li key={person.id}><span><strong>{person.name}</strong><small>{person.settled ? "Repaid" : "Owes you"} {formatCurrency(person.share)}</small></span><button className={`button ${person.settled ? "button-secondary" : "button-primary"}`} onClick={() => act(() => setSplitSettled(userId, split.id, person.id, !person.settled), person.settled ? "Repayment undone." : "Share marked repaid.")}>{person.settled ? "Undo repayment" : "Mark repaid"}</button></li>)}</ul>
        </article>) : <div className="empty-state"><Icon name="transactions" size={26} /><h3>No shared payments yet</h3><p>Select an existing expense to split without duplicating it.</p></div>}
      </section>
      <form className="content-card manage-form" onSubmit={(event) => {
        event.preventDefault();
        act(() => {
          const currentExpense = getExpenses(userId).find((item) => item.id === expenseId);
          if (!currentExpense) throw new Error("Choose an existing expense you paid.");
          createExpenseSplit(userId, currentExpense, names.split(","));
          setExpenseId(""); setNames("");
        }, "Equal split saved.");
      }}>
        <div className="card-heading"><div><h3>Split an expense</h3><p>Equal shares in INR. Extra paise go to you first, then participants in listed order.</p></div></div>
        <label className="field-label">Payment you made<select required value={expenseId} onChange={(event) => setExpenseId(event.target.value)}><option value="">Select expense</option>{available.map((item) => <option value={item.id} key={item.id}>{item.description} · {formatCurrency(item.amount)} · {formatDate(item.date)}</option>)}</select></label>
        {!available.length && <Link className="text-link" to="/app/expenses/new">Add an expense first</Link>}
        <label className="field-label">Other participants<input required value={names} onChange={(event) => setNames(event.target.value)} placeholder="Alex, Sam" /><small className="field-hint">Comma-separated unique names. You are included automatically. Up to 20 other people.</small></label>
        {preview.length > 0 && <div className="split-preview"><strong>Preview: {preview.length} people including you</strong><p>Me: {formatCurrency(preview[0])}</p>{participants.map((name, index) => <p key={index}>{name}: {formatCurrency(preview[index + 1])}</p>)}</div>}
        <button className="button button-primary">Create split</button>
      </form>
    </div>
    {deleting && <div className="dialog-backdrop"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-split-title"><h3 id="remove-split-title">Remove split tracking?</h3><p>Participant balances and repayment statuses for {deleting.description} will be removed. The original expense is kept. No real money is moved.</p><div className="dialog-actions"><button className="button button-secondary" onClick={() => setDeleting(null)}>Cancel</button><button className="button button-danger" onClick={() => act(() => { deleteExpenseSplit(userId, deleting.id); setDeleting(null); }, "Split removed. Original expense kept.")}>Remove split</button></div></section></div>}
  </>;
}
