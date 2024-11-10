import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import mongoose from 'mongoose';

const CodeSnippetSchema = new mongoose.Schema({
  code: String,
  timestamp: { type: Date, default: Date.now },
  userId: String,
  submissionId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  roomId: String,
  problemId: String
});

const CodeSnippet = mongoose.models.CodeSnippet || mongoose.model('CodeSnippet', CodeSnippetSchema);

// Array of longer code snippet templates
const codeTemplates = [
  `function advancedSort(arr) {
  console.log('Starting sort...');
  const sorted = arr.sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    return String(a).localeCompare(String(b));
  });
  console.log('Sort completed');
  return sorted;
}`,

  `const arrayOperations = {
  filter: (arr, condition) => arr.filter(condition),
  map: (arr, transform) => arr.map(transform),
  reduce: (arr, callback, initial) => arr.reduce(callback, initial),
  process: function(arr) {
    return this.map(this.filter(arr, x => x != null), x => x * 2);
  }
};`,

  `function analyzeArray(numbers) {
  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = sum / numbers.length;
  const max = Math.max(...numbers);
  const min = Math.min(...numbers);
  return {
    sum, average: avg,
    max, min,
    length: numbers.length
  };
}`,

  `class ArrayManipulator {
  constructor(array) {
    this.array = array;
    this.length = array.length;
  }
  reverse() {
    this.array.reverse();
    return this;
  }
  sort() {
    this.array.sort((a, b) => a - b);
    return this;
  }
  getResult() {
    return this.array;
  }
}`,

  `function processData(data) {
  const filtered = data
    .filter(item => item && item.value > 0)
    .map(item => ({
      ...item,
      processed: true,
      timestamp: new Date(),
      value: item.value * 2
    }));
  return filtered;
}`,

  `const arrayUtils = {
  findDuplicates: arr => {
    const seen = new Set();
    const duplicates = new Set();
    arr.forEach(item => {
      if (seen.has(item)) duplicates.add(item);
      seen.add(item);
    });
    return Array.from(duplicates);
  }
};`,

  `function transformArray(input) {
  const mapped = input.map((x, i) => ({
    value: x,
    index: i,
    isEven: x % 2 === 0,
    doubled: x * 2,
    stringified: String(x)
  }));
  return mapped.filter(x => x.isEven);
}`,

  `const statsCalculator = numbers => {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return {
    median: sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid],
    mean: numbers.reduce((a, b) => a + b) / numbers.length
  };
};`,

  `function searchArray(arr, target) {
  console.log('Searching array...');
  const result = {
    found: false,
    index: -1,
    comparisons: 0
  };
  for (let i = 0; i < arr.length; i++) {
    result.comparisons++;
    if (arr[i] === target) {
      result.found = true;
      result.index = i;
      break;
    }
  }
  return result;
}`,

  `const arrayProcessor = arr => {
  const processed = arr
    .filter(Boolean)
    .map(x => typeof x === 'string' ? x.trim() : x)
    .reduce((acc, curr) => {
      acc[typeof curr] = (acc[typeof curr] || []).concat(curr);
      return acc;
    }, {});
  return processed;
};`
];

function generateRandomSnippet() {
  const template = codeTemplates[Math.floor(Math.random() * codeTemplates.length)];
  const randomComment = `// Submission ${Math.random().toString(36).substring(7)}\n// Timestamp: ${new Date().toISOString()}`;
  return `${randomComment}\n${template}`;
}

function generateSubmissions() {
  const submissions = [];
  const startDate = new Date('2024-01-01');
  
  // Generate for test-user-1 (70 submissions)
  for (let i = 0; i < 70; i++) {
    submissions.push({
      code: generateRandomSnippet(),
      userId: 'test-user-1',
      roomId: 'room-1',
      problemId: 'sorting-1',
      timestamp: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    });
  }
  
  // Generate for test-user-2 (70 submissions)
  for (let i = 0; i < 70; i++) {
    submissions.push({
      code: generateRandomSnippet(),
      userId: 'test-user-2',
      roomId: 'room-1',
      problemId: 'sorting-1',
      timestamp: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    });
  }
  
  // Generate for test-user-3 (60 submissions)
  for (let i = 0; i < 60; i++) {
    submissions.push({
      code: generateRandomSnippet(),
      userId: 'test-user-3',
      roomId: 'room-1',
      problemId: 'sorting-1',
      timestamp: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    });
  }
  
  return submissions;
}

export async function GET() {
  try {
    await dbConnect();
    
    // Clear existing data
    await CodeSnippet.deleteMany({});
    
    // Generate and insert submissions
    const submissions = generateSubmissions();
    await CodeSnippet.insertMany(submissions);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      count: submissions.length
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to seed database'
    });
  }
}