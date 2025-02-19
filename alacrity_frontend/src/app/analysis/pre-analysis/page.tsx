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
  total_rows: number;
  columns: string[];
  missing_values: Record<string, number>;
  categorical_summary: Record<string, number>;
  duplicate_rows: number;
}

const API_BASE_URL = "http://127.0.0.1:8000/datasets";

export default function PreAnalysis() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<PreAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        setDatasets(Array.isArray(data.datasets) ? data.datasets : []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(`Error fetching datasets: ${err.message}`);
        } else {
          setError("Error fetching datasets: Unknown error occurred.");
        }
      }
    }

    fetchDatasets();
  }, []);

  async function fetchPreAnalysis() {
    if (!selectedDataset) {
      setError("Please select a dataset first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/analysis/pre-analysis/${selectedDataset}/`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const data = await response.json();
      setAnalysisData(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Error fetching pre-analysis: ${err.message}`);
      } else {
        setError("Error fetching pre-analysis: Unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Select a Dataset for Pre-Analysis</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex items-center gap-4">
        <select
          onChange={(e) => {
            setSelectedDataset(e.target.value);
            setAnalysisData(null);
          }}
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

        <button
          onClick={fetchPreAnalysis}
          disabled={!selectedDataset || loading}
          className={`px-4 py-2 rounded-md text-white ${
            selectedDataset ? "bg-primary" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Running..." : "Run Pre-Analysis"}
        </button>
      </div>

      {analysisData && (
        <div className="mt-6 border p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Pre-Analysis Results</h2>
          <p className="text-gray-700"><b>Total Rows:</b> {analysisData.total_rows}</p>

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
  );
}
