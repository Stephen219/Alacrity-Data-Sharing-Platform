"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import parse from "html-react-parser";
import { Button } from "@/components/ui/button";
import React, { Suspense, useMemo } from "react";

interface SubmissionDetailsProps {
  submissionId: string;
  fetchUrl: string;
  backUrl: string;
  onBack?: () => void;
}

const fetchSubmission = async (fetchUrl: string) => {
  const response = await fetch(fetchUrl);
  if (!response.ok) throw new Error("Failed to fetch submission.");
  return response.json();
};

const SubmissionDetails = ({ submissionId, fetchUrl}: SubmissionDetailsProps) => {
  const router = useRouter();

  const { data: submission, isLoading, error } = useQuery({
    queryKey: ["submission", submissionId], 
    queryFn: () => fetchSubmission(fetchUrl),
    staleTime: 60000, 
    refetchOnWindowFocus: false, 
  });
  

  const parsedSubmission = useMemo(() => {
    if (!submission) return { title: "", description: "", rawResults: "", summary: "" };
  
    return {
      title: parse(submission.title || ""),
      description: parse(submission.description || ""),
      rawResults: parse(submission.raw_results || ""),
      summary: parse(submission.summary || ""),
    };
  }, [submission]);
  

  if (isLoading) return <div className="text-center text-gray-600 text-lg">Loading...</div>;
  if (error) return <div className="text-center text-red-500 text-lg">Error: {error.message}</div>;
  if (!submission) return <div className="text-center text-gray-500 text-lg">Submission not found.</div>;

  return (
    <MaxWidthWrapper>
      <Suspense fallback={<div className="text-center text-lg">Rendering...</div>}>
        <div className="bg-white border-black border shadow-lg rounded-2xl dark:bg-gray-600 p-8 max-w-4xl mx-auto mt-32">

          {/* Title */}
          <div className="text-4xl font-bold text-center mb-3 text-gray-900 dark:text-white break-words">
            {parsedSubmission.title}
          </div>
          
          {/* Content Sections */}
          <div className="mt-6 space-y-8 text-gray-800 dark:text-gray-300">
            
            {/* Description */}
            <div>
              <div className="text-2xl font-semibold border-b pb-2 mb-2 border-gray-300 dark:border-gray-700">
                Description
              </div> 
              <div className="leading-relaxed text-lg mt-6 break-words">{parsedSubmission.description}</div>
            </div>

            {/* Raw Results */}
            <div>
              <div className="text-2xl font-semibold border-b pb-2 mb-2 border-gray-300 dark:border-gray-700">
                Raw Results
              </div>
              <div className="leading-relaxed text-lg mt-6 break-words">{parsedSubmission.rawResults}</div>
            </div>

            {/* Summary */}
            <div>
              <div className="text-2xl font-semibold border-b pb-2 mb-2 border-gray-300 dark:border-gray-700">
                Summary
              </div>
              <div className="leading-relaxed text-lg mt-6 break-words">{parsedSubmission.summary}</div>
            </div>
          </div>

          {/* Lazy Loaded Image */}
          {submission.image && (
            <img src={submission.image} loading="lazy" decoding="async" alt="Submission" className="mt-6 w-full h-auto" />
          )}

          {/* Back Button */}
          <div className="mt-8">
            <Button
              onClick={() => router.back()}
              className="hover:bg-orange-400 transition duration-200"
            >
              Back
            </Button>
          </div>

        </div>
      </Suspense>
    </MaxWidthWrapper>
  );
};

export default SubmissionDetails;
