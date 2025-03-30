"use client";

import { useParams, useRouter } from "next/navigation";
import Submission from "@/components/ViewSubmission";
import { BACKEND_URL } from "@/config";

const ViewSubmission = () => {
  const { id } = useParams();
  const router = useRouter();

  if (!id) return <div className="text-center text-gray-500 text-lg">Invalid Submission ID</div>;

  return (
    <Submission
      submissionId={id as string}
      fetchUrl={`${BACKEND_URL}/research/submissions/${id}/`}
      backUrl="#" 
      onBack={() => router.back()} 
    />
  );
};

export default ViewSubmission;
