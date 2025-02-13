# codebert_analyzer.py
import torch
from transformers import RobertaTokenizer, RobertaModel
import numpy as np
from typing import List, Dict, Tuple, Optional
import re
from dataclasses import dataclass


@dataclass
class SnippetInfo:
    learner_id: str
    file_name: str
    code: str
    timestamp: str


@dataclass
class ProblemSubmission:
    langauge_used: str
    code: str
    score: int
    score_overall_count: int
    learner: str
    learner_id: str
    problem: str
    room: str
    attempt_count: int
    start_time: int
    end_time: int
    completion_time: int
    paste_history: List[str]
    submission_date: str


@dataclass
class SequentialSimilarity:
    from_index: int
    to_index: int
    learner_id: str
    similarity: float
    codebert_score: float


class CodeBERTAnalyzer:
    def __init__(self, model_path: Optional[str] = None):
        """Initialize the CodeBERT analyzer with local model.

        Args:
            model_path: Optional path to local model. If None, downloads from HuggingFace.
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")
        self.model = RobertaModel.from_pretrained("microsoft/codebert-base")
        self.model.to(self.device)
        self.model.eval()
        self.embedding_cache = {}
        self.SIMILARITY_THRESHOLD = 0.7

    def preprocess_code(self, code: str) -> str:
        """Preprocess code for CodeBERT analysis."""
        # Remove comments
        code = re.sub(r"/\*[\s\S]*?\*/|//.*$", "", code, flags=re.MULTILINE)

        # Normalize whitespace
        code = re.sub(r"\s+", " ", code)
        code = code.replace("\n", " ").replace("\t", " ")

        # Standardize variable names
        code = re.sub(
            r"\b(let|var|const)\s+(\w+)",
            lambda m: f"{m.group(1)} {re.sub(r'([A-Z])', lambda x: x.group(1).lower(), m.group(2))}",
            code,
        )

        # Normalize strings
        code = re.sub(
            r'(["\'])(.*?)\1', lambda m: f"'{m.group(2).replace("'", "\\'")}'", code
        )

        # Standardize numbers
        code = re.sub(r"\b0+(\d+)", r"\1", code)  # Remove leading zeros
        code = re.sub(r"(\d+\.\d*?)0+$", r"\1", code)  # Remove trailing zeros
        code = code.lower().strip()

        # Truncate if too long
        if len(code) > 512:
            code = code[:509].rsplit(" ", 1)[0] + "..."

        return code

    def get_embedding(self, code: str) -> np.ndarray:
        """Get code embedding using local CodeBERT."""
        cache_key = hash(code)
        if cache_key in self.embedding_cache:
            return self.embedding_cache[cache_key]

        preprocessed = self.preprocess_code(code)

        with torch.no_grad():
            inputs = self.tokenizer(
                preprocessed,
                return_tensors="pt",
                max_length=512,
                truncation=True,
                padding=True,
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            outputs = self.model(**inputs)
            embedding = outputs.last_hidden_state.mean(dim=1).cpu().numpy()[0]

            # Normalize embedding
            embedding = embedding / np.linalg.norm(embedding)

            self.embedding_cache[cache_key] = embedding

            # Cache management
            if len(self.embedding_cache) > 1000:
                self.embedding_cache.pop(next(iter(self.embedding_cache)))

            return embedding

    def calculate_similarity(self, code1: str, code2: str) -> float:
        """Calculate similarity between two code snippets."""
        try:
            emb1 = self.get_embedding(code1)
            emb2 = self.get_embedding(code2)

            similarity = np.dot(emb1, emb2)
            normalized = (similarity + 1) / 2  # Scale to [0, 1]

            return float(normalized)

        except Exception as e:
            print(f"Error calculating similarity: {e}")
            return self.calculate_fallback_similarity(code1, code2)

    def calculate_fallback_similarity(self, code1: str, code2: str) -> float:
        """Calculate fallback similarity using token-based approach."""
        tokens1 = self.preprocess_code(code1).split()
        tokens2 = self.preprocess_code(code2).split()

        all_tokens = list(set(tokens1 + tokens2))

        def get_vector(tokens):
            freq = {}
            for t in tokens:
                freq[t] = freq.get(t, 0) + 1
            return [freq.get(t, 0) / len(tokens) for t in all_tokens]

        vec1 = get_vector(tokens1)
        vec2 = get_vector(tokens2)

        dot_product = sum(v1 * v2 for v1, v2 in zip(vec1, vec2))
        mag1 = np.sqrt(sum(v * v for v in vec1))
        mag2 = np.sqrt(sum(v * v for v in vec2))

        return dot_product / (mag1 * mag2) if mag1 and mag2 else 0

    def compute_similarity_matrix(
        self, snippets: List[SnippetInfo]
    ) -> Tuple[List[List[float]], List[Dict]]:
        """Compute similarity matrix for multiple code snippets."""
        codes = [s.code for s in snippets]
        n = len(codes)
        matrix = [[0.0] * n for _ in range(n)]

        for i in range(n):
            for j in range(i, n):
                if i == j:
                    similarity = 100
                else:
                    similarity = round(
                        self.calculate_similarity(codes[i], codes[j]) * 100
                    )
                matrix[i][j] = matrix[j][i] = similarity

        snippet_info = [
            {
                "learner_id": s.learner_id,
                "fileName": s.file_name,
                "code": s.code,
                "timestamp": s.timestamp,
            }
            for s in snippets
        ]

        return matrix, snippet_info

    def compute_sequential_similarities(
        self, snapshots: List[Dict]
    ) -> List[SequentialSimilarity]:
        """Compute sequential similarities between consecutive snapshots."""
        similarities = []

        for i in range(len(snapshots) - 1):
            current = snapshots[i]
            next_snapshot = snapshots[i + 1]

            score = self.calculate_similarity(current["code"], next_snapshot["code"])

            similarities.append(
                SequentialSimilarity(
                    from_index=i,
                    to_index=i + 1,
                    learner_id=current["learner_id"],
                    similarity=round(score * 100),
                    codebert_score=round(score * 100),
                )
            )

        return similarities
