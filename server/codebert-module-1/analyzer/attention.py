from transformers import BertModel, BertTokenizer
import torch


class CodeSimilarityAnalyzer:
    def __init__(self, model_version="bert-base-uncased"):
        self.model_version = model_version
        self.model = None
        self.tokenizer = None
        self._load_model()

    def _load_model(self):
        if self.model is None:
            self.model = BertModel.from_pretrained(
                self.model_version, output_attentions=True
            )
            print(
                f"BERT Model loaded with output_attentions: {self.model.config.output_attentions}"
            )
        if self.tokenizer is None:
            self.tokenizer = BertTokenizer.from_pretrained(
                self.model_version, do_lower_case=True
            )

    def analyze_attention(self, code1, code2, layer=4, head=3):
        inputs = self.tokenizer(
            [code1, code2], return_tensors="pt", padding=True, truncation=True
        )
        outputs = self.model(**inputs, output_attentions=True)  # Explicitly set here
        # print("Outputs:", outputs)
        # if outputs is not None:
        #     print("Outputs.attentions:", outputs.attentions)
        # else:
        #     print("Outputs is None")
        if outputs.attentions is not None:
            attention_weights = (
                outputs.attentions[layer][0, head].detach().numpy().tolist()
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
