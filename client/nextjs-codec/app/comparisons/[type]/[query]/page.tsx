'use client';
import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';
import ComparisonResults from "@/components/ComparisonResults";
import SourceCodeViewer from "@/components/ui/comparison-ui/sourceCodeViewer";
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
    console.log("submissions:", submissions);
    fetchData();
  }, [type, query, router]);

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
            tokenizer: "char",
            model: "default",
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

  return (
    <>
      <Nav type={user?.type} name={user?.auth.username} />
      <div className='flex justify-center w-full'>
      <div className="flex flex-row gap-2 justify-center p-2 max-w-screen-2xl">
        {loading ? null : <ComparisonResults comparisonResult={results} />}
        <div className='flex flex-col w-full'>
          {loading ? null : <SourceCodeViewer submissions={submissions} ComparisonResult={results} />}
        </div>
      </div>
      </div>
    </>
  );
}
