"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/libs/auth";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";

interface ColumnInfo {
  [key: string]: { type: "numeric" | "categorical"; values: string[] };
}

interface Dataset {
  dataset_id: string;
  title: string;
}

interface FilterCondition {
  column: string;
  operator: string;
  value: string | number;
}

const API_BASE_URL = "http://127.0.0.1:8000/datasets";

export default function FilterAndClean() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo>({});
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, unknown> | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/`, { method: "GET" });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        setDatasets(data.datasets);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_err) {
        setError("Error fetching datasets");
      }
    }
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      fetchFilterOptions();
    }
  }, [selectedDataset]);

  async function fetchFilterOptions() {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/analysis/filter-options/${selectedDataset}/`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      setColumns(data.columns);
      setError("");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setError("Error fetching filter options");
    }
  }

  function addFilter() {
    setFilters([...filters, { column: "", operator: "=", value: "" }]);
  }

  function updateFilter(index: number, key: keyof FilterCondition, value: string | number) {
    const updatedFilters = [...filters];
  
    if (key === "column" || key === "operator") {
      updatedFilters[index][key] = String(value);
    } else {
      updatedFilters[index][key] = value;
    }
  
    setFilters(updatedFilters);
  }

  async function applyFilters() {
    if (!selectedDataset) {
      setError("Please select a dataset first.");
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/analysis/filter/${selectedDataset}/`, {
        method: "POST",
        body: JSON.stringify({ filters, columns: selectedColumns }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const data = await response.json();
      setSessionId(data.session_id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setError("Error applying filters.");
    }
  }

  async function performAnalysis() {
    if (!selectedDataset || !selectedAnalysis) {
      setError("Please select a dataset and an analysis type.");
      return;
    }
  
    let url = `${API_BASE_URL}/analysis/${selectedAnalysis}/${selectedDataset}/`;
  
    if (sessionId) {
      url += `?session_id=${encodeURIComponent(sessionId)}`;
    }
  
    try {
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  
      const data = await response.json();
      setAnalysisResults(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setError("Error performing analysis.");
    }
  }  

  return (
    <MaxWidthWrapper>
      <h1 className="text-xl font-bold mb-4">Dataset Analysis</h1>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Select Dataset</label>
        <select 
          value={selectedDataset || ""}
          onChange={(e) => setSelectedDataset(e.target.value)} 
          className="p-2 border rounded-md w-full"
        >
          <option value="">Choose a dataset</option>
          {datasets.map((dataset) => (
            <option key={dataset.dataset_id} value={dataset.dataset_id}>
              {dataset.title}
            </option>
          ))}
        </select>
      </div>

      {selectedDataset && Object.keys(columns).length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">Select Columns</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(columns).map((col) => (
              <label key={col} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col)}
                  onChange={() => {
                    if (selectedColumns.includes(col)) {
                      setSelectedColumns(selectedColumns.filter(c => c !== col));
                    } else {
                      setSelectedColumns([...selectedColumns, col]);
                    }
                  }}
                />
                <span>{col}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Filters</h2>
        {filters.map((filter, index) => (
          <div key={index} className="flex gap-2 mb-2">

            <select
              value={filter.column}
              onChange={(e) => updateFilter(index, "column", e.target.value)}
              className="p-2 border rounded-md flex-1"
            >
              <option value="">Select Column</option>
              {Object.keys(columns).map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>

            <select
              value={filter.operator}
              onChange={(e) => updateFilter(index, "operator", e.target.value)}
              className="p-2 border rounded-md w-1/4"
            >
              <option value="=">=</option>
              <option value="!=">≠</option>
              <option value=">">{">"}</option>
              <option value="<">{"<"}</option>
              <option value=">=">≥</option>
              <option value="<=">≤</option>
            </select>

            <input
              type="text"
              value={filter.value}
              onChange={(e) => updateFilter(index, "value", e.target.value)}
              className="p-2 border rounded-md flex-1"
              placeholder="Enter value"
            />
          </div>
        ))}
        <button onClick={addFilter} className="bg-gray-200 px-4 py-2 rounded-md">
          + Add Filter
        </button>
      </div>

      {/* add your analyses here guys */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Select Analysis</label>
        <select
          value={selectedAnalysis || ""}
          onChange={(e) => setSelectedAnalysis(e.target.value)}
          className="p-2 border rounded-md w-full"
        >
          <option value="">Choose analysis type</option>
          <option value="pre-analysis">Pre-Analysis</option>
          <option value="descriptive">Descriptive Statistics</option>
          {/* <option value="aggregate">Aggregation</option> */}
        </select>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={applyFilters}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Apply Filters
        </button>
        <button
          onClick={performAnalysis}
          className="bg-green-500 text-white px-4 py-2 rounded-md"
        >
          Perform Analysis
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Analysis results */}
      {analysisResults && (
        <div className="mt-4 p-4 border rounded-md bg-gray-100">
          <h2 className="text-lg font-bold mb-4">Analysis Results</h2>
          <pre className="bg-white p-2 rounded-md overflow-x-auto">
            {JSON.stringify(analysisResults, null, 2)}
          </pre>
        </div>
      )}
    </MaxWidthWrapper>
  );
}