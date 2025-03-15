






/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useEffect, useState, useMemo, useReducer, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import { fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"
import { Lock, Download, FileText, BarChart3, Save, Filter, ChevronRight, X, ArrowRight, ArrowLeft } from "lucide-react"
import { Editor } from "@tiptap/react"
import TextEditorToolbar from "@/components/TextEditorToolbar"
import AnalysisFormComponent from "@/components/ResearchForm"


type Schema = Record<string, string>
type Dataset = {
  dataset_id: string
  title: string
  schema: Schema
  category: string
  created_at: string
  is_loaded?: boolean
}
type Result =
  | { operation: "mean" | "median" | "mode"; value: number | string; column: string }
  | {
      operation: "t_test"
      t_stat: number
      p_value: number
      image?: string
      accuracy_note?: string
      columns: [string, string]
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
    }
  | {
      operation: "anova"
      f_stat: number
      p_value: number
      image?: string
      accuracy_note?: string
      columns: [string, string]
    }
  | {
      operation: "pearson" | "spearman"
      correlation: number
      p_value: number
      image: string
      slope: number
      intercept: number
      columns: [string, string]
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
}

const reducer = (state: typeof initialState, action: { type: string; value: string }) => {
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

// Tour steps configuration
const tourSteps = [
  {
    target: "header",
    title: "Welcome to Data Analysis Workspace",
    content:
      "This workspace allows you to analyze your dataset with various statistical methods. Let's take a quick tour!",
    placement: "bottom",
  },
  {
    target: "tabs",
    title: "Navigation Tabs",
    content: "Use these tabs to switch between Analysis setup, Results view, and your Research Notes.",
    placement: "bottom",
  },
  {
    target: "metadata",
    title: "Dataset Information",
    content: "Here you can see details about your dataset including columns and data types.",
    placement: "right",
  },
  {
    target: "download",
    title: "Download Encrypted Data",
    content: "You can download your data in encrypted format for secure sharing and storage.",
    placement: "top",
  },
  {
    target: "analysis-setup",
    title: "Analysis Configuration",
    content: "Select calculation types, operations, and columns to analyze your data.",
    placement: "left",
  },
  {
    target: "results-tab",
    title: "View Results",
    content: "After running an analysis, switch to this tab to see visualizations and statistics.",
    placement: "bottom",
  },
  {
    target: "notes-tab",
    title: "Research Notes",
    content: "Document your observations and insights as you analyze the data.",
    placement: "bottom",
  },
]

const AnalyzePage = () => {
  const { id } = useParams()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [activeTab, setActiveTab] = useState<"analysis" | "results" | "notes" | "submit">("analysis");
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [showTermsModal, setShowTermsModal] = useState(false)

  // Tour state
  const [showTour, setShowTour] = useState(false)
  const [currentTourStep, setCurrentTourStep] = useState(0)

  // Refs for tour targets
  const headerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const metadataRef = useRef<HTMLDivElement>(null)
  const downloadRef = useRef<HTMLButtonElement>(null)
  const analysisSetupRef = useRef<HTMLDivElement>(null)
  const resultsTabRef = useRef<HTMLButtonElement>(null)
  const notesTabRef = useRef<HTMLButtonElement>(null)

  const debouncedFilterValue = useDebounce(state.filterValue, 300)
  const debouncedNotes = useDebounce(state.notes, 500)


  // Check if user has seen the tour before
  useEffect(() => {
    if (!loading && dataset) {
      const hasSeenTour = localStorage.getItem(`tour_seen_${id}`)
      if (!hasSeenTour) {
        setShowTour(true)
      }
    }
  }, [loading, dataset, id])

  // Handle tour completion
  const completeTour = () => {
    setShowTour(false)
    localStorage.setItem(`tour_seen_${id}`, "true")
  }

  // Navigate through tour steps
  const nextTourStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep((prev) => prev + 1)
    } else {
      completeTour()
    }
  }

  const prevTourStep = () => {
    if (currentTourStep > 0) {
      setCurrentTourStep((prev) => prev - 1)
    }
  }

  // Get current tour step target ref
  const getCurrentTargetRef = () => {
    const target = tourSteps[currentTourStep].target
    switch (target) {
      case "header":
        return headerRef
      case "tabs":
        return tabsRef
      case "metadata":
        return metadataRef
      case "download":
        return downloadRef
      case "analysis-setup":
        return analysisSetupRef
      case "results-tab":
        return resultsTabRef
      case "notes-tab":
        return notesTabRef
      default:
        return null
    }
  }

  useEffect(() => {
    const fetchDataset = async () => {
      setLoading(true)
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/details/${id}/`)
        if (response.status === 403) {
          setAccessDenied(true)
          return
        }
        if (!response.ok) throw new Error("Failed to fetch dataset details")
        const data: Dataset = await response.json()
        setDataset(data)
        const savedNotes = localStorage.getItem(`notes_${id}`)
        if (savedNotes) dispatch({ type: "SET_NOTES", value: savedNotes })
      } catch (err) {
        setError("Could not load dataset details")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDataset()

    const handleBeforeUnload = async () => {
      await fetchWithAuth(`${BACKEND_URL}/datasets/clear_cache/${id}/`, { method: "POST" })
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      handleBeforeUnload()
    }
  }, [id])

  const handleDownload = useCallback(async () => {
    if (!dataset) return
    setShowTermsModal(true)
  }, [dataset])

  const confirmDownload = useCallback(async () => {
    if (!dataset) return
    setShowTermsModal(false)
    setDownloadLoading(true)
    setDownloadProgress(0)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedColumns.length) params.append("columns", selectedColumns.join(","))
      const url = `${BACKEND_URL}/datasets/download/${id}/?${params.toString()}`

      const response = await fetchWithAuth(url, {
        method: "GET",
      })

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
      setDownloadProgress(0)
    }
  }, [id, dataset, selectedColumns])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setAnalysisLoading(true)
      setError(null)
      setResult(null)

      const params = new URLSearchParams()
      params.append("operation", state.operation)
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

  // Tour tooltip component
  const TourTooltip = () => {
    if (!showTour) return null

    const currentStep = tourSteps[currentTourStep]
    const targetRef = getCurrentTargetRef()

    if (!targetRef?.current) return null

    const targetRect = targetRef.current.getBoundingClientRect()
    const isFirstStep = currentTourStep === 0
    const isLastStep = currentTourStep === tourSteps.length - 1

    // Calculate position based on placement
    let tooltipStyle: React.CSSProperties = {}

    switch (currentStep.placement) {
      case "top":
        tooltipStyle = {
          bottom: `calc(100vh - ${targetRect.top}px + 10px)`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: "translateX(-50%)",
        }
        break
      case "bottom":
        tooltipStyle = {
          top: `${targetRect.bottom + 10}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: "translateX(-50%)",
        }
        break
      case "left":
        tooltipStyle = {
          top: `${targetRect.top + targetRect.height / 2}px`,
          right: `calc(100vw - ${targetRect.left}px + 10px)`,
          transform: "translateY(-50%)",
        }
        break
      case "right":
        tooltipStyle = {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + 10}px`,
          transform: "translateY(-50%)",
        }
        break
    }

    return (
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Highlight overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50">
          {/* Cut out for highlighted element */}
          <div
            className="absolute bg-transparent border-2 border-orange-500 rounded-md pointer-events-none"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />
        </div>

        {/* Tooltip */}
        <div className="absolute bg-white rounded-lg shadow-xl p-4 w-64 pointer-events-auto" style={tooltipStyle}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg" style={{ color: "#f97316" }}>
              {currentStep.title}
            </h3>
            <button onClick={completeTour} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <p className="text-gray-700 mb-4">{currentStep.content}</p>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Step {currentTourStep + 1} of {tourSteps.length}
            </div>
            <div className="flex space-x-2">
              {!isFirstStep && (
                <button onClick={prevTourStep} className="p-1 rounded-full hover:bg-gray-100">
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
              )}
              <button
                onClick={nextTourStep}
                className="flex items-center justify-center px-3 py-1 rounded-md text-white"
                style={{ backgroundColor: "#f97316" }}
              >
                {isLastStep ? (
                  "Finish"
                ) : (
                  <>
                    Next
                    <ArrowRight size={16} className="ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-lg">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <Lock size={90} className="absolute inset-0" style={{ color: "#f97316" }} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#f97316" }}>
            Oops! Limited Access
          </h2>
          <p className="text-gray-700 text-lg mb-4">Sorry, you don&apos;t have access to this resource right now.</p>
          <div className="w-16 h-1 mx-auto my-2" style={{ backgroundColor: "#f97316", opacity: 0.5 }}></div>
          <p className="text-gray-500 mt-3 text-sm">If you think this is a mistake, please contact support.</p>
        </div>
      </div>
    )
  }

  if (loading || (dataset && !dataset.is_loaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fff8f3" }}>
        <div className="p-6 text-center bg-white rounded-lg shadow-lg">
          <div className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: "#f97316" }}>
            <svg viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "#f97316" }}>
            Loading Workspace
          </h2>
          <p className="text-gray-600">Preparing your data for analysis...</p>
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

  if (!dataset) return null

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#fff8f3" }}>
      <div className="max-w-6xl mx-auto">
        <div ref={headerRef} className="mb-6 p-4 rounded-lg shadow-lg" style={{ backgroundColor: "#f97316" }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-white">{dataset.title}</h1>
          <p className="text-white/80 text-center mt-1">Data Analysis Workspace</p>
        </div>

        <div ref={tabsRef} className="w-full mb-6">
          <div className="grid grid-cols-3 gap-1 bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`py-3 px-4 text-center font-medium flex items-center justify-center ${
                activeTab === "analysis" ? "bg-orange-500 text-white" : "text-gray-700 hover:bg-orange-100"
              }`}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analysis
            </button>
            <button
              ref={resultsTabRef}
              onClick={() => setActiveTab("results")}
              className={`py-3 px-4 text-center font-medium flex items-center justify-center ${
                activeTab === "results" ? "bg-orange-500 text-white" : "text-gray-700 hover:bg-orange-100"
              }`}
            >
              <ChevronRight className="mr-2 h-4 w-4" />
              Results
            </button>
            <button
              ref={notesTabRef}
              onClick={() => setActiveTab("notes")}
              className={`py-3 px-4 text-center font-medium flex items-center justify-center ${
                activeTab === "notes" ? "bg-orange-500 text-white" : "text-gray-700 hover:bg-orange-100"
              }`}
            >
              <FileText className="mr-2 h-4 w-4" />
              Notes
            </button>
                {/* Add Submit Tab */}
    <button
      onClick={() => setActiveTab("submit")}
      className={`py-3 px-4 text-center font-medium flex items-center justify-center ${
        activeTab === "submit" ? "bg-orange-500 text-white" : "text-gray-700 hover:bg-orange-100"
      }`}
    >
      <Save className="mr-2 h-4 w-4" />
      Submit
    </button>
          </div>
        </div>

        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div ref={metadataRef} className="bg-white p-6 rounded-lg shadow-md">
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
                  <p className="text-xs text-gray-500">All data will be homomorphically encrypted (entire dataset).</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  ref={downloadRef}
                  onClick={handleDownload}
                  disabled={downloadLoading}
                  className="w-full py-2 px-4 rounded-md flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#f97316", color: "white" }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadLoading ? "Encrypting & Downloading..." : "Download Encrypted Data"}
                </button>
              </div>
              {downloadLoading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${downloadProgress}%`, backgroundColor: "#f97316" }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {downloadProgress > 0 ? `${downloadProgress.toFixed(1)}%` : "Preparing..."}
                  </p>
                </div>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
              )}
            </div>

            <div ref={analysisSetupRef} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4" style={{ color: "#f97316" }}>
                Analysis Setup
              </h2>
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
                      Numerical Results
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
                          {"value" in result ? result.value : "N/A"}
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
                          {result.contingency_table &&
                            Object.entries(result.contingency_table).map(([row, values], index) => (
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
            />
            <div className="mt-4">
              <button
                onClick={handleSaveNotes}
                className="py-2 px-4 rounded-md font-medium flex items-center justify-center"
                style={{ backgroundColor: "#f97316", color: "white" }}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Notes
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === "submit" && (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-lg font-semibold mb-4" style={{ color: "#f97316" }}>
      Submit Research for Approval
    </h2>
    <p className="text-gray-600 mb-3">
      Submit your research based on the dataset &quot;<strong>{dataset.title}</strong>&quot;. Your submission will be reviewed
      by the dataset&apos;s organization.
    </p>

    {/* toolbar */}
    {editorInstance && (
      <div className="sticky top-16 z-30 bg-white p-2 rounded-lg mb-4">
        <TextEditorToolbar editor={editorInstance} />
      </div>
    )}

    <AnalysisFormComponent 
      editorInstance={editorInstance} 
      setEditorInstance={setEditorInstance}
    />
  </div>
)}


   
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4" style={{ color: "#f97316" }}>
              Terms and Conditions
            </h3>
            <h3 className="text-xl font-bold mb-4 text-alacrityred " >
             THIS WILL TAKE A LONG TIME TO LOAD DEPENDING ON THE SIZE OF THE DATASET
            </h3>
            <div className="max-h-60 overflow-y-auto mb-4 text-gray-700 text-sm border border-gray-200 p-3 rounded-md">
              <p className="mb-3">By downloading this encrypted data, you agree to the following terms:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>You will not attempt to decrypt the data using unauthorized methods.</li>
                <li>You will maintain the confidentiality of the data and not share it with unauthorized parties.</li>
                <li>You will use the data only for the intended analytical purposes.</li>
                <li>You acknowledge that misuse of this data may result in legal consequences.</li>
                <li>You understand that the encryption is designed to protect sensitive information.</li>
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
        </div>
      )}

      {/* Tour Tooltip */}
      {showTour && <TourTooltip />}
    </div>
  )
}

export default AnalyzePage


