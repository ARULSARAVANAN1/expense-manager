import type { ButtonHTMLAttributes } from "react";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading: boolean;
  loadingText?: string;
};

export default function LoadingButton({ loading, loadingText = "Saving...", disabled, children, ...props }: LoadingButtonProps) {
  return (
    <button {...props} disabled={disabled || loading} aria-busy={loading}>
      {loading ? <><span className="button-spinner" aria-hidden="true" /><span role="status">{loadingText}</span></> : children}
    </button>
  );
}