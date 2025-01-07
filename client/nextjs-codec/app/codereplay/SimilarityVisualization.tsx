import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCode2 } from "lucide-react";
import { Editor } from '@monaco-editor/react';

const getSimilarityColor = (similarity) => {
  if (similarity >= 80) return 'bg-red-700 text-white';
  if (similarity >= 60) return 'bg-yellow-600 text-white';
  return 'bg-gray-700 text-white';
};

const SimilarityVisualization = ({ similarSnippets }) => {
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  if (!similarSnippets || similarSnippets.length === 0) {
    return (
      <Card className="p-4 bg-gray-900 text-white">
        <div className="text-center">
          <p>No similar code snippets found.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {similarSnippets.map((snippet, index) => (
        <Card 
          key={index}
          className="p-4 bg-gray-900 text-white transition-colors cursor-pointer"
          onClick={() => setSelectedSnippet(selectedSnippet === snippet.code ? null : snippet.code)}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4" />
                <span>User: {snippet.userId}</span>
              </div>
              <div className="text-sm text-gray-400">
                {new Date(snippet.timestamp).toLocaleString()}
              </div>
            </div>
            <Badge className={getSimilarityColor(snippet.similarity)}>
              {snippet.similarity?.toFixed(1) ?? 'N/A'}% Similar
            </Badge>
          </div>
          {selectedSnippet === snippet.code && (
            <div className="mt-4">
              <div className="bg-gray-800 rounded p-4 mb-4">
                <h3 className="text-sm font-semibold text-white mb-2">Semantic Analysis:</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-400">CodeBERT Score:</span>
                      <Badge className={getSimilarityColor(snippet.codebertScore)}>
                        {snippet.codebertScore?.toFixed(1) ?? 'N/A'}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <Editor
                height="200px"
                defaultLanguage="javascript"
                value={snippet.code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default SimilarityVisualization;