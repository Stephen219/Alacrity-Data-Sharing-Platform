"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
const BACKEND_URL="fjfg"

// Fallback implementation of auth functions in case they're not available
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // Add auth headers to the request
  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    // Add authorization header if you have a token in localStorage or cookies
    ...(typeof window !== "undefined" && localStorage.getItem("authToken")
      ? { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      : {}),
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

const fetchUserData = async () => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/users/me/`)
    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

type Organization = {
  id: string
  name: string
  profile_picture: string | null
  bio: string | null
  date_joined: string
  website: string | null
  location: string | null
  followers_count: number
  following_count: number
  datasets_count: number
  is_followed?: boolean
}

type Dataset = {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  downloads: number
  views: number
  tags: string[]
  thumbnail?: string | null
}

const fetchOrganizationData = async (orgId: string): Promise<Organization | null> => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/organizations/${orgId}/`, {
      method: "GET",
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch organization data: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching organization data:", error)
    return null
  }
}

const fetchOrganizationDatasets = async (orgId: string, limit = 6): Promise<Dataset[]> => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/organizations/${orgId}/datasets/?limit=${limit}`, {
      method: "GET",
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch datasets: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching datasets:", error)
    return []
  }
}

// Follow/Unfollow organization function
const toggleFollowOrganization = async (orgId: string, isFollowing: boolean): Promise<boolean> => {
  try {
    const endpoint = isFollowing ? "unfollow" : "follow"
    const response = await fetchWithAuth(`${BACKEND_URL}/organizations/${endpoint}/${orgId}/`, {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error(`Failed to ${endpoint} organization: ${response.status} ${response.statusText}`)
    }
    return true
  } catch (error) {
    console.error(`Error ${isFollowing ? "unfollowing" : "following"} organization:`, error)
    return false
  }
}

export default function OrganizationProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [orgData, setOrgData] = useState<Organization | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current user data
        const loggedInUser = await fetchUserData()
        if (loggedInUser) {
          setCurrentUser(loggedInUser)
        }

        // Load organization data
        const orgId = params.id as string
        const organization = await fetchOrganizationData(orgId)
        if (organization) {
          setOrgData(organization)

          // Load organization datasets
          const orgDatasets = await fetchOrganizationDatasets(orgId)
          setDatasets(orgDatasets)
        } else {
          setError("Organization not found")
        }
      } catch (err) {
        console.error("Load data error:", err)
        setError("An error occurred while loading data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!orgData || !currentUser) return

    setFollowLoading(true)
    try {
      const isCurrentlyFollowing = orgData.is_followed || false
      const success = await toggleFollowOrganization(orgData.id, isCurrentlyFollowing)

      if (success) {
        // Update local state to reflect the change
        setOrgData((prev) => {
          if (!prev) return null

          return {
            ...prev,
            is_followed: !isCurrentlyFollowing,
            followers_count: isCurrentlyFollowing ? prev.followers_count - 1 : prev.followers_count + 1,
          }
        })
      }
    } catch (err) {
      setError(`Failed to ${orgData.is_followed ? "unfollow" : "follow"} organization`)
    } finally {
      setFollowLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const truncateDescription = (text: string, maxLength = 100) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  if (loading) return <div className="container mx-auto px-4 py-8">Loading organization profile...</div>

  if (error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-4 text-[#f97316]"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
            <path d="M12 7v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
          <div className="text-xl font-medium">An error occurred</div>
          <p className="text-gray-500 mt-2 text-center">{error}</p>
        </div>
      </div>
    )

  if (!orgData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-[#f97316] mb-6 hover:underline group transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 group-hover:-translate-x-1 transition-transform"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          go back to the previous page
        </button>
        <div className="flex flex-col items-center justify-center py-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-4 text-[#f97316]"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
            <path d="M12 7v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
          <div className="text-xl font-medium">Organization not found</div>
          <p className="text-gray-500 mt-2 text-center">
            The organization you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Organization Profile</h1>
      </div>

      {/* Organization Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="relative h-48 bg-gradient-to-r from-[#F47521] to-[#FF9F5A]">
          {/* Cover image or gradient background */}
        </div>

        <div className="px-6 py-4 flex flex-col md:flex-row md:items-end relative">
          {/* Profile Picture */}
          <div className="absolute -top-16 left-6 md:left-6">
            {orgData.profile_picture ? (
              <div className="h-32 w-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-md">
                <img
                  src={orgData.profile_picture || "/placeholder.svg"}
                  alt={orgData.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-32 w-32 rounded-full bg-[#FF6B1A] border-4 border-white shadow-md flex items-center justify-center text-white text-4xl font-bold">
                {orgData.name?.[0]?.toUpperCase() || "O"}
              </div>
            )}
          </div>

          {/* Organization Name and Follow Button */}
          <div className="mt-16 md:mt-0 md:ml-36 flex-grow">
            <h2 className="text-2xl font-bold">{orgData.name}</h2>
            {orgData.location && (
              <p className="text-gray-600 flex items-center mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {orgData.location}
              </p>
            )}
          </div>

          {/* Follow Button */}
          {currentUser && (
            <div className="mt-4 md:mt-0">
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-6 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  orgData.is_followed
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    : "bg-[#F47521] text-white hover:bg-[#E06010]"
                }`}
              >
                {followLoading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                ) : orgData.is_followed ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Following
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    Follow
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex flex-wrap justify-between">
            <div className="flex space-x-8">
              <div className="text-center">
                <span className="block font-bold text-xl">{orgData.followers_count.toLocaleString()}</span>
                <span className="text-gray-600">Followers</span>
              </div>
              <div className="text-center">
                <span className="block font-bold text-xl">{orgData.following_count.toLocaleString()}</span>
                <span className="text-gray-600">Following</span>
              </div>
              <div className="text-center">
                <span className="block font-bold text-xl">{orgData.datasets_count.toLocaleString()}</span>
                <span className="text-gray-600">Datasets</span>
              </div>
            </div>

            {orgData.website && (
              <div className="mt-2 sm:mt-0">
                <a
                  href={orgData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F47521] hover:underline flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Website
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {orgData.bio && (
          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-gray-700">{orgData.bio}</p>
          </div>
        )}

        {/* Joined Date */}
        <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Joined {formatDate(orgData.date_joined)}
          </div>
        </div>
      </div>

      {/* Recent Datasets Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Datasets</h2>
        </div>

        {datasets.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Dataset Card */}
                  <div className="h-40 bg-gray-200 relative overflow-hidden">
                    {dataset.thumbnail ? (
                      <img
                        src={dataset.thumbnail || "/placeholder.svg"}
                        alt={dataset.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#F47521] to-[#FF9F5A] flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16 text-white opacity-50"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                    )}

                    {/* Tags */}
                    {dataset.tags && dataset.tags.length > 0 && (
                      <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                        {dataset.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {dataset.tags.length > 2 && (
                          <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full">
                            +{dataset.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 hover:text-[#F47521] transition-colors">
                      <a href={`/datasets/${dataset.id}`}>{dataset.title}</a>
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">{truncateDescription(dataset.description)}</p>

                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {dataset.views.toLocaleString()}
                      </div>

                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {dataset.downloads.toLocaleString()}
                      </div>

                      <div>{formatDate(dataset.updated_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Datasets Button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => router.push(`/organizations/${orgData.id}/datasets`)}
                className="px-6 py-3 bg-[#F47521] text-white rounded-md hover:bg-[#E06010] transition-colors flex items-center gap-2"
              >
                View All Datasets
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-300 mb-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No datasets available</h3>
            <p className="text-gray-600">This organization hasn't published any datasets yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

