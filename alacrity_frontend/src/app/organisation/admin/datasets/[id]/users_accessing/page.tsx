

/**
 * @fileoverview This file defines the `DatasetUsersPage` component, which is responsible for displaying 
 * a list of users who have access to a specific dataset. It provides functionality for filtering, 
 * sorting, and revoking user access. The page is designed for organization administrators and contributors 
 * with appropriate access permissions.
 * 
 * @module DatasetUsersPage
 * 
 * @description
 * - Fetches and displays a list of users with access to a dataset.
 * - Allows filtering by name, date range, and sorting options (e.g., newest, oldest, alphabetical).
 * - Provides a search bar for quick user lookup.
 * - Enables administrators to revoke access for specific users with confirmation dialogs.
 * - Displays success and error messages for user actions.
 * - Adapts to light and dark mode themes.
 * 
 * @access Control: Restricted to users with roles `organization_admin` or `contributor`.
 * 
 * @dependencies
 * - React for component rendering and state management.
 * - Next.js router for navigation.
 * - Custom UI components (e.g., Button, Input) for consistent styling.
 * - Utility functions for authenticated API requests and date formatting.
 * - External libraries for icons and image handling.
 * 
 * @param {Promise<{ id: string }>} paramsPromise - A promise resolving to the dataset ID passed as a route parameter.
 * 
 * @returns {JSX.Element} The rendered page component.
 */
/**
 * 
 * @description  this page displays the users with access to a specific dataset and  ANS THE ADMin can revoke the access
 * 
 * 
 */
"use client"


import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, ChevronDown, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"
import Image from "next/image"
import Link from "next/link"
import { withAccessControl } from "@/components/auth_guard/AccessControl"

type UserAccess = {
  user: {
    id: number
    username: string
    first_name: string
    sur_name: string
    profile_picture: string | null
    date_joined: string
  }
  updated_by: {
    id: number
    first_name: string
    sur_name: string
  } | null
  request_id: string
  created_at: string
  updated_at: string
}

function DatasetUsersPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const params = React.use(paramsPromise)
  const datasetId = params.id

  const [users, setUsers] = useState<UserAccess[]>([])
  const [originalUsers, setOriginalUsers] = useState<UserAccess[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState("newest")
  const [showSortOptions, setShowSortOptions] = useState(false)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datasetTitle, setDatasetTitle] = useState("Dataset")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    requestId: string
    userName: string
  }>({ show: false, requestId: "", userName: "" })
  const [isRevoking, setIsRevoking] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Fetch users with access
  useEffect(() => {
    const fetchUsersWithAccess = async () => {
      try {
        setLoading(true)
        const response = await fetchWithAuth(`${BACKEND_URL}/organisation/dataset/users-with-access/${datasetId}/`, {
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`)
        }

        const data: UserAccess[] = await response.json()
        setUsers(data)
        setOriginalUsers(data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setLoading(false)
      }
    }

    fetchUsersWithAccess()
  }, [datasetId])

  // Dark mode detection
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const htmlHasDarkClass = document.documentElement.classList.contains("dark")
    setIsDarkMode(prefersDark || htmlHasDarkClass)

    const darkModeListener = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", darkModeListener)

    return () => mediaQuery.removeEventListener("change", darkModeListener)
  }, [])

  // Filter and sort users
  useEffect(() => {
    if (!originalUsers.length) return

    let filteredUsers = [...originalUsers]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredUsers = filteredUsers.filter(
        (item) =>
          item.user.first_name.toLowerCase().includes(query) || item.user.sur_name.toLowerCase().includes(query)
      )
    }

    if (startDate || endDate) {
      filteredUsers = filteredUsers.filter((item) => {
        const itemDate = new Date(item.updated_at)
        const start = startDate ? new Date(startDate) : new Date(0)
        const end = endDate ? new Date(endDate) : new Date(8640000000000000)
        if (endDate) end.setHours(23, 59, 59, 999)
        return itemDate >= start && itemDate <= end
      })
    }

    switch (sortOption) {
      case "newest":
        filteredUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        filteredUsers.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "a-z":
        filteredUsers.sort((a, b) =>
          `${a.user.first_name} ${a.user.sur_name}`.localeCompare(`${b.user.first_name} ${b.user.sur_name}`)
        )
        break
      case "z-a":
        filteredUsers.sort((a, b) =>
          `${b.user.first_name} ${b.user.sur_name}`.localeCompare(`${a.user.first_name} ${a.user.sur_name}`)
        )
        break
    }

    setUsers(filteredUsers)
  }, [searchQuery, sortOption, startDate, endDate, originalUsers])
  useEffect(() => {
    setDatasetTitle(`Dataset ${datasetId}`)
  }, [datasetId])

  
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const clearFilters = () => {
    setSearchQuery("")
    setSortOption("newest")
    setStartDate("")
    setEndDate("")
    setUsers(originalUsers)
  }

  const getInitial = (firstName: string) => firstName.charAt(0).toUpperCase()

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const openConfirmDialog = (requestId: string, userName: string) => {
    setConfirmDialog({ show: true, requestId, userName })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({ show: false, requestId: "", userName: "" })
  }

  const handleRevokeAccess = async () => {
    try {
      setIsRevoking(true)
      const data = {
        request_id: confirmDialog.requestId,
        action: "revoke",
      }
      const response = await fetchWithAuth(`${BACKEND_URL}/requests/requestaction/${confirmDialog.requestId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to revoke access: ${response.statusText}`)
      }

      setUsers(users.filter((user) => user.request_id !== confirmDialog.requestId))
      setOriginalUsers(originalUsers.filter((user) => user.request_id !== confirmDialog.requestId))
      setSuccessMessage(`Access for ${confirmDialog.userName} has been revoked`)
      closeConfirmDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke access")
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/organisation/admin/datasets/${datasetId}`)}
          className="mr-4"
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Dataset
        </Button>
        <h1 className="text-2xl font-bold">Users with Access to {datasetTitle}</h1>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-md flex items-center">
          <div className="mr-2">✓</div>
          {successMessage}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowSortOptions(!showSortOptions)}
            >
              <span>
                Sort by: {sortOption === "newest" ? "Newest" : sortOption === "oldest" ? "Oldest" : sortOption === "a-z" ? "A-Z" : "Z-A"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            {showSortOptions && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                <div className="py-1">
                  {["newest", "oldest", "a-z", "z-a"].map((option) => (
                    <button
                      key={option}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        setSortOption(option)
                        setShowSortOptions(false)
                      }}
                    >
                      {option === "newest" ? "Newest" : option === "oldest" ? "Oldest" : option === "a-z" ? "A-Z" : "Z-A"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowDatePicker(!showDatePicker)}
              style={{ borderColor: showDatePicker ? "#f97316" : "" }}
            >
              <Calendar className="h-4 w-4" style={{ color: showDatePicker ? "#f97316" : "" }} />
              <span>
                {startDate || endDate
                  ? `${startDate ? formatDate(startDate) : "Any"} - ${endDate ? formatDate(endDate) : "Any"}`
                  : "Filter by date range"}
              </span>
            </Button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700 w-80">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border-gray-300 dark:border-gray-600 focus:ring-[#f97316] focus:border-[#f97316] dark:bg-gray-700 dark:text-white"
                      style={{ colorScheme: isDarkMode ? "dark" : "light" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border-gray-300 dark:border-gray-600 focus:ring-[#f97316] focus:border-[#f97316] dark:bg-gray-700 dark:text-white"
                      style={{ colorScheme: isDarkMode ? "dark" : "light" }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStartDate("")
                        setEndDate("")
                      }}
                      className="text-gray-600 dark:text-gray-300"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={() => setShowDatePicker(false)}
                      style={{ backgroundColor: "#f97316", color: "white" }}
                      className="hover:bg-opacity-90"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" onClick={clearFilters} className="hover:text-[#f97316]">
            Clear filters
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error: {error}</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Showing {users.length} {users.length === 1 ? "user" : "users"}
            </div>

            <div className="grid gap-4">
              {users.length > 0 ? (
                users.map((item) => (
                  <div
                    key={item.request_id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">

                        <Link href={`/researcher/profile/${item.user.id}`} className="flex-shrink-0"> 

                        {item.user.profile_picture ? (
                         
                          
                          <Image
                            src={item.user.profile_picture || "/placeholder.svg"}
                            alt={`${item.user.first_name} ${item.user.sur_name}`}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="h-12 w-12 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: "#f97316" }}
                          >
                            {getInitial(item.user.first_name)}
                          </div>
                        )}
                        </Link>
                      </div>

                      <div className="flex-1 grid gap-1">
                        <div className="font-medium dark:text-white">
                          {item.user.first_name} {item.user.sur_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Date Requested : {item.created_at}
                        </div>
                      </div>

                      <div className="text-right mr-4">
                        <div className="text-sm dark:text-white">
                          <span className="text-gray-500 dark:text-gray-400">Updated: </span>
                          {item.updated_at}
                        </div>
                        {item.updated_by && (
                          <Link href={`/organisation/members/${item.updated_by.id}`} className="flex-shrink-0">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            by {item.updated_by.first_name} {item.updated_by.sur_name}
                          </div>
                          </Link>
                        )}
                      </div>

                      <Button
                        onClick={() => openConfirmDialog(item.request_id, `${item.user.first_name} ${item.user.sur_name}`)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={isRevoking}
                      >
                        Revoke Access
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No users found matching your filters</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 mx-4">
            <div className="flex items-center mb-4">
              <div className="mr-4 bg-red-100 dark:bg-red-900 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Confirm Access Revocation</h3>
            </div>

            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to revoke access for <span className="font-semibold">{confirmDialog.userName}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeConfirmDialog}
                className="border-gray-300 dark:border-gray-600"
                disabled={isRevoking}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRevokeAccess}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isRevoking}
              >
                {isRevoking ? "Revoking..." : "Yes, Revoke Access"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withAccessControl(DatasetUsersPage, ["organization_admin", "contributor"])

