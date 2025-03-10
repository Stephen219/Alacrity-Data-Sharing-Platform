"use client";

import { useParams } from "next/navigation";
import SubmissionDetails from "@/components/ViewSubmission";

const ViewPublicSubmission = () => {
  const { id } = useParams();

  if (!id) return <div className="text-center text-gray-500 text-lg">Invalid Submission ID</div>;

  return (
    <SubmissionDetails
      submissionId={id as string}
      fetchUrl={`http://127.0.0.1:8000/research/submissions/${id}/`}
      backUrl="/researcher/allSubmissions"
    />
  );
};

export default ViewPublicSubmission;
