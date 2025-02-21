// components/SafeHtml.tsx
import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

interface SafeHtmlProps {
  html: string | undefined;
  className?: string;
}

const DOMPurifyInstance = DOMPurify.sanitize;

const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className }) => {
  const createMarkup = (html: string = '') => {
    html = DOMPurifyInstance(html);
    return { __html: marked.parse(html, { async: false }) as string };
  };

  return (
    <div className={className} dangerouslySetInnerHTML={createMarkup(html)} />
  );
};

export default SafeHtml;
