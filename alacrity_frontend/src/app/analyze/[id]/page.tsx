/**
 * @fileoverview AnalyzePage Component
 * 
 * This component serves as a comprehensive data analysis and visualization workspace. 
 * It allows users to explore datasets, perform statistical analyses, and document insights. 
 * Key features include:
 * 
 * - **Dataset Overview**: Provides a summary of dataset statistics, including total rows, duplicate rows, 
 *   missing values, numeric statistics, and categorical data visualizations.
 * - **Data Cleaning**: Enables toggling between raw and cleaned datasets, with options to remove duplicates 
 *   and fill missing values.
 * - **Analysis Setup**: Allows users to configure and run various statistical operations, such as descriptive 
 *   statistics, inferential tests (e.g., T-Test, ANOVA), and correlation analyses.
 * - **Results Visualization**: Displays numerical results, contingency tables, and graphical visualizations 
 *   for the selected analysis.
 * - **Research Notes**: Provides a space for users to document observations and insights during analysis.
 * - **Submission**: Facilitates the submission of research findings for approval, with a rich text editor 
 *   for detailed documentation.
 * - **Interactive Tour**: Guides first-time users through the interface with step-by-step tooltips.
 * 
 * The component integrates with backend APIs for dataset retrieval, analysis execution, and encrypted 
 * dataset downloads. It also includes user-friendly features like debounced inputs, local storage for 
 * notes, and customizable chart types for categorical data visualization.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */


/**
 * @fileoverview Analyze page for data analysis and visualization
 * This component provides a user interface for performing various statistical analyses on datasets.
 * 
 */



"use client"

import type React from "react"
import { useEffect, useState, useMemo, useReducer, useCallback } from "react"
import { useParams } from "next/navigation"
import { fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"
import type { Placement } from "@/components/analyze/tooltip"
import {
  Lock,
  Download,
  FileText,
  BarChart3,
  Save,
  Filter,
  ChevronRight,
  AlertTriangle,
  Check,
  PieChart,
  Info,
} from "lucide-react"
import AnalysisFormComponent from "@/components/ResearchForm"
import TextEditorToolbar from "@/components/TextEditorToolbar"
import TourTooltip from "@/components/analyze/tooltip"
import DatasetDetailModal from "@/components/all_datasets/dataset_detail"; 

type Schema = Record<string, string>
type Dataset = {
  dataset_id: string
  title: string
  schema: Schema
  category: string
  created_at: string
  is_loaded?: boolean
  overview: Overview
  normalized: boolean
}
type Overview = {
  total_rows: number
  columns: string[]
  duplicate_rows: number
  missing_values: Record<string, number>
  numeric_stats: Record<string, any>
  categorical_stats: Record<string, Record<string, number>> 
}
type Result =
  | { operation: "mean" | "median" | "mode"; value: number | string; column: string; normalized?: boolean }
  | {
      operation: "t_test"
      t_stat: number
      p_value: number
      image?: string
      accuracy_note?: string
      columns: [string, string]
      normalized?: boolean
    }
  | {
      operation: "chi_square"
      chi2: number
      p_value: number
      degrees_of_freedom: number
      contingency_table: Record<string, any>
      image?: string
      accuracy_note?: string
      columns: [string, string]
      normalized?: boolean
    }
  | {
      operation: "anova"
      f_stat: number
      p_value: number
      image?: string
      accuracy_note?: string
      columns: [string, string]
      normalized?: boolean
    }
  | {
      operation: "pearson" | "spearman"
      correlation: number
      p_value: number
      image: string
      slope: number
      intercept: number
      columns: [string, string]
      normalized?: boolean
    }

const calculationTypes = [
  { value: "descriptive", label: "Descriptive Statistics" },
  { value: "inferential", label: "Inferential Statistics" },
  { value: "correlation", label: "Correlation Analysis" },
]

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
}

const presentationOptions = {
  mean: { numbers: true, table: false, graph: false },
  median: { numbers: true, table: false, graph: false },
  mode: { numbers: true, table: false, graph: false },
  t_test: { numbers: true, table: false, graph: true },
  chi_square: { numbers: true, table: true, graph: true },
  anova: { numbers: true, table: false, graph: true },
  pearson: { numbers: true, table: false, graph: true },
  spearman: { numbers: true, table: false, graph: true },
}

const operators = [
  { value: "=", label: "Equals (=)" },
  { value: "!=", label: "Not Equals (!=)" },
  { value: ">", label: "Greater Than (>)" },
  { value: ">=", label: "Greater or Equal (>=)" },
  { value: "<", label: "Less Than (<)" },
  { value: "<=", label: "Less or Equal (<=)" },
]



const CHART_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
]

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
  clean: false,
}

const reducer = (state: typeof initialState, action: { type: string; value: any }) => {
  switch (action.type) {
    case "SET_CALC_TYPE":
      return { ...state, calcType: action.value, operation: "", column: "", column1: "", column2: "" }
    case "SET_OPERATION":
      return { ...state, operation: action.value, column: "", column1: "", column2: "" }
    case "SET_COLUMN":
      return { ...state, column: action.value }
    case "SET_COLUMN1":
      return { ...state, column1: action.value }
    case "SET_COLUMN2":
      return { ...state, column2: action.value }
    case "SET_FILTER_COLUMN":
      return { ...state, filterColumn: action.value }
    case "SET_FILTER_OPERATOR":
      return { ...state, filterOperator: action.value }
    case "SET_FILTER_VALUE":
      return { ...state, filterValue: action.value }
    case "SET_NOTES":
      return { ...state, notes: action.value }
    case "SET_CLEAN":
      return { ...state, clean: action.value }
    default:
      return state
  }
}

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

const AnalyzePage = () => {
  const { id } = useParams()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "results" | "notes" | "submit">("overview")
  const [state, dispatch] = useReducer(reducer, initialState)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [editorInstance, setEditorInstance] = useState<any | null>(null)
  const [cleaning, setCleaning] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [chartType, setChartType] = useState<"bar" | "pie">("bar")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [currentTourStep, setCurrentTourStep] = useState(0)
  const [showTour, setShowTour] = useState(false)

  const debouncedFilterValue = useDebounce(state.filterValue, 300)
  const debouncedNotes = useDebounce(state.notes, 500)
  //this is to render pop up 
  const [showDatasetModal, setShowDatasetModal] = useState(false);

  //check is user already left a review so pop up is only shown if review hasnt been left
  // useEffect(() => {
  //   const hasReviewed = localStorage.getItem(`hasReviewed_${id}`);
  //   if (!hasReviewed) {
  //     setShowDatasetModal(true);
  //   }
  // }, [id]);

  // Check if this is the first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem(`visited_analyze_${id}`)
    if (!hasVisitedBefore) {
      setIsFirstVisit(true)
      setShowTour(true)
      localStorage.setItem(`visited_analyze_${id}`, "true")
    }
  }, [id])

  const loadDataset = useCallback(
    async (clean: boolean) => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/details/${id}/?normalize=${clean}`)
        if (response.status === 403) {
          setAccessDenied(true)
          setLoading(false)
          return
        }
        if (!response.ok) throw new Error("Failed to fetch dataset")
        const data: Dataset = await response.json()
        setDataset(data)
        dispatch({ type: "SET_CLEAN", value: data.normalized })

       
        if (data.overview?.categorical_stats && Object.keys(data.overview.categorical_stats).length > 0) {
          setActiveCategory(Object.keys(data.overview.categorical_stats)[0])
        }

        const savedNotes = localStorage.getItem(`notes_${id}`)
        if (savedNotes) dispatch({ type: "SET_NOTES", value: savedNotes })
      } catch (err) {
        setError("Could not load dataset")
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    [id],
  )

  const handleCleanToggle = useCallback(async () => {
    const newClean = !state.clean
    setCleaning(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/details/${id}/?normalize=${newClean}`)
      if (!response.ok) throw new Error("Failed to toggle cleaning")
      const data = await response.json()
      setDataset(data)
      dispatch({ type: "SET_CLEAN", value: data.normalized })
    } catch (err) {
      setError("Failed to update dataset cleaning")
      console.error(err)
    } finally {
      setCleaning(false)
    }
  }, [id, state.clean])

  const handleDownload = useCallback(async () => {
    if (!dataset) return
    setShowTermsModal(true)
  }, [dataset])

  const confirmDownload = useCallback(async () => {
    if (!dataset) return
    setShowTermsModal(false)
    setDownloadLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedColumns.length) params.append("columns", selectedColumns.join(","))
      const url = `${BACKEND_URL}/datasets/download/${id}/?${params.toString()}&normalize=${state.clean}`
      const response = await fetchWithAuth(url, { method: "GET" })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Download failed")
      }
      const blob = await response.blob()
      const urlBlob = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = urlBlob
      a.download = `${dataset.title}_encrypted.json.gz`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(urlBlob)
    } catch (err: any) {
      setError(`Download error: ${err.message}`)
    } finally {
      setDownloadLoading(false)
    }
  }, [id, dataset, selectedColumns, state.clean])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setAnalysisLoading(true)
      setError(null)
      setResult(null)

      const params = new URLSearchParams()
      params.append("operation", state.operation)
      params.append("normalize", String(state.clean))
      if (["mean", "median", "mode"].includes(state.operation)) {
        if (!state.column) {
          setError("Please select a column")
          setAnalysisLoading(false)
          return
        }
        params.append("column", state.column)
      } else {
        if (!state.column1 || !state.column2) {
          setError("Please select two columns")
          setAnalysisLoading(false)
          return
        }
        params.append("column1", state.column1)
        params.append("column2", state.column2)
      }
      if (state.filterColumn && state.filterOperator && debouncedFilterValue) {
        params.append("filter_column", state.filterColumn)
        params.append("filter_operator", state.filterOperator)
        params.append("filter_value", debouncedFilterValue)
      }

      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/perform/${id}/?${params.toString()}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Analysis failed")
        }
        const data: Result = await response.json()
        setResult(data)
        setActiveTab("results")
      } catch (err: any) {
        setError(err.message)
      } finally {
        setAnalysisLoading(false)
      }
    },
    [state, debouncedFilterValue, id],
  )

  const handleSaveNotes = useCallback(() => {
    localStorage.setItem(`notes_${id}`, debouncedNotes)
    alert("Notes saved!")
  }, [debouncedNotes, id])

  useEffect(() => {
    loadDataset(state.clean)
  }, [loadDataset, state.clean])

  // Chart drawing logic
  useEffect(() => {
    if (!activeCategory || !dataset?.overview?.categorical_stats?.[activeCategory]) return;

    const canvas = document.getElementById("categoryChart") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const categoryData = dataset.overview.categorical_stats[activeCategory];
    const labels = Object.keys(categoryData);
    const values = Object.values(categoryData);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (chartType === "bar") {
      const chartHeight = canvas.height - 60;
      const chartWidth = canvas.width - 60;
      const barWidth = chartWidth / labels.length - 10;
      const maxValue = Math.max(...values) * 1.1;

      
      ctx.beginPath();
      ctx.moveTo(40, 20);
      ctx.lineTo(40, chartHeight + 30);
      ctx.lineTo(canvas.width - 10, chartHeight + 30);
      ctx.strokeStyle = "#d1d5db";
      ctx.stroke();

      // Draw bars
      labels.forEach((label, index) => {
        const x = 50 + index * (barWidth + 10);
        const barHeight = (values[index] / maxValue) * chartHeight;
        const y = chartHeight + 30 - barHeight;

        ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "#374151";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(values[index].toLocaleString(), x + barWidth / 2, y - 5);

        ctx.fillStyle = "#4b5563";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(label, x + barWidth / 2, chartHeight + 45);
      });
    } else if (chartType === "pie") {
      const total = values.reduce((sum, value) => sum + value, 0);
      let startAngle = 0;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 40;

      // Draw slices
      values.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
        ctx.fill();

        // Draw label line and text
        const midAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 1.2;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;

        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius);
        ctx.lineTo(labelX, labelY);
        ctx.strokeStyle = "#9ca3af";
        ctx.stroke();

        ctx.fillStyle = "#374151";
        ctx.font = "12px Arial";
        ctx.textAlign = midAngle < Math.PI ? "left" : "right";
        ctx.fillText(
          `${labels[index]} (${Math.round((value / total) * 100)}%)`,
          midAngle < Math.PI ? labelX + 5 : labelX - 5,
          labelY,
        );

        startAngle = endAngle;
      });

      // Draw center circle (donut style)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Draw total in center
      ctx.fillStyle = "#374151";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Total: ${total.toLocaleString()}`, centerX, centerY);
    }
  }, [chartType, activeCategory, dataset]);

  const getCompatibleColumns = useMemo(() => {
    if (!dataset?.schema) return []
    const typeOps = Object.values(operations).flat()
    const opConfig = typeOps.find((o) => o.value === state.operation)
    if (!opConfig) return []
    return Object.entries(dataset.schema)
      .filter(([, type]) => opConfig.types.includes("any") || opConfig.types.includes(type))
      .map(([name, type]) => ({ value: name, label: `${name} (${type})` }))
  }, [state.operation, dataset?.schema])

  const getAllColumns = useMemo(() => {
    if (!dataset?.schema) return []
    return Object.entries(dataset.schema).map(([name, type]) => ({ value: name, label: `${name} (${type})` }))
  }, [dataset?.schema])

  
  
  const tourSteps: { target: string; content: string; placement: Placement; }[] = [
    {
      target: "#overview-tab",
      content: "Start here to get a comprehensive view of your dataset's statistics and distributions.",
      placement: "bottom",
    },
    {
      target: "#data-cleaning-toggle",
      content: "Toggle this to clean your data by removing duplicates and filling missing values.",
      placement: "left",
    },
    {
      target: "#categorical-data-section",
      content: "Explore the distribution of categorical variables with interactive charts.",
      placement: "top",
    },
    {
      target: "#analysis-tab",
      content: "Run statistical analyses on your data to discover insights.",
      placement: "bottom",
    },
    {
      target: "#results-tab",
      content: "View the results of your analyses with visualizations.",
      placement: "bottom",
    },
    {
      target: "#notes-tab",
      content: "Document your observations and insights as you analyze the data.",
      placement: "bottom",
    },
  ]

  const nextTourStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(currentTourStep + 1)
    } else {
      setShowTour(false)
    }
  }

  const prevTourStep = () => {
    if (currentTourStep > 0) {
      setCurrentTourStep(currentTourStep - 1)
    }
  }

  const skipTour = () => {
    setShowTour(false)
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-card">
        <div className="max-w-md p-6 text-center bg-white dark:bg-card rounded-lg shadow-lg">
          <Lock size={90} className="mx-auto mb-6" style={{ color: "#f97316" }} strokeWidth={1.5} />
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#f97316" }}>
            Oops! Limited Access
          </h2>
          <p className="text-gray-700 dark:text-gray-100 text-lg mb-4">Sorry, you dont have access to this resource right now.</p>
          <p className="text-gray-500 dark:text-gray-300 mt-3 text-sm">If you think this is a mistake, please contact support.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fff8f3" }}>
        <div className="p-6 text-center bg-white dark:bg-card rounded-lg shadow-lg">
          <div className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: "#f97316" }}>
            <svg viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2 dark:text-gray-100" style={{ color: "#f97316" }}>
            Loading Dataset
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Preparing your data...</p>
        </div>
      </div>
    )
  }

  if (error && !dataset) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fff8f3" }}>
        <p className="text-gray-600 dark:text-gray-100">No dataset available.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#fff8f3" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 p-4 rounded-lg shadow-lg" style={{ backgroundColor: "#f97316" }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-white">{dataset.title}</h1>
          <p className="text-white/80 text-center mt-1">Data Analysis Workspace</p>

         

        </div>
        <div className="flex justify-between items-center mb-6">
        {/* <button
           onClick={() => setShowDatasetModal(true)}
           className="flex items-center px-4 py-2 rounded-md text-white bg-[#f97316] hover:bg-orange-600 focus:outline-none"
          >
            
            Give Feedback on Dataset
          </button> */}
        

          <button
            onClick={() => setShowDatasetModal(true)}
            className="flex items-center px-4 py-2 rounded-md text-white bg-[#f97316] hover:bg-orange-600 focus:outline-none"
          >
            <FileText className="mr-2" /> Have some feedback?
          </button>


         
          <button
            onClick={handleDownload}
            className={`flex items-center px-4 py-2 rounded-md text-white bg-[#f97316] hover:bg-orange-600 focus:outline-none ${
              downloadLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled
          >
            {downloadLoading ? <span>Downloading...</span> : <Download className="mr-2" />}
            Download encrypted Dataset
          </button>
        </div>

        <div className="w-full mb-6">
          <div className="grid grid-cols-5 gap-1 bg-white dark:bg-card rounded-lg shadow-md overflow-hidden">
            <button
              id="overview-tab"
              onClick={() => setActiveTab("overview")}
              className={`py-3 px-4 text-center font-medium ${
                activeTab === "overview" ? "bg-orange-500 text-white" : "dark:text-gray-100 text-gray-700 hover:bg-orange-100"
              }`}
            >
              Overview
            </button>
            <button
              id="analysis-tab"
              onClick={() => setActiveTab("analysis")}
              className={`py-3 px-4 text-center font-medium flex items-center justify-center ${
                activeTab === "analysis" ? "bg-orange-500 text-white" : "dark:text-gray-100 text-gray-700 hover:bg-orange-100"
              }`}
            >
              <BarChart3 className="mr-2 h-4 w-4" /> Analysis
            </button>
            <button
              id="results-tab"
              onClick={() => setActiveTab("results")}
              className={`py-3 px-4 text-center font-medium flex items-center justify-center ${
                activeTab === "results" ? "bg-orange-500 text-white" : "dark:text-gray-100 text-gray-700 hover:bg-orange-100"
              }`}
            >
              <ChevronRight className="mr-2 h-4 w-4" /> Results
            </button>
            <button
              id="notes-tab"
              onClick={() => setActiveTab("notes")}
              className={`py-3 px-4 text-center font-medium flex items-center justify-center ${
                activeTab === "notes" ? "bg-orange-500 text-white" : "dark:text-gray-100 text-gray-700 hover:bg-orange-100"
              }`}
            >
              <FileText className="mr-2 h-4 w-4" /> Notes
            </button>
            <button
              id="submit-tab"
              onClick={() => setActiveTab("submit")}
              className={`py-3 px-4 text-center font-medium flex items-center justify-center ${
                activeTab === "submit" ? "bg-orange-500 text-white" : "dark:text-gray-100 text-gray-700 hover:bg-orange-100"
              }`}
            >
              <Save className="mr-2 h-4 w-4" /> Submit
            </button>
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="bg-white dark:bg-card p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold" style={{ color: "#f97316" }}>
                Dataset Overview
              </h2>
              <div className="flex items-center space-x-2" id="data-cleaning-toggle">
                <span className="text-sm text-gray-600 dark:text-gray-300">Raw Data</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.clean}
                    onChange={handleCleanToggle}
                    className="sr-only peer"
                    disabled={cleaning || analysisLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
                <span className="text-sm text-gray-600 dark:text-gray-300">Clean Data</span>
                <button
                  className="ml-2 text-gray-500 dark:text-gray-300 hover:text-orange-500 focus:outline-none"
                  title="Clean data removes duplicates and fills missing values"
                >
                  <Info size={16} />
                </button>
                



              </div>
            </div>

            {cleaning ? (
              <div className="text-center py-12">
                <div className="animate-spin h-10 w-10 mx-auto mb-4" style={{ color: "#f97316" }}>
                  <svg viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                </div>
                <p>
                  {state.clean
                    ? "Cleaning dataset (removing duplicates and missing values)..."
                    : "Reverting to raw dataset..."}
                </p>
              </div>
            ) : dataset.overview ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border border-orange-200 rounded-lg bg-white dark:bg-gray-600 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-100 mb-1">Total Rows</h3>
                    <p className="text-2xl font-bold" style={{ color: "#f97316" }}>
                      {dataset.overview.total_rows ?? "N/A"}
                    </p>
                  </div>
                  <div className="p-4 border border-orange-200 rounded-lg bg-white dark:bg-gray-600 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-100 mb-1">Duplicate Rows</h3>
                    <div className="flex items-center">
                      <p
                        className="text-2xl font-bold"
                        style={{ color: dataset.overview.duplicate_rows > 0 ? "#ef4444" : "#10b981" }}
                      >
                        {dataset.overview.duplicate_rows ?? "N/A"}
                      </p>
                      {dataset.overview.duplicate_rows > 0 && <AlertTriangle className="h-5 w-5 ml-2 text-red-500" />}
                    </div>
                  </div>
                  <div className="p-4 border border-orange-200 rounded-lg bg-white dark:bg-gray-600 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-100 mb-1">Missing Values</h3>
                    <div className="flex items-center">
                      <p
                        className="text-2xl font-bold"
                        style={{
                          color: Object.values(dataset.overview.missing_values).some((v) => v > 0)
                            ? "#ef4444"
                            : "#10b981",
                        }}
                      >
                        {Object.values(dataset.overview.missing_values).reduce((a, b) => a + b, 0)}
                      </p>
                      {Object.values(dataset.overview.missing_values).some((v) => v > 0) && (
                        <AlertTriangle className="h-5 w-5 ml-2 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Missing Values Visualization */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Missing Values by Column</h3>
                  <div className="h-8 w-full bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                    {Object.entries(dataset.overview.missing_values).map(([column, count], index) => {
                      const percentage = (count / dataset.overview.total_rows) * 100
                      if (percentage === 0) return null
                      return (
                        <div
                          key={column}
                          className="h-full float-left"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                          }}
                          title={`${column}: ${count} missing (${percentage.toFixed(1)}%)`}
                        />
                      )
                    })}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(dataset.overview.missing_values)
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      .filter(([_, count]) => count > 0)
                      .map(([column, count], index) => (
                        <div key={column} className="flex items-center text-xs">
                          <div
                            className="w-3 h-3 mr-1 rounded-sm"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span>
                            {column}: {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Numeric Statistics */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-100 mb-2">Numeric Statistics</h3>
                  {dataset.overview.numeric_stats && Object.keys(dataset.overview.numeric_stats).length > 0 ? (
                    <div className="overflow-x-auto bg-white dark:bg-card border border-orange-200 rounded-lg">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-orange-50 dark:bg-orange-500">
                            <th className="border-b border-orange-200 p-2 text-left">Statistic</th>
                            {Object.keys(dataset.overview.numeric_stats).map((col) => (
                              <th key={col} className="border-b border-orange-200 p-2 text-left">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(
                            dataset.overview.numeric_stats[Object.keys(dataset.overview.numeric_stats)[0]],
                          ).map((stat, idx) => (
                            <tr key={stat} className={idx % 2 === 0 ? "bg-white dark:bg-card" : "bg-orange-50/30"}>
                              <td className="border-b border-orange-200 p-2 font-medium">{stat}</td>
                              {Object.entries(dataset.overview.numeric_stats).map(([col, stats]) => (
                                <td key={`${col}-${stat}`} className="border-b border-orange-200 p-2">
                                  {stats[stat] !== null && stats[stat] !== undefined
                                    ? typeof stats[stat] === "number"
                                      ? Number(stats[stat]).toFixed(2)
                                      : stats[stat]
                                    : "N/A"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-300 text-center">
                      No numeric statistics available.
                    </div>
                  )}
                </div>

                {/* Categorical Data Visualization */}
                <div id="categorical-data-section" className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">Categorical Data Visualization</h3>

                  {dataset.overview.categorical_stats && Object.keys(dataset.overview.categorical_stats).length > 0 ? (
                    <>
                      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                        {Object.keys(dataset.overview.categorical_stats).map((category) => (
                          <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${
                              activeCategory === category
                                ? "bg-orange-500 text-white"
                                : "bg-white border border-orange-200 text-gray-700 dark:text-gray-300 hover:bg-orange-50"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>

                      {activeCategory && dataset.overview.categorical_stats[activeCategory] && (
                        <div className="p-4 border border-orange-200 rounded-lg bg-white dark:bg-card shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h4 className="font-medium capitalize">{activeCategory}</h4>
                              <div className="text-sm text-gray-500 dark:text-gray-100 mt-1">
                                <span className="inline-block mr-4">
                                  Unique Values: {Object.keys(dataset.overview.categorical_stats[activeCategory]).length}
                                </span>
                                <span className="inline-block">
                                  Total Count:{" "}
                                  {Object.values(dataset.overview.categorical_stats[activeCategory])
                                    .reduce((a, b) => a + b, 0)
                                    .toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setChartType("bar")}
                                className={`px-2 py-1 rounded-md text-sm flex items-center ${
                                  chartType === "bar"
                                    ? "bg-orange-100 dark:bg-gray-700 text-orange-700 dark:text-gray-100 border border-orange-300"
                                    : "bg-white dark:bg-card border border-gray-300 text-gray-700 dark:text-gray-100 hover:bg-gray-50"
                                }`}
                              >
                                <BarChart3 className="h-4 w-4 mr-1" />
                                Bar
                              </button>
                              <button
                                onClick={() => setChartType("pie")}
                                className={`px-2 py-1 rounded-md text-sm flex items-center ${
                                  chartType === "pie"
                                    ? "bg-orange-100 text-orange-700 dark:text-gray-300 border border-orange-300"
                                    : "bg-white dark:bg-card dark:text-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <PieChart className="h-4 w-4 mr-1" />
                                Pie
                              </button>
                            </div>
                          </div>

                          <div className="h-64 relative">
                            <canvas id="categoryChart" width="600" height="250" className="w-full h-full"></canvas>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-gray-500 text-center">
                      No categorical data available.
                    </div>
                  )}
                </div>

                {/* Data Quality Indicators */}
                {state.clean ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-medium text-green-800">Data Cleaning Applied</h3>
                        <p className="text-sm text-green-700 mt-1">
                          This dataset has been cleaned by removing {dataset.overview.duplicate_rows} duplicate rows and
                          filling {Object.values(dataset.overview.missing_values).reduce((a, b) => a + b, 0)} missing
                          values.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-medium text-yellow-800">Raw Data</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          This dataset contains {dataset.overview.duplicate_rows} duplicate rows and{" "}
                          {Object.values(dataset.overview.missing_values).reduce((a, b) => a + b, 0)} missing values.
                          Toggle &quot;Clean Data&quot; to improve data quality.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No overview data available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4" style={{ color: "#f97316" }}>
                Dataset Metadata
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Title</p>
                    <p className="font-medium">{dataset.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <span
                      className="inline-block px-2 py-1 text-sm rounded-full"
                      style={{ backgroundColor: "#fff0e6", color: "#f97316", border: "1px solid #f97316" }}
                    >
                      {dataset.category}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p>{new Date(dataset.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <hr className="border-gray-200" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Columns</p>
                  <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                    {Object.entries(dataset.schema).map(([col, type]) => (
                      <div key={col} className="flex justify-between items-center py-1 px-2 rounded-md bg-gray-50">
                        <span className="font-medium">{col}</span>
                        <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <hr className="border-gray-200" />
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-500">Columns to Encrypt</p>
                  <select
                    multiple
                    value={selectedColumns}
                    onChange={(e) => setSelectedColumns(Array.from(e.target.selectedOptions, (option) => option.value))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    size={5}
                  >
                    {Object.keys(dataset.schema).map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">All data will be homomorphically encrypted.</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleDownload}
                  disabled={downloadLoading || cleaning}
                  className="w-full py-2 px-4 rounded-md flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#f97316", color: "white" }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadLoading ? "Encrypting & Downloading..." : "Download Encrypted Data"}
                </button>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold" style={{ color: "#f97316" }}>
                  Analysis Setup
                </h2>
                <label className="flex items-center space-x-2">
                  <span>Clean Data</span>

        
                  <input
                    type="checkbox"
                    checked={state.clean}
                    onChange={handleCleanToggle}
                    className="form-checkbox h-5 w-5 text-orange-500"
                    disabled={cleaning || analysisLoading}
                  />
                </label>
                
              </div>
              
              {cleaning ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-10 w-10 mx-auto mb-4" style={{ color: "#f97316" }}>
                    <svg viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                    </svg>
                  </div>
                  <p>
                    {state.clean
                      ? "Cleaning dataset (removing duplicates and missing values)..."
                      : "Reverting to raw dataset..."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Calculation Type</label>
                    <select
                      value={state.calcType}
                      onChange={(e) => dispatch({ type: "SET_CALC_TYPE", value: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select a type</option>
                      {calculationTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {state.calcType && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Operation</label>
                      <select
                        value={state.operation}
                        onChange={(e) => dispatch({ type: "SET_OPERATION", value: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select an operation</option>
                        {operations[state.calcType as keyof typeof operations].map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {state.operation && (
                    <>
                      {operations[state.calcType as keyof typeof operations].find((o) => o.value === state.operation)
                        ?.columns === 1 ? (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Column</label>
                          <select
                            value={state.column}
                            onChange={(e) => dispatch({ type: "SET_COLUMN", value: e.target.value.split(" (")[0] })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select a column</option>
                            {getCompatibleColumns.map((col) => (
                              <option key={col.value} value={col.value}>
                                {col.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Column 1</label>
                            <select
                              value={state.column1}
                              onChange={(e) => dispatch({ type: "SET_COLUMN1", value: e.target.value.split(" (")[0] })}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">Select first column</option>
                              {getCompatibleColumns.map((col) => (
                                <option key={col.value} value={col.value}>
                                  {col.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Column 2</label>
                            <select
                              value={state.column2}
                              onChange={(e) => dispatch({ type: "SET_COLUMN2", value: e.target.value.split(" (")[0] })}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">Select second column</option>
                              {getCompatibleColumns.map((col) => (
                                <option key={col.value} value={col.value}>
                                  {col.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <label className="text-sm font-medium">Filter</label>
                          <Filter className="ml-2 h-4 w-4 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={state.filterColumn}
                            onChange={(e) =>
                              dispatch({ type: "SET_FILTER_COLUMN", value: e.target.value.split(" (")[0] })
                            }
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Column</option>
                            {getAllColumns.map((col) => (
                              <option key={col.value} value={col.value}>
                                {col.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={state.filterOperator}
                            onChange={(e) => dispatch({ type: "SET_FILTER_OPERATOR", value: e.target.value })}
                            disabled={!state.filterColumn}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <option value="">Operator</option>
                            {operators.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={state.filterValue}
                            onChange={(e) => dispatch({ type: "SET_FILTER_VALUE", value: e.target.value })}
                            placeholder="Value"
                            disabled={!state.filterColumn || !state.filterOperator}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={
                        analysisLoading ||
                        cleaning ||
                        !state.operation ||
                        (["mean", "median", "mode"].includes(state.operation)
                          ? !state.column
                          : !state.column1 || !state.column2)
                      }
                      className="w-full py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#f97316", color: "white" }}
                    >
                      {analysisLoading ? "Analyzing..." : "Run Analysis"}
                    </button>
                  </div>
                  {error && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#f97316" }}>
              Analysis Results
            </h2>
            {analysisLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-10 w-10 mx-auto mb-4" style={{ color: "#f97316" }}>
                  <svg viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                </div>
                <p className="text-gray-600">Running analysis...</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {presentationOptions[result.operation]?.numbers && (
                  <div className="p-4 rounded-lg border border-orange-200 bg-orange-50">
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "#f97316" }}>
                      Numerical Results {result.normalized ? "(Cleaned)" : ""}
                    </h3>
                    {["mean", "median", "mode"].includes(result.operation) && "column" in result && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {result.operation.charAt(0).toUpperCase() + result.operation.slice(1)} of {result.column}:
                        </span>
                        <span
                          className="px-3 py-1 text-lg rounded-md text-white"
                          style={{ backgroundColor: "#f97316" }}
                        >
                          {result.value ?? "N/A"}
                        </span>
                      </div>
                    )}
                    {result.operation === "t_test" && (
                      <div className="space-y-2">
                        <p className="font-medium">
                          T-Test between {result.columns[0]} and {result.columns[1]}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">t-stat</span>
                            <p className="font-medium">{result.t_stat.toFixed(3)}</p>
                          </div>
                          <div className="bg-white p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">p-value</span>
                            <p className="font-medium">{result.p_value.toExponential(3)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {result.operation === "chi_square" && (
                      <div className="space-y-2">
                        <p className="font-medium">Chi-Square Test</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">χ²</span>
                            <p className="font-medium">{result.chi2.toFixed(3)}</p>
                          </div>
                          <div className="bg-white p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">p-value</span>
                            <p className="font-medium">{result.p_value.toExponential(3)}</p>
                          </div>
                          <div className="bg-white p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">df</span>
                            <p className="font-medium">{result.degrees_of_freedom}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {result.operation === "anova" && (
                      <div className="space-y-2">
                        <p className="font-medium">ANOVA</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">F-stat</span>
                            <p className="font-medium">{result.f_stat.toFixed(3)}</p>
                          </div>
                          <div className="bg-white p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">p-value</span>
                            <p className="font-medium">{result.p_value.toExponential(3)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {["pearson", "spearman"].includes(result.operation) && "correlation" in result && (
                      <div className="space-y-2">
                        <p className="font-medium">
                          {result.operation.charAt(0).toUpperCase() + result.operation.slice(1)} Correlation
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">r</span>
                            <p className="font-medium">{result.correlation.toFixed(3)}</p>
                          </div>
                          <div className="bg-white p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">p-value</span>
                            <p className="font-medium">{result.p_value.toExponential(3)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {"accuracy_note" in result && result.accuracy_note && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
                        {result.accuracy_note}
                      </div>
                    )}
                  </div>
                )}
                {presentationOptions[result.operation]?.graph && "image" in result && result.image && (
                  <div className="p-4 rounded-lg border border-gray-200 bg-white">
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "#f97316" }}>
                      Visualization
                    </h3>
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <img
                        src={result.image || "/placeholder.svg"}
                        alt={`${result.operation} Plot`}
                        className="max-w-full h-auto"
                      />
                    </div>
                    {["pearson", "spearman"].includes(result.operation) &&
                      "slope" in result &&
                      "intercept" in result && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="bg-orange-50 p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">Slope</span>
                            <p className="font-medium">{result.slope.toFixed(3)}</p>
                          </div>
                          <div className="bg-orange-50 p-2 rounded-md border border-orange-200">
                            <span className="text-sm text-gray-500">Intercept</span>
                            <p className="font-medium">{result.intercept.toFixed(3)}</p>
                          </div>
                        </div>
                      )}
                  </div>
                )}
                {presentationOptions[result.operation]?.table && "contingency_table" in result && (
                  <div className="p-4 rounded-lg border border-gray-200 bg-white">
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "#f97316" }}>
                      Contingency Table
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-orange-50">
                            <th className="border border-orange-200 p-2 text-left">{result.columns[0]}</th>
                            {Object.keys(Object.values(result.contingency_table)[0]).map((col) => (
                              <th key={col} className="border border-orange-200 p-2 text-left">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.contingency_table).map(([row, values], index) => (
                            <tr key={row} className={index % 2 === 0 ? "bg-white" : "bg-orange-50/30"}>
                              <td className="border border-orange-200 p-2 font-medium">{row}</td>
                              {Object.values(values).map((value, i) => (
                                <td key={i} className="border border-orange-200 p-2">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No results yet. Run an analysis to see results here.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#f97316" }}>
              Research Notes
            </h2>
            <p className="text-gray-600 mb-3">Document your observations and insights</p>
            <textarea
              value={state.notes}
              onChange={(e) => dispatch({ type: "SET_NOTES", value: e.target.value })}
              placeholder="Jot down your observations here..."
              className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={cleaning}
            />
            <div className="mt-4">
              <button
                onClick={handleSaveNotes}
                disabled={cleaning}
                className="py-2 px-4 rounded-md font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#f97316", color: "white" }}
              >
                <Save className="mr-2 h-4 w-4" /> Save Notes
              </button>
            </div>
          </div>
        )}

        {activeTab === "submit" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#f97316" }}>
              Submit Research for Approval
            </h2>
            <p className="text-gray-600 mb-3">
              Submit your research based on the dataset &quot;<strong>{dataset.title}</strong>&quot;. Your submission
              will be reviewed by the datasets organization.
            </p>
            {editorInstance && (
              <div className="sticky top-16 z-30 bg-white p-2 rounded-lg mb-4">
                <TextEditorToolbar editor={editorInstance} />
              </div>
            )}

            <AnalysisFormComponent editorInstance={editorInstance} setEditorInstance={setEditorInstance} />
          </div>
        )}

        {showTermsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4" style={{ color: "#f97316" }}>
                Terms and Conditions
              </h3>
              <div className="max-h-60 overflow-y-auto mb-4 text-gray-700 text-sm border border-gray-200 p-3 rounded-md">
                <p className="mb-3">By downloading this encrypted data, you agree to:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Not attempt to decrypt using unauthorized methods.</li>
                  <li>Maintain confidentiality and not share with unauthorized parties.</li>
                  <li>Use data only for intended analytical purposes.</li>
                  <li>Acknowledge misuse may result in legal consequences.</li>
                  <li>Understand encryption protects sensitive information.</li>
                </ol>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDownload}
                  className="px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: "#f97316" }}
                >
                  I Agree
                </button>
              </div>
             
            </div>
            iiidi
          </div>
        )}
      </div>
              {/* Only render the review modal if the user hasn't reviewed */}
      {showDatasetModal && (
        <DatasetDetailModal
          dataset_id={id as string}
          onClose={() => setShowDatasetModal(false)}
        />

)}
      {/* Tour Tooltips */}
      {showTour && tourSteps[currentTourStep] && (
        <TourTooltip
          target={tourSteps[currentTourStep].target}
          content={tourSteps[currentTourStep].content}
          placement={tourSteps[currentTourStep].placement}
          currentStep={currentTourStep + 1}
          totalSteps={tourSteps.length}
          onNext={nextTourStep}
          onPrev={prevTourStep}
          onSkip={skipTour}
        />
      )}
    </div>
  )
}

export default AnalyzePage