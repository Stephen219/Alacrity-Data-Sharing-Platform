



"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, ChangeEvent, MouseEvent, TouchEvent } from "react";
import { useParams } from "next/navigation";
import { fetchUserData, fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { withAccessControl } from "@/components/auth_guard/AccessControl";
import parse from "html-react-parser";

type Profile = {
  id: string;
  email?: string | null;
  username: string;
  firstname: string;
  lastname: string;
  profile_picture: string | null;
  date_joined: string;
  bio: string | null;
  phonenumber?: string | null;
  role: string;
  organization: string | null;
  field: string | null;
  researches: AnalysisSubmission[];
  bookmarked_researches?: BookmarkedResearch[];
};

type AnalysisSubmission = {
  id: string;
  title: string;
  description: string;
  status: string;
  submitted_at: string;
  is_private: boolean;
};

type BookmarkedResearch = {
  id: string;
  title: string;
  description: string;
  publisher?: string;
  date?: string;
};

const fetchProfileData = async (profileId: string): Promise<Profile | null> => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/users/profile/${profileId}/`, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch profile data: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return null;
  }
};

const updateProfile = async (userId: string, updatedData: Partial<Profile>) => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/users/profile/${userId}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

const updateProfilePicture = async (userId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append("profile_picture", file);

    const response = await fetchWithAuth(`${BACKEND_URL}/users/profile_pic_update/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile picture: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating profile picture:", error);
    throw error;
  }
};

function ResearcherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<"research" | "bookmarks">("research");
  const [loading, setLoading] = useState(true);
  const [profilePicLoading, setProfilePicLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    bio: "",
    email: "",
    phonenumber: "",
    organization: "",
    field: "",
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);

  const isOwner = currentUser?.id.toString() === (params.id as string);

  useEffect(() => {
    const loadData = async () => {
      try {
        const loggedInUser = await fetchUserData();
        if (!loggedInUser) {
          setError("Failed to fetch current user data");
          return;
        }
        setCurrentUser({
          ...loggedInUser,
          id: loggedInUser.id as string,
          researches: [],
          bookmarked_researches: [],
        });

        const profileData = await fetchProfileData(params.id as string);
        if (profileData) {
          setUserData(profileData);
          setFormData({
            firstname: profileData.firstname || "",
            lastname: profileData.lastname || "",
            bio: profileData.bio || "",
            email: profileData.email || "",
            phonenumber: profileData.phonenumber || "",
            organization: profileData.organization || "",
            field: profileData.field || "",
          });
        } else {
          setError("Failed to load profile");
        }
      } catch (err) {
        console.error("Load data error:", err);
        setError("An error occurred while loading data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!userData?.id || !isOwner) return;
    try {
      const updatedProfile = await updateProfile(userData.id, formData);
      setUserData((prev) => (prev ? { ...prev, ...updatedProfile } : prev));
      setIsEditing(false);
    } catch (err) {
      setError("Failed to save profile changes");
    }
  };

  const handleProfilePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isOwner || !userData?.id || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    setZoomLevel(1); 
  };

  const handleUpload = async () => {
    if (!userData?.id || !previewImage) return;
    const fileInput = document.querySelector<HTMLInputElement>("input[type='file']");
    if (!fileInput?.files?.[0]) return;

    setProfilePicLoading(true); // Start loading
    try {
      const updatedProfile = await updateProfilePicture(userData.id, fileInput.files[0]);
      const newUrl = `${updatedProfile.profile_picture}?t=${Date.now()}`; // Cache-busting
      setUserData((prev) => (prev ? { ...prev, profile_picture: newUrl } : prev));
      setPreviewImage(null); // Close the preview modal
    } catch (err) {
      setError("Failed to update profile picture");
    } finally {
      setProfilePicLoading(false); // Stop loading
    }
  };

  const handleZoomButton = (direction: "in" | "out") => {
    setZoomLevel((prev) => {
      if (direction === "in") return Math.min(prev + 0.2, 3); // Max zoom 3x
      return Math.max(prev - 0.2, 1); // Min zoom 1x
    });
  };

  const handleDragStart = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
  };

  const handleDragMove = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (!isDragging || startX === null) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX;
    const zoomChange = deltaX * 0.005;
    setZoomLevel((prev) => Math.max(1, Math.min(3, prev + zoomChange)));
    setStartX(clientX);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setStartX(null);
  };

  const handleRead = (id: string) => {
    router.push(`/researcher/Submissions/view/${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Loading profile...</div>;
  if (error) return <div className="container mx-auto px-4 py-8">Error: {error}</div>;
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
            The profile you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
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
                    </div>
                  ) : userData.profile_picture ? (
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white shadow-md relative">
                      <img
                        src={userData.profile_picture}
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
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfilePicChange}
                          />
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
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfilePicChange}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-[#F47521] text-white rounded-md hover:bg-[#E06010] transition-colors"
                    >
                      Save
                    </button>
                  </div>
                ) : null}
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">
                      {userData.firstname} {userData.lastname}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-200">@{userData.username}</p>
                  </div>
                  <div className="flex justify-center flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[#F4752115] text-[#F47521] text-sm rounded-full">
                      {userData.role}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {userData.field}
                    </span>
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
                      <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                        Organization
                      </label>
                      <input
                        id="organization"
                        name="organization"
                        value={formData.organization}
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
                    <div
                      key={research.id}
                      className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{parse(research.title)}</h3>
                            <p className="text-sm text-gray-500 mb-4 dark:text-gray-200">
                              Status: <span className="text-[#F47521] dark:text-gray-100">{research.status}</span> | Submitted on{" "}
                              {formatDate(research.submitted_at)}
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
                  {isOwner ? "You don’t have any published research yet." : "This user has no published research."}
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
                <div className="text-center text-gray-500 py-8">You don’t have any bookmarks yet.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
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
                src={previewImage}
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
  );
}

export default withAccessControl(ResearcherProfilePage, ["researcher", "organization_admin", "contributor"]);