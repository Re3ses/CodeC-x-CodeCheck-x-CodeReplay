import mongoose from "mongoose";

// Types to ensure type safety
interface CodeSnapshot {
  code: string;
  timestamp: string;
}

interface SubmissionSeedData {
  learner_id: mongoose.Types.ObjectId;
  roomId: string;
  problemId: string;
  submissionId?: string;
  snapshots: CodeSnapshot[];
}

export const seedCodeSnapshots: SubmissionSeedData[] = [
  {
    learner_id: new mongoose.Types.ObjectId(),
    roomId: 'algorithms_study_room',
    problemId: 'bubble_sort',
    submissionId: 'submission_bubble_sort_001',
    snapshots: [
      {
        code: `def bubble_sort(arr):
    # Initial attempt - placeholder implementation
    return arr`,
        timestamp: '2024-01-25T14:00:00Z'
      },
      {
        code: `def bubble_sort(arr):
    # Basic bubble sort implementation
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j, arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
        timestamp: '2024-01-25T14:15:00Z'
      },
      {
        code: `def bubble_sort(arr):
    # Optimized bubble sort with early termination
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
        timestamp: '2024-01-25T14:30:00Z'
      },
      {
        code: `def bubble_sort(arr):
    # Added comments to explain the algorithm
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            # Compare adjacent elements
            if arr[j] > arr[j + 1]:
                # Swap if the elements are in the wrong order
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            # Exit early if no swaps were made
            break
    return arr`,
        timestamp: '2024-01-25T14:45:00Z'
      },
      {
        code: `def bubble_sort(arr):
    # Refactored to make function more concise
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
        timestamp: '2024-01-25T15:00:00Z'
      },
      {
        code: `def bubble_sort(arr):
    # Added parameter checks for robustness
    if not isinstance(arr, list):
        raise TypeError("Input must be a list")
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
        timestamp: '2024-01-25T15:15:00Z'
      },
      {
        code: `def bubble_sort(arr):
    # Added input validation and edge case handling
    if not isinstance(arr, list):
        raise TypeError("Input must be a list")
    if len(arr) <= 1:
        return arr  # Already sorted
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
        timestamp: '2024-01-25T15:30:00Z'
      },
      {
        code: `def bubble_sort(arr):
    # Improved comments for better readability
    if not isinstance(arr, list):
        raise TypeError("Input must be a list")
    if len(arr) <= 1:
        return arr  # No need to sort
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(n - i - 1):
            # Swap if current element is greater than the next
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break  # List is already sorted
    return arr`,
        timestamp: '2024-01-25T15:45:00Z'
      },
      {
        code: `def bubble_sort(arr):
    # Final version with detailed validation and efficiency notes
    if not isinstance(arr, list):
        raise TypeError("Input must be a list")
    if len(arr) <= 1:
        return arr  # Single element or empty list is already sorted
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(n - i - 1):
            # Swap adjacent elements if they're in the wrong order
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break  # Optimization: stop if no swaps were made
    return arr`,
        timestamp: '2024-01-25T16:00:00Z'
      },
      {
        code: `def bubble_sort(arr):
    # Final polished version
    if not isinstance(arr, list):
        raise TypeError("Input must be a list")
    if len(arr) <= 1:
        return arr
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
        timestamp: '2024-01-25T16:15:00Z'
      }
    ]
  }
];

