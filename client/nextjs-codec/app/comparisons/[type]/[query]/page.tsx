'use client';
import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';
import ComparisonResults from "@/components/ComparisonResults";

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
  const [submissions, setSubmissions] = useState([]);
  const [user, setUser] = useState<User>();
  const [results, setResults] = useState<any>();
  const [loading, setLoading] = useState(true);

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
        await fetch(`/api/userSubmissions?problem_slug=${query}&all=true&single=true`).then(
          async (val) => {
            await val.json().then((data) => {
              setSubmissions(data.submission);
            });
          }
        );
      } else if (type === "coderoom") {
        await fetch(`/api/userSubmissions?room_id=${query}&all=true&single=true`).then(
          async (val) => {
            await val.json().then((data) => {
              setSubmissions(data.submission);
            });
          }
        );
      }
    };

    fetchData();
  }, [type, query, router]);

  const handleCompare = async () => {
    setLoading(true);
    try {
      console.log("Comparing files");

      const res = await fetch("http://127.0.0.1:5000/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          submissions: submissions,
          query: {
            tokenizer: "char",
            model: "default",
            detection_type: "comparison"
          }
        })
      });
      const data = await res.json();
      console.log("data:", data);
      setResults(data);
      console.log("results:", results);
    }
    catch (e) {
      console.error(e);
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleCompare();
  }, [submissions]);

  return (
    <>
      <Nav type={user?.type} name={user?.auth.username} />
      <div className="flex flex-col gap-2 justify-between m-4">
        {loading ?  null : <ComparisonResults comparisonResult={results} />}
        {/* Submission section */}
        {/* <BorderedContainer customStyle="w-full p-2">
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
        </BorderedContainer> */}
      </div>
    </>
  );
}
