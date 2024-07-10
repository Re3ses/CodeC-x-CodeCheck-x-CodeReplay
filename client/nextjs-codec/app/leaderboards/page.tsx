'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Select } from '@radix-ui/react-select';
import { useState } from 'react';

export default function LeaderboardsPage() {
  const [completionTimeFilter, setCompletionTimeFilter] =
    useState<string>('Fastest');
  const [nameFilter, setNameFilter] = useState<string>('A-Z');
  const [recencyFilter, setRecencyFilter] = useState<string>('Latest');
  const [scoreFilter, setScoreFilter] = useState<string>('Highest');

  function filterByCompletionTime() {
    completionTimeFilter === 'Fastest'
      ? setCompletionTimeFilter('Slowest')
      : setCompletionTimeFilter('Fastest');
  }

  function filterByName() {
    nameFilter === 'A-Z' ? setNameFilter('Z-A') : setNameFilter('A-Z');
  }

  function filterByRecency() {
    recencyFilter === 'Latest'
      ? setRecencyFilter('Oldest')
      : setRecencyFilter('Latest');
  }

  function filterByScore() {
    scoreFilter === 'Highest'
      ? setScoreFilter('Lowest')
      : setScoreFilter('Highest');
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Top ranking */}
      <div className="relative bg-card border border-slate-800/50 p-3 rounded text-center flex flex-col gap-2">
        <div className="w-full text-start lg:absolute top-0 left-0 m-2 flex gap-2">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Room selection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Problem selection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-center flex flex-col">
          <small>Top ranking</small>
          <strong>Problem: Hello world</strong>
        </div>
        <div className="flex justify-center align-middle flex-col">
          <h1 className="text-3xl">Jotaro Joestar</h1>
          <div className="flex gap-4 align-middle justify-center">
            <div className="flex flex-col text-center">
              <small>Completed in</small>
              <span>5m 53s 100ms</span>
            </div>
            <div className="flex flex-col text-center">
              <small>Score</small>
              <span>4555</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <table className="card border border-slate-700/50 table-auto w-full text-sm">
        <thead>
          <tr className="bg-card ">
            <th
              className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50"
              onClick={filterByName}
            >
              Name: ({nameFilter})
            </th>
            <th
              className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50"
              onClick={filterByRecency}
            >
              Recency: ({recencyFilter})
            </th>
            <th
              className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50"
              onClick={filterByScore}
            >
              Score: ({scoreFilter})
            </th>
            <th
              className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50"
              onClick={filterByCompletionTime}
            >
              Completion time: ({completionTimeFilter})
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-slate-700/50 border-b [&_td]:p-2">
            <td>John doe</td>
            <td>20m ago</td>
            <td>1533</td>
            <td>14m 23s 153ms</td>
          </tr>
          <tr className="border-slate-700/50 border-b [&_td]:p-2">
            <td>John doe</td>
            <td>20m ago</td>
            <td>1533</td>
            <td>14m 23s 153ms</td>
          </tr>
          <tr className="border-slate-700/50 border-b [&_td]:p-2">
            <td>John doe</td>
            <td>20m ago</td>
            <td>1533</td>
            <td>14m 23s 153ms</td>
          </tr>
          <tr className="border-slate-700/50 border-b [&_td]:p-2">
            <td>John doe</td>
            <td>20m ago</td>
            <td>1533</td>
            <td>14m 23s 153ms</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
