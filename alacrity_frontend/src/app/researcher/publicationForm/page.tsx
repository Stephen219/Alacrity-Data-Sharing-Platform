"use client";

import { fetchWithAuth } from "@/libs/auth";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import TextEditor from "@/components/TextEditor";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import DisplayFormattedText from "@/components/DisplayFormattedtext";
import TextEditorToolbar from "@/components/TextEditorToolbar";
import { Editor } from "@tiptap/react"; 

const AnalysisForm = () => {
  const [formData, setFormData] = useState<{
    id: null | number;
    title: string;
    description: string;
    rawResults: string;
    summary: string;
    status: string;
    image: File | null;
  }>({
    id: null,
    title: "",
    description: "",
    rawResults: "",
    summary: "",
    status: "draft",
    image: null,
  });

  // global instances for editor
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    console.log("Updated formData:", formData);
  }, [formData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

  const handleSave = async (publish = false) => {
    setLoading(true);
    setMessage("");

    const requestData = new FormData();
    requestData.append("title", formData.title);
    requestData.append("description", formData.description);
    requestData.append("rawResults", formData.rawResults);
    requestData.append("summary", formData.summary);
    requestData.append("status", publish ? "published" : "draft");

    if (formData.image) {
      requestData.append("image", formData.image);
    }

    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/research/submissions/save/", {
        method: "POST",
        body: requestData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(publish ? "Research Published Successfully!" : "Draft Saved Successfully!");
        setFormData((prev) => ({ ...prev, id: data.id, image: null }));
      } else {
        setMessage(`Error: ${data.error || "Failed to save."}`);
      }
    } catch (error) {
      setMessage("Failed to save.");
    }

    setLoading(false);
  };

  return (
    <MaxWidthWrapper>
      <section className="bg-white border border-black mt-12 shadow-2xl rounded-2xl dark:bg-gray-900">
        <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-center dark:text-white">Submit Analysis</h2>
          {message && <p className="text-green-500 text-center mb-4">{message}</p>}

          {/* Global Toolbar */}
<div className="sticky top-0 bg-white p-2  rounded-lg mb-4">
  {editorInstance && <TextEditorToolbar editor={editorInstance} />}
</div>


          <form className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Title</label>
              <TextEditor
                content={formData.title}
                onChange={(content) => setFormData((prev) => ({ ...prev, title: content }))}
                editorInstance={editorInstance}
                setEditorInstance={setEditorInstance}
                autoFocus={true}
                placeholder="Enter title..."
                small={true}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Description</label>
              <TextEditor
                content={formData.description}
                onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
                editorInstance={editorInstance}
                setEditorInstance={setEditorInstance}
                placeholder="Describe your analysis process..."
              />
            </div>

            {/* Raw Results */}
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Raw Results</label>
              <TextEditor
                content={formData.rawResults}
                onChange={(content) => setFormData((prev) => ({ ...prev, rawResults: content }))}
                editorInstance={editorInstance}
                setEditorInstance={setEditorInstance}
                placeholder="Enter raw results..."
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Summary</label>
              <TextEditor
                content={formData.summary}
                onChange={(content) => setFormData((prev) => ({ ...prev, summary: content }))}
                editorInstance={editorInstance}
                setEditorInstance={setEditorInstance}
                placeholder="Summarize your findings..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Upload Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-2 border rounded" />
            </div>

            {/* Buttons (Save as Draft & Submit) */}
            <div className="flex justify-center gap-4 mt-6">
              <Button type="button" className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-md shadow" onClick={() => handleSave(false)} disabled={loading}>
                {loading ? "Saving..." : "Save as Draft"}
              </Button>
              <Button type="button" className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow" onClick={() => handleSave(true)} disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </MaxWidthWrapper>
  );
};

export default AnalysisForm;
