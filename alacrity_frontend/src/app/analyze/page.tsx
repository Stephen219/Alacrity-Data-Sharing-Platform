"use client";
import React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import Link from "next/link";

// TODO make sure this page shows the analyze options only if the pending request is approved
type Dataset = {
  dataset_id: string;
  title: string;
  contributor_name: string;
  organization_name: string;
  category: string;
  schema: Record<string, string>;
  analysis_link?: string;
  description: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

const DatasetsPage = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/requests/analyze`);
        if (!response.ok) throw new Error("Failed to fetch datasets");
        const data = await response.json();
        setDatasets(data.datasets); 
      } catch (err) {
        console.error("Failed to fetch datasets", err);
        setError("Could not load datasets");
        router.push("/auth/sign-in");
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, [router]);

  if (loading) return <div>Loading datasets...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">All Datasets</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-left">Title</th>
            <th className="p-2 text-left">Contributor</th>
            <th className="p-2 text-left">Organization</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Created</th>
            <th className="p-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((dataset) => (
            <tr key={dataset.dataset_id} className="border-b">
              <td className="p-2">{dataset.title}</td>
              <td className="p-2">{dataset.contributor_name}</td>
              <td className="p-2">{dataset.organization_name}</td>
              <td className="p-2">{dataset.category}</td>
              <td className="p-2">{new Date(dataset.created_at).toLocaleDateString()}</td>
              <td className="p-2">
                <Link href={`/analyze/${dataset.dataset_id}`} className="text-blue-500 hover:underline">
                  Analyze
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DatasetsPage;