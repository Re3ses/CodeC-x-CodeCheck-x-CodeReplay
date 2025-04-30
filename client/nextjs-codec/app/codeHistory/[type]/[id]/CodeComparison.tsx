'use client'
import { useCallback, useState, useEffect } from 'react';
import HighlightedMonaco from './HighlightedMonaco';

// Define types inside the component file
interface SimilarStructure {
  cluster_id: number;
  type: string;
  similarity: number;
  code_a: string[];
  code_b: string[];
}

interface CodeComparisonProps {
  code1: string | null;
  code2: string | null;
  learner1Id?: string;
  learner2Id?: string;
  structures: SimilarStructure[];
}

interface HighlightRange {
  startLineNumber: number;
  endLineNumber: number;
  similarity: number;
  clusterId: number;
  type: string;
  matchingLines: string[];
}

export default function CodeComparison({ code1, code2, learner1Id, learner2Id, structures }: CodeComparisonProps) {
  const [scrollTop1, setScrollTop1] = useState(0);
  const [scrollTop2, setScrollTop2] = useState(0);
  const [syncScrolling, setSyncScrolling] = useState(true);
  const [highlights1, setHighlights1] = useState<HighlightRange[]>([]);
  const [highlights2, setHighlights2] = useState<HighlightRange[]>([]);

  // Generate code highlights for Monaco Editor - improved version
  const generateHighlightRanges = useCallback((code: string | null, structures: SimilarStructure[], isFirstCode: boolean): HighlightRange[] => {
    if (!code) return [];

    const highlights: HighlightRange[] = [];
    const codeLines = code.split('\n');

    structures.forEach((structure) => {
      const sourceLines = isFirstCode ? structure.code_a : structure.code_b;
      const matchingLines = isFirstCode ? structure.code_b : structure.code_a;

      // More robust line number finding
      const lineNumbers = findLineNumbers(codeLines, sourceLines);

      if (lineNumbers.length > 0) {
        highlights.push({
          startLineNumber: Math.min(...lineNumbers),
          endLineNumber: Math.max(...lineNumbers),
          similarity: structure.similarity,
          clusterId: structure.cluster_id,
          type: structure.type,
          matchingLines: matchingLines
        });
      }
    });

    // Sort highlights by start line for better rendering
    return highlights.sort((a, b) => a.startLineNumber - b.startLineNumber);
  }, []);

  // Improved line number finding algorithm
  function findLineNumbers(fullCode: string[], snippet: string[]): number[] {
    const lineNumbers: number[] = [];

    // Skip empty snippets
    if (!snippet || snippet.length === 0) return [];

    // Clean snippet lines - remove empty lines and trim whitespace
    const cleanSnippet = snippet
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (cleanSnippet.length === 0) return [];

    // First, try to find exact block matches
    if (cleanSnippet.length > 1) {
      // Try to find consecutive lines that match
      for (let i = 0; i <= fullCode.length - cleanSnippet.length; i++) {
        let match = true;
        for (let j = 0; j < cleanSnippet.length; j++) {
          if (fullCode[i + j].trim() !== cleanSnippet[j]) {
            match = false;
            break;
          }
        }

        if (match) {
          // Found exact block match
          for (let j = 0; j < cleanSnippet.length; j++) {
            lineNumbers.push(i + j + 1); // Monaco is 1-indexed
          }
          return lineNumbers;
        }
      }
    }

    // If block matching fails, fall back to individual line matching
    // Use a more reliable approach for individual lines
    fullCode.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine && cleanSnippet.includes(trimmedLine)) {
        lineNumbers.push(index + 1); // Monaco is 1-indexed
      }
    });

    return lineNumbers;
  }

  // Process highlights whenever structures change
  useEffect(() => {
    if (code1 && code2 && structures) {
      setHighlights1(generateHighlightRanges(code1, structures, true));
      setHighlights2(generateHighlightRanges(code2, structures, false));
    }
  }, [code1, code2, structures, generateHighlightRanges]);

  // Handle scroll synchronization
  const handleScroll = useCallback((side: 'left' | 'right', scrollTop: number) => {
    if (!syncScrolling) return;

    if (side === 'left') {
      setScrollTop1(scrollTop);
      setScrollTop2(scrollTop);
    } else {
      setScrollTop2(scrollTop);
      setScrollTop1(scrollTop);
    }
  }, [syncScrolling]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <div className="flex items-center">
          <label className="text-sm mr-2 text-gray-700 dark:text-gray-300">Sync Scrolling</label>
          <input
            type="checkbox"
            checked={syncScrolling}
            onChange={() => setSyncScrolling(!syncScrolling)}
            className="rounded text-blue-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            {learner1Id ? learner1Id : 'Code Sample 1'}
          </h3>
          <div className="h-[500px] border-none rounded-lg overflow-hidden">
            <HighlightedMonaco
              code={code1}
              highlights={highlights1}
              onScroll={(scrollTop) => handleScroll('left', scrollTop)}
              syncScrollTop={scrollTop1}
            />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            {learner2Id ? learner2Id : 'Code Sample 2'}
          </h3>
          <div className="h-[500px] border-none rounded-lg overflow-hidden">
            <HighlightedMonaco
              code={code2}
              highlights={highlights2}
              onScroll={(scrollTop) => handleScroll('right', scrollTop)}
              syncScrollTop={scrollTop2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}