'use client';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ClassificationChart() {
  const data = {
    labels: ['CodeCheck', 'MOSS', 'Dolos'],
    datasets: [
      {
        label: 'Low (<50%)',
        data: [3, 568, 436],  // Updated values
        backgroundColor: 'rgba(20, 184, 166, 0.8)',  // Teal color for Low
        stack: 'Stack 0',
      },
      {
        label: 'Medium (50% - 80%)',
        data: [612, 78, 168],  // Updated values
        backgroundColor: 'rgba(251, 146, 60, 0.8)',  // Orange color for Medium
        stack: 'Stack 0',
      },
      {
        label: 'High (>80%)',
        data: [61, 30, 72],  // Updated values
        backgroundColor: 'rgba(239, 68, 68, 0.8)',  // Red color for High
        stack: 'Stack 0',
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      y: {
        stacked: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
    },
  };

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg">
      <Bar data={data} options={options} />
    </div>
  );
}