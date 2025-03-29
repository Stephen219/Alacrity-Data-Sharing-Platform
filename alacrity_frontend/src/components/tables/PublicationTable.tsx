"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"

export interface Publication {
  id: string
  title: string
  status: string
  submitted_at: string
}

interface PublicationTableProps {
  publications: Publication[]
  onRowClick?: (pub: Publication) => void
  paginated?: boolean      // Enable pagination (default true)
  rowsPerPage?: number     // Number of rows per page if paginated
  scrollable?: boolean     // Wrap table in fixed-height container with scrollbar if true
  searchable?: boolean     // Show a search box if true
  getRowClass?: (pub: Publication) => string  // gets row class
}

const PublicationTable: React.FC<PublicationTableProps> = ({
  publications,
  onRowClick,
  paginated = true,
  rowsPerPage = 10,
  scrollable = false,
  searchable = false,
  getRowClass,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Badge classes for status
  const getBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter publications based on search query
  const filteredPublications = useMemo(() => {
    if (!searchQuery) return publications
    return publications.filter(pub =>
      pub.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, publications])

  let displayPublications = filteredPublications
  let totalPages = 1
  if (paginated) {
    totalPages = Math.ceil(filteredPublications.length / rowsPerPage)
    displayPublications = filteredPublications.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    )
  }

  const TableContent = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Title
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Submitted at
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {displayPublications.length > 0 ? (
          displayPublications.map((pub) => {
            const rowClass = getRowClass
              ? getRowClass(pub)
              : "hover:bg-gray-50 cursor-pointer"
            return (
              <tr
                key={pub.id}
                className={rowClass}
                onClick={() => onRowClick && onRowClick(pub)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pub.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeClass(
                      pub.status
                    )}`}
                  >
                    {pub.status.charAt(0).toUpperCase() + pub.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {new Date(pub.submitted_at).toLocaleDateString()}
                </td>
              </tr>
            )
          })
        ) : (
          <tr>
            <td
              colSpan={3}
              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
            >
              No publications found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )

  return (
    <div>
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search publications..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="border p-2 rounded-lg w-full"
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
          <span className="px-4 py-2 border-t border-b">
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
  )
}

export default PublicationTable
