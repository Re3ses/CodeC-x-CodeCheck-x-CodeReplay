// components/SafeHtml.tsx
import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

const DOMPurifyInstance = DOMPurify.sanitize;

const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className }) => {
  const createMarkup = (html: string) => {
    html = DOMPurifyInstance(html);
    return { __html: html };
  };

  return (
    <div className={className} dangerouslySetInnerHTML={createMarkup(html)} />
  );
};

export default SafeHtml;
