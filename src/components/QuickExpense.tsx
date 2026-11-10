import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseExpense } from "../services/expense.service";
import Icon from "./Icon";

const examples = [
  { label: "Coffee", command: "Coffee 120" },
  { label: "Groceries", command: "Groceries 500" },
  { label: "Taxi", command: "Taxi 250" },
];

export default function QuickExpense() {
  const [command, setCommand] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  function setFromSuggestion(value: string) {
    setCommand(value);
    setError("");
    document.getElementById("quick-expense")?.focus();
  }

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
      <div className="quick-expense-suggestions" role="group" aria-label="Expense examples">
        <span>Try an example</span>
        {examples.map((example) => <button type="button" className="quick-expense-suggestion" key={example.label} onClick={() => setFromSuggestion(example.command)}>
          <Icon name="plus" size={12} />{example.label}
        </button>)}
      </div>
      <div className="quick-expense-controls"><input id="quick-expense" value={command} onChange={(event) => { setCommand(event.target.value); setError(""); }} placeholder="e.g. Lunch 250 yesterday" aria-describedby="quick-expense-help" required /><button className="button button-primary" disabled={saving || !command.trim()}><Icon name="next" size={16} />{saving ? "Parsing…" : "Review expense"}</button></div>
      <p className="field-hint" id="quick-expense-help">Describe one expense in INR. The server prepares a draft for review; nothing saves automatically.</p>
      {error && <div className="inline-error" role="alert">{error}</div>}
    </form>
  </section>;
}
