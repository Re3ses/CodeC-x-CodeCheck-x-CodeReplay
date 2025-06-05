from .codebert_analyzer import CodeBERTAnalyzer
from .structural_analysis import StructuralAnalysis
from .gradient_analysis import GradientAnalysis
from .attention import CodeSimilarityAnalyzer
from analyzer.agreement_analyzer import AgreementAnalyzer

class CombinedAnalyzer(
    CodeBERTAnalyzer,
    StructuralAnalysis,
    GradientAnalysis,
    CodeSimilarityAnalyzer,
    AgreementAnalyzer
):
    def __init__(self):
        # Call parent class initializers
        super().__init__()
        
        # Initialize agreement analyzer specific attributes
        self.colors = {
            'CodeReplay': 'purple',
            'CodeCheck': 'blue', 
            'MOSS': 'green', 
            'Dolos': 'red'
        }
        self.required_columns = ['tool_name', 'file1', 'similarity_score']
        self.is_aggregated = False

# Export the combined analyzer
__all__ = ["CombinedAnalyzer"]