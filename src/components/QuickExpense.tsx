import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseQuickExpense } from "../utils.ts/insights";
import Icon from "./Icon";

export default function QuickExpense() {
  const [command, setCommand] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  return <section className="content-card quick-expense">
    <form onSubmit={(event) => {
      event.preventDefault();
      try {
        const draft = parseQuickExpense(command);
        navigate(`/app/expenses/new?${new URLSearchParams(draft).toString()}`);
      } catch (error) { setError(error instanceof Error ? error.message : "Unable to parse this expense."); }
    }}>
      <label className="field-label" htmlFor="quick-expense">Quick expense <span className="field-hint">Type it. Review it. Save it.</span></label>
      <div className="quick-expense-controls"><input id="quick-expense" value={command} onChange={(event) => { setCommand(event.target.value); setError(""); }} placeholder="Lunch 250 yesterday" aria-describedby="quick-expense-help" required /><button className="button button-primary"><Icon name="next" size={16} />Review expense</button></div>
      <p className="field-hint" id="quick-expense-help">Description + INR amount + optional today, yesterday, or YYYY-MM-DD. Choose category and account on the review screen; nothing saves automatically.</p>
      {error && <div className="inline-error" role="alert">{error}</div>}
    </form>
  </section>;
}
