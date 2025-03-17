"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import TextEditorToolbar from "@/components/TextEditorToolbar";
import { Editor } from "@tiptap/react";
import ResearchForm from "@/components/ResearchForm";
import { BACKEND_URL } from "@/config";

interface Analysis {
  id: number | null;
  title: string;
  description: string;
  raw_results: string;
  summary: string;
  status: string;
  dataset_id?: string | null;
}

const EditDraft = () => {
  const params = useParams();
  const router = useRouter();

  // Extract dataset_id and submission_id from the URL
  const datasetId = params?.dataset_id as string;
  const submissionId = params?.submission_id as string;

  // State for draft, loading, and error handling
  const [draft, setDraft] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  useEffect(() => {
    if (!datasetId || !submissionId) {
      console.error("❌ Error: Missing datasetId or submissionId.");
      setError("Missing dataset ID or submission ID.");
      return;
    }

    const fetchDraft = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/${datasetId}/drafts/${submissionId}/`);
        if (!response.ok) throw new Error("Failed to fetch draft.");
        const data = await response.json();
        setDraft(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [datasetId, submissionId]);

  if (loading) return <p>Loading draft...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!draft) return <p>No draft found.</p>;

  return (
    <MaxWidthWrapper>
      <section className="bg-white border border-black mt-12 shadow-2xl rounded-2xl dark:bg-gray-900">
        <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-center dark:text-white">
            Edit Analysis
          </h2>

          <div className="sticky top-16 z-30 bg-white p-2 rounded-lg mb-4">
            {editorInstance && <TextEditorToolbar editor={editorInstance} />}
          </div>

          <ResearchForm 
            editorInstance={editorInstance} 
            setEditorInstance={setEditorInstance} 
            initialData={draft} 
          />

          <div className="flex justify-center gap-4 mt-6">
            <button 
              onClick={() => router.push(`/researcher/drafts/${datasetId}`)} 
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Drafts
            </button>
          </div>
        </div>
      </section>
    </MaxWidthWrapper>
  );
};

export default EditDraft;
