"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Editor } from "@tiptap/react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import TextEditorToolbar from "@/components/TextEditorToolbar";
import ResearchForm from "@/components/ResearchForm";
import { fetchWithAuth } from "@/libs/auth";

const EditDraft = () => {
  const { id: draftId } = useParams(); 
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    rawResults: "",
    summary: "",
    status: "draft",
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!draftId) return;
  
    const fetchDraft = async () => {
      try {
        const response = await fetchWithAuth(`http://127.0.0.1:8000/research/drafts/${draftId}/`);
        if (!response.ok) throw new Error("Failed to fetch draft.");
        const data = await response.json();
  
        console.log("Fetched draft:", data);
  
        setFormData({
          id: data.id || null,
          title: data.title || "",
          description: data.description || "",
          rawResults: data.raw_results || "",
          summary: data.summary || "",
          status: data.status || "draft",
          image: data.image || null,
        });
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    };
  
    fetchDraft();
  }, [draftId]);
  

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <MaxWidthWrapper>
      <section className="bg-white border border-black mt-12 shadow-2xl rounded-2xl dark:bg-gray-900">
        <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-center dark:text-white">Edit Draft</h2>

          <div className="sticky top-16 z-30 bg-white p-2 rounded-lg mb-4">
            {editorInstance && <TextEditorToolbar editor={editorInstance} />}
          </div>

          <ResearchForm 
            editorInstance={editorInstance} 
            setEditorInstance={setEditorInstance}
            initialData={formData}
          />
        </div>
      </section>
    </MaxWidthWrapper>
  );
};

export default EditDraft;
