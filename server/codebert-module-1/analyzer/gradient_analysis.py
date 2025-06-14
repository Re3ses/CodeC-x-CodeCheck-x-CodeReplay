import torch
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import io
import base64
import traceback
from transformers import RobertaModel, RobertaTokenizer
from .codebert_analyzer import CodeBERTAnalyzer


class GradientAnalysis:
    def __init__(self):
        self.analyzer = CodeBERTAnalyzer()
        self.model = self.analyzer.model
        self.tokenizer = self.analyzer.tokenizer
        self.device = self.analyzer.device
        self.preprocess_code = self.analyzer.preprocess_code

    def analyze_embedding_gradients(self, code1: str, code2: str) -> dict:
        """Analyze gradients in the embedding space for similarity calculation."""
        try:
            print("Starting gradient analysis...")

            # Enable gradient tracking and train mode
            self.model.train()
            torch.set_grad_enabled(True)

            # Process inputs
            inputs1 = self.tokenizer(
                self.preprocess_code(code1),
                return_tensors="pt",
                max_length=512,
                truncation=True,
                padding=True,
            )
            inputs2 = self.tokenizer(
                self.preprocess_code(code2),
                return_tensors="pt",
                max_length=512,
                truncation=True,
                padding=True,
            )

            # Move inputs to device
            inputs1 = {k: v.to(self.device) for k, v in inputs1.items()}
            inputs2 = {k: v.to(self.device) for k, v in inputs2.items()}

            # Forward pass with gradient tracking
            outputs1 = self.model(**inputs1)
            outputs2 = self.model(**inputs2)

            # Get embeddings and retain gradients
            emb1 = outputs1.last_hidden_state.mean(dim=1)
            emb2 = outputs2.last_hidden_state.mean(dim=1)

            # Important: Retain gradients for non-leaf tensors
            emb1.retain_grad()
            emb2.retain_grad()

            # Create leaf tensors for gradient computation
            emb1_leaf = emb1.clone().detach().requires_grad_(True)
            emb2_leaf = emb2.clone().detach().requires_grad_(True)

            # Normalize embeddings
            emb1_norm = torch.nn.functional.normalize(emb1_leaf, p=2, dim=1)
            emb2_norm = torch.nn.functional.normalize(emb2_leaf, p=2, dim=1)

            # Calculate similarity
            similarity = torch.sum(emb1_norm * emb2_norm)
            print(f"Computed similarity: {similarity.item():.4f}")

            # Calculate gradients
            similarity.backward()

            # Get gradients from leaf tensors
            grad1 = emb1_leaf.grad
            grad2 = emb2_leaf.grad

            if grad1 is None or grad2 is None:
                print("Gradient computation returned None")
                raise ValueError("Gradient computation failed")

            print("Gradients computed successfully")

            # Get attribution scores
            attribution_scores = (
                (torch.abs(grad1[0]) + torch.abs(grad2[0])).cpu().numpy()
            )
            print(f"Attribution scores shape: {attribution_scores.shape}")

            # Find top contributing dimensions
            top_k = 10
            top_dims = np.argsort(-attribution_scores)[:top_k]
            top_scores = attribution_scores[top_dims]

            print(f"Top {top_k} dimensions identified")

            # Create visualization with improved heatmap
            plt.style.use("default")
            # Increase figure height further to accommodate the colorbar label
            fig = plt.figure(figsize=(12, 11), facecolor="white")

            # Adjust height ratios for better spacing
            gs = gridspec.GridSpec(2, 1, height_ratios=[3, 1.2], hspace=0.5)

            # Plot attribution scores with improved styling
            ax1 = fig.add_subplot(gs[0])
            x = range(len(attribution_scores))
            ax1.plot(
                x,
                attribution_scores,
                color="#1f77b4",
                linewidth=1,
                alpha=0.5,
                label="Attribution",
            )
            ax1.plot(
                top_dims,
                attribution_scores[top_dims],
                "ro",
                label="Top Contributors",
                markersize=6,
            )

            # Improve the main plot styling
            ax1.set_facecolor("#f8f9fa")  # Light gray background
            ax1.set_title("Code Embedding Dimension Contributions", fontsize=14, pad=20)
            ax1.set_xlabel("Embedding Dimension", fontsize=12)
            ax1.set_ylabel("Attribution Score", fontsize=12)
            ax1.grid(True, linestyle="--", alpha=0.3)
            ax1.legend(fontsize=10, framealpha=0.9)
            ax1.spines["top"].set_visible(False)
            ax1.spines["right"].set_visible(False)

            # Add explanation text
            ax1.text(
                0.02,
                0.98,
                "Higher scores indicate dimensions that most strongly influence similarity calculations",
                transform=ax1.transAxes,
                fontsize=10,
                verticalalignment="top",
                bbox=dict(
                    boxstyle="round,pad=0.5",
                    facecolor="white",
                    edgecolor="none",
                    alpha=0.8,
                ),
            )

            # Improve heatmap visualization
            ax2 = fig.add_subplot(gs[1])

            # Create a summarized heatmap by binning the dimensions
            bin_size = 10  # Adjust based on your data size
            num_bins = len(attribution_scores) // bin_size + (
                1 if len(attribution_scores) % bin_size > 0 else 0
            )
            binned_scores = np.zeros(num_bins)

            for i in range(num_bins):
                start_idx = i * bin_size
                end_idx = min((i + 1) * bin_size, len(attribution_scores))
                binned_scores[i] = np.mean(attribution_scores[start_idx:end_idx])

            # Reshape for heatmap display
            binned_scores_2d = binned_scores.reshape(1, -1)

            # Create the heatmap with improved styling
            im = ax2.imshow(
                binned_scores_2d, aspect="auto", cmap="viridis", interpolation="nearest"
            )

            # Add a colorbar with better positioning - increase the pad to move it down
            cbar = plt.colorbar(
                im, ax=ax2, orientation="horizontal", pad=0.35, aspect=40
            )
            cbar.set_label("Average Attribution Strength", fontsize=10, labelpad=10)
            cbar.ax.tick_params(labelsize=9)

            # Improve x-axis labeling for the heatmap
            ax2.set_xticks(np.arange(0, num_bins, max(1, num_bins // 10)))
            ax2.set_xticklabels(
                [f"{i*bin_size}" for i in range(0, num_bins, max(1, num_bins // 10))],
                fontsize=9,
            )
            ax2.set_xlabel("Embedding Dimension Groups", fontsize=11)

            # Remove y-axis ticks to clean up the plot
            ax2.set_yticks([])
            ax2.set_yticklabels([])

            # Annotate the heatmap
            ax2.set_title(
                "Attribution Strength by Dimension Groups", fontsize=12, pad=10
            )

            # Add a text explanation - move it further down to avoid overlap
            fig.text(
                0.5,
                0.02,
                f"Dimensions grouped into bins of size {bin_size} for clarity",
                ha="center",
                fontsize=9,
                style="italic",
            )

            # Save plot with high quality
            plt.tight_layout()
            buf = io.BytesIO()
            plt.savefig(buf, format="png", dpi=300, bbox_inches="tight", pad_inches=0.5)
            plt.close("all")
            buf.seek(0)

            # Reset model state
            self.model.eval()
            torch.set_grad_enabled(False)

            print("Analysis completed successfully")

            # Update the return structure to match frontend expectations
            dimension_analysis = []
            for dim, score in zip(top_dims, top_scores):
                context = self.get_dimension_context(
                    code1, int(dim), attribution_scores
                )
                dimension_analysis.append(
                    {
                        "dimension": int(dim),
                        "score": float(score),
                        "tokens": context["tokens"],
                        "contexts": context["contexts"],
                        "activation_scores": context["activation_scores"],
                    }
                )

            # Create base64 image
            img_base64 = base64.b64encode(buf.read()).decode("utf-8")

            return {
                "success": True,
                "analysis": {
                    "similarity": float(similarity.item()),
                    "top_dimensions": top_dims.tolist(),
                    "top_scores": top_scores.tolist(),
                    "dimension_analysis": dimension_analysis,
                    "visualization": f"data:image/png;base64,{img_base64}",
                },
            }

        except Exception as e:
            print(f"Analysis error: {str(e)}")
            traceback_str = traceback.format_exc()
            print(f"Traceback:\n{traceback_str}")

            # Create error visualization
            fig = plt.figure(figsize=(8, 6))
            plt.text(
                0.5,
                0.5,
                f"Error during analysis:\n{str(e)}",
                ha="center",
                va="center",
                wrap=True,
            )
            plt.axis("off")

            # Save error plot
            buf = io.BytesIO()
            plt.savefig(buf, format="png", dpi=300, bbox_inches="tight")
            plt.close("all")
            buf.seek(0)

            return {
                "success": False,
                "error": str(e),
                "traceback": traceback_str,
                "analysis": {
                    "visualization": f"data:image/png;base64,{base64.b64encode(buf.read()).decode('utf-8')}",
                    "similarity": 0.0,
                    "top_dimensions": [],
                    "top_scores": [],
                    "dimension_analysis": [],
                },
            }

    def get_dimension_context(
        self, code: str, dimension: int, attribution_scores: np.ndarray
    ) -> dict:
        """Get the context for a specific embedding dimension."""
        try:
            # Tokenize the code
            tokens = self.tokenizer.tokenize(self.preprocess_code(code))
            inputs = self.tokenizer(
                self.preprocess_code(code),
                return_tensors="pt",
                max_length=512,
                truncation=True,
                padding=True,
            )

            print(f"Processing dimension {dimension} with {len(tokens)} tokens")

            with torch.no_grad():
                outputs = self.model(
                    **{k: v.to(self.device) for k, v in inputs.items()}
                )
                token_embeddings = outputs.last_hidden_state[0]

            # Find tokens that most strongly activate this dimension
            dimension_activations = token_embeddings[:, dimension].cpu().numpy()
            top_token_indices = np.argsort(-np.abs(dimension_activations))[:5]

            # Filter indices to prevent out of bounds access
            valid_indices = [idx for idx in top_token_indices if idx < len(tokens)]

            # Humanize the tokens by removing special characters (like Ġ)
            relevant_tokens = []
            for idx in valid_indices:
                token = tokens[idx]
                # Remove the Ġ character (RoBERTa tokenizer uses this for space)
                humanized_token = token.replace("Ġ", " ").strip()
                # Remove other special characters if needed
                humanized_token = humanized_token.replace("Ċ", "\n").replace("ĉ", "\t")
                relevant_tokens.append(humanized_token)

            # Get context around these tokens
            context_window = 2  # tokens before and after
            contexts = []
            for idx in valid_indices:
                start = max(0, idx - context_window)
                end = min(len(tokens), idx + context_window + 1)

                # Humanize the context tokens
                context_tokens = []
                for i in range(start, end):
                    token = tokens[i]
                    # Handle space prefix (replace Ġ with actual space)
                    if token.startswith("Ġ"):
                        token = " " + token[1:]
                    # Handle newlines and tabs
                    token = token.replace("Ċ", "\n").replace("ĉ", "\t")
                    context_tokens.append(token)

                context = "".join(context_tokens)
                contexts.append(context)

            # Get activation scores for valid indices only
            activation_scores = dimension_activations[valid_indices].tolist()

            print(
                f"Found {len(relevant_tokens)} relevant tokens for dimension {dimension}"
            )

            return {
                "tokens": relevant_tokens,
                "contexts": contexts,
                "activation_scores": activation_scores,
            }
        except Exception as e:
            print(f"Error in get_dimension_context: {str(e)}")
            return {"tokens": [], "contexts": [], "activation_scores": []}
