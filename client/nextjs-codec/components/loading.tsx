// components/Loading.tsx

import React from 'react';

export default function Loading({ message = 'Loading' }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-muted-foreground text-sm">{message}</p>
        </div>
    );
}
