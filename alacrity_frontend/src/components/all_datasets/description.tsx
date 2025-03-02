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

  useEffect(() => {
    if (!datasetId) return;
    const fetchDatasetDetail = async () => {
      try {
        // Assuming your backend has an endpoint to get a single dataset by ID
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

  if (loading) return <div>Loading...</div>;
  if (!dataset) return <div>No dataset found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      {/* Display the dataset title */}
      <h1 className="text-3xl font-bold mb-4">{dataset.title}</h1>
      
      {/* Display the dataset description */}
      <p className="text-gray-700 mb-4">{dataset.description}</p>
      
      {/* Display the organization name */}
      <p className="text-gray-500 mb-4">
        <strong>Organization:</strong> {dataset.organization_name}
      </p>
      
      {/* Display the date added (formatted from created_at) */}
      <p className="text-gray-500 mb-4">
        <strong>Date Added:</strong> {new Date(dataset.created_at).toLocaleDateString()}
      </p>

      {/* Buttons to make a request or go back */}
      <div className="flex gap-4 mt-auto">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => router.push(`/request?id=${dataset.dataset_id}`)}
        >
          Request
        </button>
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>
    </div>
  );
}
