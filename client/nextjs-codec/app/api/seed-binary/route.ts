import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import UserSubmissions from '@/models/UserSubmissions';

const codeVariants = {
  main: `#include <iostream>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    int arr[100];
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    int left = 0, right = n - 1;
    while(left <= right) {
        int mid = left + (right - left) / 2;
        if(arr[mid] == target) {
            cout << mid << endl;
            return 0;
        }
        if(arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    }
    cout << -1 << endl;
    return 0;
}`,

  identical: `#include <iostream>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    int arr[100];
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    int left = 0, right = n - 1;
    while(left <= right) {
        int mid = left + (right - left) / 2;
        if(arr[mid] == target) {
            cout << mid << endl;
            return 0;
        }
        if(arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    }
    cout << -1 << endl;
    return 0;
}`,

  renamedVariables: `#include <iostream>
using namespace std;

int main() {
    int size, searchValue;
    cin >> size >> searchValue;
    int numbers[100];
    for(int index = 0; index < size; index++) {
        cin >> numbers[index];
    }
    
    int start = 0, end = size - 1;
    while(start <= end) {
        int middle = start + (end - start) / 2;
        if(numbers[middle] == searchValue) {
            cout << middle << endl;
            return 0;
        }
        if(numbers[middle] < searchValue)
            start = middle + 1;
        else
            end = middle - 1;
    }
    cout << -1 << endl;
    return 0;
}`,

  reorderedStatements: `#include <iostream>
using namespace std;

int main() {
    int arr[100];
    int n, target;
    int left = 0;
    cin >> n >> target;
    int right = n - 1;
    
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    while(left <= right) {
        int mid = left + (right - left) / 2;
        if(arr[mid] == target) {
            cout << mid << endl;
            return 0;
        }
        if(target > arr[mid])
            left = mid + 1;
        else
            right = mid - 1;
    }
    cout << -1 << endl;
    return 0;
}`,

  withComments: `#include <iostream>
using namespace std;

// Binary search implementation to find target in sorted array
int main() {
    // Input size and target value
    int n, target;
    cin >> n >> target;
    
    // Input array of size n
    int arr[100];
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    // Initialize binary search boundaries
    int left = 0, right = n - 1;
    
    // Binary search loop
    while(left <= right) {
        // Calculate middle point safely avoiding overflow
        int mid = left + (right - left) / 2;
        
        // Check if target is found
        if(arr[mid] == target) {
            cout << mid << endl;
            return 0;
        }
        
        // Update search boundaries
        if(arr[mid] < target)
            left = mid + 1;    // Search right half
        else
            right = mid - 1;   // Search left half
    }
    
    // Target not found
    cout << -1 << endl;
    return 0;
}`,

  modifiedControlFlow: `#include <iostream>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    int arr[100];
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    int left = 0, right = n - 1;
    bool found = false;
    
    do {
        int mid = left + (right - left) / 2;
        if(arr[mid] == target) {
            cout << mid << endl;
            found = true;
            break;
        }
        else if(arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    } while(left <= right);
    
    if(!found)
        cout << -1 << endl;
    return 0;
}`,

  dummyCode: `#include <iostream>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    int arr[100];
    int debug_count = 0;  // unused counter
    string status = "searching";  // dummy string
    bool isSearching = true;  // dummy flag
    
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    int left = 0, right = n - 1;
    while(left <= right && isSearching) {  // dummy condition
        debug_count++;  // dummy increment
        int mid = left + (right - left) / 2;
        status = "checking mid point";  // dummy assignment
        
        if(arr[mid] == target) {
            cout << mid << endl;
            return 0;
        }
        if(arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    }
    cout << -1 << endl;
    return 0;
}`,

  partialDuplication: `#include <iostream>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    int arr[100];
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    // First half search
    int left = 0, right = n/2;
    while(left <= right) {
        int mid = left + (right - left) / 2;
        if(arr[mid] == target) {
            cout << mid << endl;
            return 0;
        }
        if(arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    }
    
    // Second half search
    left = n/2 + 1;
    right = n - 1;
    while(left <= right) {
        int mid = left + (right - left) / 2;
        if(arr[mid] == target) {
            cout << mid << endl;
            return 0;
        }
        if(arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    }
    
    cout << -1 << endl;
    return 0;
}`,

  completelyDifferent: `#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    int arr[100];
    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    auto it = lower_bound(arr, arr + n, target);
    if(it != arr + n && *it == target)
        cout << it - arr << endl;
    else
        cout << -1 << endl;
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
      problem: "counting-vowels-6463556035",
      room: "comp-UzTQiHNHCV",
      submission_date: new Date(`2024-02-25T${10 + index}:00:00Z`),
      attempt_count: 1,
      start_time: 1708848000000 + (index * 900000),
      end_time: 1708848120000 + (index * 900000),
      completion_time: 120000 + (index * 30000),
      paste_history: ""
    }));

    console.log(`Preparing to insert ${submissions.length} submissions`);

    await UserSubmissions.deleteMany({
      problem: "factorial-calculation-8463556035",
      room: "comp-UzTQiHNHCV"
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