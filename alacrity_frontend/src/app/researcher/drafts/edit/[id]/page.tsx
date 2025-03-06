"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import TextEditorToolbar from "@/components/TextEditorToolbar";
import { Editor } from "@tiptap/react";
import ResearchForm from "@/components/ResearchForm";

interface Analysis {
  id: number | null;
  title: string;
  description: string;
  raw_results: string;
  summary: string;
  status: string;
}

const EditDraft = () => {
  const params = useParams();
  const id = params?.id as string;
  const [draft, setDraft] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDraft = async () => {
      try {
        const response = await fetchWithAuth(`http://127.0.0.1:8000/research/drafts/${id}/`);
        if (!response.ok) throw new Error("Failed to fetch draft.");
        const data = await response.json();
        setDraft(data);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };

    fetchDraft();
  }, [id]);

  if (loading) return <p>Loading draft...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!draft) return <p>No draft found.</p>;

  return (
    <MaxWidthWrapper>
      <section className="bg-white border border-black mt-12 shadow-2xl rounded-2xl dark:bg-gray-900 mt-48">
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
        </div>
      </section>
    </MaxWidthWrapper>
  );
};

export default EditDraft;
