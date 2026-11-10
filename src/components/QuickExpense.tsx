import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseExpense } from "../services/expense.service";
import Icon from "./Icon";

export default function QuickExpense() {
  const [command, setCommand] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  return <section className="content-card quick-expense">
    <form onSubmit={async (event) => {
      event.preventDefault();
      setSaving(true);
      setError("");
      try {
        const result = await parseExpense(command);
        if (result.needsClarification.length) {
          setError(result.needsClarification.map((item) => item.message).join(" "));
          return;
        }
        navigate(`/app/expenses/new?${new URLSearchParams({
          amount: String(result.draft.amount),
          description: result.draft.description,
          categoryId: result.draft.categoryId,
          accountId: result.draft.accountId,
          date: result.draft.date,
          notes: result.draft.notes ?? "",
        }).toString()}`);
      } catch (parseError) {
        setError(parseError instanceof Error ? parseError.message : "Unable to parse this expense.");
      } finally {
        setSaving(false);
      }
    }}>
      <label className="field-label" htmlFor="quick-expense">Quick expense <span className="field-hint">Type it. Review it. Save it.</span></label>
      <div className="quick-expense-controls"><input id="quick-expense" value={command} onChange={(event) => { setCommand(event.target.value); setError(""); }} placeholder="Lunch 250 yesterday" aria-describedby="quick-expense-help" required /><button className="button button-primary" disabled={saving}><Icon name="next" size={16} />{saving ? "Parsing…" : "Review expense"}</button></div>
      <p className="field-hint" id="quick-expense-help">Describe one expense in INR. The server prepares a draft for review; nothing saves automatically.</p>
      {error && <div className="inline-error" role="alert">{error}</div>}
    </form>
  </section>;
}
