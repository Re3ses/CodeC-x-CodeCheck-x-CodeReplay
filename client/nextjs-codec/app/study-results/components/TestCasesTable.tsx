'use client';
import React from 'react';

export default function TestCasesTable() {
  const testCases = [
    {
      category: 'Main File',
      withoutTS: { plagiarized: true, confidence: 93 },
      withTS: { plagiarized: true, confidence: 78 },
      withPrep: { plagiarized: true, confidence: 100 }
    },
    {
      category: 'Identical File',
      withoutTS: { plagiarized: true, confidence: 93 },
      withTS: { plagiarized: true, confidence: 78 },
      withPrep: { plagiarized: true, confidence: 100 }
    },
    {
      category: 'Renamed Variables',
      withoutTS: { plagiarized: true, confidence: 95 },
      withTS: { plagiarized: true, confidence: 80 },
      withPrep: { plagiarized: true, confidence: 99 }
    },
    {
      category: 'Reordered Statements',
      withoutTS: { plagiarized: true, confidence: 94 },
      withTS: { plagiarized: true, confidence: 80 },
      withPrep: { plagiarized: true, confidence: 100 }
    },
    {
      category: 'Added Whitespace/Comments',
      withoutTS: { plagiarized: true, confidence: 98 },
      withTS: { plagiarized: true, confidence: 96 },
      withPrep: { plagiarized: true, confidence: 98 }
    },
    {
      category: 'Modified Control Flow',
      withoutTS: { plagiarized: true, confidence: 96 },
      withTS: { plagiarized: true, confidence: 83 },
      withPrep: { plagiarized: true, confidence: 100 }
    },
    {
      category: 'Inserted Dummy Code',
      withoutTS: { plagiarized: true, confidence: 98 },
      withTS: { plagiarized: true, confidence: 83 },
      withPrep: { plagiarized: true, confidence: 100 }
    },
    {
      category: 'Partial Code Duplication',
      withoutTS: { plagiarized: true, confidence: 99 },
      withTS: { plagiarized: true, confidence: 88 },
      withPrep: { plagiarized: true, confidence: 100 }
    },
    {
      category: 'Completely Different Code',
      withoutTS: { plagiarized: true, confidence: 98 },
      withTS: { plagiarized: true, confidence: 96 },
      withPrep: { plagiarized: true, confidence: 100 }
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-yellow-500">
        Test Cases for Factorial Algorithm
      </h3>
      <div className="bg-gray-700/50 p-4 rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th rowSpan={2} className="px-4 py-2 text-left text-white/90 border-b border-gray-600">
                Test Case Category
              </th>
              <th colSpan={2} className="px-4 py-2 text-center text-white/90 border-b border-gray-600">
                Without Tree-Sitter
              </th>
              <th colSpan={2} className="px-4 py-2 text-center text-white/90 border-b border-gray-600">
                With Tree-Sitter
              </th>
              <th colSpan={2} className="px-4 py-2 text-center text-white/90 border-b border-gray-600">
                Tree-Sitter + Preprocessing
              </th>
            </tr>
            <tr>
              <th className="px-4 py-2 text-center text-white/90 border-b border-gray-600">Plagiarized?</th>
              <th className="px-4 py-2 text-center text-white/90 border-b border-gray-600">Confidence</th>
              <th className="px-4 py-2 text-center text-white/90 border-b border-gray-600">Plagiarized?</th>
              <th className="px-4 py-2 text-center text-white/90 border-b border-gray-600">Confidence</th>
              <th className="px-4 py-2 text-center text-white/90 border-b border-gray-600">Plagiarized?</th>
              <th className="px-4 py-2 text-center text-white/90 border-b border-gray-600">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((testCase, index) => (
              <tr key={index} className="hover:bg-gray-600/30">
                <td className="px-4 py-2 text-white/80 border-b border-gray-600">
                  {testCase.category}
                </td>
                <td className="px-4 py-2 text-center text-yellow-500 border-b border-gray-600">
                  {testCase.withoutTS.plagiarized ? 'True' : 'False'}
                </td>
                <td className="px-4 py-2 text-center text-yellow-500 border-b border-gray-600">
                  {testCase.withoutTS.confidence}
                </td>
                <td className="px-4 py-2 text-center text-yellow-500 border-b border-gray-600">
                  {testCase.withTS.plagiarized ? 'True' : 'False'}
                </td>
                <td className="px-4 py-2 text-center text-yellow-500 border-b border-gray-600">
                  {testCase.withTS.confidence}
                </td>
                <td className="px-4 py-2 text-center text-yellow-500 border-b border-gray-600">
                  {testCase.withPrep.plagiarized ? 'True' : 'False'}
                </td>
                <td className="px-4 py-2 text-center text-yellow-500 border-b border-gray-600">
                  {testCase.withPrep.confidence}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}