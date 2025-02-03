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
  `// Variation 1: Using a for loop
function factorial(n) {
  let result = 1;
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  return result;
}`,

  `// Variation 2: Arrow function syntax
const factorial = (n) => {
  if (n === 0) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}`,

  `// Variation 3: Ternary operator
function factorial(n) {
  return n === 0 ? 1 : n * factorial(n - 1);
}`,

  `// Variation 4:  More descriptive variable names
function factorial(number) {
  if (number === 0) {
    return 1;
  } else {
    return number * factorial(number - 1);
  }
}`,

  `// Variation 5: Added comments
function factorial(n) { // Calculate factorial
  if (n === 0) { // Base case
    return 1;
  } else { // Recursive step
    return n * factorial(n - 1);
  }
}`,

  `// Variation 6:  Slightly different formatting
function factorial (n) {
  if (n === 0) return 1;
  else return n * factorial(n - 1);
}`,

  `// Variation 7:  Using a while loop
function factorial(n) {
  let result = 1;
  let i = 1;
  while (i <= n) {
    result *= i;
    i++;
  }
  return result;
}`,

  `// Variation 8:  Using BigInt for larger numbers (if needed)
function factorial(n) {
  if (n === 0n) { // Use BigInt
    return 1n;
  } else {
    return n * factorial(n - 1n);
  }
}`,

  `// Variation 9:  Checking for negative input
function factorial(n) {
  if (n < 0) {
    return "Factorial is not defined for negative numbers";
  } else if (n === 0) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}`,

  `// Variation 10:  Using Math.floor to handle non-integer input (optional)
function factorial(n) {
    n = Math.floor(n); // Handle non-integer input
    if (n < 0) {
      return "Factorial is not defined for negative numbers";
    } else if (n === 0) {
      return 1;
    } else {
      return n * factorial(n - 1);
    }
  }`,

  `// Variation 11:  Adding console logs for debugging
function factorial(n) {
  console.log("Calculating factorial of", n);
  if (n === 0) {
    return 1;
  } else {
    const result = n * factorial(n - 1);
    console.log("Factorial of", n, "is", result);
    return result;
  }
}`,

  `// Variation 12:  Using a named function expression for recursion
const factorial = function fact(n) {
  if (n === 0) {
    return 1;
  } else {
    return n * fact(n - 1); // Call the named function 'fact'
  }
};`,

  `// Variation 13:  More concise if/else
function factorial(n) {
  if (n === 0) return 1;
  return n * factorial(n - 1);
}`,

  `// Variation 14:  Slightly different indentation
function factorial(n) {
    if (n === 0) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}`,

  `// Variation 15:  Adding a docstring
/**
 * Calculates the factorial of a non-negative integer.
 * @param {number} n The input number.
 * @returns {number} The factorial of n.
 */
function factorial(n) {
  if (n === 0) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}`,

  `// Variation 16:  Using comments to explain the recursive calls
function factorial(n) {
  if (n === 0) { // Base case: factorial of 0 is 1
    return 1;
  } else { // Recursive case: n! = n * (n-1)!
    return n * factorial(n - 1);
  }
}`,

  `// Variation 17:  Using const for variables where appropriate
function factorial(n) {
  if (n === 0) {
    return 1;
  } else {
    const result = n * factorial(n - 1); // Use const here
    return result;
  }
}`,

  `// Variation 18:  Adding more whitespace
function factorial ( n ) {

  if ( n === 0 ) {
    return 1;
  } else {
    return n * factorial ( n - 1 );
  }
}`,

  `// Variation 19:  Using a different comment style
function factorial(n) {
  /*
   * Calculate the factorial of n.
   */
  if (n === 0) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}`,

  `// Variation 20: A combination of above variations
/**
 * Calculates the factorial of a number.
 * @param {number} num The number to calculate the factorial of.
 * @returns {number} The factorial of the number.
 */
const factorial = (num) => {
  if (num < 0) {
    return "Factorial is not defined for negative numbers.";
  }
  if (num === 0) return 1;
  let result = 1;
  for (let i = 1; i <= num; i++) {
    result *= i;
  }
  return result;
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

  // Generate exactly 20 submissions, one for each sorting implementation
  for (let i = 0; i < 3; i++) {
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