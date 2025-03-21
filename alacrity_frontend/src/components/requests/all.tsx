"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "../../config";
import { fetchWithAuth } from "@/libs/auth";

interface RequestData {
    id: number;
    dataset_title: string;
    researcher_name: string;
    researcher_role: string;
    researcher_description: string;
    message: string;
    request_status: string;
    created_at: string;
    }

export default function AllRequests() {
    const [requests, setRequests] = useState<RequestData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchRequests = async () =>{
            try{
                const response = await fetchWithAuth(`${BACKEND_URL}/requests/viewrequests/`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.statusText}`);
                }
                const data: RequestData[] = await response.json();
                setRequests(data);
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
        fetchRequests();
    }, []);
    if (loading) return <div className="text-center mt-10">Loading requests...</div>;
  if (error) return <div className="text-center text-red-500 mt-10">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-left mb-4">All Requests</h1>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2 text-left">Researcher Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Dataset Title</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Request Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Date Requested</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id} className="border border-gray-300">
                    <td
                      className="border border-gray-300 px-4 py-2 text-blue-600 cursor-pointer hover:underline"
                    >
                      {request.researcher_name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{request.dataset_title}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-semibold text-blue-600">
                      {request.request_status}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-4">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );}