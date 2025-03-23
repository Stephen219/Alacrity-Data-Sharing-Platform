"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import parse from "html-react-parser";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  } from "@/components/ui/select";
  

export interface PendingSubmission {
  id: number;
  title: string;
  description: string;
  researcher_email: string;
  submitted_at: string;
  status: string;
}

export interface PendingSubmissionsTableProps {
  submissions: PendingSubmission[];
  enablePagination?: boolean;
  pageSize?: number;
  enableVerticalScroll?: boolean;
  verticalScrollHeight?: string;
  showSortDropdown?: boolean;
  showSearchBar?: boolean;
}

const PendingSubmissionsTable: React.FC<PendingSubmissionsTableProps> = ({
  submissions,
  enablePagination = false,
  pageSize = 10,
  enableVerticalScroll = false,
  verticalScrollHeight = "400px",
  showSortDropdown = false,
  showSearchBar = false,
}) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = submissions;
    if (showSearchBar && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (submission) =>
          submission.title.toLowerCase().includes(query) ||
          submission.researcher_email.toLowerCase().includes(query)
      );
    }
    return filtered.sort((a, b) => {
      const dateA = new Date(a.submitted_at).getTime();
      const dateB = new Date(b.submitted_at).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [submissions, searchQuery, sortOrder, showSearchBar]);

  const totalSubmissions = filteredAndSortedSubmissions.length;
  const totalPages = Math.ceil(totalSubmissions / pageSize);
  const displayedSubmissions = enablePagination
    ? filteredAndSortedSubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredAndSortedSubmissions;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString || Date.now());
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRowClick = (id: number) => {
    router.push(`/requests/submissions/${id}`);
  };

  return (
    <div>
      {/* Renders search bar and sort dropdown if enabled */}
      {(showSearchBar || showSortDropdown) && (
        <div className="flex items-center justify-between mb-4 pt-4">
          {showSearchBar && (
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); 
              }}
              className="border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:border-[#FF6B1A]"
            />
          )}
          {showSortDropdown && (
            <Select
            value={sortOrder}
            onValueChange={(value: "asc" | "desc") => {
                setSortOrder(value);
                setCurrentPage(1);
            }}
            >
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="asc">Oldest to Newest</SelectItem>
                <SelectItem value="desc">Newest to Oldest</SelectItem>
            </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Table container with optional vertical scrolling */}
      <div
        className={enableVerticalScroll ? "overflow-y-auto scrollbar-custom" : ""}
        style={enableVerticalScroll ? { maxHeight: verticalScrollHeight } : {}}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Researcher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedSubmissions.length > 0 ? (
              displayedSubmissions.map((submission) => (
                <tr
                  key={submission.id}
                  className="hover:bg-gray-100 cursor-pointer transition"
                  onClick={() => handleRowClick(submission.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.researcher_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {parse(submission.title.split(" ").slice(0, 5).join(" "))}
                    {submission.title.split(" ").length > 5 ? "..." : ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(submission.submitted_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#FF6B1A]">
                    {submission.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No pending submissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {enablePagination && totalPages > 1 && (
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border border-gray-300 rounded ${
                currentPage === page ? "bg-[#FF6B1A] text-white" : ""
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PendingSubmissionsTable;
