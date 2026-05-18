export default function AgenciesInsight({ children, className = "" }) {
  return (
    <p
      className={`text-lg md:text-xl font-semibold text-primary border-s-4 border-primary ps-4 py-1 ${className}`}
    >
      {children}
    </p>
  );
}
