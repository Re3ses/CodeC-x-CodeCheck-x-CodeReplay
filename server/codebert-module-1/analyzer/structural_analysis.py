import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from scipy.spatial import ConvexHull
from umap import UMAP
from sklearn.cluster import DBSCAN
import pandas as pd
import io
import base64
import random
import torch
from .codebert_analyzer import CodeBERTAnalyzer
# Set environment variables for deterministic behavior
import os
os.environ['PYTHONHASHSEED'] = '42'
os.environ['CUBLAS_WORKSPACE_CONFIG'] = ':4096:8'  # For CUDA determinism

class StructuralAnalysis:
    def __init__(self):
        # Initialize the CodeBERT analyzer
        self.analyzer = CodeBERTAnalyzer()
        
        # Set all seeds for reproducibility
        np.random.seed(42)
        random.seed(42)
        torch.manual_seed(42)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(42)

    def get_embedding(self, line):
        # Use the analyzer's embedding method with preprocessing
        preprocessed_line = self.analyzer.preprocess_code(line)
        return self.analyzer.get_embedding(preprocessed_line)
        
    def calculate_similarity(self, code1, code2):
        # Use the analyzer's preprocessing and similarity calculation
        preprocessed_code1 = self.analyzer.preprocess_code(code1)
        preprocessed_code2 = self.analyzer.preprocess_code(code2)
        return self.analyzer.calculate_similarity(preprocessed_code1, preprocessed_code2)

    def infer_code_structure_type(self, code_lines: list[str]) -> str:
        """Infer the type of code structure based on code patterns."""
        code_text = '\n'.join(code_lines).lower()
        
        # Control Flow
        if 'for ' in code_text and ('in ' in code_text or ';' in code_text):
            if 'range(' in code_text:
                return 'Numeric Loop'
            elif 'enumerate(' in code_text:
                return 'Enumerated Loop'
            return 'Iterative Loop'
        elif 'while ' in code_text:
            return 'While Loop'
        elif 'if ' in code_text:
            if 'elif ' in code_text or 'else ' in code_text:
                return 'Complex Conditional'
            return 'Simple Conditional'
        
        # Function-related
        elif 'def ' in code_text or 'function ' in code_text:
            if 'async ' in code_text:
                return 'Async Function'
            elif 'return ' in code_text:
                return 'Function with Return'
            elif '*args' in code_text or '**kwargs' in code_text:
                return 'Variable Args Function'
            return 'Simple Function'
        elif 'lambda ' in code_text:
            return 'Lambda Function'
        elif 'return ' in code_text:
            return 'Return Statement'
        
        # Class-related
        elif 'class ' in code_text:
            if '(' in code_text:
                return 'Inherited Class'
            return 'Base Class'
        elif '@property' in code_text:
            return 'Property Decorator'
        elif '@' in code_text:
            return 'Decorated Definition'
        
        # Data Structures
        elif '[' in code_text and ']' in code_text:
            if 'append(' in code_text or 'extend(' in code_text:
                return 'List Operation'
            return 'List Definition'
        elif '{' in code_text and '}' in code_text:
            if ':' in code_text:
                return 'Dictionary Operation'
            return 'Set Operation'
        
        # Variable Operations
        elif '=' in code_text:
            if not any(op in code_text for op in ['==', '<=', '>=', '!=']):
                if any(op in code_text for op in ['+=', '-=', '*=', '/=']):
                    return 'Compound Assignment'
                elif 'list(' in code_text or 'dict(' in code_text or 'set(' in code_text:
                    return 'Data Structure Assignment'
                return 'Variable Assignment'
        
        # Error Handling
        elif 'try' in code_text:
            if 'finally' in code_text:
                return 'Try-Except-Finally'
            elif 'except' in code_text:
                return 'Try-Except'
            return 'Try Block'
        elif 'raise ' in code_text:
            return 'Exception Raising'
        
        # Import Statements
        elif 'import ' in code_text:
            if 'from ' in code_text:
                return 'From Import'
            return 'Import Statement'
        
        # String Operations
        elif "'" in code_text or '"' in code_text:
            if 'f"' in code_text or "f'" in code_text:
                return 'F-String'
            elif '.format(' in code_text:
                return 'String Formatting'
            return 'String Operation'
        
        # File Operations
        elif 'open(' in code_text:
            if 'with ' in code_text:
                return 'Context Manager File Operation'
            return 'File Operation'
        
        # Comments and Documentation
        elif '"""' in code_text or "'''" in code_text:
            return 'Documentation String'
        elif '#' in code_text:
            return 'Comment'
        
        # Mathematical Operations
        elif any(op in code_text for op in ['+', '-', '*', '/', '%', '**']):
            return 'Mathematical Operation'
        
        # Print/Output
        elif 'print(' in code_text or 'console.log(' in code_text:
            return 'Output Statement'
        
        return 'Other Code Structure'

    def get_line_embeddings(self, code_snippet: str) -> tuple[np.ndarray, list[str]]:
        """Get embeddings for each non-empty line in the code snippet."""
        lines = code_snippet.split('\n')
        embeddings = []
        valid_lines = []
        
        for line in lines:
            if not line.strip():
                continue
            emb = self.get_embedding(line)
            embeddings.append(emb)
            valid_lines.append(line)
        
        return np.array(embeddings), valid_lines

    def visualize_code_similarity(self, code_snippet_a: str, code_snippet_b: str, dim: int = 2) -> tuple[str, list[dict]]:
        """Generate visualization for code similarity between two snippets with improved readability."""
        try:
            # Force deterministic behavior for UMAP
            torch.use_deterministic_algorithms(True)
            
            # Calculate overall similarity score
            overall_similarity = self.calculate_similarity(code_snippet_a, code_snippet_b)
            
            # Get embeddings for both snippets
            embeddings_a, lines_a = self.get_line_embeddings(code_snippet_a)
            embeddings_b, lines_b = self.get_line_embeddings(code_snippet_b)
            
            if len(embeddings_a) == 0 or len(embeddings_b) == 0:
                raise ValueError("One or both code snippets are empty after preprocessing")
            
            # Combine embeddings and create labels
            combined_embeddings = np.vstack([embeddings_a, embeddings_b])
            labels = np.concatenate([np.zeros(len(embeddings_a)), np.ones(len(embeddings_b))])
            
            # Apply UMAP with fixed parameters for reproducibility
            reducer = UMAP(
                n_components=2,  # 2D visualization
                n_neighbors=min(7, len(combined_embeddings) - 1), 
                min_dist=2, 
                spread=2,  # Increased spread for better visualization
                random_state=42,
                n_jobs=1
            )
            
            reduced_embeddings = reducer.fit_transform(combined_embeddings)
            
            # Apply DBSCAN with fixed parameters
            clustering = DBSCAN(
                eps=0.005, 
                min_samples=2, 
                metric='cosine',
                n_jobs=1  # Single thread for determinism
            ).fit(reduced_embeddings)
            
            cluster_labels = clustering.labels_
            
            # Create DataFrame for visualization
            df = pd.DataFrame({
                'x': reduced_embeddings[:, 0],
                'y': reduced_embeddings[:, 1],
                'source': ['Code Sample 1' if l == 0 else 'Code Sample 2' for l in labels],
                'cluster': cluster_labels,
                'text': lines_a + lines_b
            })
            
            # Find similar structures
            similar_structures = []
            for cluster_id in sorted(set(cluster_labels)):  # Sort for deterministic order
                if cluster_id == -1:  # Skip noise points
                    continue
                cluster_df = df[df['cluster'] == cluster_id]
                if len(set(cluster_df['source'])) > 1:
                    code_a_lines = cluster_df[cluster_df['source'] == 'Code Sample 1']['text'].tolist()
                    code_b_lines = cluster_df[cluster_df['source'] == 'Code Sample 2']['text'].tolist()
                    structure_type = self.infer_code_structure_type(code_a_lines + code_b_lines)
                    similar_structures.append({
                        'cluster_id': int(cluster_id),
                        'type': structure_type,
                        'code_a': code_a_lines,
                        'code_b': code_b_lines,
                        'similarity': float(self.calculate_similarity('\n'.join(code_a_lines), '\n'.join(code_b_lines)))
                    })
            
            # Sort similar structures for deterministic output
            similar_structures.sort(key=lambda x: (x['cluster_id'], x['type']))
            
            # Create visualization with improved layout
            plt.figure(figsize=(14, 12))
            
            # Create subplot layout with room for labels
            gs = gridspec.GridSpec(1, 2, width_ratios=[3, 1])
            ax = plt.subplot(gs[0])
            legend_ax = plt.subplot(gs[1])
            legend_ax.axis('off')
            
            # Add grid for better readability
            ax.grid(True, linestyle='--', alpha=0.3, zorder=1)
            
            # Create main scatter plot with fixed colors
            colors = {'Code Sample 1': '#1f77b4', 'Code Sample 2': '#ff7f0e'}
            
            for source, color in sorted(colors.items()):  # Sort for determinism
                source_df = df[df['source'] == source]
                ax.scatter(
                    source_df['x'], source_df['y'],
                    c=color,
                    alpha=0.8,
                    s=100,  # Larger points
                    label=source,
                    zorder=3
                )
            
            # Highlight similar clusters
            for structure in similar_structures:
                cluster_points = df[df['cluster'] == structure['cluster_id']]
                if len(cluster_points) >= 3:  # Need at least 3 points for ConvexHull
                    hull = ConvexHull(cluster_points[['x', 'y']].values)
                    hull_points = cluster_points[['x', 'y']].values[hull.vertices]
                    
                    # Add a translucent highlight around the cluster
                    ax.fill(hull_points[:, 0], hull_points[:, 1], alpha=0.2, 
                        color='gray', zorder=2)
                
                # Add cluster number in the center
                centroid = (cluster_points['x'].mean(), cluster_points['y'].mean())
                ax.text(centroid[0], centroid[1], f"{structure['cluster_id']}", 
                    ha='center', va='center', fontsize=10, fontweight='bold',
                    bbox=dict(facecolor='white', alpha=0.7, edgecolor='none', pad=1),
                    zorder=4)
            
            # Add descriptive axes labels
            ax.set_xlabel('Semantic Distance (Dimension 1)', fontsize=10)
            ax.set_ylabel('Semantic Distance (Dimension 2)', fontsize=10)
            
            # Add title and subtitle with colored similarity score
            similarity_color = '#22c55e' if overall_similarity >= 0.7 else '#eab308' if overall_similarity >= 0.4 else '#ef4444'
            plt.suptitle('Code Structure Comparison', fontsize=16, y=0.98)
            ax.set_title(
                f'Overall Similarity: {overall_similarity:.2%}',
                fontsize=14,
                color=similarity_color,
                weight='bold',
                pad=10
            )
            
            # Create proper legend
            ax.legend(
                title='Code Samples',
                loc='upper left',
                frameon=True,
                framealpha=0.9
            )
            
            # Create a clean, readable legend for similar structures in the right subplot
            if similar_structures:
                # Sort by cluster_id for consistent ordering
                similar_structures.sort(key=lambda x: x['cluster_id'])
                
                legend_content = "Similar Code Structures:\n\n"
                for structure in similar_structures:
                    legend_content += (f"Cluster {structure['cluster_id']}:\n"
                                    f"• Type: {structure['type']}\n"
                                    f"• Similarity: {structure['similarity']:.2%}\n\n")
                
                legend_ax.text(0, 0.95, legend_content, va='top', ha='left', 
                            fontsize=10, linespacing=1.5,
                            bbox=dict(facecolor='white', edgecolor='lightgray', 
                                    boxstyle='round,pad=0.5'))
            else:
                legend_ax.text(0, 0.5, "No similar structures detected", 
                            va='center', ha='left', fontsize=12)
            
            # Adjust layout
            plt.tight_layout()
            
            # Save high-quality image with fixed DPI and format
            buf = io.BytesIO()
            plt.savefig(buf,
                    format='png',
                    dpi=300,
                    bbox_inches='tight',
                    pad_inches=0.4)
            plt.close('all')
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            
            return f"data:image/png;base64,{img_base64}", similar_structures
            
        except Exception as e:
            print(f"Visualization error: {str(e)}")
            fig = plt.figure(figsize=(6, 4))
            plt.text(0.5, 0.5, f'Error: {str(e)}', ha='center', va='center')
            plt.axis('off')
            buf = io.BytesIO()
            plt.savefig(buf, format='png')
            plt.close('all')
            buf.seek(0)
            error_img = base64.b64encode(buf.read()).decode('utf-8')
            return f"data:image/png;base64,{error_img}", []
