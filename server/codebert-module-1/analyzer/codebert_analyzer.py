import torch
from transformers import RobertaTokenizer, RobertaModel
import numpy as np
from typing import List, Dict, Tuple, Optional
import re
from dataclasses import dataclass

# unused import statements
# import matplotlib

# matplotlib.use("Agg")  # Add this near the top of the file, before importing pyplot
# import matplotlib.pyplot as plt
# import matplotlib.gridspec as gridspec  # Add this import
# from scipy.spatial import ConvexHull  # Add this import
# from umap import UMAP
# from sklearn.cluster import DBSCAN
# import pandas as pd
# import io
# import base64
# import json
# import traceback
# import logging


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
        self.tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")
        self.model = RobertaModel.from_pretrained("microsoft/codebert-base")
        self.model.to(self.device)
        self.model.eval()
        self.embedding_cache = {}

        # Parameters for adjusting similarity calculation
        self.scaling_exponent = (
            3.0  # Higher values make small differences more pronounced
        )
        self.amplification_factor = (
            5.0  # Amplifies differences in the transformed space
        )

    def preprocess_code(self, code: str) -> str:
        """Preprocess code for CodeBERT analysis."""
        # Normalize whitespace and remove newlines/tabs
        code = re.sub(r"\s+", "", code).replace("\n", "").replace("\t", "").strip()

        # Truncate to 512 tokens with proper word boundary
        return code[:509].rsplit(" ", 1)[0] + "..." if len(code) > 512 else code

    def get_embedding(self, code: str) -> np.ndarray:
        """Get code embedding using CodeBERT with mean pooling."""
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

            # Use mean pooling
            embedding = outputs.last_hidden_state.mean(dim=1).cpu().numpy()[0]

            # Normalize the embedding
            embedding /= np.linalg.norm(embedding)

            self.embedding_cache[cache_key] = embedding
            if len(self.embedding_cache) > 1000:
                self.embedding_cache.pop(next(iter(self.embedding_cache)))
            return embedding

    def calculate_similarity(self, code1: str, code2: str) -> float:
        """Calculate similarity between two code snippets with improved scaling."""
        emb1 = self.get_embedding(code1)
        emb2 = self.get_embedding(code2)

        # Base similarity (cosine similarity)
        cosine_sim = np.dot(emb1, emb2)

        # Apply non-linear transformation to emphasize differences
        similarity = cosine_sim

        # Step 1: Convert to a distance measure (0 = identical, higher = more different)
        distance = 1 - similarity

        # Ensure distance is non-negative
        if distance < 0:
            distance = 0

        # Step 2: Amplify the distance (makes small differences larger)
        amplified_distance = distance * self.amplification_factor

        # Ensure amplified_distance is non-negative
        if amplified_distance < 0:
            amplified_distance = 0

        # Step 3: Apply non-linear scaling (exponential) to further separate close values
        scaled_distance = min(1, amplified_distance ** (1 / self.scaling_exponent))

        # Step 4: Convert back to similarity score
        transformed_similarity = 1 - scaled_distance

        return max(0, transformed_similarity)

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
