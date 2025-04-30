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

  // Add custom CSS for highlights
  const addCustomHighlightStyles = (clusterColorMap: Map<number, string>) => {
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

    // Add styles for each cluster
    clusterColorMap.forEach((color, clusterId) => {
      const borderColor = color.replace('0.15', '0.75').replace('0.12', '0.65');

      styleContent += `
        .monaco-editor .highlight-cluster-${clusterId} {
          background-color: ${color} !important;
          border-left: 3px solid ${borderColor} !important;
        }
        .monaco-editor .highlight-gutter-cluster-${clusterId} {
          border-left: 3px solid ${borderColor} !important;
        }
        .monaco-editor .highlight-margin-cluster-${clusterId} {
          border-left: 3px solid ${borderColor} !important;
        }
      `;
    });

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

      // Create a map by cluster ID for consistent coloring
      const clusterColorMap = new Map();

      // First pass to establish consistent colors per cluster
      highlights.forEach(highlight => {
        if (!clusterColorMap.has(highlight.clusterId)) {
          // Decide color based on cluster ID to ensure consistency
          let color;
          const colorIndex = highlight.clusterId % 5; // Cycle through 5 distinct colors

          switch (colorIndex) {
            case 0:
              color = `rgba(220, 20, 60, 0.45)`;  // Red
              break;
            case 1:
              color = `rgba(0, 128, 0, 0.2)`;    // Green
              break;
            case 2:
              color = `rgba(0, 0, 255, 0.2)`;    // Blue
              break;
            case 3:
              color = `rgba(255, 165, 0, 0.2)`;  // Orange
              break;
            case 4:
              color = `rgba(128, 0, 128, 0.2)`;  // Purple
              break;
            default:
              color = `rgba(255, 215, 0, 0.2)`;  // Yellow fallback
          }

          clusterColorMap.set(highlight.clusterId, color);
        }
      });

      // Create decorations for all highlights
      const decorations = highlights.map(highlight => {
        const backgroundColor = clusterColorMap.get(highlight.clusterId);
        const borderColor = backgroundColor.replace('0.15', '0.75').replace('0.12', '0.65');

        return {
          range: new (monacoRef.current as any).Range(
            highlight.startLineNumber,
            1,
            highlight.endLineNumber,
            Number.MAX_SAFE_INTEGER
          ),
          options: {
            isWholeLine: true,
            className: `highlight-line highlight-cluster-${highlight.clusterId}`,
            inlineClassName: `highlight-text-cluster-${highlight.clusterId}`,
            linesDecorationsClassName: `highlight-gutter-cluster-${highlight.clusterId}`,
            marginClassName: `highlight-margin-cluster-${highlight.clusterId}`,
            stickiness: monacoRef.current?.editor?.TrackedRangeStickiness?.NeverGrowsWhenTypingAtEdges || monacoRef.current?.editor?.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            overviewRuler: {
              color: borderColor,
              position: monacoRef.current?.editor?.OverviewRulerLane?.Center || undefined
            },
            hoverMessage: { value: `Similarity: ${(highlight.similarity * 100).toFixed(1)}% (Cluster ${highlight.clusterId})` }
          }
        };
      });

      // Apply all decorations at once
      decorationsRef.current = editorRef.current.deltaDecorations([], decorations);

      // Add custom CSS for highlights
      addCustomHighlightStyles(clusterColorMap);
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