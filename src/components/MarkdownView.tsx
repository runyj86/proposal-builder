"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownView({ children }: { children: string }) {
  return (
    <div className="prose-pb">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ ...props }) => (
            <div className="table-wrap"><table {...props} /></div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
