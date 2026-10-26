import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components = {
  h1: () => null, // H1 comes from the layout
  h2: ({ children }) => (
    <h2 className="text-xl sm:text-2xl font-bold text-primary mt-10 mb-3 leading-snug">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-bold text-primary mt-6 mb-2 leading-snug">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-base text-black/80 leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pe-6 space-y-2 mb-4 text-black/80">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pe-6 space-y-2 mb-4 text-black/80">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
      {...(href?.startsWith("http")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-s-4 border-primary/30 bg-primary/[0.03] rounded-e-xl px-4 py-3 my-6 text-black/80">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-primary/15">
      <table className="min-w-full text-sm text-start">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-primary/[0.06] text-primary">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 font-bold text-start whitespace-nowrap">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border-t border-primary/10 text-black/80 align-top">
      {children}
    </td>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-primary">{children}</strong>
  ),
  hr: () => <hr className="my-8 border-primary/10" />,
};

export default function GuideMarkdown({ content }) {
  if (!content) return null;
  return (
    <div className="guide-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
