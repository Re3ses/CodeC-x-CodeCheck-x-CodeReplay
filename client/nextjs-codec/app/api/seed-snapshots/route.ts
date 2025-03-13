import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import CodeSnapshot from '@/models/CodeSnapshots';

const snapshots = [
  {
    code: `#include <iostream>
using namespace std;

int main() {
    string s;
    cin >> s;
    return 0;
}`,
    timestamp: new Date('2024-02-25T10:00:00Z').toISOString(),
    learner_id: 'main',
    problemId: 'counting-vowels-1965702275',
    roomId: 'comp-2t9LleHwLG',
    submissionId: 'snapshot1',
    version: 1
  },
  {
    code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    return 0;
}`,
    timestamp: new Date('2024-02-25T10:15:00Z').toISOString(),
    learner_id: 'main',
    problemId: 'counting-vowels-1965702275',
    roomId: 'comp-2t9LleHwLG',
    submissionId: 'snapshot2',
    version: 2
  },
  {
    code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    int vowelCount = 0;
    return 0;
}`,
    timestamp: new Date('2024-02-25T10:30:00Z').toISOString(),
    learner_id: 'main',
    problemId: 'counting-vowels-1965702275',
    roomId: 'comp-2t9LleHwLG',
    submissionId: 'snapshot3',
    version: 3
  },
  {
    code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    int vowelCount = 0;
    for (char c : s) {
        // Check if character is a vowel
    }
    return 0;
}`,
    timestamp: new Date('2024-02-25T10:45:00Z').toISOString(),
    learner_id: 'main',
    problemId: 'counting-vowels-1965702275',
    roomId: 'comp-2t9LleHwLG',
    submissionId: 'snapshot4',
    version: 4
  },
  {
    code: `#include <iostream>
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
    return 0;
}`,
    timestamp: new Date('2024-02-25T11:00:00Z').toISOString(),
    learner_id: 'main',
    problemId: 'counting-vowels-1965702275',
    roomId: 'comp-2t9LleHwLG',
    submissionId: 'snapshot5',
    version: 5
  },
  {
    code: `#include <iostream>
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
    timestamp: new Date('2024-02-25T11:15:00Z').toISOString(),
    learner_id: 'main',
    problemId: 'counting-vowels-1965702275',
    roomId: 'comp-2t9LleHwLG',
    submissionId: 'snapshot6',
    version: 6
  },
  {
    code: `#include <iostream>
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
    timestamp: new Date('2024-02-25T11:30:00Z').toISOString(),
    learner_id: 'main',
    problemId: 'counting-vowels-1965702275',
    roomId: 'comp-2t9LleHwLG',
    submissionId: 'snapshot7',
    version: 7
  },
  {
    code: `#include <iostream>
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
    timestamp: new Date('2024-02-25T11:45:00Z').toISOString(),
    learner_id: 'main',
    problemId: 'counting-vowels-1965702275',
    roomId: 'comp-2t9LleHwLG',
    submissionId: 'snapshot8',
    version: 8
  },
  {
    code: `#include <iostream>
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
    timestamp: new Date('2024-02-25T12:00:00Z').toISOString(),
    learner_id: 'main',
    problemId: 'counting-vowels-1965702275',
    roomId: 'comp-2t9LleHwLG',
    submissionId: 'snapshot9',
    version: 9
  },
  {
    code: `#include <iostream>
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
    timestamp: new Date('2024-02-25T12:15:00Z').toISOString(),
    learner_id: 'main',
    problemId: 'counting-vowels-1965702275',
    roomId: 'comp-2t9LleHwLG',
    submissionId: 'snapshot10',
    version: 10
  }
];

export async function POST() {
  try {
    await dbConnect();
    console.log('Connected to database');

    await CodeSnapshot.deleteMany({
      problemId: 'counting-vowels-1965702275',
      roomId: 'comp-2t9LleHwLG',
      learner_id: 'main'
    });
    console.log('Cleared existing snapshots');

    const result = await CodeSnapshot.insertMany(snapshots);
    console.log(`Inserted ${result.length} snapshots`);

    return NextResponse.json({ 
      success: true,
      message: 'Snapshots seeded successfully',
      count: result.length 
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { success: false, message: 'Error seeding snapshots', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
    try {
      await dbConnect();
      console.log('Connected to database');
  
      const result = await CodeSnapshot.deleteMany({
        problemId: 'counting-vowels-1965702275',
        roomId: 'comp-2t9LleHwLG',
        learner_id: 'main' 
      });
  
      console.log(`Deleted ${result.deletedCount} snapshots`);
  
      return NextResponse.json({ 
        success: true,
        message: 'Snapshots deleted successfully',
        count: result.deletedCount 
      });
    } catch (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { success: false, message: 'Error deleting snapshots', error: error.message },
        { status: 500 }
      );
    }
  }