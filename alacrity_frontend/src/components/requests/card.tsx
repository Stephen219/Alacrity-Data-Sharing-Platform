


"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BACKEND_URL } from "../../config"
import { fetchWithAuth } from "@/libs/auth"
import { Loader2, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from "lucide-react"

interface RequestDetails {
  id: string
  request_id: string
  researcher_name: string
  researcher_field: string
  researcher_description: string
  message: string
  dataset_title: string
  dataset_description: string
  created_at: string
  request_status: string
}

interface ApproveRequestProps {
  requestId: string | string[] | undefined
}

export default function ApproveRequest({ requestId }: ApproveRequestProps) {
  const [request, setRequest] = useState<RequestDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        if (!requestId) {
          setError("No request ID provided")
          setLoading(false)
          return
        }

        const endpoint = `${BACKEND_URL}/requests/requestaction/${requestId}/`

        const response = await fetchWithAuth(endpoint)
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
        }

        const data: RequestDetails = await response.json()
        setRequest(data)
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("An unknown error occurred")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRequestDetails()
  }, [requestId])

  const handleAction = async (status: string) => {
    try {
      if (!requestId) {
        setError("No request ID provided")
        return
      }

      const idToUse = request?.request_id || requestId
      const endpoint = `${BACKEND_URL}/requests/requestaction/${requestId}/`

      const response = await fetchWithAuth(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: idToUse, action: status }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Action failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      if (status === "revoke") {
        router.push("/requests/all")
      } else {
        router.push("/requests/all")
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex justify-center items-center">
        <div className="flex flex-col items-center justify-center space-y-4 text-gray-700 dark:text-gray-300">
          <Loader2 className="h-12 w-12 animate-spin text-[#f97316]" />
          <p className="text-lg font-medium">Loading request details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex justify-center items-center">
        <div className="max-w-3xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="bg-red-500 p-6 text-white text-xl font-bold flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" />
            Error
          </div>
          <div className="p-6">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              onClick={() => router.push("/requests/all")}
              className="mt-4 px-4 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold rounded-md flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Requests
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex justify-center items-center">
      <div className="max-w-3xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="bg-[#f97316] p-6 text-white text-xl font-bold">Request Details</div>
        {request ? (
          <div className="p-6 space-y-6 text-gray-800 dark:text-gray-200">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Request ID</p>
                <h2 className="text-lg font-bold">{request.id}</h2>
              </div>
              <div className="flex items-center">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.request_status === "approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : request.request_status === "denied"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {request.request_status.charAt(0).toUpperCase() + request.request_status.slice(1)}
                </div>
                <p className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(request.created_at || "").toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Researcher Information</h3>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span> {request.researcher_name}
                    </p>
                    <p>
                      <span className="font-semibold">Field:</span> {request.researcher_field}
                    </p>
                    <p>
                      <span className="font-semibold">Description:</span>
                    </p>
                    <div className="mt-1 max-h-24 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-sm">
                      {request.researcher_description}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dataset Information</h3>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-semibold">Title:</span> {request.dataset_title}
                    </p>
                    <p>
                      <span className="font-semibold">Description:</span>
                    </p>
                    <div className="mt-1 max-h-24 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-sm">
                      {request.dataset_description}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Message</h3>
              <div className="mt-2 max-h-32 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                {request.message}
              </div>
            </div>

            <div className="pt-4 flex flex-wrap justify-end gap-3">
              {request.request_status === "pending" ? (
                <>
                  <button
                    onClick={() => handleAction("accept")}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md flex items-center"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md flex items-center"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </button>
                </>
              ) : request.request_status === "approved" ? (
                <button
                  onClick={() => handleAction("revoke")}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md flex items-center"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Revoke
                </button>
              ) : null}

              <button
                onClick={() => router.push("/requests/all")}
                className="px-4 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-medium rounded-md flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">No request details found</p>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => router.push("/requests/all")}
                className="px-4 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-medium rounded-md flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Requests
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

