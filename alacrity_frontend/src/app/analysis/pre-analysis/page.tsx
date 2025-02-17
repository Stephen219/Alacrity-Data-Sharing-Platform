"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";

interface Dataset {
  dataset_id: string;
  title: string;
  category: string;
  description: string;
}

interface PreAnalysisData {
  dataset_id: string;
  title: string;
  category: string;
  description: string;
  columns: Record<string, string>; 
  missing_values: Record<string, number>; 
  categorical_summary: Record<string, number>; 
  duplicate_rows: number;
}

const API_BASE_URL = "http://127.0.0.1:8000/datasets"; // Django API base URL

export default function PreAnalysis() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<PreAnalysisData | null>(null);
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

  async function fetchPreAnalysis() {
    if (!selectedDataset) {
      console.error("No dataset selected!");
      setError("Please select a dataset first.");
      return;
    }

    try {
      console.log(`Fetching pre-analysis for dataset: ${selectedDataset}`);
      const response = await fetchWithAuth(`${API_BASE_URL}/analysis/pre-analysis/${selectedDataset}/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);

      const data = await response.json();
      console.log("Parsed Pre-Analysis Data:", data);
      setAnalysisData(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Error fetching pre-analysis: ${err}`);
    }
  }

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Select a Dataset for Pre-Analysis</h1>
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
            onClick={fetchPreAnalysis}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Perform Pre-Analysis
          </button>
        )}
      </div>

      {analysisData && selectedDataset === analysisData.dataset_id && (
        <div className="mt-6 border p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Pre-Analysis for {analysisData.title}</h2>
          <p className="text-gray-700"><b>Category:</b> {analysisData.category}</p>
          <p className="text-gray-700"><b>Description:</b> {analysisData.description}</p>

          <h3 className="text-lg font-semibold mt-4">Duplicate Rows</h3>
          <p className="text-gray-700">{analysisData.duplicate_rows} duplicate rows found.</p>

          <h3 className="text-lg font-semibold mt-4">Missing Values</h3>
          {Object.values(analysisData.missing_values).every((val) => val === 0) ? (
            <p className="text-green-600"> No missing values in any columns.</p>
          ) : (
            <table className="w-full border border-gray-300 mt-2">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Column</th>
                  <th className="border px-4 py-2">Missing Values</th>
                </tr>
              </thead>
              <tbody>
              {Object.entries(analysisData.missing_values)
                  .filter(([, count]) => count > 0) 
                  .map(([col, count]) => (
                    <tr key={col}>
                      <td className="border px-4 py-2">{col}</td>
                      <td className="border px-4 py-2">{count}</td>
                    </tr>
                  ))}

              </tbody>
            </table>
          )}

          <h3 className="text-lg font-semibold mt-4">Categorical Summary</h3>
          <table className="w-full border border-gray-300 mt-2">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Column</th>
                <th className="border px-4 py-2">Unique Values</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysisData.categorical_summary).map(([col, unique_count]) => (
                <tr key={col}>
                  <td className="border px-4 py-2">{col}</td>
                  <td className="border px-4 py-2">{unique_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
}
