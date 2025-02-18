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
const ROWS_PER_PAGE = 100; // Display 100 rows per page

export default function FilterAndClean() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo>({});
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectAllColumns, setSelectAllColumns] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/`, { method: "GET" });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        setDatasets(data.datasets);
      } catch (err) {
        console.error(err);
        setError("Error fetching datasets");
      }
    }
    fetchDatasets();
  }, []);

  async function fetchFilterOptions() {
    if (!selectedDataset) return;
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/analysis/filter-options/${selectedDataset}/`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      setColumns(data.columns);
    } catch (err) {
      console.error(err);
      setError("Error fetching filter options");
    }
  }

  function handleSelectAllColumns() {
    setSelectAllColumns(!selectAllColumns);
    setSelectedColumns(selectAllColumns ? [] : Object.keys(columns));
  }

  function addFilter() {
    setFilters([...filters, { column: "", operator: "=", value: "" }]);
  }

  function updateFilter(index: number, key: keyof FilterCondition, value: string) {
    const updatedFilters = [...filters];
    updatedFilters[index][key] = value;
    setFilters(updatedFilters);
  }

  async function applyFilters() {
    if (!selectedDataset) {
      setError("Please select a dataset first.");
      return;
    }

    console.log("Sending filter request:", { filters, columns: selectedColumns });

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/analysis/filter/${selectedDataset}/`, {
        method: "POST",
        body: JSON.stringify({ filters, columns: selectedColumns }),
        headers: { "Content-Type": "application/json" },
      });

      console.log("Request Sent:", response);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Filtered Data Received:", data.filtered_data);

      if (data.filtered_data.length === 0) {
        console.warn("Rows don't match the filter criteria.");
      }

      setFilteredData(data.filtered_data);
      setCurrentPage(1); 
    } catch (err) {
      console.error("Error applying filters:", err);
      setError("Error applying filters.");
    }
  }

  
  const paginatedData = filteredData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  return (
    <MaxWidthWrapper>
      <h1 className="text-xl font-bold">Filter & Clean Data</h1>

      <select onChange={(e) => setSelectedDataset(e.target.value)} className="p-2 border rounded-md">
        <option value="">Select Dataset</option>
        {datasets.map((dataset) => (
          <option key={dataset.dataset_id} value={dataset.dataset_id}>{dataset.title}</option>
        ))}
      </select>

      <button onClick={fetchFilterOptions} className="ml-4 bg-primary text-white p-2 rounded-md">Load Filters</button>

      {Object.keys(columns).length > 0 && (
        <div>
          <h2 className="text-lg font-bold mt-4">Select Columns to Display</h2>
          <label>
            <input
              type="checkbox"
              checked={selectAllColumns}
              onChange={handleSelectAllColumns}
            />
            Select All
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(columns).map((col) => (
              <label key={col}>
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col)}
                  onChange={() =>
                    setSelectedColumns(selectedColumns.includes(col)
                      ? selectedColumns.filter((c) => c !== col)
                      : [...selectedColumns, col])
                  }
                />
                {col}
              </label>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold mt-4">Apply Filters</h2>
      {filters.map((filter, index) => (
        <div key={index} className="flex gap-2 mt-2">
          <select onChange={(e) => updateFilter(index, "column", e.target.value)} className="border p-2 rounded-md">
            <option value="">Select Column</option>
            {Object.keys(columns).map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>

          <select onChange={(e) => updateFilter(index, "operator", e.target.value)} className="border p-2 rounded-md">
            <option value="=">=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value=">=">≥</option>
            <option value="<=">≤</option>
          </select>

          <input
            type="text"
            onChange={(e) => updateFilter(index, "value", e.target.value)}
            className="border p-2 rounded-md"
            placeholder="Value"
            list={`unique-values-${index}`}
          />
        </div>
      ))}
      <button onClick={addFilter} className="mt-2 bg-gray-500 text-white p-2 rounded-md">+ Add Filter</button>
      <button onClick={applyFilters} className="ml-4 bg-green-500 text-white p-2 rounded-md">Apply</button>

      {paginatedData.length > 0 && (
        <div className="mt-4 p-4 border rounded-md bg-gray-100 overflow-auto max-h-[500px]">
          <h2 className="text-lg font-bold">Filtered Results</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                {Object.keys(paginatedData[0]).map((key) => (
                  <th key={key} className="border border-gray-300 p-2">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr key={index} className="even:bg-gray-50">
                  {Object.values(row).map((value, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 p-2">
                      {typeof value === "string" || typeof value === "number" ? value : JSON.stringify(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center mt-4">
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 bg-gray-400 text-white rounded-md mx-2">Previous</button>
            <span className="p-2">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage >= totalPages} className="p-2 bg-gray-400 text-white rounded-md mx-2">Next</button>
          </div>
        </div>
      )}
    </MaxWidthWrapper>
  );
}
