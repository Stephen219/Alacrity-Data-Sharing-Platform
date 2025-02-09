


"use client"
import { useState, useEffect } from "react"

import LoadingSpinner from "@/components/ui/Loader"
import UploadIcon from "./ui/Upload"

import { BACKEND_URL } from "@/config"

/**
 * This component is a form for adding a new dataset. It has fields for title, description, category, tags, and file upload.
 * It also has a checkbox for agreeing to the license terms.
 * @returns {JSX.Element}
 *
 * */

const DatasetForm = () => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  const [serverMessage, setServerMessage] = useState("")
  const [visible, setVisible] = useState({ error: false, message: false })
  const [progress, setProgress] = useState({ error: 100, message: 100 })
  const [showOverlay, setShowOverlay] = useState(false)

  useEffect(() => {
    if (serverError || serverMessage) {
      setVisible({ error: !!serverError, message: !!serverMessage })
      setProgress({ error: 100, message: 100 })
      const timer = setInterval(() => {
        setProgress((prev) => ({
          error: serverError ? Math.max(prev.error - 100 / 150, 0) : 0,
          message: serverMessage ? Math.max(prev.message - 100 / 150, 0) : 0,
        }))
      }, 100)
      const hideTimer = setTimeout(() => {
        setVisible({ error: false, message: false })
      }, 15000)
      return () => {
        clearInterval(timer)
        clearTimeout(hideTimer)
      }
    }
  }, [serverError, serverMessage])

  /**
   * this function validates the form fields and sets the errors state
   * and show the error message if the form fields are not valid
   *
   * @returns {boolean}
   */

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!title.trim()) newErrors.title = "Title is required"
    if (!description.trim() || description.length < 100)
      newErrors.description = "Description is required and must be at least 100 characters"
    if (!category) newErrors.category = "Please select a category"
    if (tags.length === 0) newErrors.tags = "At least one tag is required"
    if (!file) newErrors.file = "Please select a file to upload"
    if (file && !["csv", "xlsx", "pdf"].includes(file.name.split(".").pop() ?? ""))
      newErrors.file = "Invalid file type. Only CSV and exel files are allowed"

    if (!agreedToTerms) newErrors.agreedToTerms = "You must agree to the license terms"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  /**
   * this function handles the form submission and sends the data to the backend
   * with the right url it does send to the backend    but its not sending the file
   * @returns {Promise<void>}
   *
   */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setServerError("")
    setServerMessage("")


    setLoading(true)
    setShowOverlay(true)


    const formData = new FormData()
    formData.append("title", title)
    formData.append("description", description)
    formData.append("category", category)
    formData.append("tags", tags.join(","))
    formData.append("fileUrl","")
    if (file) formData.append("file", file)

    try {
      const response = await fetch(`${BACKEND_URL}datasets/create_dataset/`, {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      // setServerError("")
      // setServerMessage("")

      if (!response.ok) {
        if (data.error) {
          setServerError(data.error)
        } else {
          setServerError("An error occurred while uploading. Please try again.")
        }

        return
      }
      setServerError("")

      if (data.message) {
        setServerMessage(data.message)
      } else {
        setServerError("")
        setServerMessage("Dataset uploaded successfully!")
      }
      setTitle("")
      setDescription("")
      setCategory("")
      setTags([])
      setFile(null)
      setAgreedToTerms(false)
      setErrors({})
    } catch (error) {
      // Catch and set server error message
      setServerError(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setLoading(false)
      setShowOverlay(false)
    }
  }

  // const handleCancel = useCallback(() => {
  //   setLoading(false)
  //   setShowOverlay(false)

  //   // stop the upload process
    
  // }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg xl:px-10 xl:py-8 xl:rounded-2xl xl:max-w-6xl xl:min-h-[90vh] md:mb-9">
     
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900">Add a new dataset</h2>
        </div>
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {serverError && visible.error && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md relative overflow-hidden"
              role="alert"
            >
              <div className="flex justify-between items-center">
                <p>{serverError}</p>
                <button
                  onClick={() => setVisible((prev) => ({ ...prev, error: false }))}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg width="39" height="39" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                  <path d="M6.21967 7.28033C5.92678 6.98744 5.92678 6.51256 6.21967 6.21967C6.51256 5.92678 6.98744 5.92678 7.28033 6.21967L11.999 10.9384L16.7176 6.2198C17.0105 5.92691 17.4854 5.92691 17.7782 6.2198C18.0711 6.51269 18.0711 6.98757 17.7782 7.28046L13.0597 11.999L17.7782 16.7176C18.0711 17.0105 18.0711 17.4854 17.7782 17.7782C17.4854 18.0711 17.0105 18.0711 16.7176 17.7782L11.999 13.0597L7.28033 17.7784C6.98744 18.0713 6.51256 18.0713 6.21967 17.7784C5.92678 17.4855 5.92678 17.0106 6.21967 16.7177L10.9384 11.999L6.21967 7.28033Z" fill="#343C54"/>
                  </svg>
                </button>
              </div>
              <div
                className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-100 ease-linear"
                style={{ width: `${progress.error}%` }}
              />
            </div>
          )}
          {serverMessage && visible.message && (
            <div
              className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md relative overflow-hidden"
              role="alert"
            >
              <div className="flex justify-between items-center">
                <p>{serverMessage}</p>
                <button
                  onClick={() => setVisible((prev) => ({ ...prev, message: false }))}
                  className="text-green-500 hover:text-green-700"


                >

                  <svg width="39" height="39" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                  <path d="M6.21967 7.28033C5.92678 6.98744 5.92678 6.51256 6.21967 6.21967C6.51256 5.92678 6.98744 5.92678 7.28033 6.21967L11.999 10.9384L16.7176 6.2198C17.0105 5.92691 17.4854 5.92691 17.7782 6.2198C18.0711 6.51269 18.0711 6.98757 17.7782 7.28046L13.0597 11.999L17.7782 16.7176C18.0711 17.0105 18.0711 17.4854 17.7782 17.7782C17.4854 18.0711 17.0105 18.0711 16.7176 17.7782L11.999 13.0597L7.28033 17.7784C6.98744 18.0713 6.51256 18.0713 6.21967 17.7784C5.92678 17.4855 5.92678 17.0106 6.21967 16.7177L10.9384 11.999L6.21967 7.28033Z" fill="#343C54"/>
                  </svg>
                  
                </button>
              </div>
              <div
                className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-100 ease-linear"
                style={{ width: `${progress.message}%` }}
              />
            </div>
          )}
        </div>
        <form className="p-7 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2 relative">
            <label htmlFor="title" className="flex items-center text-sm font-medium text-gray-700">
              Title <span className="text-red-500 ml-1">*</span>
              <div className="group relative ml-1">
                <svg
                  className="w-4 h-4 text-gray-400 cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="absolute left-0 bottom-full mb-1 hidden w-40 bg-black text-white text-xs rounded-md p-2 group-hover:block">
                  The title should be short and descriptive.
                </div>
              </div>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
              placeholder="Enter dataset title"
            />

            <div>
              {errors.title && (
                <p className="text-red-500 text-xs" role="alert" data-testid="title-error" id="title-error">
                  {errors.title}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 relative">
            <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-700">
              Description <span className="text-red-500 ml-1">*</span>
              <div className="group relative ml-1">
                <svg
                  className="w-4 h-4 text-gray-400 cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="absolute left-0 bottom-full mb-1 hidden w-52 bg-black text-white text-xs rounded-md p-2 group-hover:block">
                  Provide a detailed description of the dataset.
                </div>
              </div>
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
              placeholder="Enter dataset description"
            ></textarea>
            {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
          </div>

          <div className="space-y-2 relative">
            <label htmlFor="tags" className="flex items-center text-sm font-medium text-gray-700">
              Tags <span className="text-red-500 ml-1">*</span>
              <div className="group relative ml-1">
                <svg
                  className="w-4 h-4 text-gray-400 cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="absolute left-0 bottom-full mb-1 hidden w-44 bg-black text-white text-xs rounded-md p-2 group-hover:block">
                  Enter tags separated by commas (e.g., AI, Research, Data).
                </div>
              </div>
            </label>
            <input
              type="text"
              id="tags"
              value={tags.join(",")}
              onChange={(e) => setTags(e.target.value.split(","))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#FF6B00] focus:border-[#FF6B00]"
              placeholder="Comma-separated tags"
            />
            {errors.tags && <p className="text-red-500 text-xs">{errors.tags}</p>}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 relative">
              <label htmlFor="category" className="flex items-center text-sm font-medium text-gray-700">
                Category <span className="text-red-500 ml-1">*</span>
                <div className="group relative ml-1">
                  <svg
                    className="w-4 h-4 text-gray-400 cursor-pointer"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="absolute left-0 bottom-full mb-1 hidden w-44 bg-black text-white text-xs rounded-md p-2 group-hover:block">
                    Select the most relevant category for your dataset.
                  </div>
                </div>
              </label>
              <div className="relative">
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                >
                  <option value="">Select category</option>
                  <option value="category1">Category 1</option>
                  <option value="category2">Category 2</option>
                  <option value="category3">Category 3</option>
                </select>
                <svg
                  className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              {errors.category && <p className="text-red-500 text-xs">{errors.category}</p>}
            </div>

            <div className="space-y-2 relative">
              <label htmlFor="file" className="flex items-center text-sm font-medium text-gray-700">
                Select file <span className="text-red-500 ml-1">*</span>
                <div className="group relative ml-1">
                  <svg
                    className="w-4 h-4 text-gray-400 cursor-pointer"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="absolute left-0 bottom-full mb-1 hidden w-44 bg-black text-white text-xs rounded-md p-2 group-hover:block">
                    Upload the dataset file in CSV or JSON format.
                  </div>
                </div>
              </label>
              <input
                type="file"
                id="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
              />
              {errors.file && <p className="text-red-500 text-xs">{errors.file}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2 relative">
            <input
              type="checkbox"
              id="license"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="h-4 w-4 text-[#FF6B00] border-gray-300 rounded focus:ring-[#FF6B00]"
            />
            <label htmlFor="license" className="text-sm text-gray-700">
              I agree to the{" "}
              <a href="#" className="text-[#FF6B00] underline">
                license terms
              </a>
              .
            </label>
            <div className="group relative ml-1">
              <svg
                className="w-4 h-4 text-gray-400 cursor-pointer"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="absolute left-0 bottom-full mb-1 hidden w-48 bg-black text-white text-xs rounded-md p-2 group-hover:block">
                You must accept the terms before submitting.
              </div>
            </div>
          </div>
          {errors.agreedToTerms && <p className="text-red-500 text-xs">{errors.agreedToTerms}</p>}

          <button
            type="submit"
            disabled={loading}
            id="submit-button"
            data-testid="submitting-button"
            className="w-full px-4 py-2 text-white bg-[#FF6B00] rounded-md hover:bg-[#FF6B00]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B00] disabled:opacity-50 md:mb-6 md:mt-4 md:pb-4 md:pt-4"
          >
            {loading ? "Uploading..." : "Upload Data"}
          </button>
        </form>
      </div>
      {showOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 xl:p-4">
          <div className="bg-gray-200 p-6 rounded-lg shadow-2xl flex flex-col items-center space-y-4 ">
            <h1 className="text-2xl font-semibold xl:mt-5 xl:text-5xl xl:mb-3">Alacrity</h1>
            <UploadIcon  />
            <LoadingSpinner />
            <p className="mt-2 text-lg font-semibold xl:pl-8 xl:pr-8 xl:m-6 xl:text-2xl">Uploading your Data...</p>

            <p className="mt-2 text-sm font-light xl:mb-5 xl:text-xl">This shoudn&apos;t take that long</p>
            {/* <button
              onClick={handleCancel}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button> */}
          </div>
        </div>
      )}
    </div>
  )
}

export default DatasetForm

