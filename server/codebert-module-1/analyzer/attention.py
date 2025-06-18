from transformers import RobertaModel, RobertaTokenizer
import torch
from .codebert_analyzer import CodeBERTAnalyzer

class CodeSimilarityAnalyzer:
    def __init__(self, model_name="microsoft/codebert-base"):
        self.model_name = model_name
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.tokenizer = None
        self._load_model()

    def _load_model(self):
        if self.model is None:
            self.model = RobertaModel.from_pretrained(
                self.model_name, 
                output_attentions=True
            ).to(self.device)
            print(f"CodeBERT Model loaded on {self.device}")
            
        if self.tokenizer is None:
            self.tokenizer = RobertaTokenizer.from_pretrained(self.model_name)

    def analyze_attention(self, code1, code2, layer=4, head=3):
        try:
            # Tokenize inputs
            inputs = self.tokenizer(
                [code1, code2],
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors="pt"
            ).to(self.device)
            
            # Get model outputs with attention
            with torch.no_grad():
                outputs = self.model(**inputs, output_attentions=True)

            if outputs.attentions is not None:
                attention_weights = (
                    outputs.attentions[layer][0, head].cpu().numpy().tolist()
                )
                tokens1 = self.tokenizer.tokenize(code1)
                tokens2 = self.tokenizer.tokenize(code2)
                return {
                    "tokens1": tokens1,
                    "tokens2": tokens2,
                    "attention_weights": attention_weights,
                }
            else:
                return {"error": "Attention weights not found in outputs"}
        except Exception as e:
            return {"error": f"Error in analyze_attention: {str(e)}"}
