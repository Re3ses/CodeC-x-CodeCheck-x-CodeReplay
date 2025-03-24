import torch
from transformers import RobertaTokenizer, RobertaModel
import numpy as np
from typing import Dict, List, Tuple
import matplotlib.pyplot as plt
import io
import base64
import json
import traceback

class CodeBERTAttentionAnalyzer:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        
        # Configure model to output attention
        self.model = RobertaModel.from_pretrained(
            "microsoft/codebert-base",
            output_attentions=True,
            add_pooling_layer=False
        ).to(self.device)
        
        self.tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")
        self.model.eval()
        print("CodeBERT attention analyzer initialized")

    def get_attention_maps(self, code1: str, code2: str) -> Dict:
        """Generate attention visualizations for all layers and heads."""
        try:
            print("Tokenizing inputs...")
            # Tokenize both code snippets
            inputs1 = self.tokenizer(
                code1,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            inputs2 = self.tokenizer(
                code2,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            
            # Get tokens for visualization
            tokens1 = self.tokenizer.convert_ids_to_tokens(inputs1['input_ids'][0])
            tokens2 = self.tokenizer.convert_ids_to_tokens(inputs2['input_ids'][0])
            
            print(f"Token lengths - Code 1: {len(tokens1)}, Code 2: {len(tokens2)}")
            
            # Move inputs to device
            inputs1 = {k: v.to(self.device) for k, v in inputs1.items()}
            inputs2 = {k: v.to(self.device) for k, v in inputs2.items()}

            print("Getting model outputs...")
            with torch.no_grad():
                outputs1 = self.model(**inputs1, output_attentions=True)
                outputs2 = self.model(**inputs2, output_attentions=True)
                
                # Verify attention outputs
                if outputs1.attentions is None or outputs2.attentions is None:
                    print("Attention outputs:", outputs1.attentions, outputs2.attentions)
                    raise ValueError("No attention outputs from model")

            attention_maps = {}
            num_layers = len(outputs1.attentions)
            num_heads = outputs1.attentions[0].size(1)
            print(f"Processing {num_layers} layers with {num_heads} heads each...")
            
            for layer in range(num_layers):
                attention_maps[str(layer)] = {}
                
                for head in range(num_heads):
                    try:
                        # Get attention matrices
                        attention1 = outputs1.attentions[layer][0, head].cpu().numpy()
                        attention2 = outputs2.attentions[layer][0, head].cpu().numpy()

                        # Create visualization
                        plt.figure(figsize=(20, 10))
                        plt.clf()  # Clear the figure to prevent memory leaks
                        gs = plt.GridSpec(2, 2, width_ratios=[4, 1], height_ratios=[1, 1])

                        # Plot attention heatmap for code1
                        ax1 = plt.subplot(gs[0, 0])
                        im1 = ax1.imshow(attention1, cmap='YlOrRd')
                        
                        # Limit the number of tokens displayed to prevent overcrowding
                        max_tokens_display = min(30, len(tokens1))
                        token_indices = np.linspace(0, len(tokens1)-1, max_tokens_display, dtype=int)
                        ax1.set_xticks(token_indices)
                        ax1.set_yticks(token_indices)
                        ax1.set_xticklabels([tokens1[i] for i in token_indices], rotation=45, ha='right')
                        ax1.set_yticklabels([tokens1[i] for i in token_indices])
                        ax1.set_title(f'Code 1 Attention (Layer {layer+1}, Head {head+1})')
                        plt.colorbar(im1, ax=ax1)

                        # Plot attention statistics
                        ax_stats1 = plt.subplot(gs[0, 1])
                        ax_stats1.axis('off')
                        stats1 = (f"Code 1 Statistics:\n"
                                f"Max: {attention1.max():.3f}\n"
                                f"Mean: {attention1.mean():.3f}\n"
                                f"Std: {attention1.std():.3f}")
                        ax_stats1.text(0, 0.5, stats1, va='center')

                        # Convert plot to base64
                        buf = io.BytesIO()
                        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')  # Lower DPI to reduce size
                        plt.close()  # Close the figure to free memory
                        buf.seek(0)
                        img_str = base64.b64encode(buf.read()).decode('utf-8')
                        
                        # Store results with reduced data size
                        # Only store a downsampled version of attention matrices to reduce JSON size
                        downsample_factor = max(1, attention1.shape[0] // 50)  # Downsample to max 50x50
                        
                        attention_maps[str(layer)][str(head)] = {
                            'visualization': f"data:image/png;base64,{img_str}",
                            # Only include a subset of tokens to reduce size
                            'tokens1': tokens1[:50] if len(tokens1) > 50 else tokens1,
                            'tokens2': tokens2[:50] if len(tokens2) > 50 else tokens2,
                            # Downsample attention matrices
                            'attention1': attention1[::downsample_factor, ::downsample_factor].tolist(),
                            'attention2': attention2[::downsample_factor, ::downsample_factor].tolist(),
                            'stats': {
                                'code1': {
                                    'max': float(attention1.max()),
                                    'mean': float(attention1.mean()),
                                    'std': float(attention1.std())
                                },
                                'code2': {
                                    'max': float(attention2.max()),
                                    'mean': float(attention2.mean()),
                                    'std': float(attention2.std())
                                }
                            }
                        }
                    except Exception as e:
                        print(f"Error processing layer {layer}, head {head}: {str(e)}")
                        attention_maps[str(layer)][str(head)] = {
                            'error': str(e)
                        }

            return attention_maps

        except Exception as e:
            error_msg = f"Error in attention analysis: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            return {'error': error_msg}  # Return a valid JSON object with error info