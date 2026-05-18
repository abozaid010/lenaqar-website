export default function GlassCard({ children, className = "", hover = true, ...props }) {
  const base =
    "rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-lg shadow-primary/5";
  const hoverClass = hover
    ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
    : "";

  return (
    <div className={`${base} ${hoverClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
