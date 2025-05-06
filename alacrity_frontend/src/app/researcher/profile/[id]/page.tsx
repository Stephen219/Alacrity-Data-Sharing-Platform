/* eslint-disable @typescript-eslint/no-unused-vars */
// dissable the 
/**
 * Researcher Profile Page**
 * @fileoverview Researcher profile page
 * @package @alacrity/researcher
 * This file defines the ResearcherProfilePage component, which is responsible for displaying and managing the profile of a researcher.
 * The component fetches the profile data from the backend, allows the profile owner to edit their information, and displays the research publications and bookmarks.
 * 
 * The main functionalities include:
 * - Fetching and displaying the researcher's profile data.
 * - Allowing the profile owner to edit and save their profile information.
 * - Displaying the research publications and bookmarks of the researcher.
 * - Handling loading and error states during data fetching.
 * 
 * The component uses various hooks such as useState and useEffect to manage state and side effects.
 * It also utilizes the useParams hook from Next.js for dynamic routing based on the researcher's ID.
 * 
 * The component is wrapped with an access control HOC (withAccessControl) to restrict access to certain user roles.
 */



"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState, useEffect, type ChangeEvent, type MouseEvent, type TouchEvent } from "react"
import { useParams } from "next/navigation"
import { fetchUserData, fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"
import { withAccessControl } from "@/components/auth_guard/AccessControl"
import parse from "html-react-parser"
import { Router } from "lucide-react"
import Link from "next/link"

type Profile = {
  id: string
  email?: string | null
  username: string
  firstname: string
  lastname: string
  profile_picture: string | null
  date_joined: string
  bio: string | null
  phonenumber?: string | null
  role: string
  organization: string | null
  field: string | null
  researches: AnalysisSubmission[]
  bookmarked_researches?: BookmarkedResearch[]
  followers_count: number
  following_count: number
  social_links: string[]
  is_followed?: boolean 
}


interface formData {
  firstname: string
  lastname: string
  bio: string
  email: string
  phonenumber: string
  username: string
  field: string
  social_links: string[]
}


type AnalysisSubmission = {
  id: string
  title: string
  description: string
  status: string
  submitted_at: string
  is_private: boolean
}

type BookmarkedResearch = {
  id: string
  title: string
  description: string
  publisher?: string
  date?: string
}

type SocialLinkError = {
  message: string
  index?: number
}


const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-]{8,15}$/
  return phoneRegex.test(phone)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const validateFormData = (data: formData): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {}
  
  if (!data.firstname.trim()) {
    errors.firstname = ["This field may not be blank."]
  }
  
  if (!data.lastname.trim()) {
    errors.lastname = ["This field may not be blank."]
  }
  
  if (!data.username.trim()) {
    errors.username = ["This field may not be blank."]
  }
  
  if (data.email && !validateEmail(data.email)) {
    errors.email = ["Enter a valid email address."]
  }
  
  if (data.phonenumber && !validatePhone(data.phonenumber)) {
    errors.phonenumber = ["Enter a valid phone number."]
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

const fetchProfileData = async (profileId: string): Promise<Profile | null> => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/users/profile/${profileId}/`, {
      method: "GET",
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch profile data: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching profile data:", error)
    return null
  }
}

const toggleFollowUser = async (userId: string, isFollowing: boolean): Promise<boolean> => {
  try {
    const endpoint = isFollowing ? "unfollow" : "follow"
    const response = await fetchWithAuth(`${BACKEND_URL}/users/${endpoint}/${userId}/`, {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error(`Failed to ${endpoint} user: ${response.status} ${response.statusText}`)
    }
    return true
  } catch (error) {
    console.error(`Error ${isFollowing ? "unfollowing" : "following"} user:`, error)
    return false
  }
}

const updateProfilePicture = async (userId: string, file: File) => {
  try {
    const formData = new FormData()
    formData.append("profile_picture", file)

    const response = await fetchWithAuth(`${BACKEND_URL}/users/profile_pic_update/`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to update profile picture: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error updating profile picture:", error)
    throw error
  }
}

function ResearcherProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<"research" | "bookmarks">("research")
  const [loading, setLoading] = useState(true)
  const [profilePicLoading, setProfilePicLoading] = useState(false)
  const [notfound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    bio: "",
    email: "",
    phonenumber: "",
    username: "",
    field: "",
    social_links: [] as string[],
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState<number | null>(null)
  const [newSocialLink, setNewSocialLink] = useState("")
  const [socialLinkError, setSocialLinkError] = useState<SocialLinkError | null>(null)
  const [followLoading, setFollowLoading] = useState(false)

  const isOwner = currentUser?.id.toString() === (params.id as string)

  useEffect(() => {
    const loadData = async () => {
      try {
        const loggedInUser = await fetchUserData()
        if (!loggedInUser) {
          setError("Failed to fetch current user data")
          return
        }
        setCurrentUser({
          ...loggedInUser,
          id: loggedInUser.id as string,
          researches: [],
          bookmarked_researches: [],
          followers_count: loggedInUser.followers_count || 0,
          following_count: loggedInUser.following_count || 0,
          social_links: loggedInUser.social_links || [],
        })

        const profileData = await fetchProfileData(params.id as string)
        if (profileData) {
          setUserData(profileData)
          setFormData({
            firstname: profileData.firstname || "",
            lastname: profileData.lastname || "",
            bio: profileData.bio || "",
            email: profileData.email || "",
            phonenumber: profileData.phonenumber || "",
            username: profileData.username || "",
            field: profileData.field || "",
            social_links: profileData.social_links || [],
          })
        } else {
          setNotFound(true)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!userData?.id || !isOwner) return

    // Validate form data
    const { isValid, errors } = validateFormData(formData)
    
    if (!isValid) {
      setError(JSON.stringify(errors))
      return
    }

    setLoading(true)
    try {
      const updatedData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        bio: formData.bio,
        email: formData.email,
        phonenumber: formData.phonenumber,
        username: formData.username,
        field: formData.field,
        social_links: formData.social_links,
      }

      const response = await fetchWithAuth(`${BACKEND_URL}/users/profile/${userData.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 404) {
          setNotFound(true)
          return
        }
        setError(JSON.stringify(errorData))
        throw new Error("Failed to update profile")
      }

      const updatedProfile = await response.json()
      setUserData((prev) => {
        if (!prev) return prev
        return { ...prev, ...updatedProfile }
      })
      setIsEditing(false)
    } catch (err) {
      console.error("Save error:", err)
      if (!error) {
        setError("Failed to update profile. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleProfilePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isOwner || !userData?.id || !e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const previewUrl = URL.createObjectURL(file)
    setPreviewImage(previewUrl)
    setZoomLevel(1)
  }

  const handleUpload = async () => {
    if (!userData?.id || !previewImage) return
    const fileInput = document.querySelector<HTMLInputElement>("input[type='file']")
    if (!fileInput?.files?.[0]) return

    setProfilePicLoading(true)
    try {
      const updatedProfile = await updateProfilePicture(userData.id, fileInput.files[0])
      const newUrl = `${updatedProfile.profile_picture}?t=${Date.now()}`
      setUserData((prev) => (prev ? { ...prev, profile_picture: newUrl } : prev))
      setPreviewImage(null)
    } catch (err) {
      setError("Failed to update profile picture")
    } finally {
      setProfilePicLoading(false)
    }
  }

  const handleZoomButton = (direction: "in" | "out") => {
    setZoomLevel((prev) => {
      if (direction === "in") return Math.min(prev + 0.2, 3)
      return Math.max(prev - 0.2, 1)
    })
  }

  const handleDragStart = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    setIsDragging(true)
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    setStartX(clientX)
  }
  const handleChat = async (userId: string) => {
    try {
      // Call the StartChatView API to get or create a conversation
      const response = await fetchWithAuth(`${BACKEND_URL}/users/api/start-chat/${userId}/`);
      if (!response.ok) {
        throw new Error(`Failed to start chat: ${response.status} ${response.statusText}`);
      }
  
      const { conversation_id } = await response.json();
      if (!conversation_id) {
        throw new Error("No conversation ID returned from the server");
      }
  
      // Navigate to the chat page with the conversation ID
      await router.push(`/chat/users/message/${conversation_id}`);
      return true;
    } catch (error) {
      console.error("Error starting chat:", error);
      return false;
    }
  };

  const handleDragMove = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (!isDragging || startX === null) return
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const deltaX = clientX - startX
    const zoomChange = deltaX * 0.005
    setZoomLevel((prev) => Math.max(1, Math.min(3, prev + zoomChange)))
    setStartX(clientX)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setStartX(null)
  }

  const handleRead = (id: string) => {
    router.push(`/researcher/Submissions/view/${id}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const truncateDescription = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const addSocialLink = () => {
    setSocialLinkError(null)
    if (!newSocialLink) {
      setSocialLinkError({ message: "Please enter a social link" })
      return
    }

    try {
      new URL(newSocialLink)
    } catch (e) {
      setSocialLinkError({ message: "Please enter a valid URL" })
      return
    }

    const validDomains = ["linkedin.com", "twitter.com", "x.com", "facebook.com"]
    const isValid = validDomains.some((domain) => newSocialLink.includes(domain))

    if (!isValid) {
      setSocialLinkError({
        message: "Only LinkedIn, Twitter/X, or Facebook URLs are supported",
      })
      return
    }

    if (!newSocialLink.startsWith("https://")) {
      setSocialLinkError({
        message: "URL must start with https://",
      })
      return
    }

    setFormData((prev) => ({
      ...prev,
      social_links: [...prev.social_links, newSocialLink],
    }))
    setNewSocialLink("")
  }

  const removeSocialLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index),
    }))
  }

  const getSocialIcon = (link: string) => {
    if (link.includes("linkedin.com")) {
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5 text-[#0077B5]">
        <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/>
      </svg>
    } else if (link.includes("twitter.com") || link.includes("x.com")) {
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-5 w-5 text-[#1DA1F2]">
        <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
      </svg>
    } else if (link.includes("facebook.com")) {
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-5 w-5 text-[#1877F2]">
        <path fill="#2653d9" d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5V334.2H141.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287V510.1C413.8 494.8 512 386.9 512 256h0z"/>
      </svg>
    }
    return null
  }

  const handleFollowToggle = async () => {
    if (!userData || !currentUser || isOwner) return

    setFollowLoading(true)
    try {
      const isCurrentlyFollowing = userData.is_followed || false
      const success = await toggleFollowUser(userData.id, isCurrentlyFollowing)

      if (success) {
        setUserData((prev) => {
          if (!prev) return null
          return {
            ...prev,
            is_followed: !isCurrentlyFollowing,
            followers_count: isCurrentlyFollowing ? prev.followers_count - 1 : prev.followers_count + 1,
          }
        })
      }
    } catch (err) {
      setError(`Failed to ${userData.is_followed ? "unfollow" : "follow"} user`)
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading && !userData) return <div className="container mx-auto px-4 py-8">Loading profile...</div>
  if (notfound) {
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
  if (error && !isEditing)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-8">
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
  if (!userData || userData.role === "organization_admin" || userData.role === "contributor") {
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
            The profile you&lsquo;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Researcher Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {profilePicLoading ? (
                    <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white shadow-md flex items-center justify-center">
                      <svg
                        className="animate-spin h-8 w-8 text-[#F47521]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                      </svg>
                    </div>
                  ) : userData.profile_picture ? (
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white shadow-md relative">
                      <img
                        src={userData.profile_picture || "/placeholder.svg"}
                        alt={`${userData.firstname} ${userData.lastname}`}
                        className="h-full w-full object-cover"
                      />
                      {isOwner && (
                        <label className="absolute bottom-1 right-0 bg-[#FF6B1A] rounded-full p-1.5 m-1 shadow-md cursor-pointer">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <input type="file" accept="image/*" data-testid="camera" className="hidden" onChange={handleProfilePicChange} />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-[#FF6B1A] border-4 border-white shadow-md flex items-center justify-center text-white text-4xl font-bold relative">
                      {userData.firstname?.[0]?.toUpperCase() || ""}
                      {isOwner && (
                        <label className="absolute bottom-0 left-0 bg-white rounded-full p-1.5 m-1 shadow-md cursor-pointer">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-[#FF6B1A]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <input type="file" data-testid="camera" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                        </label>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mb-2">
                  {isOwner && !isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 border border-gray-300 rounded-md flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                      Edit Profile
                    </button>
                  ) : isOwner && isEditing ? (
                    <div className="flex flex-col gap-4">
                      {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-md">
                          {error.includes("{") ? (
                            Object.entries(JSON.parse(error)).map(([field, errors]) => (
                              <p key={field}>{field}: {(errors as string[])[0]}</p>
                            ))
                          ) : (
                            <p>{error}</p>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            setError(null)
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-[#F47521] text-white rounded-md hover:bg-[#E06010] transition-colors flex items-center gap-2"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                                />
                              </svg>
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (

                 
                    !isOwner &&
                    currentUser &&  (
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading || currentUser.role === "organization_admin" || currentUser.role === "contributor"} 
                        className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                          userData.is_followed
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
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                          </svg>
                        ) : userData.is_followed ? (
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
                    )
                  )}
                </div>
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">
                      {userData.firstname} {userData.lastname}
                    </h2>
                    {/* Chat Button */}
                    {!isOwner && currentUser && (
                        <button
                          onClick={() => handleChat(userData.id)}
                          className="p-2 text-[#F47521] hover:text-[#E06010] transition-colors"
                          title="Chat with this researcher"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                          </svg>
                        </button>
                      )}
                    <p className="text-gray-500 dark:text-gray-200">@{userData.username}</p>
                  </div>
                  <div className="flex justify-center gap-6 mt-2">
                    
                    <Link href={`/researcher/followers/${userData.id}`} className="text-center">
                    <div className="text-center">
                      <span className="font-semibold">{userData.followers_count || 0}</span>
                      <p className="text-gray-500 text-sm">Followers</p>
                    </div>
                    </Link>


                    <div className="text-center">
                      <span className="font-semibold">{userData.following_count || 0}</span>
                      <p className="text-gray-500 text-sm">Following</p>
                    </div>
                  </div>
                  <div className="flex justify-center flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[#F4752115] text-[#F47521] text-sm rounded-full">
                      {userData.role}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">{userData.field}</span>
                  </div>
                  <div className="border-t border-b border-gray-100 py-4">
                    <p className="text-sm text-center">{userData.bio || "No bio available"}</p>
                  </div>
                  <div className="space-y-3">
                    {userData.organization && (
                      <div className="flex items-center gap-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
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
                        <span>{userData.organization}</span>
                      </div>
                    )}
                    {isOwner && userData.email && (
                      <div className="flex items-center gap-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span>{userData.email}</span>
                      </div>
                    )}
                    {isOwner && userData.phonenumber && (
                      <div className="flex items-center gap-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{userData.phonenumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
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
                      <span>Joined {formatDate(userData.date_joined)}</span>
                    </div>
                    {userData.social_links && userData.social_links.length > 0 && (
                      <div className="space-y-2">
                        {userData.social_links.map((link, index) => (
                          <div key={index} className="flex items-center gap-3">
                            {getSocialIcon(link)}
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#F47521] hover:underline"
                            >
                              {link.split("/")[3] || link}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        id="firstname"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phonenumber" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        id="phonenumber"
                        name="phonenumber"
                        value={formData.phonenumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="field" className="block text-sm font-medium text-gray-700">
                        Field
                      </label>
                      <input
                        id="field"
                        name="field"
                        value={formData.field}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Social Links</label>
                      {formData.social_links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-grow relative">
                            <input
                              type="text"
                              value={link}
                              onChange={(e) => {
                                const updatedLinks = [...formData.social_links]
                                updatedLinks[index] = e.target.value
                                setFormData((prev) => ({ ...prev, social_links: updatedLinks }))
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
                            />
                            {getSocialIcon(link) && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {getSocialIcon(link)}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeSocialLink(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                            aria-label="Remove social link"
                          >
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
                              <path d="M3 6h18" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-grow relative">
                            <input
                              type="text"
                              value={newSocialLink}
                              onChange={(e) => {
                                setNewSocialLink(e.target.value)
                                if (socialLinkError) setSocialLinkError(null)
                              }}
                              placeholder="https://linkedin.com/in/username"
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521] ${
                                socialLinkError ? "border-red-500" : "border-gray-300"
                              }`}
                            />
                            {getSocialIcon(newSocialLink) && (
                              <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                                {getSocialIcon(newSocialLink)}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={addSocialLink}
                            className="px-3 py-2 bg-[#F47521] text-white rounded-md hover:bg-[#E06010]"
                          >
                            Add
                          </button>
                        </div>
                        {socialLinkError && <p className="text-red-500 text-sm mt-1">{socialLinkError.message}</p>}
                        <p className="text-sm text-gray-500 mt-2">
                          Only LinkedIn, Twitter/X, or Facebook links are supported (must start with https://).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <div className="flex -mb-px">
                <button
                  className={`py-3 px-6 font-medium text-sm border-b-2 ${
                    activeTab === "research"
                      ? "border-[#F47521] text-[#F47521]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("research")}
                >
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
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Research Publications
                  </div>
                </button>
                {isOwner && (
                  <button
                    className={`py-3 px-6 font-medium text-sm border-b-2 ${
                      activeTab === "bookmarks"
                        ? "border-[#F47521] text-[#F47521]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("bookmarks")}
                  >
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
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      Bookmarks
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {activeTab === "research" && (
            <div className="space-y-6">
              {userData.researches.length > 0 ? (
                userData.researches
                  .filter((research) => research.status === "published" && !research.is_private)
                  .map((research) => (
                    <div key={research.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{parse(research.title)}</h3>
                            <p className="text-sm text-gray-500 mb-4 dark:text-gray-200">
                              Status: <span className="text-[#F47521] dark:text-gray-100">{research.status}</span> |
                              Submitted on {formatDate(research.submitted_at)}
                            </p>
                          </div>
                        </div>
                        <div className="mb-4">{parse(research.description)}</div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleRead(research.id)}
                            className="px-4 py-2 text-sm bg-[#F47521] text-white rounded-md hover:bg-[#E06010] transition-colors"
                          >
                            View Full Paper
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {isOwner ? "You don't have any published research yet." : "This user has no published research."}
                </div>
              )}
            </div>
          )}

          {activeTab === "bookmarks" && isOwner && (
            <div className="space-y-6">
              {userData.bookmarked_researches && userData.bookmarked_researches.length > 0 ? (
                userData.bookmarked_researches.map((bookmark) => (
                  <div key={bookmark.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{bookmark.title}</h3>
                          <p className="text-sm text-gray-500">
                            {bookmark.publisher && (
                              <>
                                By <span className="font-medium">{bookmark.publisher}</span>
                              </>
                            )}
                            {bookmark.date && (
                              <>
                                {" in "}
                                <span className="text-[#F47521]">{formatDate(bookmark.date)}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-[#F47521]"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                      </div>
                      <p className="mb-4">{truncateDescription(bookmark.description)}</p>
                      <div className="flex justify-end">
                        <button className="px-4 py-2 text-sm border border-[#F47521] text-[#F47521] rounded-md hover:bg-[#F4752110] dark:hover:text-gray-100 transition-colors">
                          View Paper
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">You don&apos;t have any bookmarks yet.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-8 w-8 text-[#F47521]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
              <span className="text-lg">Saving profile...</span>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Preview Profile Picture</h2>
              <button onClick={() => setPreviewImage(null)} className="text-gray-500 hover:text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div
              className="overflow-auto max-h-96 flex justify-center cursor-grab select-none"
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              <img
                src={previewImage || "/placeholder.svg"}
                alt="Profile picture preview"
                className="max-w-full max-h-80 object-contain"
                style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.1s ease" }}
              />
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => handleZoomButton("out")}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={zoomLevel <= 1}
              >
                Zoom Out
              </button>
              <button
                onClick={() => handleZoomButton("in")}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={zoomLevel >= 3}
              >
                Zoom In
              </button>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-[#F47521] text-white rounded-md hover:bg-[#E06010] transition-colors flex items-center gap-2"
                disabled={profilePicLoading}
              >
                {profilePicLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withAccessControl(ResearcherProfilePage, ["researcher", "organization_admin", "contributor"])

