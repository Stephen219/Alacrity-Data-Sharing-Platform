"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

export interface DatasetRequest {
  id: string;
  dataset_id: string;
  title: string;
  status: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  hasPaid: boolean;
  price: number;
}

interface DatasetRequestTableProps {
  requests: DatasetRequest[];
  onRowClick?: (req: DatasetRequest) => void;
  onPayClick?: (req: DatasetRequest) => void;
  paginated?: boolean;
  rowsPerPage?: number;
  scrollable?: boolean;
  searchable?: boolean;
  getRowClass?: (req: DatasetRequest) => string;
}

const DatasetRequestTable: React.FC<DatasetRequestTableProps> = ({
  requests,
  onRowClick,
  onPayClick,
  paginated = true,
  rowsPerPage = 10,
  scrollable = false,
  searchable = false,
  getRowClass,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortRecent, ] = useState(false);
  const [needToPay, setNeedToPay] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Badge styling based on status
  const getBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "denied":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // useMemo to efficiently compute the filtered and sorted list.
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Applies status filter if not "all"
    if (statusFilter !== "all") {
      result = result.filter(
        (req) => req.status.toLowerCase() === statusFilter
      );
    }

    //Applies search filter by title
    if (searchQuery.trim() !== "") {
      result = result.filter((req) =>
        req.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (needToPay) {
      result = result.filter(
        (req) =>
          req.status.toLowerCase() === "approved" &&
          req.price > 0 &&
          !req.hasPaid
      );
    }

    if (sortRecent) {
      result.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }

    return result;
  }, [requests, statusFilter, searchQuery, needToPay, sortRecent]);

   // Pagination determines the current slice of the filtered results.
  let displayRequests = filteredRequests;
  let totalPages = 1;
  if (paginated) {
    totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
    displayRequests = filteredRequests.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }

  // Defines which rows are clickable (approved + free, approved + paid)
  const isClickable = (req: DatasetRequest) =>
    req.status.toLowerCase() === "approved" && (req.price === 0 || req.hasPaid);

  const TableContent = () => (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100">
            Title
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100">
            Status
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100">
            Submitted at
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100">
            Action
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {displayRequests.length > 0 ? (
          displayRequests.map((req) => {
            const clickable = isClickable(req);
            const rowClass = getRowClass
              ? getRowClass(req)
              : clickable
              ? "cursor-pointer"
              : "bg-gray-200 dark:bg-gray-700 cursor-not-allowed";
            return (
              <tr
                key={req.id}
                className={rowClass}
                onClick={() => {
                  if (clickable && onRowClick) {
                    onRowClick(req);
                  }
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {req.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeClass(
                      req.status
                    )}`}
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right dark:text-gray-100">
                  {new Date(req.submitted_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {req.price > 0 && req.status.toLowerCase() === "approved" ? (
                    req.hasPaid ? (
                      <span className="text-green-600 dark:text-green-400">Paid</span>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onPayClick) {
                            onPayClick(req);
                          }
                        }}
                        className="text-white bg-[#FF6B1A] dark:bg-[#FF6B1A] hover:bg-[#e65c0f] dark:hover:bg-[#e65c0f]"
                      >
                        Pay
                      </Button>
                    )
                  ) : null}
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td
              colSpan={4}
              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center dark:text-gray-100"
            >
              No dataset requests found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div>
      {/* Toggle controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setStatusFilter("all");
            setCurrentPage(1);
          }}
          className={`px-3 py-1 rounded-md border dark:border-gray-700 ${
            statusFilter === "all"
              ? "bg-[#FF6B1A] text-white"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          All
        </button>
        <button
          onClick={() => {
            setStatusFilter("approved");
            setCurrentPage(1);
          }}
          className={`px-3 py-1 rounded-md border dark:border-gray-700${
            statusFilter === "approved"
              ? "bg-[#FF6B1A] text-white"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => {
            setStatusFilter("pending");
            setCurrentPage(1);
          }}
          className={`px-3 py-1 rounded-md border dark:border-gray-700 ${
            statusFilter === "pending"
              ? "bg-[#FF6B1A] text-white"
              : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => {
            setStatusFilter("denied");
            setCurrentPage(1);
          }}
          className={`px-3 py-1 rounded-md border dark:border-gray-700${
            statusFilter === "denied"
              ? "bg-[#FF6B1A] text-white"
              : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => {
            setNeedToPay(!needToPay);
            setCurrentPage(1);
          }}
          className={`px-3 py-1 rounded-md border dark:border-gray-700 ${
            needToPay 
            ? "bg-[#FF6B1A] text-white" 
            : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          Need to Pay
        </button>
      </div>

      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search dataset requests..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="border p-2 rounded-lg w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A] focus:border-transparent dark:border-gray-700"
          />
        </div>
      )}

      {scrollable ? (
        <div className="overflow-x-auto scrollbar-custom" style={{ maxHeight: "400px" }}>
          <TableContent />
        </div>
      ) : (
        <TableContent />
      )}

      {paginated && totalPages > 1 && (
        <div className="flex justify-end mt-4 space-x-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-l disabled:opacity-50"
          >
            Previous
          </Button>
          <span className="px-4 py-2 border-t border-b dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            {currentPage} / {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default DatasetRequestTable;
