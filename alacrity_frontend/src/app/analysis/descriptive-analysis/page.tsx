"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";

interface Dataset {
  dataset_id: string;
  title: string;
  category: string;
  description: string;
}

interface DescriptiveStats {
  mean: Record<string, number>;
  median: Record<string, number>;
  mode: Record<string, number | null>;
}

const API_BASE_URL = "http://127.0.0.1:8000/datasets"; 

export default function DescriptiveAnalysis() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [descriptiveStats, setDescriptiveStats] = useState<DescriptiveStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDatasets() {
      try {
        console.log("Fetching datasets...");
        const response = await fetchWithAuth(`${API_BASE_URL}/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);

        const data = await response.json();
        console.log("Fetched Datasets:", data);
        setDatasets(data.datasets);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Error fetching datasets: ${err}`);
      }
    }

    fetchDatasets();
  }, []);

  async function fetchDescriptiveStats() {
    if (!selectedDataset) {
      setError("Please select a dataset first.");
      return;
    }

    try {
      console.log(`Fetching descriptive stats for dataset: ${selectedDataset}`);
      const response = await fetchWithAuth(`${API_BASE_URL}/analysis/descriptive/${selectedDataset}/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);

      const data = await response.json();
      console.log("Descriptive Stats:", data);
      setDescriptiveStats(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Error fetching descriptive statistics: ${err}`);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Select a Dataset for Descriptive Analysis</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex items-center gap-4">
        <select
          onChange={(e) => setSelectedDataset(e.target.value)}
          value={selectedDataset || ""}
          className="p-2 border rounded-md"
        >
          <option value="">-- Select a Dataset --</option>
          {datasets.map((dataset) => (
            <option key={dataset.dataset_id} value={dataset.dataset_id}>
              {dataset.title}
            </option>
          ))}
        </select>

        {selectedDataset && (
          <button 
            onClick={fetchDescriptiveStats}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Perform Descriptive Analysis
          </button>
        )}
      </div>

      {descriptiveStats && (
        <div className="mt-6 border p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Descriptive Statistics</h2>

          {/* Table for the analysis'*/}
          <table className="w-full border border-gray-300 mt-2">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Column</th>
                <th className="border px-4 py-2">Mean</th>
                <th className="border px-4 py-2">Median</th>
                <th className="border px-4 py-2">Mode</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(descriptiveStats.mean).map((col) => (
                <tr key={col}>
                  <td className="border px-4 py-2">{col}</td>
                  <td className="border px-4 py-2">{descriptiveStats.mean[col].toFixed(2)}</td>
                  <td className="border px-4 py-2">{descriptiveStats.median[col].toFixed(2)}</td>
                  <td className="border px-4 py-2">
                    {descriptiveStats.mode[col] !== null ? descriptiveStats.mode[col]?.toFixed(2) : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
