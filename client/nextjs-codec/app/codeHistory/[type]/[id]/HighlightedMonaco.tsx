// components/HighlightedMonaco.tsx
import React, { useRef, useEffect, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';

// Define types inside the component file
interface HighlightRange {
  startLineNumber: number;
  endLineNumber: number;
  similarity: number;
  clusterId: number;
  type: string;
  matchingLines: string[];
}

interface HighlightedMonacoProps {
  code: string | null;
  highlights: HighlightRange[];
  onScroll?: (scrollTop: number) => void;
  syncScrollTop?: number;
  language?: string;
}

// Helper function to get color based on similarity
const getSimilarityColor = (similarity: number) => {
  if (similarity >= 80) return { bg: 'bg-red-600', opacity: 'bg-opacity-40', text: 'text-white', hex: '#dc2626' };
  if (similarity >= 60) return { bg: 'bg-yellow-600', opacity: 'bg-opacity-60', text: 'text-white', hex: '#ca8a04' };
  return { bg: 'bg-gray-700', opacity: 'bg-opacity-50', text: 'text-white', hex: '#2563eb' };
};


const HighlightedMonaco: React.FC<HighlightedMonacoProps> = ({
  code,
  highlights,
  onScroll,
  syncScrollTop,
  language = "typescript"
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const addCustomHighlightStyles = () => {
    const existingStyle = document.getElementById('monaco-highlight-styles');
    if (existingStyle) existingStyle.remove();

    const styleElement = document.createElement('style');
    styleElement.id = 'monaco-highlight-styles';
    styleElement.innerHTML = `
      .monaco-editor .highlight-line {
        width: 100% !important;
      }
      .monaco-editor .view-overlays .current-line {
        border: none !important;
      }
    `;
    document.head.appendChild(styleElement);
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);
    editor.updateOptions({
      readOnly: true,
      lineNumbers: "on",
      minimap: { enabled: true },
      wordWrap: 'on',
      scrollBeyondLastLine: false,
    });
    editor.onDidScrollChange((e: any) => {
      if (onScroll) onScroll(editor.getScrollTop());
    });
  };

  useEffect(() => {
    if (editorRef.current && syncScrollTop !== undefined) {
      const currentScrollTop = editorRef.current.getScrollTop();
      if (Math.abs(currentScrollTop - syncScrollTop) > 5) {
        editorRef.current.setScrollTop(syncScrollTop);
      }
    }
  }, [syncScrollTop]);

  useEffect(() => {
    const applyHighlighting = () => {
      if (!editorRef.current || !monacoRef.current) return;
      if (decorationsRef.current.length > 0) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }

      const decorations = highlights.map(highlight => {
        const color = getSimilarityColor(highlight.similarity * 100);
        return {
          range: new (monacoRef.current as any).Range(
            highlight.startLineNumber,
            1,
            highlight.endLineNumber,
            Number.MAX_SAFE_INTEGER
          ),
          options: {
            isWholeLine: true,
            className: `highlight-line ${color.bg} ${color.opacity}`,
            hoverMessage: { value: `Similarity: ${(highlight.similarity * 100).toFixed(1)}%` },
          }
        };
      });

      decorationsRef.current = editorRef.current.deltaDecorations([], decorations);
      addCustomHighlightStyles();
    };

    if (isEditorReady && (highlights.length > 0 || code)) {
      applyHighlighting();
    }
  }, [isEditorReady, highlights, code]);

  return (
    <div ref={containerRef} style={{ height: "100%", width: "100%" }}>
      <Editor
        height="100%"
        width="100%"
        defaultLanguage={language}
        value={code || ''}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          readOnly: true,
          lineNumbers: "on",
          minimap: { enabled: false },
          wordWrap: 'on',
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};

export default HighlightedMonaco;
