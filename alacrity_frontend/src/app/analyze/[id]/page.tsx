
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";

type Schema = Record<string, string>;
type Dataset = { dataset_id: string; title: string; schema: Schema; category: string; created_at: string; is_loaded?: boolean };
type Result = { [key: string]: any };

const calculationTypes = [
  { value: "descriptive", label: "Descriptive Statistics" },
  { value: "inferential", label: "Inferential Statistics" },
  { value: "correlation", label: "Correlation Analysis" },
];

const operations = {
  descriptive: [
    { value: "mean", label: "Mean", columns: 1, types: ["int64", "float64"] },
    { value: "median", label: "Median", columns: 1, types: ["int64", "float64"] },
    { value: "mode", label: "Mode", columns: 1, types: ["any"] },
  ],
  inferential: [
    { value: "t_test", label: "T-Test", columns: 2, types: ["int64", "float64"] },
    { value: "chi_square", label: "Chi-Square", columns: 2, types: ["object", "int64"] },
    { value: "anova", label: "ANOVA", columns: 2, types: ["int64", "float64", "object"] },
  ],
  correlation: [
    { value: "pearson", label: "Pearson Correlation", columns: 2, types: ["int64", "float64"] },
    { value: "spearman", label: "Spearman Correlation", columns: 2, types: ["int64", "float64"] },
  ],
};

const AnalyzePage = () => {
  const router = useRouter();
  const { id } = useParams();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [calcType, setCalcType] = useState<string>("");
  const [operation, setOperation] = useState<string>("");
  const [column, setColumn] = useState<string>("");
  const [column1, setColumn1] = useState<string>("");
  const [column2, setColumn2] = useState<string>("");
  const [filter, setFilter] = useState<string>("");
  const [result, setResult] = useState<Result | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataset = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/details/${id}/`);
        if (!response.ok) throw new Error("Failed to fetch dataset details");
        const data: Dataset = await response.json();
        setDataset(data);
        const savedNotes = localStorage.getItem(`notes_${id}`);
        if (savedNotes) setNotes(savedNotes);
      } catch (err) {
        setError("Could not load dataset details");
        console.error(err);
        // router.push("/auth/sign-in");
      } finally {
        setLoading(false);
      }
    };
    fetchDataset();

    const handleBeforeUnload = async () => {
      try {
        await fetchWithAuth(`${BACKEND_URL}/datasets/clear_cache/${id}/`, {
          method: "POST",
        });
      } catch (err) {
        console.error("Failed to clear cache on exit:", err);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload(); // Clear cache on navigation away
    };
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const params = new URLSearchParams();
    params.append("operation", operation);
    if (["mean", "median", "mode"].includes(operation)) {
      if (!column) {
        setError("Please select a column");
        setLoading(false);
        return;
      }
      params.append("column", column);
    } else {
      if (!column1 || !column2) {
        setError("Please select two columns");
        setLoading(false);
        return;
      }
      params.append("column1", column1);
      params.append("column2", column2);
    }
    if (filter) params.append("filter", filter);

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/perform/${id}/?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }
      const data: Result = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = () => {
    localStorage.setItem(`notes_${id}`, notes);
    alert("Notes saved!");
  };

  const getCompatibleColumns = (op: string) => {
    if (!dataset?.schema) return [];
    const typeOps = Object.values(operations).flat();
    const opConfig = typeOps.find((o) => o.value === op);
    if (!opConfig) return [];
    return Object.entries(dataset.schema)
      .filter(([_, type]) => opConfig.types.includes("any") || opConfig.types.includes(type))
      .map(([name, type]) => ({ value: name, label: `${name} (${type})` }));
  };

  if (loading || (dataset && !dataset.is_loaded)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
          </svg>
          <h2 className="text-2xl font-semibold text-gray-800">Loading data into the workspace...</h2>
          <p className="text-gray-600 mt-2">Please wait while we prepare your dataset.</p>
        </div>
      </div>
    );
  }

  if (error && !dataset) return <div className="text-center text-red-500 mt-10">Error: {error}</div>;
  if (!dataset) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
          Workspace: {dataset.title}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metadata Panel */}
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Metadata</h2>
            <div className="space-y-2 text-gray-600 text-sm sm:text-base">
              <p>
                <span className="font-medium">Title:</span> {dataset.title}
              </p>
              <p>
                <span className="font-medium">Category:</span> {dataset.category}
              </p>
              <p>
                <span className="font-medium">Columns:</span>
              </p>
              <ul className="list-disc pl-5">
                {Object.entries(dataset.schema).map(([col, type]) => (
                  <li key={col}>{col} ({type})</li>
                ))}
              </ul>
              <p>
                <span className="font-medium">Created:</span>{" "}
                {new Date(dataset.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Analysis</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Type</label>
                <select
                  value={calcType}
                  onChange={(e) => {
                    setCalcType(e.target.value);
                    setOperation("");
                    setColumn("");
                    setColumn1("");
                    setColumn2("");
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="">Select a type</option>
                  {calculationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {calcType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
                  <select
                    value={operation}
                    onChange={(e) => {
                      setOperation(e.target.value);
                      setColumn("");
                      setColumn1("");
                      setColumn2("");
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="">Select an operation</option>
                    {operations[calcType as keyof typeof operations].map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {operation && (
                <>
                  {operations[calcType as keyof typeof operations].find((o) => o.value === operation)?.columns === 1 ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                      <select
                        value={column}
                        onChange={(e) => setColumn(e.target.value.split(" (")[0])}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      >
                        <option value="">Select a column</option>
                        {getCompatibleColumns(operation).map((col) => (
                          <option key={col.value} value={col.value}>
                            {col.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Column 1</label>
                        <select
                          value={column1}
                          onChange={(e) => setColumn1(e.target.value.split(" (")[0])}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        >
                          <option value="">Select first column</option>
                          {getCompatibleColumns(operation).map((col) => (
                            <option key={col.value} value={col.value}>
                              {col.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Column 2</label>
                        <select
                          value={column2}
                          onChange={(e) => setColumn2(e.target.value.split(" (")[0])}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        >
                          <option value="">Select second column</option>
                          {getCompatibleColumns(operation).map((col) => (
                            <option key={col.value} value={col.value}>
                              {col.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
                    <input
                      type="text"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Enter filter condition"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-200 text-sm sm:text-base"
                  >
                    {loading ? "Analyzing..." : "Run Analysis"}
                  </button>
                </>
              )}
            </form>

            {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
            {result && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Result</h3>
                <pre className="text-xs sm:text-sm text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Notepad Panel */}
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 flex flex-col">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Notepad</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down your observations here..."
              className="w-full flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm sm:text-base min-h-[200px]"
            />
            <button
              onClick={handleSaveNotes}
              className="mt-4 bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition duration-200 text-sm sm:text-base"
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzePage;