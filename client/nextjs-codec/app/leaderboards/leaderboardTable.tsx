'use client';

import { buttonVariants } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import moment from 'moment';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

async function fetchUserSubmissions(searchParams: ReadonlyURLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '5', 10);

  const response = await fetch(
    // Temp fix, fetch all
    `/api/userSubmissions?all=true`
  );
  return response.json();
}

export default function LeaderboardTable() {
  const searchParams = useSearchParams();

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(5);

  useEffect(() => {
    const getSubmissions = async () => {
      const userSubmissionsData = await fetchUserSubmissions(searchParams);
      const { submissions, count } = userSubmissionsData;

      setSubmissions(submissions);
      setSubmissionCount(count);

      const page = parseInt(searchParams.get('page') || '1', 10);
      const perPage = parseInt(searchParams.get('perPage') || '5', 10);

      setCurrentPage(page);
      setPerPage(perPage);
      setPageCount(Math.ceil(count / perPage));
    };

    getSubmissions();
  }, [searchParams, perPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return;
    setCurrentPage(newPage);
    window.location.search = `?page=${newPage}&perPage=${perPage}`;
  };

  return (
    <>
      {/* TODO: Add filters */}

      {/* Table pagination
      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
            />
          </PaginationItem>
          <PaginationItem>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
              <PaginationLink
                key={page}
                onClick={() => handlePageChange(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            ))}
          </PaginationItem>
          <PaginationItem>
            <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination> */}

      {/* Leaderboard table */}
      <table className="card border border-slate-700/50 table-auto w-full text-sm">
        <thead>
          <tr className="bg-card">
            <th className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50">
              Name
            </th>
            <th className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50">
              Language used
            </th>
            <th className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50">
              Score
            </th>
            <th className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50">
              Problem ID
            </th>
            <th className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50">
              Attempt count
            </th>
            <th className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50">
              Start time
            </th>
            <th className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50">
              End time
            </th>
            <th className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50">
              Completion time
            </th>
            <th className="p-3 text-start hover:cursor-pointer hover:bg-slate-800/50">
              Submission date
            </th>
          </tr>
        </thead>
        <tbody>
          <Suspense fallback={<div>Loading table...</div>}>
            {submissions?.map((element: any) => (
              <tr
                className="border-slate-700/50 border-b [&_td]:p-2"
                key={element._id}
              >
                <td>{element.learner}</td>
                <td>{element.language_used}</td>
                <td
                  className={
                    element.score === element.score_overall_count
                      ? 'text-[green] font-bold'
                      : 'text-[red]'
                  }
                >
                  {element.score} / {element.score_overall_count}
                </td>
                <td>{element.problem}</td>
                <td>{element.attempt_count}</td>
                <td>
                  {moment(element.start_time).format('MMMM Do YYYY, h:mm:ss a')}
                </td>
                <td>
                  {element.end_time > 0 ? (
                    <span className="text-[green]">
                      {moment(element.end_time).format(
                        'MMMM Do YYYY, h:mm:ss a'
                      )}
                    </span>
                  ) : (
                    <span className="text-[red]">Unsolved</span>
                  )}
                </td>
                <td>
                  {element.completion_time > 0 ? (
                    <span className="text-[green]">
                      {moment.duration(element.completion_time).humanize()}
                    </span>
                  ) : (
                    <span className="text-[red]">Unsolved</span>
                  )}
                </td>
                <td>{moment(element.submission_date).fromNow()}</td>
              </tr>
            ))}
          </Suspense>
        </tbody>
      </table>
    </>
  );
}
