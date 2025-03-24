from .codebert_analyzer import CodeBERTAnalyzer
from .structural_analysis import StructuralAnalysis
from .gradient_analysis import GradientAnalysis

# from .codebert_attention import CodeBERTAttentionAnalyzer
from .attention import CodeSimilarityAnalyzer


class CombinedAnalyzer(
    CodeBERTAnalyzer,
    StructuralAnalysis,
    GradientAnalysis,
    CodeSimilarityAnalyzer,
    # CodeBERTAttentionAnalyzer,
):
    pass


__all__ = ["CombinedAnalyzer"]
