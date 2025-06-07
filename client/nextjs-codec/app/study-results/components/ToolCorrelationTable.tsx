'use client';
import React from 'react';

export default function ToolCorrelationTable() {
  const correlationData = [
    ['', 'CodeCheck', 'MOSS', 'Dolos'],
    ['CodeCheck', '1.00', '-0.01', '-0.05'],
    ['MOSS', '-0.01', '1.00', '0.60'],
    ['Dolos', '-0.05', '0.60', '1.00'],
  ];

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            {correlationData[0].map((header, index) => (
              <th key={index} className="px-4 py-2 text-left text-white/90 border-b border-gray-600">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {correlationData.slice(1).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-white/80 border-b border-gray-600">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}