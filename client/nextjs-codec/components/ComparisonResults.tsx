import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import BorderedContainer from "./ui/wrappers/BorderedContainer";

interface Comparison {
    filename: string;
    structural_similarity: number;
    token_similarity: number;
    tfidf_similarity: number;
    semantic_similarity: number;
    combined_similarity: number;
    potential_plagiarism: boolean;
}

interface ComparisonResult {
    file: string;
    comparisons: Comparison[];
}

interface ComparisonResultsProps {
    comparisonResult: ComparisonResult[];
}

const ComparisonResults: React.FC<ComparisonResultsProps> = ({ comparisonResult }) => (
    <BorderedContainer customStyle="w-full p-2 flex items-center flex-col">
        <h2 className="font-medium mb-2">List of Comparison Results for this Problem</h2>
        {comparisonResult.map((result, index) => (
            <BorderedContainer customStyle=" p-2 my-2">
                <div key={index} className="mb-4">
                    <h2 className="font-bold uppercase p-2">
                        {result.file}
                    </h2>

                    <Table className="border-collapse">
                        <TableHeader className="w-full">
                            <TableRow>
                                <TableHead className="border text-left">Learner</TableHead>
                                <TableHead className="border text-right">Structural Similarity</TableHead>
                                <TableHead className="border text-right">Token Similarity</TableHead>
                                <TableHead className="border text-right">TF-IDF Similarity</TableHead>
                                <TableHead className="border text-right">Semantic Similarity</TableHead>
                                <TableHead className="border text-right">Combined Similarity</TableHead>
                                <TableHead className="border text-right">Potential Plagiarism</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {result.comparisons.map((comparison, i) => (
                                <TableRow key={i} >
                                    <TableCell className="border">{comparison.filename}</TableCell>
                                    <TableCell className="border text-right">
                                        {comparison.structural_similarity.toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="border text-right">
                                        {comparison.token_similarity.toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="border text-right">
                                        {comparison.tfidf_similarity.toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="border text-right">
                                        {comparison.semantic_similarity.toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="border text-right">
                                        {comparison.combined_similarity.toFixed(2)}%
                                    </TableCell>
                                    <TableCell className={`border text-right ${comparison.potential_plagiarism ? "bg-red-500" : "bg-green-600"
                                        }`}>
                                        {comparison.potential_plagiarism ? "Yes" : "No"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </BorderedContainer>
        ))}
    </BorderedContainer>
);

export default ComparisonResults;