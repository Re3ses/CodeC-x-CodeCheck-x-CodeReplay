'use client';
import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';
import { ProblemSchemaInferredType } from '@/lib/interface/problem';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import ComparisonResults from "@/components/ComparisonResults";
import SourceCodeViewer from "@/components/ui/comparison-ui/SourceCodeViewer";
import { GetProblems } from '@/utilities/apiService';
import SafeHtml from '@/components/SafeHtml';
import { Button } from '@/components/ui/button';
import BorderedContainer from '@/components/ui/wrappers/BorderedContainer';

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
  const params = useParams<{ type: string, id: string, query: string }>();
  const [submissions, setSubmissions] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState<ProblemSchemaInferredType | RoomSchemaInferredType>();
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
      if (params.type === "problem") {
        await fetch(`/api/userSubmissions?problem_slug=${params.id}&all=true&single=true`).then(
          async (val) => {
            await val.json().then((data) => {
              setSubmissions(data.submission);
            });
          }
        );
        const res: () => Promise<ProblemSchemaInferredType> = async () => {
          return await GetProblems(params.id);
        };
        res().then((result) => setAdditionalInfo(result));
      } else if (params.type === "coderoom") {
        await fetch(`/api/userSubmissions?room_id=${params.id}&all=true&single=true`).then(
          async (val) => {
            await val.json().then((data) => {
              setSubmissions(data.submission);
            });
          }
        );
        // await fetch(`/api/rooms?room_id=${params.id}`).then(
        //   async (val) => {
        //     await val.json().then((data) => {
        //       setAdditionalInfo(data.room);
        //     });
        //   }
        // );
      }
    };
    fetchData();
  }, [params.type, params.id, params.query, router]);

  const handleCompare = async () => {
    setLoading(true);
    try {

      const res = await fetch("http://127.0.0.1:5000/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          submissions: submissions,
          query: {
            model: params.query || "default", // "default", "ts_no-prep", "no-ts_prep", "no-ts_no-prep"
            detection_type: "model" // Change this to "model" or "embeddings" to set the detection type
          }
        })
      });
      const data = await res.json();
      setResults(data);
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

  useEffect(() => {
    console.log("additionalInfo:", additionalInfo);
  }, [additionalInfo]);

  return (
    <div className='h-screen w-screen flex flex-col'>
      <Nav type={user?.type} name={user?.auth.username} />
      <div className='flex-grow flex flex-col items-center justify-center w-full'>
        {loading ? <h1>Loading...</h1> : null}
        {loading ? null :
          <BorderedContainer customStyle='w-full max-w-screen-2xl flex justify-between'>
            <div>
              <SafeHtml
                className="text-center font-bold"
                html={additionalInfo?.name!}
              />
              <SafeHtml html={additionalInfo?.description!} />
            </div>
            <Button onClick={() => router.back()} variant="secondary">Back</Button>
          </BorderedContainer>
        }
        {loading ? null :
          <div className="flex flex-row gap-2 justify-center max-w-screen-2xl">
            <ComparisonResults comparisonResult={results} />
            <div className='flex flex-col w-full'>
              <SourceCodeViewer submissions={submissions} ComparisonResult={results} />
            </div>
          </div>
        }
      </div>
    </div>
  );
}
