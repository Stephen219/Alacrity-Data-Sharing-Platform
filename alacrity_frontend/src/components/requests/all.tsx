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
  profile_picture?: string | null; // Optional field for future use
}

export default function AllRequests() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [sortedRequests, setSortedRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortStatus, setSortStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/requests/viewrequests/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const data: RequestData[] = await response.json();
        const sortedData = data.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRequests(sortedData);
        setSortedRequests(sortedData);
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

  useEffect(() => {
    let filtered = [...requests];

    if (sortStatus !== "all") {
      filtered = filtered.filter(
        (req) => req.request_status.toLowerCase() === sortStatus.toLowerCase()
      );
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((req) =>
        req.researcher_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setSortedRequests(filtered);
  }, [sortStatus, searchQuery, requests]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "text-blue-600";
      case "approved": return "text-green-600";
      case "rejected": return "text-red-600";
      case "revoked": return "text-purple-600";
      default: return "text-gray-600";
    }
  };

  const handleRowClick = (id: number) => {
    router.push(`/requests/approval/${id}`);
  };

  const getInitials = (name: string) => {
    const nameParts = name.trim().split(" ");
    const firstInitial = nameParts[0]?.[0] || "";
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  if (loading)
    return <div className="text-center mt-10">Loading requests...</div>;
  if (error)
    return <div className="text-center text-red-500 mt-10">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto bg-white rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h1 className="text-2xl font-bold">All Requests</h1>
          <input
            type="text"
            placeholder="Search by Researcher Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded p-2 w-full md:w-64"
          />
          <div>
            <label htmlFor="statusSort" className="mr-2 font-medium">
              Sort by Status:
            </label>
            <select
              id="statusSort"
              value={sortStatus}
              onChange={(e) => setSortStatus(e.target.value)}
              className="border border-gray-300 rounded p-2"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Researcher Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dataset Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Requested
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRequests.length > 0 ? (
                sortedRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-100 cursor-pointer transition"
                    onClick={() => handleRowClick(request.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          {request.profile_picture ? (
                            <img
                              src={request.profile_picture}
                              alt={request.researcher_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-semibold">
                              {getInitials(request.researcher_name)}
                            </div>
                          )}
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 truncate">
                          {request.researcher_name}
                        </h2>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.dataset_title}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getStatusColor(request.request_status)}`}>
                      {request.request_status.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}