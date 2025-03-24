from transformers import RobertaModel, RobertaTokenizer
import torch


class CodeSimilarityAnalyzer:
    def __init__(self, model_name="microsoft/codebert-base"):
        self.model = RobertaModel.from_pretrained(model_name, output_attentions=True)
        self.tokenizer = RobertaTokenizer.from_pretrained(model_name)

    def get_attention_matrix(self, code):
        # Tokenize and encode the code
        inputs = self.tokenizer(code, return_tensors="pt")
        # Forward pass through the model
        with torch.no_grad():
            outputs = self.model(**inputs)
        # Extract attention from the last layer
        last_layer_attention = outputs.attentions[-1]
        # Average over all heads
        average_attention = last_layer_attention.mean(dim=1).squeeze(0)
        # Normalize the attention scores
        attention_matrix = average_attention / average_attention.sum(dim=-1, keepdim=True)
        # Extract tokens
        tokens = self.tokenizer.convert_ids_to_tokens(inputs['input_ids'].squeeze().tolist())

        return tokens, attention_matrix

    def compare(self, code_snippets):
        num_snippets = len(code_snippets)
        similarity_results = []

        # Precompute attention matrices and tokens for all snippets
        attention_data = [self.get_attention_matrix(code) for code in code_snippets]

        # Perform 1-to-all comparison
        for i, (tokens1, attention1) in enumerate(attention_data):
            similarities = {}

            for j, (tokens2, attention2) in enumerate(attention_data):
                if i == j:  # Skip self-comparison
                    continue

                # Compare similarity using cosine similarity
                similarity_matrix = torch.matmul(attention1, attention2.T)

                # Map tokens to similarity scores
                similarities[j] = {
                    tokens1[idx1]: {
                        tokens2[idx2]: similarity_matrix[idx1][idx2].item()
                        for idx2 in range(len(tokens2))
                    }
                    for idx1 in range(len(tokens1))
                }

            similarity_results.append(similarities)

        return similarity_results