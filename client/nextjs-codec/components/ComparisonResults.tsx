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

interface ComparisonResult {
    confidence: number;
    file_name: string;
    is_plagiarized: boolean;
}

interface ComparisonResultsProps {
    comparisonResult: ComparisonResult[];
    customStyle?: string;
}

const ComparisonResults: React.FC<ComparisonResultsProps> = ({ comparisonResult, customStyle }) => (
    <BorderedContainer customStyle={`p-2 w-fit flex items-center flex-col ${customStyle}`}>
        {/* Comparison Results || Plagiarism Reports */}
        <h2 className="font-medium m-2">Plagiarism Reports</h2> 
        <div className="mb-4">
            <Table className="border-collapse">
                <TableHeader className="w-full">
                    <TableRow>
                        <TableHead className="border text-left">Learner</TableHead>
                        <TableHead className="border text-right">Confidence</TableHead>
                        {/* <TableHead className="border text-right">Proposed Embeddings Results</TableHead> */}
                        <TableHead className="border text-right">Plagiarism Detected</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {comparisonResult.map((result, i) => (
                        <TableRow key={i}>
                            <TableCell className="border">{result.file_name}</TableCell>
                            <TableCell className="border text-right">
                                {(result.confidence * 100).toFixed(2)}%
                            </TableCell>
                            {/* <TableCell className="border text-right">
                            </TableCell> */}
                            <TableCell className={`border text-right ${result.is_plagiarized ? "bg-red-500" : "bg-green-600"
                                }`}>
                                {result.is_plagiarized ? "Yes" : "No"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    </BorderedContainer>
);

export default ComparisonResults;