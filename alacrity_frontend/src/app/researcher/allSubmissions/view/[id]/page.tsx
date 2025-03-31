"use client";

import { useParams } from "next/navigation";
import SubmissionDetails from "@/components/ViewSubmission";
import { BACKEND_URL } from "@/config";

const ViewPublicSubmission = () => {
  const { id } = useParams();

  if (!id) return <div className="text-center text-gray-500 text-lg">Invalid Submission ID</div>;

  return (
    <SubmissionDetails
      submissionId={id as string}
      fetchUrl={`${BACKEND_URL}/research/submissions/${id}/`}
      backUrl="/researcher/allSubmissions"
    />
  );
};

export default ViewPublicSubmission;
