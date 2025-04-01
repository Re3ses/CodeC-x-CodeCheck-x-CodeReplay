"use client"
import AttentionView from './attentionSingle';

export default function Page() {
    // const code1 = "def mergesort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = mergesort(arr[:mid])\n    right = mergesort(arr[mid:])\n    return merge(left, right)\n\ndef merge(left, right):\n    result = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] < right[j]:\n            result.append(left[i])\n            i += 1\n        else:\n            result.append(right[j])\n            j += 1\n    result.extend(left[i:])\n    result.extend(right[j:])\n    return result";
    // const code2 = "function quicksort(arr) {\n    if (arr.length <= 1) {\n        return arr;\n    }\n    const pivot = arr[Math.floor(arr.length / 2)];\n    const left = arr.filter(x => x < pivot);\n    const middle = arr.filter(x => x === pivot);\n    const right = arr.filter(x => x > pivot);\n    return [...quicksort(left), ...middle, ...quicksort(right)];\n}";
    const code1 = "This is a very long sentence that contains many more words than the previous sentences, designed specifically to evaluate how the length of the input strings impacts the time it takes for the attention visualization to load using the bertviz library in a Google Colaboratory notebook environment.";
    const code2 = "And here we have a second very long sentence, comparable in length to the first one, which will be used as the second input to the bertviz visualization function so that we can accurately measure the loading time and observe any potential differences based on the increased text length.";

    return <AttentionView code1={code1} code2={code2} />;
}