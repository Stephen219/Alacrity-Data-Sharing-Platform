
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import TextEditor from "@/components/TextEditor";
import { Editor } from "@tiptap/react";
import { fetchWithAuth } from "@/libs/auth";
import { useSearchParams } from "next/navigation"; 

interface Analysis {
  id: number | null;
  title: string;
  description: string;
  raw_results: string;
  summary: string;
  status: string;
  image?: File | null;
}

interface AnalysisFormProps {
  editorInstance: Editor | null;
  setEditorInstance: React.Dispatch<React.SetStateAction<Editor | null>>;
  initialData?: Analysis;
}


const AnalysisFormComponent = ({ editorInstance, setEditorInstance }: AnalysisFormProps) => {
  const searchParams = useSearchParams(); 
  const [formData, setFormData] = useState<{
    id: null | number;
    title: string;
    description: string;
    rawResults: string;
    summary: string;
    status: string;
    image: File | null;
    datasetId?: string; 
  }>({
    id: null,
    title: "",
    description: "",
    rawResults: "",
    summary: "",
    status: "draft",
    image: null,
    datasetId: undefined,
  });

const AnalysisFormComponent = ({ editorInstance, setEditorInstance, initialData }: AnalysisFormProps) => {
  const [formData, setFormData] = useState<Analysis>(() => ({
    id: initialData?.id || null,
    title: initialData?.title || "",
    description: initialData?.description || "",
    raw_results: initialData?.raw_results || "",
    summary: initialData?.summary || "",
    status: initialData?.status || "draft",
    image: null,
  }));


  const [lastSavedData, setLastSavedData] = useState<Analysis | null>(null);
  const [lastPublishedData, setLastPublishedData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");



  useEffect(() => {
    const datasetId = searchParams.get("id");
    console.log("Dataset ID:", datasetId);
    console.log("Dataset ID:", datasetId);
    console.log("Dataset ID:", datasetId);
    if (datasetId) {
      setFormData((prev) => ({ ...prev, datasetId }));
    }
  }, [searchParams]);


  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        image: null,
      }));
      setLastSavedData(initialData);
      if (initialData.status === "published") {
        setLastPublishedData(initialData);
      }
    }
  }, [initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

  const isContentSame = (newData: Analysis, oldData: Analysis | null) => {
    if (!oldData) return false;
    return (
      newData.title === oldData.title &&
      newData.description === oldData.description &&
      newData.raw_results === oldData.raw_results &&
      newData.summary === oldData.summary
    );
  };

  const handleSave = async (publish = false) => {
    if (!publish && isContentSame(formData, lastSavedData)) {
      setMessage("This draft has already been saved.");
      return;
    }

    if (publish && isContentSame(formData, lastPublishedData)) {
      setMessage("This research has already been published.");
      return;
    }

    setLoading(true);
    setMessage("");

    const requestData = new FormData();
    requestData.append("title", formData.title);
    requestData.append("description", formData.description);
    requestData.append("rawResults", formData.raw_results);
    requestData.append("summary", formData.summary);
    requestData.append("status", publish ? "published" : "draft");
    if (formData.datasetId) {
      requestData.append("dataset_id", formData.datasetId); 
    }
    if (formData.image) {
      requestData.append("image", formData.image);
    }

    // TODO: I CAN OPTIONNALY MAKE THE THE PAGE NOT TO RENDER WITHOUT THE DATASET ID OR 
    // MAKE THE DATASET ID A REQUIRED PARAMETER BY THE URL STRUCTURE
    // BUT FOR NOW IT WORKS BUT CANNOT SUBMITT WITHOUT THE DATASET ID
    


    try {
      const response = await fetchWithAuth(
        `http://127.0.0.1:8000/research/submissions/save/`,
        {
          method: "POST",
          body: requestData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(publish ? "Research Published Successfully!" : "Draft Saved Successfully!");
        setFormData((prev) => ({ ...prev, id: data.id, image: null }));

        if (publish) {
          setLastPublishedData({ ...formData, id: data.id });
        } else {
          setLastSavedData({ ...formData, id: data.id });
        }
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
          content={formData.raw_results}
          onChange={(content) => setFormData((prev) => ({ ...prev, raw_results: content }))}
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

      {/* Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <Button 
          type="button" 
          variant={"ghost"} 
          className="border" 
          onClick={() => handleSave(false)} 
          disabled={loading}
        >
          {loading ? "Saving..." : "Save as Draft"}
        </Button>

        <Button 
          type="button" 
          className="primary" 
          onClick={() => handleSave(true)} 
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </div>

      {message && (
        <div className={`mt-4 text-center font-medium ${message.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
          {message}
        </div>
      )}
    </form>
  );
};

export default AnalysisFormComponent;
