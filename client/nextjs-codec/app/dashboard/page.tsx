import React from 'react';
import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import LoadingAnimation from './loading';

const inspirationalQuotes = [
  "Every coding challenge is an opportunity to grow and innovate together.",
  "In the world of programming, persistence and creativity build excellence.",
  "Great solutions emerge when we embrace challenges with curiosity.",
  "Today's challenges are tomorrow's stepping stones to success.",
];

export default function Page() {
  const randomQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];

  return (
    <div className="p-6 h-full w-full flex items-center justify-center">
      <Card className="overflow-hidden w-full h-fit max-w-4xl mx-auto">
        <CardContent className="p-0 h-fit w-full">
          <div className="bg-gray-900 p-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Trophy Section */}
              <div className="flex-shrink-0">
                <Trophy className="w-16 h-16 text-yellow-400 motion-safe:animate-pulse" />
              </div>

              {/* Inspirational Message Section */}
              <div className="text-center md:text-left">
                <h2 className="text-yellow-400 text-xl font-bold mb-2">
                  Welcome to Your Coding Journey!
                </h2>
                <p className="text-white text-base font-medium leading-relaxed">
                  {randomQuote}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Encouraging Text */}
          <div className="p-4 bg-white text-center border-t border-yellow-400">
            <p className="text-gray-900 text-sm">
              Ready to explore the world of programming? Each challenge brings new discoveries!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}