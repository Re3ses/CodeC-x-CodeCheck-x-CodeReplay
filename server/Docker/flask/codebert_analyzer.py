import torch
from transformers import RobertaTokenizer, RobertaModel
import numpy as np
from typing import List, Dict, Tuple, Optional
import re
from dataclasses import dataclass


@dataclass
class SnippetInfo:
    learner: str
    learner_id: str
    file_name: str
    code: str
    timestamp: str


# @dataclass
# class ProblemSubmission:
#     langauge_used: str
#     code: str
#     score: int
#     score_overall_count: int
#     learner: str
#     learner_id: str
#     problem: str
#     room: str
#     attempt_count: int
#     start_time: int
#     end_time: int
#     completion_time: int
#     paste_history: List[str]
#     submission_date: str


@dataclass
class SequentialSimilarity:
    from_index: int
    to_index: int
    learner_id: str
    similarity: float
    codebert_score: float


class CodeBERTAnalyzer:
    def __init__(self, model_path: Optional[str] = None):
        """Initialize the CodeBERT analyzer with local model."""
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.embedding_cache = {}
        self.SIMILARITY_THRESHOLD = 0.7
        self.tokenizer = None
        self.model = None

    def _ensure_model_loaded(self):
        """Lazy load models only when needed"""
        if self.tokenizer is None:
            self.tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")
        if self.model is None:
            self.model = RobertaModel.from_pretrained("microsoft/codebert-base")
            self.model.to(self.device)
            self.model.eval()

    def preprocess_code(self, code: str) -> str:
        """Preprocess code for CodeBERT analysis."""
        code = re.sub(r"/\*[\s\S]*?\*/|//.*$", "", code, flags=re.MULTILINE)
        code = re.sub(r"\s+", " ", code).replace("\n", " ").replace("\t", " ")
        code = re.sub(
            r'(["\'])(.*?)\1',
            lambda m: "'" + m.group(2).replace("'", "\\'") + "'",
            code,
        )
        code = re.sub(r"\b0+(\d+)", r"\1", code)
        code = re.sub(r"(\d+\.\d*?)0+$", r"\1", code)
        code = code.lower().strip()
        return code[:509].rsplit(" ", 1)[0] + "..." if len(code) > 512 else code

    def get_embedding(self, code: str) -> np.ndarray:
        """Get code embedding using CodeBERT."""
        self._ensure_model_loaded()
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
            embedding /= np.linalg.norm(embedding)
            self.embedding_cache[cache_key] = embedding
            if len(self.embedding_cache) > 1000:
                self.embedding_cache.pop(next(iter(self.embedding_cache)))
            return embedding

    def calculate_similarity(self, code1: str, code2: str) -> float:
        """Calculate similarity between two code snippets using CodeBERT."""
        emb1 = self.get_embedding(code1)
        emb2 = self.get_embedding(code2)
        similarity = np.dot(emb1, emb2)
        return float((similarity + 1) / 2)  # Scale to [0, 1]

    def compute_similarity_matrix(
        self, snippets: List[SnippetInfo]
    ) -> Tuple[List[List[float]], List[Dict]]:
        """Compute similarity matrix for multiple code snippets."""
        codes = [s.code for s in snippets]
        n = len(codes)
        matrix = [[0.0] * n for _ in range(n)]

        for i in range(n):
            for j in range(i, n):
                matrix[i][j] = matrix[j][i] = (
                    100
                    if i == j
                    else round(self.calculate_similarity(codes[i], codes[j]) * 100)
                )

        snippet_info = [
            {
                "learner": s.learner,
                "learner_id": s.learner_id,
                "fileName": s.file_name,
                "code": s.code,
                "timestamp": str(s.timestamp),
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
            score = self.calculate_similarity(
                snapshots[i]["code"], snapshots[i + 1]["code"]
            )
            similarities.append(
                SequentialSimilarity(
                    from_index=i,
                    to_index=i + 1,
                    learner_id=snapshots[i]["learner_id"],
                    similarity=round(score * 100),
                    codebert_score=round(score * 100),
                )
            )
        return similarities
