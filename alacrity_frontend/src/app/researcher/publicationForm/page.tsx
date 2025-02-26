"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useState } from "react";

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
  

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
      console.log("Uploading Image:", formData.image);
      requestData.append("image", formData.image);
    } else {
      console.log("No Image Selected");
    }
  
    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/research/submissions/save/", {
        method: "POST",
        body: requestData,
      });
  
      const data = await response.json();
      console.log("API Response:", data); 
  
      if (response.ok) {
        setMessage(publish ? "Research Published Successfully!" : "Draft Saved Successfully!");
        setFormData((prev) => ({ ...prev, id: data.id, image: null }));
      } else {
        setMessage(`Error: ${data.error || "Failed to save."}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setMessage("Failed to save.");
    }
  
    setLoading(false);
  };
  
  
  
  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Submit Analysis</h2>
      {message && <p className="text-green-500 mb-4">{message}</p>}

      <form className="space-y-4">
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Title Name"
          className="w-full p-2 border rounded"
        />

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description of the Analysis Process"
          className="w-full p-2 border rounded"
          rows={3}
        />

        <textarea
          name="rawResults"
          value={formData.rawResults}
          onChange={handleChange}
          placeholder="Raw Results"
          className="w-full p-2 border rounded"
          rows={3}
        />

        <textarea
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          placeholder="Summary of Findings"
          className="w-full p-2 border rounded"
          rows={3}
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 border rounded"
        />

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save as Draft"}
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnalysisForm;