// utils/similarity.ts
export function calculateCodeSimilarity(code1: string, code2: string): number {
    // Remove comments and whitespace
    const cleanCode1 = code1.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').replace(/\s+/g, ' ').trim();
    const cleanCode2 = code2.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').replace(/\s+/g, ' ').trim();
    
    // Tokenize the code
    const tokens1 = cleanCode1.split(/[\s,{}();\[\]]+/).filter(Boolean);
    const tokens2 = cleanCode2.split(/[\s,{}();\[\]]+/).filter(Boolean);
    
    // Calculate similarity using Jaccard index
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
  