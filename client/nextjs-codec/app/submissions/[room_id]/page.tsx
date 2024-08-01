'use client';

import { UserContext } from '@/app/dashboard/contexts';
import Profile from './profile';
import BorderedContainer from '../../../components/ui/wrappers/BorderedContainer';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function Page(props: { type: string }) {
  const { room_id } = useParams();
  const [submissions, setSubmissions] = useState<any>();
  const [selectedSubmission, setSelectedSubmission] = useState<any>();

  useEffect(() => {
    const fetchData = async () => {
      await fetch(`/api/userSubmissions?room_id=${room_id}`).then(
        async (val) => {
          await val.json().then((data) => {
            setSubmissions(data);
          });
        }
      );
    };

    fetchData();
  }, [room_id]);

  return (
    <div className="flex gap-2 justify-between">
      {/* Submission section */}
      <BorderedContainer customStyle="w-full p-2">
        <Table>
          <TableCaption>List of who submitted in this room</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Verdict</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions?.submission.map((submission: any) => {
              return (
                <TableRow
                  key={submission._id}
                  onClick={() => {
                    setSelectedSubmission(submission);
                  }}
                >
                  <TableCell className="font-medium">
                    {submission?.learner}
                  </TableCell>
                  <TableCell>{submission?.completion_time}</TableCell>
                  <TableCell>
                    {submission?.score} / {submission?.score_overall_count}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        submission?.verdict === 'ACCEPTED'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {submission.verdict}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </BorderedContainer>

      <UserContext.Provider value={selectedSubmission}>
        <Profile type={props.type} />
      </UserContext.Provider>
    </div>
  );
}
