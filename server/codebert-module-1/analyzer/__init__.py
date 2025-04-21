from .codebert_analyzer import CodeBERTAnalyzer
from .structural_analysis import StructuralAnalysis
from .gradient_analysis import GradientAnalysis
from .attention import CodeSimilarityAnalyzer

# from .codebert_attention import CodeBERTAttentionAnalyzer
from .attention import CodeSimilarityAnalyzer


class CombinedAnalyzer(
    CodeBERTAnalyzer,
    StructuralAnalysis,
    GradientAnalysis,
    CodeSimilarityAnalyzer,
):
    pass


__all__ = ["CombinedAnalyzer"]
