"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/libs/auth";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import parse from "html-react-parser";
import { Button } from "@/components/ui/button";

interface Analysis {
  id: number;
  title: string;
  description: string;
  raw_results: string;
  summary: string;
  submitted_at: string;
  image?: string;
}

interface SubmissionDetailsProps {
  submissionId: string;
  fetchUrl: string;
  backUrl: string;
}

const SubmissionDetails = ({ submissionId, fetchUrl, backUrl }: SubmissionDetailsProps) => {
  const router = useRouter();
  const [submission, setSubmission] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) return;

    const fetchSubmission = async () => {
      try {
        const response = await fetchWithAuth(fetchUrl);
        if (!response.ok) throw new Error("Failed to fetch submission.");
        const data = await response.json();
        setSubmission(data);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };

    fetchSubmission();
  }, [submissionId, fetchUrl]);

  if (loading) return <div className="text-center text-gray-600 text-lg">Loading...</div>;
  if (error) return <div className="text-center text-red-500 text-lg">Error: {error}</div>;
  if (!submission) return <div className="text-center text-gray-500 text-lg">Submission not found.</div>;

  return (
    <MaxWidthWrapper>
      <div className="bg-white border-black border shadow-lg rounded-2xl dark:bg-gray-900 p-8 max-w-4xl mx-auto mt-32">

        {/* Title */}
        <div className="text-4xl font-bold text-center mb-3 text-gray-900 dark:text-white">
          {parse(submission.title)}
        </div>
        
        {/* Content Sections */}
        <div className="mt-6 space-y-8 text-gray-800 dark:text-gray-300">
          
          {/* Description */}
          <div>
            <div className="text-2xl font-semibold border-b pb-2 mb-2 border-gray-300 dark:border-gray-700">
              Description
            </div> 
            <div className="leading-relaxed text-lg mt-6">{parse(submission.description)}</div>
          </div>

          {/* Raw Results */}
          <div>
            <div className="text-2xl font-semibold border-b pb-2 mb-2 border-gray-300 dark:border-gray-700">
              Raw Results
            </div>
            <div className="leading-relaxed text-lg mt-6">{parse(submission.raw_results)}</div>
          </div>

          {/* Summary */}
          <div>
            <div className="text-2xl font-semibold border-b pb-2 mb-2 border-gray-300 dark:border-gray-700">
              Summary
            </div>
            <div className="leading-relaxed text-lg mt-6">{parse(submission.summary)}</div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Button
            onClick={() => router.push(backUrl)}
            className="hover:bg-orange-400 transition duration-200"
          >
            Back
          </Button>
        </div>

      </div>
    </MaxWidthWrapper>
  );
};

export default SubmissionDetails;
