import CalendarPicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toDateKey } from "../utils.ts/finance";
import "./DatePicker.css";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  type?: "date" | "month" | "year";
  id?: string;
  required?: boolean;
  min?: string;
  max?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}

export default function DatePicker({ value, onChange, type = "date", id, required, min, max, ...aria }: DatePickerProps) {
  const monthOnly = type === "month";
  const yearOnly = type === "year";
  const parse = (key: string) => new Date(`${key.length === 4 ? `${key}-01-01` : key.length === 7 ? `${key}-01` : key}T00:00:00`);
  return (
    <CalendarPicker
      id={id}
      selected={value ? parse(value) : null}
      onChange={(date: Date | null) => onChange(date ? toDateKey(date).slice(0, yearOnly ? 4 : monthOnly ? 7 : 10) : "")}
      dateFormat={yearOnly ? "yyyy" : monthOnly ? "MMMM yyyy" : "dd MMM yyyy"}
      showMonthYearPicker={monthOnly}
      showYearPicker={yearOnly}
      showYearDropdown={!monthOnly && !yearOnly}
      showMonthDropdown={!monthOnly && !yearOnly}
      dropdownMode="select"
      minDate={min ? parse(min) : undefined}
      maxDate={max ? parse(max) : undefined}
      required={required}
      ariaInvalid={aria["aria-invalid"] ? "true" : undefined}
      placeholderText={yearOnly ? "Select year" : monthOnly ? "Select month" : "Select date"}
      className="calendar-input"
      calendarClassName={`finance-calendar${monthOnly ? " finance-month-calendar" : ""}`}
      popperClassName="finance-calendar-popper"
      portalId="finance-calendar-portal"
      customInput={<input aria-label={aria["aria-label"]} />}
      isClearable={!required && Boolean(value)}
      strictParsing
    />
  );
}
