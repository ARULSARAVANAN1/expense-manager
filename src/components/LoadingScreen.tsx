import Icon from "./Icon";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Loading your finances…",
}: LoadingScreenProps) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-screen-icon">
        <Icon name="expense" size={30} />
      </div>
      <span className="loading-screen-message">{message}</span>
      <div className="loading-screen-progress" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
