






/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useReducer, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";

type Schema = Record<string, string>;
type Dataset = { dataset_id: string; title: string; schema: Schema; category: string; created_at: string; is_loaded?: boolean };
type Result = 
  | { operation: "mean" | "median" | "mode"; value: number | string; column: string }
  | { operation: "t_test"; t_stat: number; p_value: number; image?: string; accuracy_note?: string; columns: [string, string] }
  | { operation: "chi_square"; chi2: number; p_value: number; degrees_of_freedom: number; contingency_table: Record<string, any>; image?: string; accuracy_note?: string; columns: [string, string] }
  | { operation: "anova"; f_stat: number; p_value: number; image?: string; accuracy_note?: string; columns: [string, string] }
  | { operation: "pearson" | "spearman"; correlation: number; p_value: number; image: string; slope: number; intercept: number; columns: [string, string] };


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

const presentationOptions = {
  mean: { numbers: true, table: false, graph: false },
  median: { numbers: true, table: false, graph: false },
  mode: { numbers: true, table: false, graph: false },
  t_test: { numbers: true, table: false, graph: true },
  chi_square: { numbers: true, table: true, graph: true },
  anova: { numbers: true, table: false, graph: true }, 
  pearson: { numbers: true, table: false, graph: true },
  spearman: { numbers: true, table: false, graph: true },
};

const operators = [
  { value: "=", label: "Equals (=)" },
  { value: "!=", label: "Not Equals (!=)" },
  { value: ">", label: "Greater Than (>)" },
  { value: ">=", label: "Greater or Equal (>=)" },
  { value: "<", label: "Less Than (<)" },
  { value: "<=", label: "Less or Equal (<=)" },
];

// State Reducer
const initialState = {
  calcType: "",
  operation: "",
  column: "",
  column1: "",
  column2: "",
  filterColumn: "",
  filterOperator: "",
  filterValue: "",
  notes: "",
};

const reducer = (state: typeof initialState, action: { type: string; value: string }) => {
  switch (action.type) {
    case "SET_CALC_TYPE":
      return { ...state, calcType: action.value, operation: "", column: "", column1: "", column2: "" };
    case "SET_OPERATION":
      return { ...state, operation: action.value, column: "", column1: "", column2: "" };
    case "SET_COLUMN":
      return { ...state, column: action.value };
    case "SET_COLUMN1":
      return { ...state, column1: action.value };
    case "SET_COLUMN2":
      return { ...state, column2: action.value };
    case "SET_FILTER_COLUMN":
      return { ...state, filterColumn: action.value };
    case "SET_FILTER_OPERATOR":
      return { ...state, filterOperator: action.value };
    case "SET_FILTER_VALUE":
      return { ...state, filterValue: action.value };
    case "SET_NOTES":
      return { ...state, notes: action.value };
    default:
      return state;
  }
};

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

const AnalyzePage = () => {
  const router = useRouter();
  const { id } = useParams();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "results" | "notes">("analysis");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedFilterValue = useDebounce(state.filterValue, 300);
  const debouncedNotes = useDebounce(state.notes, 500);

  useEffect(() => {
    const fetchDataset = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/details/${id}/`);
        if (!response.ok) throw new Error("Failed to fetch dataset details");
        const data: Dataset = await response.json();
        setDataset(data);
        const savedNotes = localStorage.getItem(`notes_${id}`);
        if (savedNotes) dispatch({ type: "SET_NOTES", value: savedNotes });
      } catch (err) {
        setError("Could not load dataset details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDataset();

    const handleBeforeUnload = async () => {
      await fetchWithAuth(`${BACKEND_URL}/datasets/clear_cache/${id}/`, { method: "POST" });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [id]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalysisLoading(true);
    setError(null);
    setResult(null);

    const params = new URLSearchParams();
    params.append("operation", state.operation);
    if (["mean", "median", "mode"].includes(state.operation)) {
      if (!state.column) {
        setError("Please select a column");
        setAnalysisLoading(false);
        return;
      }
      params.append("column", state.column);
    } else {
      if (!state.column1 || !state.column2) {
        setError("Please select two columns");
        setAnalysisLoading(false);
        return;
      }
      params.append("column1", state.column1);
      params.append("column2", state.column2);
    }
    if (state.filterColumn && state.filterOperator && debouncedFilterValue) {
      params.append("filter_column", state.filterColumn);
      params.append("filter_operator", state.filterOperator);
      params.append("filter_value", debouncedFilterValue);
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/perform/${id}/?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }
      const data: Result = await response.json();
      setResult(data);
      setActiveTab("results");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalysisLoading(false);
    }
  }, [state, debouncedFilterValue, id]);

  const handleSaveNotes = useCallback(() => {
    localStorage.setItem(`notes_${id}`, debouncedNotes);
    alert("Notes saved!");
  }, [debouncedNotes, id]);

  const getCompatibleColumns = useMemo(() => {
    if (!dataset?.schema) return [];
    const typeOps = Object.values(operations).flat();
    const opConfig = typeOps.find((o) => o.value === state.operation);
    if (!opConfig) return [];
    return Object.entries(dataset.schema)
      .filter(([, type]) => opConfig.types.includes("any") || opConfig.types.includes(type))
      .map(([name, type]) => ({ value: name, label: `${name} (${type})` }));
  }, [state.operation, dataset?.schema]);

  const getAllColumns = useMemo(() => {
    if (!dataset?.schema) return [];
    return Object.entries(dataset.schema).map(([name, type]) => ({ value: name, label: `${name} (${type})` }));
  }, [dataset?.schema]);

  if (loading || (dataset && !dataset.is_loaded)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-800">Loading data into the workspace...</h2>
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

        <div className="flex border-b border-gray-200 mb-6">
          {["analysis", "results", "notes"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-2 px-4 text-center ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
              onClick={() => setActiveTab(tab as typeof activeTab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
          {activeTab === "analysis" && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Metadata</h3>
                  <div className="space-y-2 text-gray-600 text-sm">
                    <p><span className="font-medium">Title:</span> {dataset.title}</p>
                    <p><span className="font-medium">Category:</span> {dataset.category}</p>
                    <p><span className="font-medium">Columns:</span></p>
                    <ul className="list-disc pl-5">
                      {Object.entries(dataset.schema).map(([col, type]) => (
                        <li key={col}>{col} ({type})</li>
                      ))}
                    </ul>
                    <p><span className="font-medium">Created:</span> {new Date(dataset.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Analysis Setup</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Type</label>
                      <select
                        value={state.calcType}
                        onChange={(e) => dispatch({ type: "SET_CALC_TYPE", value: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a type</option>
                        {calculationTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    {state.calcType && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
                        <select
                          value={state.operation}
                          onChange={(e) => dispatch({ type: "SET_OPERATION", value: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select an operation</option>
                          {operations[state.calcType as keyof typeof operations].map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {state.operation && (
                      <>
                        {operations[state.calcType as keyof typeof operations].find((o) => o.value === state.operation)?.columns === 1 ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                            <select
                              value={state.column}
                              onChange={(e) => dispatch({ type: "SET_COLUMN", value: e.target.value.split(" (")[0] })}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select a column</option>
                              {getCompatibleColumns.map((col) => (
                                <option key={col.value} value={col.value}>{col.label}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Column 1</label>
                              <select
                                value={state.column1}
                                onChange={(e) => dispatch({ type: "SET_COLUMN1", value: e.target.value.split(" (")[0] })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select first column</option>
                                {getCompatibleColumns.map((col) => (
                                  <option key={col.value} value={col.value}>{col.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Column 2</label>
                              <select
                                value={state.column2}
                                onChange={(e) => dispatch({ type: "SET_COLUMN2", value: e.target.value.split(" (")[0] })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select second column</option>
                                {getCompatibleColumns.map((col) => (
                                  <option key={col.value} value={col.value}>{col.label}</option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
                          <div className="flex space-x-2">
                            <select
                              value={state.filterColumn}
                              onChange={(e) => dispatch({ type: "SET_FILTER_COLUMN", value: e.target.value.split(" (")[0] })}
                              className="w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select column</option>
                              {getAllColumns.map((col) => (
                                <option key={col.value} value={col.value}>{col.label}</option>
                              ))}
                            </select>
                            <select
                              value={state.filterOperator}
                              onChange={(e) => dispatch({ type: "SET_FILTER_OPERATOR", value: e.target.value })}
                              className="w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={!state.filterColumn}
                            >
                              <option value="">Select operator</option>
                              {operators.map((op) => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={state.filterValue}
                              onChange={(e) => dispatch({ type: "SET_FILTER_VALUE", value: e.target.value })}
                              placeholder="Enter value"
                              className="w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={!state.filterColumn || !state.filterOperator}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={analysisLoading}
                          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {analysisLoading ? "Analyzing..." : "Run Analysis"}
                        </button>
                      </>
                    )}
                    {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "results" && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Results</h2>
              {analysisLoading ? (
                <div className="text-center">
                  <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  <p className="text-gray-600">Running analysis...</p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  {presentationOptions[result.operation]?.numbers && (
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Numerical Results</h3>
                      {["mean", "median", "mode"].includes(result.operation) && result.column && (
                        <p className="text-sm text-gray-600">
                          {result.operation.charAt(0).toUpperCase() + result.operation.slice(1)} of {result.column}: {result.value}
                        </p>
                      )}
                      {result.operation === "t_test" && (
                        <p className="text-sm text-gray-600">
                          T-Test between {result.columns[0]} and {result.columns[1]}: 
                          t-stat = {result.t_stat.toFixed(3)}, p-value = {result.p_value.toExponential(3)}
                        </p>
                      )}
                      {result.operation === "chi_square" && (
                        <p className="text-sm text-gray-600">
                          Chi-Square: χ² = {result.chi2.toFixed(3)}, p-value = {result.p_value.toExponential(3)}, df = {result.degrees_of_freedom}
                        </p>
                      )}
                      {result.operation === "anova" && (
                        <p className="text-sm text-gray-600">
                          ANOVA: F-stat = {result.f_stat.toFixed(3)}, p-value = {result.p_value.toExponential(3)}
                        </p>
                      )}
                      {["pearson", "spearman"].includes(result.operation) && (
                        <p className="text-sm text-gray-600">
                          {result.operation.charAt(0).toUpperCase() + result.operation.slice(1)} Correlation: 
                          r = {result.correlation.toFixed(3)}, p-value = {result.p_value.toExponential(3)}
                        </p>
                      )}
                      {result.accuracy_note && (
                        <p className="text-sm text-yellow-600 mt-2">{result.accuracy_note}</p>
                      )}
                    </div>
                  )}

                  {presentationOptions[result.operation]?.graph && result.image && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Visualization</h3>
                      <img src={result.image} alt={`${result.operation} Plot`} className="max-w-full h-auto rounded-md border border-gray-200" />
                      {["pearson", "spearman"].includes(result.operation) && result.slope !== undefined && result.intercept !== undefined && (
                        <p className="mt-2 text-sm text-gray-600">
                          Regression: Slope = {result.slope.toFixed(3)}, Intercept = {result.intercept.toFixed(3)}
                        </p>
                      )}
                    </div>
                  )}

                  {presentationOptions[result.operation]?.table && result.contingency_table && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Table</h3>
                      <table className="w-full text-sm border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2">{result.columns[0]}</th>
                            {Object.keys(Object.values(result.contingency_table)[0]).map((col) => (
                              <th key={col} className="border border-gray-300 p-2">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.contingency_table).map(([row, values], index) => (
                            <tr key={row} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="border border-gray-300 p-2">{row}</td>
                              {Object.values(values).map((value, i) => (
                                <td key={i} className="border border-gray-300 p-2">{value}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No results yet. Run an analysis to see results here.</p>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="flex flex-col h-full">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Notes</h2>
              <textarea
                value={state.notes}
                onChange={(e) => dispatch({ type: "SET_NOTES", value: e.target.value })}
                placeholder="Jot down your observations here..."
                className="w-full flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none min-h-[300px]"
              />
              <button
                onClick={handleSaveNotes}
                className="mt-4 bg-green-600 text-white p-2 rounded-md hover:bg-green-700"
              >
                Save Notes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyzePage;










