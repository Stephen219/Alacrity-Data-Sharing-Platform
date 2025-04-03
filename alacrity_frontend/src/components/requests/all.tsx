// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { BACKEND_URL } from "../../config";
// import { fetchWithAuth } from "@/libs/auth";

// interface RequestData {
//   id: number;
//   dataset_title: string;
//   researcher_name: string;
//   researcher_role: string;
//   researcher_description: string;
//   message: string;
//   request_status: string;
//   created_at: string;
//   profile_picture?: string | null; // Optional field for future use
// }

// export default function AllRequests() {
//   const [requests, setRequests] = useState<RequestData[]>([]);
//   const [sortedRequests, setSortedRequests] = useState<RequestData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [sortStatus, setSortStatus] = useState<string>("all");
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const router = useRouter();

//   useEffect(() => {
//     const fetchRequests = async () => {
//       try {
//         const response = await fetchWithAuth(`${BACKEND_URL}/requests/viewrequests/`);
//         if (!response.ok) {
//           throw new Error(`Failed to fetch: ${response.statusText}`);
//         }
//         const data: RequestData[] = await response.json();
//         const sortedData = data.sort(
//           (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//         );
//         setRequests(sortedData);
//         setSortedRequests(sortedData);
//       } catch (err: unknown) {
//         if (err instanceof Error) {
//           setError(err.message);
//         } else {
//           setError("An unknown error occurred");
//         }
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchRequests();
//   }, []);

//   useEffect(() => {
//     let filtered = [...requests];

//     if (sortStatus !== "all") {
//       filtered = filtered.filter(
//         (req) => req.request_status.toLowerCase() === sortStatus.toLowerCase()
//       );
//     }

//     if (searchQuery.trim() !== "") {
//       filtered = filtered.filter((req) =>
//         req.researcher_name.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     filtered.sort(
//       (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//     );

//     setSortedRequests(filtered);
//   }, [sortStatus, searchQuery, requests]);

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "pending": return "text-blue-600";
//       case "approved": return "text-green-600";
//       case "rejected": return "text-red-600";
//       case "revoked": return "text-purple-600";
//       default: return "text-gray-600";
//     }
//   };

//   const handleRowClick = (id: number) => {
//     router.push(`/requests/approval/${id}`);
//   };

//   const getInitials = (name: string) => {
//     const nameParts = name.trim().split(" ");
//     const firstInitial = nameParts[0]?.[0] || "";
//     const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "";
//     return `${firstInitial}${lastInitial}`.toUpperCase();
//   };

//   if (loading)
//     return <div className="text-center mt-10">Loading requests...</div>;
//   if (error)
//     return <div className="text-center text-red-500 mt-10">Error: {error}</div>;

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <div className="max-w-5xl mx-auto bg-white rounded-lg">
//         <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
//           <h1 className="text-2xl font-bold">All Requests</h1>
//           <input
//             type="text"
//             placeholder="Search by Researcher Name..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="border border-gray-300 rounded p-2 w-full md:w-64"
//           />
//           <div>
//             <label htmlFor="statusSort" className="mr-2 font-medium">
//               Sort by Status:
//             </label>
//             <select
//               id="statusSort"
//               value={sortStatus}
//               onChange={(e) => setSortStatus(e.target.value)}
//               className="border border-gray-300 rounded p-2"
//             >
//               <option value="all">All</option>
//               <option value="pending">Pending</option>
//               <option value="approved">Approved</option>
//               <option value="rejected">Rejected</option>
//               <option value="revoked">Revoked</option>
//             </select>
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Researcher Name
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Dataset Title
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Request Status
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Date Requested
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {sortedRequests.length > 0 ? (
//                 sortedRequests.map((request) => (
//                   <tr
//                     key={request.id}
//                     className="hover:bg-gray-100 cursor-pointer transition"
//                     onClick={() => handleRowClick(request.id)}
//                   >
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center space-x-4">
//                         <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
//                           {request.profile_picture ? (
//                             <img
//                               src={request.profile_picture}
//                               alt={request.researcher_name}
//                               className="w-full h-full object-cover"
//                             />
//                           ) : (
//                             <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-semibold">
//                               {getInitials(request.researcher_name)}
//                             </div>
//                           )}
//                         </div>
//                         <h2 className="text-lg font-semibold text-gray-800 truncate">
//                           {request.researcher_name}
//                         </h2>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                       {request.dataset_title}
//                     </td>
//                     <td className={`px-6 py-4 whitespace-nowrap text-sm ${getStatusColor(request.request_status)}`}>
//                       {request.request_status.toUpperCase()}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       {new Date(request.created_at).toLocaleDateString()}
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
//                     No requests found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BACKEND_URL } from "../../config"
import { fetchWithAuth } from "@/libs/auth"

interface RequestData {
  id: number
  dataset_title: string
  researcher_name: string
  researcher_role: string
  researcher_description: string
  message: string
  request_status: string
  created_at: string
  profile_picture?: string | null
}

export default function AllRequests() {
  const [requests, setRequests] = useState<RequestData[]>([])
  const [sortedRequests, setSortedRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortStatus, setSortStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const router = useRouter()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/requests/viewrequests/`)
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }
        const data: RequestData[] = await response.json()
        const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setRequests(sortedData)
        setSortedRequests(sortedData)
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
    fetchRequests()
  }, [])

  useEffect(() => {
    let filtered = [...requests]

    if (sortStatus !== "all") {
      filtered = filtered.filter((req) => req.request_status.toLowerCase() === sortStatus.toLowerCase())
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((req) => req.researcher_name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setSortedRequests(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [sortStatus, searchQuery, requests])

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
      case "revoked":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }
  }

  const handleRowClick = (id: number) => {
    router.push(`/requests/approval/${id}`)
  }

  const getInitials = (name: string) => {
    const nameParts = name.trim().split(" ")
    const firstInitial = nameParts[0]?.[0] || ""
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : ""
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedRequests.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Generate page numbers for pagination
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  // Determine which page numbers to show
  const getVisiblePageNumbers = () => {
    if (totalPages <= 5) {
      return pageNumbers
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5]
    }

    if (currentPage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
  }

  const visiblePageNumbers = getVisiblePageNumbers()

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto mt-8 p-6 border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold dark:text-white">All Requests</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="h-10 w-[250px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            <div className="h-10 w-[200px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto mt-8 p-6 border border-red-200 dark:border-red-800 rounded-lg shadow-sm bg-white dark:bg-gray-800">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-red-500 dark:text-red-400">Error Loading Requests</h2>
        </div>
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-5xl mx-auto border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold dark:text-white">All Requests</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full md:w-auto">
              <input
                type="text"
                placeholder="Search by researcher name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-[250px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-sm font-medium whitespace-nowrap dark:text-gray-300">Filter by status:</span>
              <select
                value={sortStatus}
                onChange={(e) => setSortStatus(e.target.value)}
                className="w-full md:w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>

          <div className="border rounded-md overflow-x-auto dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Researcher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Dataset Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Date Requested
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {currentItems.length > 0 ? (
                  currentItems.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(request.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                            {request.profile_picture ? (
                              <img
                                src={request.profile_picture || "/placeholder.svg"}
                                alt={request.researcher_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-semibold">
                                {getInitials(request.researcher_name)}
                              </div>
                            )}
                          </div>
                          <span className="font-medium dark:text-white">{request.researcher_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {request.dataset_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(request.request_status)}`}
                        >
                          {request.request_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                      No requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border bg-white text-sm font-medium dark:bg-gray-800 dark:border-gray-600 ${
                    currentPage === 1
                      ? "text-gray-300 dark:text-gray-600 cursor-not-allowed border-gray-300"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-gray-300"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {!visiblePageNumbers.includes(1) && (
                  <>
                    <button
                      onClick={() => paginate(1)}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      1
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
                      ...
                    </span>
                  </>
                )}

                {visiblePageNumbers.map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === number
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {number}
                  </button>
                ))}

                {!visiblePageNumbers.includes(totalPages) && totalPages > 1 && (
                  <>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
                      ...
                    </span>
                    <button
                      onClick={() => paginate(totalPages)}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border bg-white text-sm font-medium dark:bg-gray-800 dark:border-gray-600 ${
                    currentPage === totalPages
                      ? "text-gray-300 dark:text-gray-600 cursor-not-allowed border-gray-300"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-gray-300"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


