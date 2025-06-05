import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from scipy import stats
import numpy as np
import traceback

class AgreementAnalyzer:
    def __init__(self):
        self.colors = {'CodeReplay': 'purple', 'CodeCheck': 'blue', 'MOSS': 'green', 'Dolos': 'red'}
        self.required_columns = ['tool_name', 'file1', 'similarity_score']
        self.is_aggregated = False  # Flag to determine if we're doing aggregated analysis

    def analyze_agreement(self, files, aggregate=False):
        """
        Analyze agreement between tools
        files: List of file objects from Flask request
        aggregate: Boolean indicating whether to aggregate results
        """
        try:
            self.is_aggregated = aggregate
            
            # Validate files
            if not files:
                return {'success': False, 'error': 'No files uploaded'}
            
            # Read all CSV files
            all_dfs = []
            for file in files:
                try:
                    df = pd.read_csv(file)
                    # Add problem_set_id if not present
                    if 'problem_set_id' not in df.columns:
                        df['problem_set_id'] = file.filename
                    all_dfs.append(df)
                except Exception as e:
                    return {
                        'success': False,
                        'error': f'Error reading file {file.filename}: {str(e)}'
                    }
            
            # Combine all dataframes
            df = pd.concat(all_dfs, ignore_index=True)
            
            # Validate required columns
            missing_cols = [col for col in self.required_columns if col not in df.columns]
            if missing_cols:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing_cols)}'
                }

            # Ensure file2 exists for traditional tools but not required for CodeReplay
            if 'file2' not in df.columns:
                df['file2'] = ''  # Add empty file2 column for CodeReplay entries

            # Validate data types
            try:
                df['similarity_score'] = pd.to_numeric(df['similarity_score'])
            except Exception as e:
                return {
                    'success': False,
                    'error': 'Similarity scores must be numeric values'
                }

            # Validate tool names
            valid_tools = set(self.colors.keys()) | {'CodeReplay'}  # Explicitly include CodeReplay
            found_tools = set(df['tool_name'].unique())
            invalid_tools = found_tools - valid_tools
            if invalid_tools:
                return {
                    'success': False,
                    'error': f'Invalid tool names found: {", ".join(invalid_tools)}. Valid tools are: {", ".join(valid_tools)}'
                }

            # Ensure CodeReplay is included in the analysis even if missing from the dataset
            tools = list(valid_tools.intersection(found_tools))
            if 'CodeReplay' not in tools:
                tools.append('CodeReplay')  # Add CodeReplay to tools for compatibility

            # Separate traditional tools from CodeReplay
            traditional_tools = [t for t in tools if t != 'CodeReplay']

            # Calculate statistics based on aggregation mode
            try:
                if self.is_aggregated and len(df['problem_set_id'].unique()) > 1:
                    averages = self._calculate_aggregated_averages(df, tools)
                    correlations = self._calculate_aggregated_correlations(df, traditional_tools)
                    consensus_metrics = self._calculate_aggregated_consensus_metrics(df, tools)
                else:
                    self.is_aggregated = False  # Force non-aggregated mode if only one problem set
                    averages = self._calculate_averages(df, tools)
                    correlations = self._calculate_correlations(df, traditional_tools)
                    consensus_metrics = self._calculate_consensus_metrics(df, tools)

                # Calculate overall statistics
                overall_avg = df.groupby('problem_set_id')['similarity_score'].mean().mean() if self.is_aggregated else df['similarity_score'].mean()

            except Exception as e:
                traceback.print_exc()
                return {
                    'success': False,
                    'error': f'Error calculating statistics: {str(e)}'
                }
                
            # Generate appropriate plot
            try:
                plot_base64 = self._generate_plot(df, tools, traditional_tools, averages, 
                                                overall_avg, correlations, consensus_metrics)
            except Exception as e:
                traceback.print_exc()
                return {
                    'success': False,
                    'error': f'Error generating plot: {str(e)}'
                }

            return {
                'success': True,
                'plot': plot_base64,
                'statistics': {
                    'averages': averages,
                    'overall_average': overall_avg,
                    'correlations': correlations,
                    'problem_sets': len(df['problem_set_id'].unique()),
                    'is_aggregated': self.is_aggregated
                }
            }

        except Exception as e:
            traceback.print_exc()
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}'
            }   
            
    def _calculate_averages(self, df, tools):
        averages = {}
        for tool in tools:
            tool_data = df[df['tool_name'] == tool]['similarity_score']
            averages[tool] = tool_data.mean()
        return averages

    def _calculate_correlations(self, df, tools, threshold=50):
        """Calculate Spearman rank correlation between tool scores"""
        correlations = {}
        try:
            for i in range(len(tools)):
                for j in range(i+1, len(tools)):
                    # Get data for both tools and create pair IDs
                    df1 = df[df['tool_name'] == tools[i]][['file1', 'file2', 'similarity_score']].copy()
                    df2 = df[df['tool_name'] == tools[j]][['file1', 'file2', 'similarity_score']].copy()
                    
                    # Create pair IDs for matching (ensuring consistent ordering)
                    def create_pair_id(row):
                        files = sorted([str(row['file1']), str(row['file2'])])
                        return '||'.join(files)
                    
                    df1['pair_id'] = df1.apply(create_pair_id, axis=1)
                    df2['pair_id'] = df2.apply(create_pair_id, axis=1)
                    
                    # Merge scores for matching pairs
                    matched_pairs = pd.merge(
                        df1[['pair_id', 'similarity_score']], 
                        df2[['pair_id', 'similarity_score']], 
                        on='pair_id',
                        how='inner',
                        suffixes=('_1', '_2')
                    )
                    
                    if len(matched_pairs) > 0:
                        # Calculate Spearman correlation
                        scores1 = matched_pairs['similarity_score_1'].values
                        scores2 = matched_pairs['similarity_score_2'].values
                        
                        # Use scipy.stats.spearmanr
                        rho, _ = stats.spearmanr(scores1, scores2, nan_policy='omit')
                        
                        # Store correlation for both directions
                        correlations[f"{tools[i]} vs {tools[j]}"] = rho
                        correlations[f"{tools[j]} vs {tools[i]}"] = rho
                        
        except Exception as e:
            print(f"Error calculating correlations: {str(e)}")
            traceback.print_exc()
        
        return correlations
    
    def _calculate_aggregated_averages(self, df, tools):
        """Calculate averages across problem sets"""
        return df.groupby(['problem_set_id', 'tool_name'])['similarity_score'].mean()\
                 .groupby('tool_name').mean().to_dict()

    def _calculate_aggregated_correlations(self, df, tools):
        """Calculate correlations averaged across problem sets"""
        correlations = {}
        for ps_id in df['problem_set_id'].unique():
            ps_df = df[df['problem_set_id'] == ps_id]
            ps_corr = self._calculate_correlations(ps_df, tools)
            for pair, value in ps_corr.items():
                if pair not in correlations:
                    correlations[pair] = []
                correlations[pair].append(value)
        
        return {pair: np.mean([v for v in values if v is not None]) 
                for pair, values in correlations.items()}


    def _calculate_codereplay_effectiveness(self, df, traditional_tools):
        """Calculate effectiveness of CodeReplay compared to traditional tools"""
        try:
            comparison = {
                'by_learner': {},
                'overall': {}
            }
            
            # Skip if CodeReplay is not in the dataset
            if 'CodeReplay' not in df['tool_name'].unique():
                return comparison
                
            # Get CodeReplay scores by learner
            codereplay_df = df[df['tool_name'] == 'CodeReplay']
            
            # For each learner with CodeReplay data
            for learner_id in codereplay_df['file1'].unique():
                # Get CodeReplay score for this learner
                cr_score = codereplay_df[codereplay_df['file1'] == learner_id]['similarity_score'].mean()
                
                # Get traditional tool scores for this learner
                trad_scores = {}
                for tool in traditional_tools:
                    learner_pairs = df[(df['tool_name'] == tool) & 
                                      ((df['file1'] == learner_id) | (df['file2'] == learner_id))]
                    if not learner_pairs.empty:
                        trad_scores[tool] = learner_pairs['similarity_score'].mean()
                
                # Calculate average of traditional tools for this learner
                if trad_scores:
                    trad_avg = sum(trad_scores.values()) / len(trad_scores)
                    comparison['by_learner'][learner_id] = {
                        'CodeReplay': cr_score,
                        'traditional_tools': trad_scores,
                        'traditional_average': trad_avg,
                        'difference': cr_score - trad_avg
                    }
            
            # Calculate overall averages
            if comparison['by_learner']:
                cr_overall = codereplay_df['similarity_score'].mean()
                
                # Get average scores for each traditional tool
                trad_overall = {}
                for tool in traditional_tools:
                    trad_overall[tool] = df[df['tool_name'] == tool]['similarity_score'].mean()
                
                # Average of all traditional tools
                trad_avg_overall = sum(trad_overall.values()) / len(trad_overall) if trad_overall else 0
                
                comparison['overall'] = {
                    'CodeReplay': cr_overall,
                    'traditional_tools': trad_overall,
                    'traditional_average': trad_avg_overall,
                    'difference': cr_overall - trad_avg_overall
                }
                
        except Exception as e:
            print(f"Error calculating CodeReplay effectiveness: {str(e)}")
            traceback.print_exc()
            
        return comparison

    def _calculate_consensus_metrics(self, df, tools, threshold=50):
        """Calculate consensus metrics for non-aggregated data."""
        trad_tools = [t for t in tools if t != 'CodeReplay']
        
        # Collect all unique submissions from file1 and file2
        unique_submissions = set(df['file1']).union(set(df['file2']))
        unique_submissions.discard('')  # Remove empty strings if any
        n_submissions = len(unique_submissions)
        n_tools = len(trad_tools)
        
        # Calculate total comparisons
        total_tool_comparisons = self._calculate_total_tool_comparisons(n_submissions, n_tools)
        
        # Get unique file pairs
        file_pairs = df[df['tool_name'].isin(trad_tools)][['file1', 'file2']].drop_duplicates().values
        unique_pairs = len(file_pairs)

        consensus_results = {
            'agreement_rates': {},
            'consensus_cases': {'2_tools': 0, '3_tools': 0},
            'disagreement_cases': [],
            'total_pairs': unique_pairs,
            'total_comparisons': total_tool_comparisons,
            'n_submissions': n_submissions,
            'n_tools': n_tools
        }
        
        # Process each unique pair
        for file1, file2 in file_pairs:
            decisions = {}
            
            # Get decisions from all tools for this pair
            for tool in trad_tools:
                tool_data = df[(df['tool_name'] == tool) & 
                               (((df['file1'] == file1) & (df['file2'] == file2)) |
                                ((df['file1'] == file2) & (df['file2'] == file1)))]
                
                if not tool_data.empty:
                    score = tool_data['similarity_score'].iloc[0]
                    decisions[tool] = score >= threshold
            
            # Only process if we have data from all tools
            if len(decisions) == len(trad_tools):
                # Count tools flagging plagiarism
                flags = sum(decisions.values())
                
                # Record consensus cases
                if flags >= 2:
                    consensus_results['consensus_cases'][f'{flags}_tools'] += 1
                
                # Record disagreements
                if 0 < flags < len(trad_tools):
                    case = {
                        'file1': file1,
                        'file2': file2,
                        'decisions': decisions
                    }
                    consensus_results['disagreement_cases'].append(case)
                
                # Calculate pairwise agreement
                for i, tool1 in enumerate(trad_tools):
                    for j, tool2 in enumerate(trad_tools):
                        if i < j:
                            pair = f"{tool1} vs {tool2}"
                            if pair not in consensus_results['agreement_rates']:
                                consensus_results['agreement_rates'][pair] = {'agree': 0, 'total': 0}
                            
                            consensus_results['agreement_rates'][pair]['total'] += 1
                            if decisions[tool1] == decisions[tool2]:
                                consensus_results['agreement_rates'][pair]['agree'] += 1

        # Convert agreement counts to percentages
        for pair in consensus_results['agreement_rates']:
            agree = consensus_results['agreement_rates'][pair]['agree']
            total = consensus_results['agreement_rates'][pair]['total']
            consensus_results['agreement_rates'][pair] = (agree / total * 100) if total > 0 else 0

        return consensus_results

    def _calculate_aggregated_consensus_metrics(self, df, tools, threshold=50):
        total_metrics = {
            'agreement_rates': {},
            'consensus_cases': {'2_tools': 0, '3_tools': 0},
            'disagreement_cases': [],
            'total_pairs': 0,
            'total_comparisons': 0,
            'n_submissions': 0,
            'n_tools': 0,
            'total_agreed_cases': 0
        }
        
        try:
            trad_tools = [t for t in tools if t != 'CodeReplay']
            total_metrics['n_tools'] = len(trad_tools)
            
            # Get unique submissions
            unique_submissions = set(df['file1']).union(set(df['file2']))
            unique_submissions.discard('')
            n_submissions = len(unique_submissions)
            total_metrics['n_submissions'] = n_submissions  # Don't subtract 1 here
            
            # Calculate expected number of unique pairs
            expected_pairs = (n_submissions * (n_submissions - 1)) // 2
            
            # Process unique pairs using a set to avoid duplicates
            processed_pairs = set()
            
            for ps_id in df['problem_set_id'].unique():
                ps_df = df[df['problem_set_id'] == ps_id]
                
                # Get unique file pairs
                pairs_df = ps_df[ps_df['tool_name'].isin(trad_tools)][['file1', 'file2']].drop_duplicates()
                
                for _, row in pairs_df.iterrows():
                    # Sort the pair to ensure consistent ordering
                    pair = tuple(sorted([str(row['file1']), str(row['file2'])]))
                    
                    # Skip self-comparisons and already processed pairs
                    if pair[0] != pair[1] and pair not in processed_pairs:
                        processed_pairs.add(pair)
                        
                        # Get decisions from all tools for this pair
                        decisions = {}
                        for tool in trad_tools:
                            tool_data = ps_df[(ps_df['tool_name'] == tool) & 
                                            (((ps_df['file1'] == pair[0]) & (ps_df['file2'] == pair[1])) |
                                             ((ps_df['file1'] == pair[1]) & (ps_df['file2'] == pair[0])))]
                            
                            if not tool_data.empty:
                                score = tool_data['similarity_score'].iloc[0]
                                decisions[tool] = score >= threshold
                        
                        # Only process if all tools made a decision
                        if len(decisions) == len(trad_tools):
                            # Calculate agreement
                            all_agree = all(decisions.values()) or not any(decisions.values())
                            if all_agree:
                                total_metrics['total_agreed_cases'] += 1
                            
                            # Update pairwise agreement rates
                            for i, tool1 in enumerate(trad_tools):
                                for j, tool2 in enumerate(trad_tools):
                                    if i < j:
                                        pair_name = f"{tool1} vs {tool2}"
                                        if pair_name not in total_metrics['agreement_rates']:
                                            total_metrics['agreement_rates'][pair_name] = {'agree': 0, 'total': 0}
                                        
                                        total_metrics['agreement_rates'][pair_name]['total'] += 1
                                        if decisions[tool1] == decisions[tool2]:
                                            total_metrics['agreement_rates'][pair_name]['agree'] += 1
            
            # Update final metrics
            total_metrics['total_pairs'] = len(processed_pairs)
            
            # Calculate final agreement rates
            for pair in total_metrics['agreement_rates']:
                counts = total_metrics['agreement_rates'][pair]
                total_metrics['agreement_rates'][pair] = (counts['agree'] / counts['total'] * 100) if counts['total'] > 0 else 0
            
        except Exception as e:
            print(f"Error in aggregated consensus metrics: {str(e)}")
            traceback.print_exc()
        
        return total_metrics

    def _calculate_total_comparisons(self, n):
        """Calculate total possible comparisons using combination formula C(n,2)"""
        return (n * (n-1)) // 2

    def _calculate_total_tool_comparisons(self, n_submissions, n_tools):
        """
        Calculate total comparisons made by all tools
        n_submissions: number of unique submissions
        n_tools: number of traditional tools
        """
        # Each tool compares each submission with every other submission
        comparisons_per_tool = (n_submissions * (n_submissions - 1)) // 2
        # Multiply by number of tools
        return comparisons_per_tool * n_tools

    def _generate_plot(self, df, all_tools, traditional_tools, averages, overall_avg, correlations, consensus_metrics):
        if self.is_aggregated:
            # For aggregated view, use 2x2 layout
            fig = plt.figure(figsize=(15, 12))
            grid = plt.GridSpec(2, 2, height_ratios=[1, 1], width_ratios=[1, 1], figure=fig)
            n_problems = len(df['problem_set_id'].unique())
            agg_text = f"\n(Aggregated across {n_problems} problem sets)"
            
            # 1. Average Scores Bar Chart (top left)
            ax1 = fig.add_subplot(grid[0, 0])
            self._create_average_bar_chart(ax1, all_tools, averages)

            # 2. Traditional Tools Correlation Heatmap (top right)
            ax2 = fig.add_subplot(grid[0, 1])
            self._create_correlation_heatmap(ax2, traditional_tools, correlations)

            # 3. Similarity Classification Chart (bottom left)
            ax3 = fig.add_subplot(grid[1, 0])
            class_counts = self._calculate_similarity_classes(df, traditional_tools)
            self._create_similarity_class_chart(ax3, class_counts)

            # 4. Consensus Display (bottom right)
            ax4 = fig.add_subplot(grid[1, 1])
            self._create_consensus_display(ax4, consensus_metrics)
            
        else:
            # For non-aggregated view, use 3x3 layout
            fig = plt.figure(figsize=(15, 16))
            grid = plt.GridSpec(3, 3, height_ratios=[1, 1, 1], width_ratios=[1, 1, 1], figure=fig)

            # 1. Average Scores Bar Chart (top left)
            ax1 = fig.add_subplot(grid[0, 0])
            self._create_average_bar_chart(ax1, all_tools, averages)

            # 2. Traditional Tools Correlation Heatmap (top middle)
            ax2 = fig.add_subplot(grid[0, 1])
            self._create_correlation_heatmap(ax2, traditional_tools, correlations)

            # 3. Submission-based Correlation Heatmap including CodeReplay (top right)
            ax3 = fig.add_subplot(grid[0, 2])
            submission_correlations = self._calculate_submission_based_correlations(df, traditional_tools)
            self._create_submission_correlation_heatmap(ax3, traditional_tools, submission_correlations)

            if len(traditional_tools) >= 2:
                # 4. Scatterplots (middle row)
                ax4 = fig.add_subplot(grid[1, 0])
                ax5 = fig.add_subplot(grid[1, 1])
                
                # Create scatter plots
                corr1 = self._create_pairwise_scatter(df, traditional_tools[0], traditional_tools[1], ax4)
                if len(traditional_tools) >= 3:
                    corr2 = self._create_pairwise_scatter(df, traditional_tools[0], traditional_tools[2], ax5)
                else:
                    ax5.axis('off')

                # 5. Tool Comparison and Consensus (bottom row)
                ax6 = fig.add_subplot(grid[2, 0:2])  # Span two columns
                ax7 = fig.add_subplot(grid[2, 2])

                # Create comparison bar chart and consensus display
                self._create_comparison_bar_chart(ax6, averages, traditional_tools)
                self._create_consensus_display(ax7, consensus_metrics)

        plt.tight_layout()
        return self._save_plot_to_base64(fig)
    def _create_average_bar_chart(self, ax, tools, averages):
        """Create bar chart showing average similarity scores for each tool"""
        try:
            # Prepare data
            tool_names = [t for t in tools if t in averages]
            scores = [averages.get(t, 0) for t in tool_names]
            colors = [self.colors.get(t, 'gray') for t in tool_names]

            # Create bars
            bars = ax.bar(tool_names, scores, color=colors, alpha=0.7)

            # Customize plot
            ax.set_ylim(0, 100)
            ax.set_ylabel('Average Similarity Score (%)')
            ax.set_title('Average Similarity Scores by Tool')
            ax.grid(True, alpha=0.3, axis='y')

            # Add value labels on top of bars
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{height:.1f}%',
                       ha='center', va='bottom')

            # Rotate x-axis labels if many tools
            if len(tool_names) > 3:
                plt.setp(ax.get_xticklabels(), rotation=45, ha='right')

            # Add threshold line at 50%
            ax.axhline(y=50, color='gray', linestyle=':', alpha=0.3)

        except Exception as e:
            print(f"Error creating bar chart: {str(e)}")
            traceback.print_exc()
            ax.axis('off')
            ax.text(0.5, 0.5, f"Error creating bar chart:\n{str(e)}", 
                    ha='center', va='center', fontsize=12)

    def _create_comparison_bar_chart(self, ax, averages, traditional_tools):
        """Create bar chart comparing CodeReplay with Traditional Tools average"""
        try:
            # Calculate traditional tools average
            trad_scores = [averages.get(t, 0) for t in traditional_tools]
            trad_avg = np.mean(trad_scores)
            
            # Prepare data
            tools = traditional_tools + ['CodeReplay', 'Traditional Avg']
            scores = [averages.get(t, 0) for t in traditional_tools] + [averages.get('CodeReplay', 0), trad_avg]
            colors = [self.colors.get(t, 'gray') for t in tools]
            
            # Create bars
            bars = ax.bar(tools, scores, color=colors, alpha=0.7)

            # Customize plot
            ax.set_ylim(0, 100)
            ax.set_ylabel('Average Similarity Score (%)')
            ax.set_title('Tool Comparison with Traditional Average')
            ax.grid(True, alpha=0.3, axis='y')

            # Add value labels
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{height:.1f}%',
                       ha='center', va='bottom')

            # Rotate labels if needed
            plt.setp(ax.get_xticklabels(), rotation=45, ha='right')
            
            # Add threshold line
            ax.axhline(y=50, color='gray', linestyle=':', alpha=0.3)

        except Exception as e:
            print(f"Error creating comparison chart: {str(e)}")
            traceback.print_exc()
            ax.axis('off')
            ax.text(0.5, 0.5, f"Error creating comparison chart:\n{str(e)}", 
                    ha='center', va='center', fontsize=12)

    def _create_pairwise_scatter(self, df, tool1, tool2, ax, threshold=50):
        """Create scatter plot with consistent correlation calculation"""
        try:
            # Prepare data (same as in _calculate_correlations)
            df1 = df[df['tool_name'] == tool1][['file1', 'file2', 'similarity_score']].copy()
            df2 = df[df['tool_name'] == tool2][['file1', 'file2', 'similarity_score']].copy()
            
            def create_pair_id(row):
                files = sorted([str(row['file1']), str(row['file2'])])
                return '||'.join(files)
            
            df1['pair_id'] = df1.apply(create_pair_id, axis=1)
            df2['pair_id'] = df2.apply(create_pair_id, axis=1)
            
            merged_df = pd.merge(
                df1[['pair_id', 'similarity_score']], 
                df2[['pair_id', 'similarity_score']], 
                on='pair_id',
                how='inner',
                suffixes=('_1', '_2')
            )
            
            if len(merged_df) == 0:
                ax.axis('off')
                ax.text(0.5, 0.5, f"No matching pairs found", ha='center', va='center')
                return 0
                
            # Calculate correlation exactly as in _calculate_correlations
            corr, _ = stats.spearmanr(
                merged_df['similarity_score_1'],
                merged_df['similarity_score_2']
            )
            
            # Create scatter plot
            ax.scatter(merged_df['similarity_score_1'], 
                      merged_df['similarity_score_2'],
                      alpha=0.5, 
                      c=self.colors[tool1],
                      s=30)
            
            # Add reference line and threshold lines
            ax.plot([0, 100], [0, 100], 'k--', alpha=0.5, label='Perfect Agreement')
            ax.axhline(y=threshold, color='gray', linestyle=':', alpha=0.3)
            ax.axvline(x=threshold, color='gray', linestyle=':', alpha=0.3)
            
            # Customize plot
            ax.set_xlim(0, 100)
            ax.set_ylim(0, 100)
            ax.set_xlabel(f'{tool1} Similarity Score (%)')
            ax.set_ylabel(f'{tool2} Similarity Score (%)')
            ax.set_title(f'{tool1} vs {tool2} Comparison\n(n={len(merged_df)})')
            ax.grid(True, alpha=0.3)
            
            # Add correlation coefficient
            ax.text(0.05, 0.95, f'R = {corr:.2f}', 
                    transform=ax.transAxes,
                    ha='left', 
                    va='top',
                    bbox=dict(facecolor='white', alpha=0.7))
            
            return corr
            
        except Exception as e:
            print(f"Error in scatter plot: {str(e)}")
            traceback.print_exc()
            return 0

    def _format_stats_text(self, averages, overall_avg, correlations, codereplay_comparison=None):
        stats_text = f"Averages:\n"
        for tool, avg in averages.items():
            stats_text += f"{tool}: {avg:.2f}%\n"
        stats_text += f"\nOverall: {overall_avg:.2f}%\n\nCorrelations:\n"
        for pair, corr in correlations.items():
            stats_text += f"{pair}: {corr:.2f}\n"
            
        # Add CodeReplay comparison information if available
        if codereplay_comparison and codereplay_comparison.get('overall'):
            stats_text += f"\nCodeReplay Comparison:\n"
            stats_text += f"CodeReplay avg: {codereplay_comparison['overall'].get('CodeReplay', 0):.2f}%\n"
            stats_text += f"Traditional tools avg: {codereplay_comparison['overall'].get('traditional_average', 0):.2f}%\n"
            diff = codereplay_comparison['overall'].get('difference', 0)
            stats_text += f"Difference: {diff:.2f}% ({'higher' if diff > 0 else 'lower'})\n"
            
        return stats_text

    def _validate_aggregation(self, df):
        """Validate if the data can be aggregated"""
        if not 'problem_set_id' in df.columns:
            return False, "Missing problem_set_id column required for aggregation"
            
        problem_sets = df['problem_set_id'].unique()
        if len(problem_sets) < 2:
            return False, "At least 2 different problem sets are required for aggregation"
            
        return True, None

    def _create_correlation_heatmap(self, ax, tools, correlations):
        """Create heatmap showing Spearman correlations between traditional tools"""
        try:
            # Create correlation matrix
            n = len(tools)
            corr_matrix = np.zeros((n, n))
            
            # Fill correlation matrix
            for i in range(n):
                for j in range(n):
                    if i == j:
                        corr_matrix[i,j] = 1.0
                    else:
                        key = f"{tools[i]} vs {tools[j]}"
                        rev_key = f"{tools[j]} vs {tools[i]}"
                        corr_matrix[i,j] = correlations.get(key, correlations.get(rev_key, 0))
            
            # Create heatmap with updated title and labels
            sns.heatmap(corr_matrix, 
                       annot=True, 
                       fmt='.2f',
                       cmap='RdYlBu',
                       vmin=-1, 
                       vmax=1,
                       square=True,
                       xticklabels=tools,
                       yticklabels=tools,
                       ax=ax)

            ax.set_title('Spearman Rank Correlation\n(Traditional Tools)')

        except Exception as e:
            print(f"Error creating heatmap: {str(e)}")
            traceback.print_exc()
            ax.axis('off')
            ax.text(0.5, 0.5, f"Error creating heatmap:\n{str(e)}", 
                    ha='center', va='center', fontsize=12)

    def _create_consensus_display(self, ax, metrics):
        """Create text display showing only agreement rates."""
        try:
            text_content = "Consensus Analysis\n\n"
            
            # Agreement rates
            text_content += "Agreement Rates:\n"
            for pair, rate in metrics['agreement_rates'].items():
                text_content += f"{pair}: {rate:.1f}%\n"
            
            # # Overall agreement metric
            # total_agreement = metrics.get('total_agreed_cases', 0)
            # total_pairs = metrics.get('total_pairs', 0)
            # overall_agreement_percentage = (total_agreement / total_pairs * 100) if total_pairs > 0 else 0
            # text_content += f"\nOverall agreement rate: {total_agreement} / {total_pairs} cases ({overall_agreement_percentage:.1f}%)"
            
            # Display text
            ax.axis('off')
            ax.text(0.05, 0.95, text_content,
                    transform=ax.transAxes,
                    verticalalignment='top',
                    fontfamily='monospace')
            
        except Exception as e:
            print(f"Error creating consensus display: {str(e)}")
            traceback.print_exc()
            ax.axis('off')

    def _save_plot_to_base64(self, fig):
        """Convert matplotlib figure to base64 string"""
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        plt.close(fig)
        return base64.b64encode(buf.getvalue()).decode('utf-8')

    def _calculate_submission_based_correlations(self, df, tools):
        """Calculate correlations between tools based on per-submission averages"""
        try:
            correlations = {}
            all_tools = tools + ['CodeReplay']
            
            # Dictionary to store scores per submission for each tool
            submission_scores = {tool: {} for tool in all_tools}
            
            # Process traditional tools first
            for tool in tools:
                tool_df = df[df['tool_name'] == tool]
                
                # Group by problem set to handle same file names
                for ps_id in tool_df['problem_set_id'].unique():
                    ps_df = tool_df[tool_df['problem_set_id'] == ps_id]
                    
                    # Get unique submissions in this problem set
                    submissions = set(ps_df['file1']).union(set(ps_df['file2']))
                    submissions.discard('')
                    
                    # Calculate average score for each submission
                    for submission in submissions:
                        # Get all scores where this submission appears
                        scores = ps_df[
                            (ps_df['file1'] == submission) | 
                            (ps_df['file2'] == submission)
                        ]['similarity_score']
                        
                        # Create unique key combining problem set and submission
                        sub_key = f"{ps_id}||{submission}"
                        submission_scores[tool][sub_key] = scores.mean()
            
            # Process CodeReplay scores
            cr_df = df[df['tool_name'] == 'CodeReplay']
            for ps_id in cr_df['problem_set_id'].unique():
                ps_cr_df = cr_df[cr_df['problem_set_id'] == ps_id]
                
                for _, row in ps_cr_df.iterrows():
                    sub_key = f"{ps_id}||{row['file1']}"
                    submission_scores['CodeReplay'][sub_key] = row['similarity_score']
            
            # Calculate Spearman correlations between all tools
            for i, tool1 in enumerate(all_tools):
                for j, tool2 in enumerate(all_tools):
                    if i < j:  # Only process each pair once
                        # Get submissions that have scores for both tools
                        common_subs = set(submission_scores[tool1].keys()) & set(submission_scores[tool2].keys())
                        
                        if common_subs:
                            # Extract scores for common submissions
                            scores1 = [submission_scores[tool1][sub] for sub in common_subs]
                            scores2 = [submission_scores[tool2][sub] for sub in common_subs]
                            
                            # Calculate Spearman correlation
                            corr, _ = stats.spearmanr(scores1, scores2)
                            
                            # Store correlation
                            pair = f"{tool1} vs {tool2}"
                            correlations[pair] = corr
                            correlations[f"{tool2} vs {tool1}"] = corr
            
            return correlations
            
        except Exception as e:
            print(f"Error calculating submission-based correlations: {str(e)}")
            traceback.print_exc()
            return {}

    def _create_submission_correlation_heatmap(self, ax, tools, correlations):
        """Create heatmap including CodeReplay based on submission-level correlations"""
        try:
            all_tools = tools + ['CodeReplay']
            n = len(all_tools)
            
            # Create correlation matrix
            corr_matrix = np.zeros((n, n))
            for i in range(n):
                for j in range(n):
                    if i == j:
                        corr_matrix[i,j] = 1.0
                    else:
                        key = f"{all_tools[i]} vs {all_tools[j]}"
                        rev_key = f"{all_tools[j]} vs {all_tools[i]}"
                        corr_matrix[i,j] = correlations.get(key, correlations.get(rev_key, 0))
            
            # Create heatmap
            sns.heatmap(corr_matrix,
                       annot=True,
                       fmt='.2f',
                       cmap='RdYlBu',
                       vmin=-1,
                       vmax=1,
                       square=True,
                       xticklabels=all_tools,
                       yticklabels=all_tools,
                       ax=ax)
            
            ax.set_title('Submission-based Correlation Heatmap\n(Spearman)')
            
        except Exception as e:
            print(f"Error creating submission correlation heatmap: {str(e)}")
            traceback.print_exc()
            ax.axis('off')
            ax.text(0.5, 0.5, f"Error creating heatmap:\n{str(e)}",
                    ha='center', va='center', fontsize=12)

    def _calculate_similarity_classes(self, df, traditional_tools):
        """Calculate similarity score classifications for traditional tools"""
        try:
            # Initialize results dictionary
            class_counts = {
                tool: {'high': 0, 'medium': 0, 'low': 0, 'total': 0} 
                for tool in traditional_tools
            }
            
            # Get common pairs across all tools
            processed_pairs = set()
            pair_scores = {}
            
            # Process each problem set
            for ps_id in df['problem_set_id'].unique():
                ps_df = df[df['problem_set_id'] == ps_id]
                
                # Get unique file pairs
                pairs_df = ps_df[ps_df['tool_name'].isin(traditional_tools)][['file1', 'file2']].drop_duplicates()
                
                for _, row in pairs_df.iterrows():
                    # Sort the pair to ensure consistent ordering
                    pair = tuple(sorted([str(row['file1']), str(row['file2'])]))
                    
                    # Skip self-comparisons
                    if pair[0] != pair[1]:
                        pair_key = f"{ps_id}||{pair[0]}||{pair[1]}"
                        
                        # Get scores from all tools for this pair
                        for tool in traditional_tools:
                            tool_data = ps_df[(ps_df['tool_name'] == tool) & 
                                            (((ps_df['file1'] == pair[0]) & (ps_df['file2'] == pair[1])) |
                                             ((ps_df['file1'] == pair[1]) & (ps_df['file2'] == pair[0])))]
                            
                            if not tool_data.empty:
                                score = tool_data['similarity_score'].iloc[0]
                                
                                if pair_key not in pair_scores:
                                    pair_scores[pair_key] = {}
                                pair_scores[pair_key][tool] = score
            
            # Only process pairs that have scores from all tools
            for pair_key, scores in pair_scores.items():
                if len(scores) == len(traditional_tools):
                    for tool, score in scores.items():
                        # Classify score
                        if score >= 80:
                            class_counts[tool]['high'] += 1
                        elif score >= 50:
                            class_counts[tool]['medium'] += 1
                        else:
                            class_counts[tool]['low'] += 1
                        class_counts[tool]['total'] += 1
            
            return class_counts
            
        except Exception as e:
            print(f"Error calculating similarity classes: {str(e)}")
            traceback.print_exc()
            return {}

    def _create_similarity_class_chart(self, ax, class_counts):
        """Create stacked bar chart showing similarity score classifications"""
        try:
            tools = list(class_counts.keys())
            n_tools = len(tools)
            
            # Prepare data for plotting
            high_counts = [class_counts[t]['high'] for t in tools]
            medium_counts = [class_counts[t]['medium'] for t in tools]
            low_counts = [class_counts[t]['low'] for t in tools]
            
            # Calculate percentages
            totals = [class_counts[t]['total'] for t in tools]
            
            # Create bars with new colors
            x = np.arange(n_tools)
            
            # Create stacked bars with updated colors
            bars1 = ax.bar(x, low_counts, 
                          label='Low (<50%)', 
                          color='#0066cc',  # Blue
                          alpha=0.8)
            
            bars2 = ax.bar(x, medium_counts,
                          bottom=low_counts, 
                          label='Medium (50-79%)', 
                          color='#ff9933',  # Orange
                          alpha=0.8)
            
            bars3 = ax.bar(x, high_counts,
                          bottom=[i+j for i,j in zip(low_counts, medium_counts)],
                          label='High (80-100%)', 
                          color='#cc0000',  # Red
                          alpha=0.8)
            
            # Customize plot
            ax.set_ylabel('Number of File Pairs')
            ax.set_title('Similarity Score Classifications by Tool')
            ax.set_xticks(x)
            ax.set_xticklabels(tools)
            
            # Adjust legend position to avoid overlap
            ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
            
            # Add value labels with improved positioning
            def add_labels(bars, counts, is_stacked=False, bottom=None):
                for idx, (rect, count) in enumerate(zip(bars, counts)):
                    height = rect.get_height()
                    if count == 0:  # Skip labels for zero values
                        continue
                        
                    if is_stacked and bottom is not None:
                        y_pos = bottom[idx] + height/2
                    else:
                        y_pos = height/2 if is_stacked else height/2
                    
                    # Calculate percentage
                    percentage = (count/totals[idx])*100 if totals[idx] > 0 else 0
                    
                    # Add label with count and percentage
                    label = f'{count}\n({percentage:.1f}%)'
                    
                    # Adjust vertical position to prevent overlap
                    ax.text(rect.get_x() + rect.get_width()/2., y_pos,
                           label,
                           ha='center',
                           va='center',
                           fontsize=9,
                           fontweight='bold',
                           color='white')  # White text for better contrast
            
            # Add labels
            add_labels(bars1, low_counts)
            add_labels(bars2, medium_counts, True, low_counts)
            add_labels(bars3, high_counts, True, 
                      [i+j for i,j in zip(low_counts, medium_counts)])
            
            # Add grid
            ax.grid(True, alpha=0.3, axis='y')
            
            # Ensure layout accommodates legend
            ax.set_box_aspect(0.8)  # Adjust aspect ratio
            
        except Exception as e:
            print(f"Error creating similarity class chart: {str(e)}")
            traceback.print_exc()
            ax.axis('off')
            ax.text(0.5, 0.5, f"Error creating chart:\n{str(e)}",
                    ha='center', va='center', fontsize=12)