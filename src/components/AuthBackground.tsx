import { useEffect, useRef } from "react";
import Icon from "./Icon";
import "./AuthBackground.css";

export default function AuthBackground() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");
    let frame = 0;
    function move(event: PointerEvent) {
      if (motion.matches || !pointer.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        backgroundRef.current?.style.setProperty("--pointer-x", `${(event.clientX / window.innerWidth - 0.5) * 18}px`);
        backgroundRef.current?.style.setProperty("--pointer-y", `${(event.clientY / window.innerHeight - 0.5) * 18}px`);
      });
    }
    function reset() {
      cancelAnimationFrame(frame);
      backgroundRef.current?.style.setProperty("--pointer-x", "0px");
      backgroundRef.current?.style.setProperty("--pointer-y", "0px");
    }
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    motion.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      motion.removeEventListener("change", reset);
    };
  }, []);

  return <div className="auth-background" ref={backgroundRef} aria-hidden="true">
    <div className="auth-background-grid" />
    <div className="auth-glow auth-glow-one" />
    <div className="auth-glow auth-glow-two" />
    <div className="auth-finance-scene">
      <div className="auth-float auth-receipt">
        <div className="auth-art-heading"><span className="auth-art-icon"><Icon name="expense" size={20} /></span><span>Everyday expenses<small>A little clarity, every day</small></span></div>
        <div className="auth-receipt-row"><Icon name="groceries" size={17} /><span>Groceries</span><i /></div>
        <div className="auth-receipt-row"><Icon name="food" size={17} /><span>Coffee & dining</span><i /></div>
        <div className="auth-receipt-row"><Icon name="transport" size={17} /><span>Getting around</span><i /></div>
        <div className="auth-art-footer"><Icon name="check" size={15} />All in one place</div>
      </div>
      <div className="auth-float auth-spending-art">
        <div className="auth-art-heading"><span className="auth-art-icon"><Icon name="reports" size={20} /></span><span>See the bigger picture<small>Your spending, simplified</small></span></div>
        <div className="auth-art-bars">{[38, 65, 48, 88, 59, 76, 52].map((height, index) => <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 0.12}s` }} />)}</div>
        <div className="auth-art-baseline"><span>Track</span><span>Understand</span><span>Plan</span></div>
      </div>
      <div className="auth-float auth-wallet-art"><span className="auth-art-icon"><Icon name="wallet" size={27} /></span><div>Make every rupee count<small>Small steps. Smarter habits.</small></div></div>
      <div className="auth-float auth-budget-art"><span className="auth-mini-donut"><Icon name="check" size={18} /></span><div>Room for your goals<small>Build better budgets</small></div></div>
      <span className="auth-floating-symbol auth-symbol-one"><Icon name="rupee" size={30} /></span>
      <span className="auth-floating-symbol auth-symbol-two"><Icon name="categories" size={24} /></span>
      <span className="auth-floating-symbol auth-symbol-three"><Icon name="income" size={26} /></span>
    </div>
  </div>;
}
