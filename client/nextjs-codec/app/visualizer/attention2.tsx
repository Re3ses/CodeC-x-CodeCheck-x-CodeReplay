import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Monaco } from '@monaco-editor/react';
import './App.css';

interface attentionProps{
    codeSnippets: string[];
}

const App = ({ codeSnippets }: attentionProps) => {
  const [code1, setCode1] = useState('def calculate_area(radius): return 3.14 * radius * radius');
  const [code2, setCode2] = useState('def compute_circle_area(r): return 3.14159 * r * r');
  const [similarities, setSimilarities] = useState([]);
  const [hoveredToken, setHoveredToken] = useState(null);

  const handleEditorChange1 = (value) => setCode1(value || '');
  const handleEditorChange2 = (value) => setCode2(value || '');

//   useEffect(() => {
//     // Mock similarity data. Replace this with actual data from Python backend.
//     setSimilarities([
//       { token1: 'radius', token2: 'r', similarity: 0.95 },
//       { token1: '3.14', token2: '3.14159', similarity: 0.92 }
//     ]);
//   }, [code1, code2]);

  const highlightTokens = (code, tokens, isCode1 = true) => {
    let highlightedCode = code;
    tokens.forEach(({ token1, token2, similarity }) => {
      const regex = new RegExp(`\b${isCode1 ? token1 : token2}\b`, 'g');
      highlightedCode = highlightedCode.replace(regex, (match) =>
        `<span class='highlight' data-token='${match}' data-similarity='${similarity}'>${match}</span>`
      );
    });
    return highlightedCode;
  };

  const handleMouseOver = (e) => {
    const token = e.target.getAttribute('data-token');
    const similarity = e.target.getAttribute('data-similarity');
    if (token && similarity) {
      setHoveredToken({ token, similarity });
    }
  };

  const handleMouseOut = () => {
    setHoveredToken(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <div
              className="editor"
              dangerouslySetInnerHTML={{ __html: highlightTokens(code1, codeSnippets, true) }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div
              className="editor"
              dangerouslySetInnerHTML={{ __html: highlightTokens(code2, codeSnippets, false) }}
            />
          </CardContent>
        </Card>
      </div>

      {hoveredToken && (
        <div className="tooltip fixed bg-white p-2 border rounded shadow-lg">
          <strong>Token:</strong> {hoveredToken.token} <br />
          <strong>Similarity:</strong> {hoveredToken.similarity}
        </div>
      )}
    </div>
  );
};

export default App;
