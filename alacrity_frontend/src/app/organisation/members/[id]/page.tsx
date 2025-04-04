
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @fileoverview This page displays the profile of a member in the organization.
 * It allows the organization admin to view and manage the member's details.
 * The admin can block/unblock the member, remove the member, and view the requests processed by the member.
 * The page also displays the member's profile picture, name, role, email, phone number, and join date.
 * The admin can view the member's date of birth if available.
 * The admin can navigate to the "Requests Processed" tab to view the requests processed by the member.
 * The admin can block/unblock the member and remove the member from the organization.
 */

"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BACKEND_URL } from "@/config"
import { fetchWithAuth } from "@/libs/auth"
import { fetchUserData } from "@/libs/auth"
import Image from "next/image";
import { ClipboardX } from "lucide-react"

type User = {
  id: number;
  email: string;
  first_name: string;
  sur_name: string;
  phone_number: string;
  role: string;
  date_joined: string;
  date_of_birth: string | null;
  profile_picture: string | null;
  is_blocked?: boolean;
  requests_processed?: RequestProcessed[];
}

type RequestProcessed = {
  id: string;
  researcher_id: string;
  profile_picture: string | null;
  researcher_name: string;
  title: string;
  dataset_title: string;
  dataset_id: string;
  date_processed: string;
  request_status: "approved" | "rejected" | "pending";
}

const fetchRequestsProcessed = async (id: string): Promise<RequestProcessed[]> => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/organisation/requests-processed-by/${id}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`Failed to fetch requests processed: ${response.statusText}`)
    return await response.json()
  } catch (error) {

    return []
  }
}

const fetchMemberData = async (id: string): Promise<User | null> => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/users/org_members/${id}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`Failed to fetch member data: ${response.statusText}`)
    return await response.json()
  } catch (error) {

    return null
  }
}

const toggleBlockMember = async (id: string, isBlocked: boolean) => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/users/org_members/${id}/block/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blocked: !isBlocked }),
    })
    if (!response.ok) throw new Error('Failed to update block status')
    return await response.json()
  } catch (error) {

    throw error
  }
}

const removeMember = async (id: string) => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/users/org_members/${id}/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error('Failed to remove member')
    return true
  } catch (error) {

    throw error
  }
}

export default function MemberProfilePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise)
  const router = useRouter()
  const [member, setMember] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"profile" | "requests">("profile")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortType, setSortType] = useState<"date-asc" | "date-desc" | "status" | "">("")
  const [originalRequests, setOriginalRequests] = useState<RequestProcessed[]>([])

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true)
      try {
        const currentUserData = await fetchUserData() as unknown as User
        if (!currentUserData) {
          setError(`Cannot load user with id ${params.id}`)
          setLoading(false)
          return
        }
        setCurrentUser(currentUserData)

        const fetchedMember = await fetchMemberData(params.id)
        if (!fetchedMember) {
          setLoading(false)
          return
        }

        const isOrgAdmin = currentUserData.role === 'organization_admin'
        const isSelf = currentUserData.id === Number(params.id)
        if (!isOrgAdmin && !isSelf) {
          setError(`Cannot load user with id ${params.id}`)
          setLoading(false)
          return
        }

        const memberWithRequests = await fetchRequestsProcessed(params.id)
        setOriginalRequests(memberWithRequests)
        setMember({ ...fetchedMember, requests_processed: memberWithRequests })
        setIsBlocked(fetchedMember.is_blocked || false)
      } catch (err) {
        setError(`Cannot load user with id ${params.id}`)
      } finally {
        setLoading(false)
      }
    }
    initializePage()
  }, [params.id])

  const handleBlockToggle = async () => {
    if (!member || !currentUser || currentUser.id === member.id) return
    try {
      await toggleBlockMember(member.id.toString(), isBlocked)
      setIsBlocked(!isBlocked)
    } catch (err) {
      setError("Failed to update block status")
    }
  }

  const handleRemove = async () => {
    if (!member || !currentUser || currentUser.id === member.id) return
    if (confirm("Are you sure you want to remove this member?")) {
      try {
        await removeMember(member.id.toString())
        router.push("/organisation/admin/members")
      } catch (err) {
        setError("Failed to remove member")
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) return <div className="container mx-auto py-8 px-4">Loading profile...</div>
  if (error) return <div className="container mx-auto py-8 px-4">{error}</div>

  if (!currentUser || !member) {
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
          <div className="text-xl font-medium">Profile not found</div>
          <p className="text-gray-500 mt-2 text-center">
            The profile you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const isOrgAdmin = currentUser.role === 'organization_admin'
  const isSelf = currentUser.id === member.id

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/organisation/members" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="m12 19-7-7 7-7"></path>
            <path d="M19 12H5"></path>
          </svg>
          Back to All Members
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className=" p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center">

              <Link href={`/organisation/members/${member.id}`} className="mb-4">
                {member.profile_picture ? (
                  <Image
                    src={member.profile_picture}
                    alt={`${member.first_name} ${member.sur_name}`}
                    className="rounded-full w-24 h-24 object-cover mb-4"
                    width={96}
                    height={96}
                  />
                ) : (
                  <div className="rounded-full w-24 h-24 bg-[#FF6B1A] flex items-center justify-center text-white text-3xl font-bold mb-4">
                    {member.first_name?.[0]?.toUpperCase() || ""}
                  </div>
                )}</Link>
              <h2 className="text-2xl font-bold mb-2">
                {member.first_name} {member.sur_name}
              </h2>
              <p className="text-gray-500 mb-4">{member.role}</p>
              <div className="w-full space-y-3">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>{member.phone_number}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className=" rounded-lg border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200">
              <div className="flex -mb-px px-6">
                <button
                  className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === "profile"
                      ? "border-[#F47521] text-[#F47521]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  onClick={() => setActiveTab("profile")}
                >
                  Profile
                </button>
                <button
                  className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === "requests"
                      ? "border-[#F47521] text-[#F47521]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  onClick={() => setActiveTab("requests")}
                >
                  Requests Processed
                </button>
              </div>
            </div>

            {activeTab === "profile" && (
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">Member Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">First Name</p>
                    <p>{member.first_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Name</p>
                    <p>{member.sur_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{member.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p>{member.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p>{member.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Join Date</p>
                    <p>{formatDate(member.date_joined)}</p>
                  </div>
                  {member.date_of_birth && (
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p>{formatDate(member.date_of_birth)}</p>
                    </div>
                  )}
                </div>

                {isOrgAdmin && !isSelf && (
                  <>
                    <hr className="my-6 border-gray-200" />
                    <h3 className="text-xl font-semibold mb-4">Account Management</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Block Member</label>
                          <p className="text-sm text-gray-500">
                            {isBlocked ? "Unblock to restore access" : "Block to restrict access"}
                          </p>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input
                            type="checkbox"
                            id="block-member"
                            name="block-member"
                            className="sr-only"
                            checked={isBlocked}
                            onChange={handleBlockToggle}
                          />
                          <label
                            htmlFor="block-member"
                            className={`block overflow-hidden h-6 rounded-full cursor-pointer ${isBlocked ? "bg-[#F47521]" : "bg-gray-300"}`}
                          >
                            <span
                              className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${isBlocked ? "translate-x-4" : "translate-x-0"}`}
                            ></span>
                          </label>
                        </div>
                      </div>
                      <button
                        onClick={handleRemove}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
                      >
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
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <line x1="17" x2="22" y1="8" y2="13"></line>
                          <line x1="22" x2="17" y1="8" y2="13"></line>
                        </svg>
                        Remove Member
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "requests" && (
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">Requests Processed</h3>

                {/* Search and Sort Controls */}
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Search by researcher name..."
                    value={searchTerm}
                    className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
                    onChange={(e) => {
                      const term = e.target.value
                      setSearchTerm(term)
                      if (!term) {
                        setMember(prev => ({ ...prev!, requests_processed: [...originalRequests] }))
                      } else {
                        setMember(prev => ({
                          ...prev!,
                          requests_processed: originalRequests.filter(req =>
                            req.researcher_name.toLowerCase().includes(term.toLowerCase())
                          )
                        }))
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <select
                      className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
                      value={sortType}
                      onChange={(e) => {
                        const type = e.target.value as "date-asc" | "date-desc" | "status" | ""
                        setSortType(type)
                        setMember(prev => {
                          const sortedRequests = [...(prev!.requests_processed || [])]
                          if (type === "date-asc") {
                            sortedRequests.sort((a, b) =>
                              new Date(a.date_processed).getTime() - new Date(b.date_processed).getTime()
                            )
                          } else if (type === "date-desc") {
                            sortedRequests.sort((a, b) =>
                              new Date(b.date_processed).getTime() - new Date(a.date_processed).getTime()
                            )
                          } else if (type === "status") {
                            sortedRequests.sort((a, b) =>
                              a.request_status.localeCompare(b.request_status)
                            )
                          }
                          return { ...prev!, requests_processed: sortedRequests }
                        })
                      }}
                    >
                      <option value="">Sort by...</option>
                      <option value="date-desc">Date (Newest First)</option>
                      <option value="date-asc">Date (Oldest First)</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                </div>
                {member?.requests_processed && member.requests_processed.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                    {member.requests_processed.slice(0, 5).map((request, index) => {
                      const truncatedDatasetTitle =
                        request.dataset_title.length > 30
                          ? `${request.dataset_title.substring(0, 27)}...`
                          : request.dataset_title

                      const key = request.id || `request-${index}`

                      return (
                        <div
                          key={key}
                          className="border rounded-lg p-4 flex items-center space-x-4 mb-4 last:mb-0"
                        >
                          <div className="flex-shrink-0">

                            <Link href={`/researcher/profile/${request.researcher_id}`} className="flex items-center">
                              {request.profile_picture ? (
                                <Image
                                  src={request.profile_picture}
                                  alt={request.researcher_name}
                                  className="rounded-full w-12 h-12 object-cover"
                                  width={48}
                                  height={48}
                                />
                              ) : (
                                <div className="rounded-full w-12 h-12 bg-[#FF6B1A] flex items-center justify-center text-white text-xl font-bold">
                                  {request.researcher_name?.[0]?.toUpperCase() || ""}
                                </div>
                              )} </Link>
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{request.researcher_name}</h4>
                                <Link href={`/organisation/admin/datasets/${request.dataset_id}`} className="text-sm text-gray-500 hover:text-[#F47521]">
                                  <p className="text-sm text-gray-500">
                                    Dataset: {truncatedDatasetTitle}
                                  </p>
                                </Link>
                                <p className="text-sm text-gray-500">
                                  Processed on {request.date_processed}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-sm ${request.request_status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : request.request_status === "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                              >
                                {request.request_status.charAt(0).toUpperCase() +
                                  request.request_status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (



                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto">

                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-100 to-orange-50" />


                      <svg
                        className="absolute inset-0"
                        viewBox="0 0 200 200"
                        xmlns="http://www.w3.org/2000/svg"
                      >

                        <circle cx="40" cy="40" r="4" fill="#f97316" opacity="0.3" />
                        <circle cx="160" cy="160" r="4" fill="#f97316" opacity="0.3" />
                        <circle cx="160" cy="40" r="4" fill="#f97316" opacity="0.3" />
                        <circle cx="40" cy="160" r="4" fill="#f97316" opacity="0.3" />


                        <path
                          d="M30,100 C30,60 60,30 100,30 C140,30 170,60 170,100 C170,140 140,170 100,170 C60,170 30,140 30,100"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="3"
                          strokeDasharray="8 8"
                          opacity="0.4"
                        />


                        <circle
                          cx="100"
                          cy="100"
                          r="50"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="2"
                          opacity="0.6"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="45"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="1"
                          opacity="0.3"
                          strokeDasharray="4 4"
                        />
                      </svg>


                      <div className="absolute inset-0 flex items-center justify-center">
                        <ClipboardX
                          className="w-10 h-10 text-[#f97316]"
                          strokeWidth={2}
                        />
                      </div>
                    </div>
                    <p className=" text-center py-4 font-medium text-gray-500">
                      No requests processed by this member yet.
                    </p>
                  </div>




                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}