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
                setRequests(data);
                setSortedRequests(data); // Initialize sorted list
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

    // Combined filter by status and researcher name
    useEffect(() => {
        let filtered = requests;

        if (sortStatus !== "all") {
            filtered = filtered.filter(req => req.request_status.toLowerCase() === sortStatus.toLowerCase());
        }

        if (searchQuery.trim() !== "") {
            filtered = filtered.filter(req =>
                req.researcher_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setSortedRequests(filtered);
    }, [sortStatus, searchQuery, requests]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'text-blue-600';
            case 'approved':
                return 'text-green-600';
            case 'rejected':
                return 'text-red-600';
            case 'revoked':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    if (loading) return <div className="text-center mt-10">Loading requests...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="text-2xl font-bold">All Requests</h1>

                    {/* Search Bar */}
                    <input
                        type="text"
                        placeholder="Search by Researcher Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border border-gray-300 rounded p-2 w-full md:w-64"
                    />

                    {/* Sort Dropdown */}
                    <div>
                        <label htmlFor="statusSort" className="mr-2 font-medium">Sort by Status:</label>
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
                            {sortedRequests.length > 0 ? (
                                sortedRequests.map((request) => (
                                    <tr key={request.id} className="border border-gray-300">
                                        <td
                                            className="border border-gray-300 px-4 py-2 text-blue-600 cursor-pointer hover:underline"
                                            onClick={() => router.push(`/requests/approval/${request.id}`)}
                                        >
                                            {request.researcher_name}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">{request.dataset_title}</td>
                                        <td
                                            className={`border border-gray-300 px-4 py-2 text-sm font-semibold ${getStatusColor(request.request_status)}`}
                                        >
                                            {request.request_status.toUpperCase()}
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
    );
}
