import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';

// TODO:
// query submisions
// display submissions
export default function Page() {
    return (
        <div>
        <h1>Submissions Check</h1>
        <p>
            Upload java files for similarity detection.
        </p>
        <Button variant="default" color="primary">Submit</Button>
        <Button variant="default" color="secondary">Upload and compare</Button>
        </div>
    );
}