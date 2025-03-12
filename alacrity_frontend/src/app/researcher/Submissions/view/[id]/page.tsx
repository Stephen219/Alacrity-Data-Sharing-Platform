"use client";

import { useParams, useRouter } from "next/navigation";
import Submission from "@/components/ViewSubmission";

const ViewSubmission = () => {
  const { id } = useParams();
  const router = useRouter();

  if (!id) return <div className="text-center text-gray-500 text-lg">Invalid Submission ID</div>;

  return (
    <Submission
      submissionId={id as string}
      fetchUrl={`http://127.0.0.1:8000/research/submissions/${id}/`}
      backUrl="#" 
      onBack={() => router.back()} 
    />
  );
};

export default ViewSubmission;
