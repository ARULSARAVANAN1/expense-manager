import { useState } from "react";
import Icon from "../components/Icon";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { deleteExpense, getExpenses } from "../services/expense.service";
import { getCategories } from "../services/finance-data.service";
import { formatCurrency, formatDate } from "../utils.ts/finance";

function ExpenseDetailsPage() {
  const { expenseId = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const expense = getExpenses(user?.id ?? "").find((item) => item.id === expenseId);
  const categories = getCategories(user?.id ?? "", "expense");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  if (!expense) return <div className="not-found"><h2>Expense not found</h2><p>This transaction may have been removed.</p><Link className="button button-primary" to="/app/expenses">Back to expenses</Link></div>;
  const selectedExpense = expense;
  const category = categories.find((item) => item.id === selectedExpense.categoryId);

  function handleDelete() {
    if (!user) return;
    try {
      deleteExpense(user.id, selectedExpense.id);
      navigate("/app/expenses", { replace: true, state: { message: "Expense deleted successfully." } });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete expense.");
      setConfirming(false);
    }
  }

  return (
    <>
      <Link to="/app/expenses" className="back-link"><Icon name="back" size={16} />Back to expenses</Link>
      {typeof location.state?.message === "string" && <div className="toast-message" role="status">{location.state.message}</div>}
      {error && <div className="inline-error" role="alert">{error}</div>}
      <section className="detail-hero content-card">
        <div className="detail-category-icon" style={{ color: category?.color, backgroundColor: `${category?.color ?? "#64748b"}1c` }}><Icon name={category?.icon ?? "categories"} size={25} /></div>
        <div className="detail-title"><span>{selectedExpense.categoryName}</span><h2>{selectedExpense.description}</h2><p>{formatDate(selectedExpense.date)} · {selectedExpense.accountName}</p></div>
        <strong className="detail-amount" data-finance-tone="expense">{formatCurrency(selectedExpense.amount)}</strong>
        <div className="detail-actions"><Link className="button button-secondary" to={`/app/expenses/${selectedExpense.id}/edit`}><Icon name="edit" size={16} />Edit</Link><button className="button button-danger-outline" onClick={() => setConfirming(true)}><Icon name="delete" size={16} />Delete</button></div>
      </section>
      <section className="content-card detail-card">
        <div className="card-heading"><div><h3>Transaction details</h3><p>Information about this expense</p></div></div>
        <dl className="detail-grid">
          <div><dt>Description</dt><dd>{selectedExpense.description}</dd></div><div><dt>Amount</dt><dd data-finance-tone="expense">{formatCurrency(selectedExpense.amount)}</dd></div>
          <div><dt>Category</dt><dd>{selectedExpense.categoryName}</dd></div><div><dt>Account / payment method</dt><dd>{selectedExpense.accountName}</dd></div>
          <div><dt>Transaction date</dt><dd>{formatDate(selectedExpense.date)}</dd></div><div><dt>Created</dt><dd>{formatDate(selectedExpense.createdAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDate(selectedExpense.updatedAt)}</dd></div><div><dt>Notes</dt><dd>{selectedExpense.notes || "—"}</dd></div>
        </dl>
      </section>
      {confirming && <div className="dialog-backdrop"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-detail-title"><div className="dialog-icon">!</div><h3 id="delete-detail-title">Delete this expense?</h3><p>Are you sure you want to delete this expense? This action cannot be undone.</p><div className="dialog-actions"><button className="button button-secondary" onClick={() => setConfirming(false)}>Cancel</button><button className="button button-danger" onClick={handleDelete}>Delete expense</button></div></section></div>}
    </>
  );
}

export default ExpenseDetailsPage;
