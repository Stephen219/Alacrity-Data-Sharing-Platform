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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full p-8 bg-white rounded-lg shadow-lg">
        {/* Centered Title */}
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-4xl font-bold text-center">{dataset.title}</h1>
        </div>
        {/* Dataset Description */}
        <div className="mb-4">
          <p className="text-gray-700 text-lg">{dataset.description}</p>
        </div>
        {/* Organization Name */}
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-semibold">Organization:</span> {dataset.organization_name}
          </p>
        </div>
        {/* Date Added */}
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-semibold">Date Added:</span> {new Date(dataset.created_at).toLocaleDateString()}
          </p>
        </div>
        {/* Buttons */}
        <div className="flex gap-4 mt-8 justify-center">
          <button
            className="bg-orange-200 text-black px-6 py-2 rounded hover:bg-orange-300 transition-colors"
            onClick={() => router.push(`/request?id=${dataset.dataset_id}`)}
          >
            Request
          </button>
          <button
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );  
}
