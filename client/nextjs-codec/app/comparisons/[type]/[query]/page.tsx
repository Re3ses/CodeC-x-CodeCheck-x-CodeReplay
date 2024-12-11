'use client';

import { UserContext } from '@/app/dashboard/contexts';
import BorderedContainer from '../../../../components/ui/wrappers/BorderedContainer';
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
import { useParams, useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';
import moment from 'moment';

interface User {
  _id: number;
  first_name: string;
  last_name: string;
  type: string;
  auth: {
    username: string;
  };
}

export default function Page() {
  const router = useRouter();

  const { type, query } = useParams();
  const [submissions, setSubmissions] = useState<any>();
  const [selectedSubmission, setSelectedSubmission] = useState<any>();
  const [user, setUser] = useState<User>();

  useEffect(() => {
    // Get user/login
    const req = async () => {
      await getUser().then((val) => {
        setUser(val);
        if (
          val.error ||
          val.message === 'Authentication failed: [JWT MALFORMED]'
        ) {
          router.push('/login');
        }
      });
    };
    req();

    // Fetch room data
    const fetchData = async () => {
      if (type === "problem") {
        await fetch(`/api/userSubmissions?problem_slug=${query}&all=true`).then(
          async (val) => {
            await val.json().then((data) => {
              setSubmissions(data);
            });
          }
        );
      } else if (type === "coderoom") {
        await fetch(`/api/userSubmissions?room_id=${query}&all=true`).then(
          async (val) => {
            await val.json().then((data) => {
              setSubmissions(data);
            });
          }
        );
      }
    };

    fetchData();
  }, [type, query, router]);

  return (
    <>
      <Nav type={user?.type} name={user?.auth.username} />
      <div className="flex flex-col gap-2 justify-between m-4">
        {/* Results summary section */}
        <div className='flex'>
          <BorderedContainer customStyle="w-full p-2">
            Similarity Graph
          </BorderedContainer>
          <BorderedContainer customStyle="w-full p-2">
            Group Distance Similarity
          </BorderedContainer>
        </div>

        {/* Submission section */}
        <BorderedContainer customStyle="w-full p-2">
          <Table>
            <TableCaption>List of who submitted in this room</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Similarity Score</TableHead>
                <TableHead>Most Similar Submission</TableHead>
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
                    <TableCell>
                      {submission?.similarity_score || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {submission?.most_similar_submission || 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </BorderedContainer>
      </div>
    </>
  );
}
