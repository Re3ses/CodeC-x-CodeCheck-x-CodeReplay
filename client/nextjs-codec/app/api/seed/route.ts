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

// Array of 20 different sorting implementations
const codeTemplates = [
  `// Bubble Sort Implementation
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,

  `// Quick Sort Implementation
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}`,

  `// Merge Sort Implementation
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  
  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);
  
  return merge(mergeSort(left), mergeSort(right));
}

function merge(left, right) {
  const result = [];
  while (left.length && right.length) {
    result.push(left[0] <= right[0] ? left.shift() : right.shift());
  }
  return [...result, ...left, ...right];
}`,

  `// Insertion Sort Implementation
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const current = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > current) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = current;
  }
  return arr;
}`,

  `// Selection Sort Implementation
function selectionSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
  }
  return arr;
}`,

  `// Heap Sort Implementation
function heapSort(arr) {
  function heapify(arr, n, i) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;
    
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      heapify(arr, n, largest);
    }
  }
  
  for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--)
    heapify(arr, arr.length, i);
    
  for (let i = arr.length - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(arr, i, 0);
  }
  return arr;
}`,

  `// Counting Sort Implementation
function countingSort(arr) {
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const range = max - min + 1;
  const count = new Array(range).fill(0);
  const output = new Array(arr.length);
  
  for (let i = 0; i < arr.length; i++) {
    count[arr[i] - min]++;
  }
  
  for (let i = 1; i < count.length; i++) {
    count[i] += count[i - 1];
  }
  
  for (let i = arr.length - 1; i >= 0; i--) {
    output[count[arr[i] - min] - 1] = arr[i];
    count[arr[i] - min]--;
  }
  
  return output;
}`,

  `// Shell Sort Implementation
function shellSort(arr) {
  const n = arr.length;
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < n; i++) {
      const temp = arr[i];
      let j;
      for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
        arr[j] = arr[j - gap];
      }
      arr[j] = temp;
    }
  }
  return arr;
}`,

  `// Radix Sort Implementation
function radixSort(arr) {
  const max = Math.max(...arr);
  
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const output = new Array(arr.length).fill(0);
    const count = new Array(10).fill(0);
    
    for (let i = 0; i < arr.length; i++) {
      count[Math.floor(arr[i] / exp) % 10]++;
    }
    
    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }
    
    for (let i = arr.length - 1; i >= 0; i--) {
      output[count[Math.floor(arr[i] / exp) % 10] - 1] = arr[i];
      count[Math.floor(arr[i] / exp) % 10]--;
    }
    
    for (let i = 0; i < arr.length; i++) {
      arr[i] = output[i];
    }
  }
  return arr;
}`,

  `// Cocktail Sort Implementation
function cocktailSort(arr) {
  let swapped = true;
  let start = 0;
  let end = arr.length - 1;
  
  while (swapped) {
    swapped = false;
    
    for (let i = start; i < end; i++) {
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swapped = true;
      }
    }
    
    if (!swapped) break;
    swapped = false;
    end--;
    
    for (let i = end - 1; i >= start; i--) {
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swapped = true;
      }
    }
    
    start++;
  }
  return arr;
}`,

  `// Bucket Sort Implementation
function bucketSort(arr, bucketSize = 5) {
  if (arr.length === 0) return arr;

  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const bucketCount = Math.floor((max - min) / bucketSize) + 1;
  const buckets = new Array(bucketCount).fill().map(() => []);

  for (let i = 0; i < arr.length; i++) {
    const bucketIndex = Math.floor((arr[i] - min) / bucketSize);
    buckets[bucketIndex].push(arr[i]);
  }

  const sortedArray = [];
  for (let i = 0; i < buckets.length; i++) {
    insertionSort(buckets[i]);
    sortedArray.push(...buckets[i]);
  }

  return sortedArray;
}`,

  `// Comb Sort Implementation
function combSort(arr) {
  let gap = arr.length;
  let shrink = 1.3;
  let sorted = false;

  while (!sorted) {
    gap = Math.floor(gap / shrink);
    if (gap <= 1) {
      gap = 1;
      sorted = true;
    }

    for (let i = 0; i + gap < arr.length; i++) {
      if (arr[i] > arr[i + gap]) {
        [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
        sorted = false;
      }
    }
  }

  return arr;
}`,

  `// Gnome Sort Implementation
function gnomeSort(arr) {
  let pos = 0;

  while (pos < arr.length) {
    if (pos === 0 || arr[pos] >= arr[pos - 1]) {
      pos++;
    } else {
      [arr[pos], arr[pos - 1]] = [arr[pos - 1], arr[pos]];
      pos--;
    }
  }

  return arr;
}`,

  `// Pigeonhole Sort Implementation
function pigeonholeSort(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min + 1;
  const holes = new Array(range).fill(0);

  for (let i = 0; i < arr.length; i++) {
    holes[arr[i] - min]++;
  }

  let index = 0;
  for (let i = 0; i < range; i++) {
    while (holes[i]-- > 0) {
      arr[index++] = i + min;
    }
  }

  return arr;
}`,

  `// Cycle Sort Implementation
function cycleSort(arr) {
  for (let cycleStart = 0; cycleStart < arr.length - 1; cycleStart++) {
    let item = arr[cycleStart];
    let pos = cycleStart;

    for (let i = cycleStart + 1; i < arr.length; i++) {
      if (arr[i] < item) pos++;
    }

    if (pos === cycleStart) continue;

    while (item === arr[pos]) pos++;

    [item, arr[pos]] = [arr[pos], item];

    while (pos !== cycleStart) {
      pos = cycleStart;
      for (let i = cycleStart + 1; i < arr.length; i++) {
        if (arr[i] < item) pos++;
      }

      while (item === arr[pos]) pos++;

      [item, arr[pos]] = [arr[pos], item];
    }
  }

  return arr;
}`,

  `// Bogo Sort Implementation
function bogoSort(arr) {
  function isSorted(arr) {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1] > arr[i]) return false;
    }
    return true;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  while (!isSorted(arr)) {
    arr = shuffle(arr);
  }

  return arr;
}`,

  `// Tim Sort Implementation
function timSort(arr) {
  const RUN = 32;
  const n = arr.length;

  for (let i = 0; i < n; i += RUN) {
    insertionSort(arr, i, Math.min(i + RUN - 1, n - 1));
  }

  for (let size = RUN; size < n; size = 2 * size) {
    for (let left = 0; left < n; left += 2 * size) {
      const mid = left + size - 1;
      const right = Math.min(left + 2 * size - 1, n - 1);
      merge(arr, left, mid, right);
    }
  }

  return arr;
}

function insertionSort(arr, left, right) {
  for (let i = left + 1; i <= right; i++) {
    const temp = arr[i];
    let j = i - 1;
    while (j >= left && arr[j] > temp) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = temp;
  }
}

function merge(arr, l, m, r) {
  const len1 = m - l + 1;
  const len2 = r - m;
  const left = new Array(len1);
  const right = new Array(len2);

  for (let i = 0; i < len1; i++) {
    left[i] = arr[l + i];
  }
  for (let i = 0; i < len2; i++) {
    right[i] = arr[m + 1 + i];
  }

  let i = 0, j = 0, k = l;
  while (i < len1 && j < len2) {
    if (left[i] <= right[j]) {
      arr[k] = left[i];
      i++;
    } else {
      arr[k] = right[j];
      j++;
    }
    k++;
  }

  while (i < len1) {
    arr[k] = left[i];
    i++;
    k++;
  }

  while (j < len2) {
    arr[k] = right[j];
    j++;
    k++;
  }
}`,

  `// Pancake Sort Implementation
function pancakeSort(arr) {
  for (let i = arr.length; i > 1; i--) {
    const maxIndex = findMaxIndex(arr, i);
    if (maxIndex !== i - 1) {
      flip(arr, maxIndex);
      flip(arr, i - 1);
    }
  }
  return arr;
}

function findMaxIndex(arr, n) {
  let maxIndex = 0;
  for (let i = 0; i < n; i++) {
    if (arr[i] > arr[maxIndex]) {
      maxIndex = i;
    }
  }
  return maxIndex;
}

function flip(arr, k) {
  let i = 0;
  while (i < k) {
    [arr[i], arr[k]] = [arr[k], arr[i]];
    i++;
    k--;
  }
}`,

  `// Bitonic Sort Implementation
function bitonicSort(arr, up = true) {
  bitonicMerge(arr, 0, arr.length, up);
  return arr;
}

function bitonicMerge(arr, low, cnt, up) {
  if (cnt > 1) {
    const k = Math.floor(cnt / 2);
    bitonicCompare(arr, low, cnt, up);
    bitonicMerge(arr, low, k, up);
    bitonicMerge(arr, low + k, k, up);
  }
}

function bitonicCompare(arr, low, cnt, up) {
  const k = Math.floor(cnt / 2);
  for (let i = low; i < low + k; i++) {
    if ((arr[i] > arr[i + k]) === up) {
      [arr[i], arr[i + k]] = [arr[i + k], arr[i]];
    }
  }
}`,

  `// Odd-Even Sort Implementation
function oddEvenSort(arr) {
  let sorted = false;
  while (!sorted) {
    sorted = true;
    for (let i = 1; i < arr.length - 1; i += 2) {
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        sorted = false;
      }
    }
    for (let i = 0; i < arr.length - 1; i += 2) {
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        sorted = false;
      }
    }
  }
  return arr;
}`
];

function generateRandomSnippet() {
  const template = codeTemplates[Math.floor(Math.random() * codeTemplates.length)];
  const randomComment = `// Submission ${Math.random().toString(36).substring(7)}\n// Timestamp: ${new Date().toISOString()}`;
  return `${randomComment}\n${template}`;
}

function generateSubmissions() {
  const submissions = [];
  const startDate = new Date('2024-01-01');

  // Generate exactly 20 submissions, one for each sorting implementation
  for (let i = 0; i < 20; i++) {
    submissions.push({
      code: codeTemplates[i], // Use each template exactly once
      userId: `test-user-${i + 1}`, // Assign a unique test user to each snippet
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