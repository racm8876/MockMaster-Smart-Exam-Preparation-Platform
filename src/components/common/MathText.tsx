import React from 'react';
import katex from 'katex';

interface MathTextProps {
  content?: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ content = '', className = '' }) => {
  if (!content) return null;

  // Split text by LaTeX markers: $$...$$ (block) or $...$ (inline)
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);

  return (
    <span className={`inline-block whitespace-pre-wrap leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return (
              <span
                key={index}
                className="my-2 block overflow-x-auto text-center"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={index}>{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return (
              <span
                key={index}
                className="inline-block px-1 align-middle"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={index}>{part}</span>;
          }
        }

        // Render standard text with bold **word** formatting
        const boldParts = part.split(/(\*\*[^*]+?\*\*)/g);
        return (
          <React.Fragment key={index}>
            {boldParts.map((sub, sIdx) => {
              if (sub.startsWith('**') && sub.endsWith('**')) {
                return (
                  <strong key={sIdx} className="font-bold text-[#17241f]">
                    {sub.slice(2, -2)}
                  </strong>
                );
              }
              return sub;
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
};
