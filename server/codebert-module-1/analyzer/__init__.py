from .codebert_analyzer import CodeBERTAnalyzer
from .structural_analysis import StructuralAnalysis
from .gradient_analysis import GradientAnalysis
from .codebert_attention import CodeBERTAttentionAnalyzer

class CombinedAnalyzer(CodeBERTAnalyzer, StructuralAnalysis, GradientAnalysis, CodeBERTAttentionAnalyzer):
    pass

__all__ = ['CombinedAnalyzer']