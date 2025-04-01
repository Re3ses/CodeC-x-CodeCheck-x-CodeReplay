export interface SimilarStructure {
    cluster_id: number;
    type: string;
    similarity: number;
    code_a: string[];
    code_b: string[];
}

export interface HighlightInfo {
    start: number;
    end: number;
    similarity: number;
    clusterId: number;
    structureType: string;
}

export interface HighlightedCode {
    code: string;
    highlights: HighlightInfo[];
}

export interface GradientAnalysis {
    tokens: string[];
    gradients: number[][];
    attention_weights?: number[][];
}