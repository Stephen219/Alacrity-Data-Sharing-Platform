"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "../../config";
import { fetchWithAuth } from "@/libs/auth";

interface RequestDetails {
  id: string;
  request_id: string;
  researcher_name: string;
  researcher_field: string;
  researcher_description: string;
  message: string;
  dataset_title: string;
  dataset_description: string;
  created_at: string;
}

interface ApproveRequestProps {
  requestId: string | string[] | undefined;
}

export default function ApproveRequest({ requestId }: ApproveRequestProps) {
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        if (!requestId) {
          setError("No request ID provided");
          setLoading(false);
          return;
        }

        const endpoint = `${BACKEND_URL}/requests/acceptreject/${requestId}/`;

        const response = await fetchWithAuth(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const data: RequestDetails = await response.json();
        setRequest(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  const handleAction = async (status: string) => {
    try {
      if (!requestId) {
        setError("No request ID provided");
        return;
      }

      const idToUse = request?.request_id || requestId;
      const endpoint = `${BACKEND_URL}/requests/acceptreject/${requestId}/`;

      const response = await fetchWithAuth(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: idToUse, action: status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Action failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      router.push("/requests/pending");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  if (loading) return <div className="text-center mt-10">Loading request details...</div>;
  if (error) return <div className="text-center text-red-500 mt-10">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white text-2xl font-bold">
          Request Details
        </div>
        {request ? (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Request ID:</p>
                <h2 className="text-lg font-bold">{request.request_id}</h2>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Date Requested:</strong>{" "}
                {new Date(request.created_at || "").toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-2">
              <p>
                <strong>Researcher Name:</strong> {request.researcher_name}
              </p>
              <p>
                <strong>Research Field:</strong> {request.researcher_field}
              </p>
              <p>
                <strong>Description:</strong> {request.researcher_description}
              </p>
              <p>
                <strong>Message:</strong> {request.message}
              </p>
              <p>
                <strong>Dataset Title:</strong> {request.dataset_title}
              </p>
              <p>
                <strong>Dataset description:</strong> {request.dataset_description}
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => handleAction("accept")}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction("reject")}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md"
              >
                Reject
              </button>
              <button
                onClick={() => router.push("/requests/pending")}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-center text-gray-500">No request details found</p>
          </div>
        )}
      </div>
    </div>
  );
}
