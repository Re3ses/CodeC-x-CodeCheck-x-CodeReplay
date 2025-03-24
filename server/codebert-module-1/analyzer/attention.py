from transformers import RobertaModel, RobertaTokenizer
import torch


class CodeSimilarityAnalyzer:
    def __init__(self, model_name="microsoft/codebert-base"):
        self.model = RobertaModel.from_pretrained(model_name, output_attentions=True)
        self.tokenizer = RobertaTokenizer.from_pretrained(model_name)

    def get_attention_matrices(self, code_snippets):
        """Tokenize together, get full attention for each layer"""
        inputs = self.tokenizer(code_snippets, return_tensors="pt", padding=True)

        with torch.no_grad():
            outputs = self.model(**inputs, output_attentions=True)

        if outputs.attentions is None:
            raise ValueError("Model outputs do not contain attentions.")

        attentions = torch.stack(
            outputs.attentions
        )  # Shape: (num_layers, num_heads, seq_len, seq_len)

        # Get the input_ids and ensure it's a 1D tensor after squeezing
        input_ids = inputs["input_ids"].squeeze()
        if input_ids.ndim > 1:
            # If it's still 2D (more than one code snippet), take the first one
            input_ids = input_ids[0]

        tokens = self.tokenizer.convert_ids_to_tokens(input_ids.tolist())

        return tokens, attentions  # Return full attention data (layer-wise)

    def compare(self, code_snippets):
        tokens, attentions = self.get_attention_matrices(code_snippets)

        num_layers, batch_size, num_heads, seq_len, _ = attentions.shape
        print(
            f"Extracted {num_layers} layers, batch size {batch_size}, {num_heads} heads, sequence length {seq_len}"
        )
        print(f"Shape of attentions tensor: {attentions.shape}")
        print(f"Length of tokens: {len(tokens)}")

        attention_results = {
            "tokens": tokens,
            "layer_wise_attention": attentions[0].tolist(),
        }
        return attention_results
