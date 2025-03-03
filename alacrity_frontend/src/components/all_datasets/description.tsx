"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BACKEND_URL } from "../../config";
import { fetchWithAuth } from "@/libs/auth";

// Define the dataset type based on your serializer
interface Dataset {
  dataset_id: string;
  title: string;
  contributor_name: string;
  organization_name: string;
  category: string;
  schema: string;
  analysis_link: string;
  description: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function DatasetDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const datasetId = searchParams.get("id");
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [objective, setObjective] = useState("");

  useEffect(() => {
    if (!datasetId) return;
    const fetchDatasetDetail = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/${datasetId}`);
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        const data = await response.json();
        setDataset(data);
      } catch (error) {
        console.error("Error fetching dataset details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasetDetail();
  }, [datasetId]);

  // Function to send the POST request to create a dataset request with the objective message
  const handleRequest = async () => {
    if (!dataset) return;
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/requests/makerequest/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          dataset_id: dataset.dataset_id,
          objective: objective,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create request");
      }
      setMessage("Request created successfully");
      setObjective("");
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!dataset) return <div>No dataset found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-bold text-left my-4 px-4">{dataset.title}</h1>
        {/* Description */}
        <p className="text-gray-700 text-base text-left my-2 px-4">
          {dataset.description}
        </p>
        {/* Organization & Date */}
        <div className="text-left my-2 text-sm text-gray-600 px-4">
          <p>
            <span className="font-semibold">Organization:</span> {dataset.organization_name}
          </p>
          <p>
            <span className="font-semibold">Date Added:</span>{" "}
            {new Date(dataset.created_at).toLocaleDateString()}
          </p>
        </div>
        {/* Objective Form (moved below Organization & Date) */}
        <div className="my-4 px-4">
          <label className="block text-gray-600 text-sm mb-1" htmlFor="objective">
            Please write the main objective as to why you need the data:
          </label>
          <textarea
            id="objective"
            className="w-full border border-black p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            rows={4}
            placeholder="Enter your objective here..."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
          />
        </div>
        {/* Display message if available */}
        {message && <div className="text-left text-green-600 text-sm my-2 px-4">{message}</div>}
        {/* Buttons */}
        <div className="flex gap-4 mt-4 mb-4 px-4">
          <button
            className="bg-orange-200 text-black px-4 py-2 rounded hover:bg-orange-300 transition-colors text-sm"
            onClick={handleRequest}
          >
            Request
          </button>
          <button
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors text-sm"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
