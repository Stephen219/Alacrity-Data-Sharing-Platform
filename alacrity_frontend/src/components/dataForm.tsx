



"use client"
import { useState } from "react"

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

  /**
   * this function validates the form fields and sets the errors state
   * and show the error message if the form fields are not valid
   *
   * @returns {boolean}
   */

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!title.trim()) newErrors.title = "Title is required"
    if (!description.trim() || description.length < 100
    ) newErrors.description = "Description is required and must be at least 100 characters"
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
   *
   * @param file this function generates a unique URL for the file
   * @returns  {string} fileUrl
   */
  const generateFileUrl = (file: File) => {
    const fileId = "gyfhksp"
    const fileUrl = `https://ex/files/${fileId}-${file.name}` // TODO: Tthis should be a read/write URL
    return fileUrl
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

    setLoading(true)

    const formData = new FormData()
    formData.append("title", title)
    formData.append("description", description)
    formData.append("category", category)
    formData.append("tags", tags.join(","))
    formData.append("fileUrl", generateFileUrl(file!))
    if (file) formData.append("file", file)
      

    try {
      const response = await fetch(`${BACKEND_URL}datasets/create_dataset/`, {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        

        if (data.error) {
          setServerError(data.error) 
        }
        else {
          setServerError("An error occurred while uploading. Please try again.")
        }

        return
      
      }
      setServerError("");

      if (data.message)
      {
        setServerMessage(data.message)

      }
      
      else {
        setServerError("")
        setServerMessage("Dataset uploaded successfully!"); // this is the message that should be displayed when the dataset is uploaded successfully
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
    }
  }


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900">Add a new dataset</h2>
        </div>
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
        {serverError && <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
            <svg className="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
            <span className="sr-only">Error</span>
            <div>
            <p className="text-red-500 text-sm">{serverError}</p>
            </div>
          </div>}

          {serverMessage && <div className="bg-green-200 px-6 py-4 mx-2 my-4 rounded-md text-lg flex items-center mx-auto max-w-lg">
        <svg viewBox="0 0 24 24" className="text-green-600 w-5 h-5 sm:w-5 sm:h-5 mr-3">
            <path fill="currentColor"
                d="M12,0A12,12,0,1,0,24,12,12.014,12.014,0,0,0,12,0Zm6.927,8.2-6.845,9.289a1.011,1.011,0,0,1-1.43.188L5.764,13.769a1,1,0,1,1,1.25-1.562l4.076,3.261,6.227-8.451A1,1,0,1,1,18.927,8.2Z">
            </path>
        </svg>
        <span className="text-green-800">{serverMessage}</span>
    </div>}


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

            <div>{errors.title && <p className="text-red-500 text-xs" role="alert" data-testid="title-error" id="title-error">{errors.title}</p>}</div>
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
            className="w-full px-4 py-2 text-white bg-[#FF6B00] rounded-md hover:bg-[#FF6B00]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B00]"
          >
            {loading ? "Uploading..." : "Upload Data"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default DatasetForm


