import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import TextEditor from "@/components/TextEditor";
import { Editor } from "@tiptap/react";
import { fetchWithAuth } from "@/libs/auth";

interface AnalysisFormProps {
  editorInstance: Editor | null;
  setEditorInstance: React.Dispatch<React.SetStateAction<Editor | null>>;
}

const AnalysisFormComponent = ({ editorInstance, setEditorInstance }: AnalysisFormProps) => {
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

  const [loading, setLoading] = useState(false);
  const [,setMessage] = useState("");

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
    } catch {
      setMessage("Failed to save.");
    }

    setLoading(false);
  };

  return (
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
        <Button type="button" variant={"ghost"} className="border" onClick={() => handleSave(false)} disabled={loading}>
          {loading ? "Saving..." : "Save as Draft"}
        </Button>
        <Button type="button" className="primary" onClick={() => handleSave(true)} disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
};

export default AnalysisFormComponent;
