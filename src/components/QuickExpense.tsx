import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseExpense, validateExpenseImage } from "../services/expense.service";
import Icon from "./Icon";
import "./QuickExpense.css";

function InfoTip({ label, children }: { label: string; children: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return <span className="quick-expense-tip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <button type="button" className="quick-expense-info" aria-label={label} aria-describedby={open ? id : undefined}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen(true)}
      onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); event.stopPropagation(); } }}>
      <Icon name="info" size={15} />
    </button>
    {open && <span className="quick-expense-tooltip" id={id} role="tooltip">{children}</span>}
  </span>;
}

function BillPreview({ file, url }: { file: File; url: string }) {
  const [unavailable, setUnavailable] = useState(false);

  return <span className="quick-expense-thumbnail">
    {unavailable ? <Icon name="image" size={24} /> : <img src={url} alt={`Selected bill: ${file.name}`} onError={() => setUnavailable(true)} />}
  </span>;
}

export default function QuickExpense() {
  const [command, setCommand] = useState("");
  const [attachment, setAttachment] = useState<{ file: File; url: string }>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const commandInput = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => { if (attachment) URL.revokeObjectURL(attachment.url); };
  }, [attachment]);

  function selectImage(file?: File) {
    if (!file || saving) return;
    try {
      validateExpenseImage(file);
      setAttachment({ file, url: URL.createObjectURL(file) });
      setError("");
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Unable to use this bill image.");
    }
  }

  return <section className="content-card quick-expense" aria-labelledby="quick-expense-title">
    <header className="quick-expense-header">
      <span className="quick-expense-mark"><Icon name="sparkle" size={21} /></span>
      <div className="quick-expense-heading">
        <h2 id="quick-expense-title">Quick expense <span className="quick-expense-badge">AI assisted</span></h2>
        <p>A few words or a bill. We'll take it from here.</p>
      </div>
      <InfoTip label="How AI expense entry works">AI turns your description or bill into an expense draft in INR. Check the amount, category, account, and date before saving. AI can make mistakes.</InfoTip>
    </header>
    <form aria-busy={saving} onSubmit={async (event) => {
      event.preventDefault();
      if (saving || (!command.trim() && !attachment)) return;
      setSaving(true);
      setError("");
      try {
        const result = await parseExpense(command, attachment?.file);
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
      <div className={`quick-expense-composer${dragging ? " is-dragging" : ""}`}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = saving ? "none" : "copy";
          if (!saving) setDragging(true);
        }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (saving) return;
          if (event.dataTransfer.files.length > 1) {
            setError("Please attach one bill image at a time.");
            return;
          }
          selectImage(event.dataTransfer.files[0]);
        }}>
        <label className="sr-only" htmlFor="quick-expense">Describe your expense</label>
        <textarea ref={commandInput} id="quick-expense" rows={2} value={command} disabled={saving}
          onChange={(event) => { setCommand(event.target.value); setError(""); }}
          placeholder={attachment ? "Add a note for this bill (optional)..." : "e.g. Lunch at Cafe Coffee Day, 250 yesterday"}
          aria-describedby="quick-expense-help" required={!attachment} />
        {attachment && <div className="quick-expense-attachment">
          <BillPreview key={attachment.url} file={attachment.file} url={attachment.url} />
          <div className="quick-expense-file">
            <strong title={attachment.file.name}>{attachment.file.name}</strong>
            <span>{attachment.file.size < 1024 * 1024 ? `${Math.max(1, Math.round(attachment.file.size / 1024))} KB` : `${(attachment.file.size / (1024 * 1024)).toFixed(1)} MB`} <span aria-hidden="true">&middot;</span> Ready to read</span>
          </div>
          <button type="button" className="quick-expense-file-action" disabled={saving} onClick={() => imageInput.current?.click()}>Replace</button>
          <button type="button" className="quick-expense-file-action quick-expense-remove" aria-label="Remove bill image" title="Remove bill image" disabled={saving} onClick={() => {
            setAttachment(undefined);
            setError("");
            commandInput.current?.focus();
          }}><Icon name="close" size={17} /></button>
        </div>}
        <div className="quick-expense-toolbar">
          <div className="quick-expense-upload-action">
            {!attachment && <button type="button" className="quick-expense-attach" disabled={saving} onClick={() => imageInput.current?.click()}>
              <Icon name="image" size={18} />Attach bill
            </button>}
            <span className="quick-expense-upload-limit">{attachment ? "Bill attached" : "Image up to 2 MB"}</span>
            <InfoTip label="Bill image requirements">Choose or drop one PNG, JPG, or other image file, up to 2 MB. Use a clear photo with the total and date visible. You can add optional details above.</InfoTip>
          </div>
          <button type="submit" className="button button-primary quick-expense-submit" disabled={saving || (!command.trim() && !attachment)}>
            <Icon name={saving ? "clock" : "sparkle"} size={16} />{saving ? "Preparing draft..." : "Create draft"}
          </button>
        </div>
      </div>
      <input ref={imageInput} id="quick-expense-image" className="sr-only" type="file" accept="image/*" disabled={saving} tabIndex={-1}
        aria-label="Choose bill image" onChange={(event) => {
          selectImage(event.target.files?.[0]);
          event.target.value = "";
        }} />
      <p className="quick-expense-help" id="quick-expense-help"><Icon name="check" size={14} />You review before saving. Nothing is added automatically.</p>
      {saving && <p className="sr-only" role="status">AI is preparing your expense draft. Please wait.</p>}
      {error && <div className="inline-error" role="alert">{error}</div>}
    </form>
  </section>;
}
