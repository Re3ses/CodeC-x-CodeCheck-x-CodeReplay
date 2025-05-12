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

  // Get color based on similarity - using exact same thresholds and colors as SimilarityDashboard
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 80) return { bg: 'rgba(220, 38, 38, 0.3)', border: '#dc2626' }; // Red for high similarity (matches hex #dc2626)
    if (similarity >= 60) return { bg: 'rgba(202, 138, 4, 0.3)', border: '#ca8a04' };  // Yellow for medium (matches hex #ca8a04)
    return { bg: 'rgba(37, 99, 235, 0.3)', border: '#2563eb' };  // Blue for lower similarity (matches hex #2563eb)
  };

  // Add custom CSS for highlights
  const addCustomHighlightStyles = () => {
    // Remove previous style if exists
    const existingStyle = document.getElementById('monaco-highlight-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element
    const styleElement = document.createElement('style');
    styleElement.id = 'monaco-highlight-styles';

    let styleContent = `
      .monaco-editor .highlight-line {
        width: 100% !important;
      }
      .monaco-editor .view-overlays .current-line {
        border: none !important;
      }
    `;

    // Add styles for each similarity level - using exact same colors as SimilarityDashboard
    styleContent += `
      .monaco-editor .highlight-high-similarity {
        background-color: rgba(220, 38, 38, 0.3) !important;
        // border-left: 3px solid #dc2626 !important;
      }
      .monaco-editor .highlight-medium-similarity {
        background-color: rgba(202, 138, 4, 0.3) !important;
        // border-left: 3px solid #ca8a04 !important;
      }
      .monaco-editor .highlight-low-similarity {
        background-color: rgba(37, 99, 235, 0.3) !important;
        // border-left: 3px solid #2563eb !important;
      }
      .monaco-editor .highlight-gutter-high-similarity {
        // border-left: 3px solid #dc2626 !important;
      }
      .monaco-editor .highlight-gutter-medium-similarity {
        // border-left: 3px solid #ca8a04 !important;
      }
      .monaco-editor .highlight-gutter-low-similarity {
        // border-left: 3px solid #2563eb !important;
      }
      .monaco-editor .highlight-margin-high-similarity {
        // border-left: 3px solid #dc2626 !important;
      }
      .monaco-editor .highlight-margin-medium-similarity {
        // border-left: 3px solid #ca8a04 !important;
      }
      .monaco-editor .highlight-margin-low-similarity {
        // border-left: 3px solid #2563eb !important;
      }
    `;

    styleElement.innerHTML = styleContent;
    document.head.appendChild(styleElement);
  };

  // Initialize Monaco editor
  function handleEditorDidMount(editor: any, monaco: Monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    // Setup editor options
    editor.updateOptions({
      readOnly: true,
      lineNumbers: "on",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      folding: true,
      renderLineHighlight: 'none',
      fixedOverflowWidgets: true
    });

    // Set up scroll synchronization
    editor.onDidScrollChange((e: any) => {
      if (onScroll) onScroll(editor.getScrollTop());
    });
  }

  // Handle scroll synchronization
  useEffect(() => {
    if (editorRef.current && syncScrollTop !== undefined) {
      const currentScrollTop = editorRef.current.getScrollTop();
      if (Math.abs(currentScrollTop - syncScrollTop) > 5) {
        editorRef.current.setScrollTop(syncScrollTop);
      }
    }
  }, [syncScrollTop]);

  // Combined useEffect for handling highlights, code changes, and layout
  useEffect(() => {
    // Apply highlighting using Monaco decorations instead of DOM manipulation
    const applyHighlighting = () => {
      if (!editorRef.current || !monacoRef.current || highlights.length === 0) return;

      // Clear previous decorations
      if (decorationsRef.current.length > 0) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }

      // Create decorations for all highlights
      const decorations = highlights.map(highlight => {
        // Determine similarity level class
        let similarityLevel = 'low';
        if (highlight.similarity >= 80) {
          similarityLevel = 'high';
        } else if (highlight.similarity >= 60) {
          similarityLevel = 'medium';
        }

        const colorInfo = getSimilarityColor(highlight.similarity);

        return {
          range: new (monacoRef.current as any).Range(
            highlight.startLineNumber,
            1,
            highlight.endLineNumber,
            Number.MAX_SAFE_INTEGER
          ),
          options: {
            isWholeLine: true,
            className: `highlight-line highlight-${similarityLevel}-similarity`,
            inlineClassName: `highlight-text-${similarityLevel}-similarity`,
            linesDecorationsClassName: `highlight-gutter-${similarityLevel}-similarity`,
            marginClassName: `highlight-margin-${similarityLevel}-similarity`,
            stickiness: monacoRef.current?.editor?.TrackedRangeStickiness?.NeverGrowsWhenTypingAtEdges || monacoRef.current?.editor?.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            overviewRuler: {
              color: colorInfo.border,
              position: monacoRef.current?.editor?.OverviewRulerLane?.Center || undefined
            },
            hoverMessage: { value: `Similarity: ${(highlight.similarity * 100).toFixed(1)}%` }
          }
        };
      });

      // Apply all decorations at once
      decorationsRef.current = editorRef.current.deltaDecorations([], decorations);

      // Add custom CSS for highlights
      addCustomHighlightStyles();
    };

    // Function to apply highlights and handle editor layout
    const applyHighlightsWithLayout = () => {
      if (editorRef.current) {
        editorRef.current.layout();
        applyHighlighting();
      }
    };

    if (isEditorReady) {
      if (highlights.length > 0 || code) {
        // Small delay to ensure Monaco has finished rendering
        const timeoutId = setTimeout(() => {
          applyHighlighting();
        }, 300); // Using the longer timeout for all cases to be safe

        return () => clearTimeout(timeoutId);
      }
    }

    // Handle window resize events
    const handleResize = () => {
      applyHighlightsWithLayout();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isEditorReady, highlights, code]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const existingStyle = document.getElementById('monaco-highlight-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="monaco-editor-wrapper" style={{ height: "100%", width: "100%", position: "relative" }}>
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
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          overviewRulerBorder: false,
          renderLineHighlight: 'none',
        }}
        loading={<div className="text-center p-4">Loading editor...</div>}
      />
    </div>
  );
};

export default HighlightedMonaco;