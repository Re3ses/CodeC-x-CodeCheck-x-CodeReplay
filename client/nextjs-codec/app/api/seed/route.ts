import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import UserSubmissions from '@/models/UserSubmissions';

const codeVariants = {
main: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    cin >> s;
    int vowelCount = 0;
    for (char c : s) {
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            vowelCount++;
        }
    }
    cout << vowelCount << endl;
    return 0;
}`,
identical: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    cin >> s;
    int vowelCount = 0;
    for (char c : s) {
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            vowelCount++;
        }
    }
    cout << vowelCount << endl;
    return 0;
}`,

renamedVariables: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string inputText;
    cin >> inputText;
    int numVowels = 0;
    for (char currentChar : inputText) {
        if (currentChar == 'a' || currentChar == 'e' || currentChar == 'i' || currentChar == 'o' || currentChar == 'u') {
            numVowels++;
        }
    }
    cout << numVowels << endl;
    return 0;
}`,

reorderedStatements: `#include <string>
#include <iostream>
using namespace std;
int main() {
    int count = 0;
    string input;
    cin >> input;
    for (char c : input) {
        if (c == 'u' || c == 'o' || c == 'i' || c == 'e' || c == 'a') {
            count++;
        }
    }
    cout << count << endl;
    return 0;
}`,

withComments: `#include <iostream>
#include <string>
using namespace std;

// Program to count vowels in a string
int main() {
    // Input string variable
    string text;
    
    // Get input from user
    cin >> text;
    
    // Initialize vowel counter
    int vowelCount = 0;
    
    // Iterate through each character
    for (char c : text) {
        // Check if character is a vowel
        if (c == 'a' || 
            c == 'e' || 
            c == 'i' || 
            c == 'o' || 
            c == 'u') {
            vowelCount++;
        }
    }
    
    // Output result
    cout << vowelCount << endl;
    return 0;
}`,

modifiedControlFlow: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    cin >> s;
    int vowelCount = 0;
    int i = 0;
    while (i < s.length()) {
        switch(s[i]) {
            case 'a':
            case 'e':
            case 'i':
            case 'o':
            case 'u':
                vowelCount++;
                break;
            default:
                break;
        }
        i++;
    }
    cout << vowelCount << endl;
    return 0;
}`,

dummyCode: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    cin >> s;
    int temp = 0;  // unused variable
    int vowelCount = 0;
    string debug = "checking vowels";  // dummy string
    bool isProcessing = true;  // dummy flag
    for (char c : s) {
        temp++;  // dummy increment
        if (isProcessing) {  // dummy condition
            if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
                vowelCount++;
            }
        }
    }
    cout << vowelCount << endl;
    return 0;
}`,

partialDuplication: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    cin >> s;
    int vowelCount = 0;
    // First half check
    for (int i = 0; i < s.length()/2; i++) {
        if (s[i] == 'a' || s[i] == 'e' || s[i] == 'i' || s[i] == 'o' || s[i] == 'u') {
            vowelCount++;
        }
    }
    // Second half check (duplicated logic)
    for (int i = s.length()/2; i < s.length(); i++) {
        if (s[i] == 'a' || s[i] == 'e' || s[i] == 'i' || s[i] == 'o' || s[i] == 'u') {
            vowelCount++;
        }
    }
    cout << vowelCount << endl;
    return 0;
}`,

completelyDifferent: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    string s;
    cin >> s;
    int result = count_if(s.begin(), s.end(), 
        [](char c) { 
            return string("aeiou").find(c) != string::npos; 
        });
    cout << result << endl;
    return 0;
}`
};

const learners = [
    { name: "main", id: new mongoose.Types.ObjectId() },
    { name: "identical", id: new mongoose.Types.ObjectId() },
    { name: "renamed", id: new mongoose.Types.ObjectId() },
    { name: "reordered", id: new mongoose.Types.ObjectId() },
    { name: "commented", id: new mongoose.Types.ObjectId() },
    { name: "modified", id: new mongoose.Types.ObjectId() },
    { name: "dummy", id: new mongoose.Types.ObjectId() },
    { name: "duplicated", id: new mongoose.Types.ObjectId() },
    { name: "different", id: new mongoose.Types.ObjectId() }
];

export async function POST() {
  try {
    await dbConnect();
    console.log('Connected to database');

    const submissions = Object.entries(codeVariants).map(([variant, code], index) => ({
      language_used: "cpp",
      code,
      score: 60,
      score_overall_count: 60,
      verdict: "ACCEPTED",
      learner: learners[index].name,
      learner_id: learners[index].id,
      problem: "counting-vowels-1965702275",
      room: "comp-2t9LleHwLG",
      submission_date: new Date(`2024-02-25T${10 + index}:00:00Z`),
      attempt_count: 1,
      start_time: 1708848000000 + (index * 900000),
      end_time: 1708848120000 + (index * 900000),
      completion_time: 120000 + (index * 30000),
      paste_history: ""
    }));

    console.log(`Preparing to insert ${submissions.length} submissions`);

    await UserSubmissions.deleteMany({
      problem: "counting-vowels-1965702275",
      room: "comp-2t9LleHwLG"
    });
    console.log('Cleared existing submissions');

    const result = await UserSubmissions.insertMany(submissions);
    console.log(`Inserted ${result.length} submissions`);

    return NextResponse.json({ 
      success: true,
      message: 'Database seeded successfully',
      count: result.length 
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { success: false, message: 'Error seeding database', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await dbConnect();
    console.log('Connected to database');

    const result = await UserSubmissions.deleteMany({
      problem: "counting-vowels-6463556035",
      room: "comp-UzTQiHNHCV"
    });

    console.log(`Deleted ${result.deletedCount} submissions`);

    return NextResponse.json({ 
      success: true,
      message: 'Database cleared successfully',
      count: result.deletedCount 
    });
  } catch (error) {
    console.error('Clear error:', error);
    return NextResponse.json(
      { success: false, message: 'Error clearing database', error: error.message },
      { status: 500 }
    );
  }
}