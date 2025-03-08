/* eslint-disable @typescript-eslint/no-unused-vars */

/**
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

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchUserData, fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { withAccessControl } from "@/components/auth_guard/AccessControl";


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
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch profile data: ${response.status} ${response.statusText}`);
    }
    console.log("Response:", response.status);
    const data = await response.json();
    console.log("Profile Data:", data);
    return data;
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return null;
  }
};

const updateProfile = async (userId: string, updatedData: Partial<Profile>) => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}users/profile/${userId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

function ResearcherProfilePage() {
  const params = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<"research" | "bookmarks">("research");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    bio: '',
    email: '',
    phonenumber: '',
    organization: '',
    field: '',
  });

  const isOwner = currentUser?.id.toString() === (params.id as string);
  console.log("Is Owner:", isOwner);
  console.log("Current User:", currentUser);
  console.log("User Data:", params.id);


  useEffect(() => {
    const loadData = async () => {
      try {
        const loggedInUser = await fetchUserData();
        console.log("Logged-in User:", loggedInUser);
        if (!loggedInUser) {
          setError("Failed to fetch current user jdata " );
          return ;
        }
        setCurrentUser({
          ...loggedInUser,
          id: loggedInUser.id as string,
          researches: [],
          bookmarked_researches: [],
        });

        const profileData = await fetchProfileData(params.id as string);
        console.log("Profile ID:", params.id);
        if (profileData) {
          setUserData(profileData);
          setFormData({
            firstname: profileData.firstname || '',
            lastname: profileData.lastname || '',
            bio: profileData.bio || '',
            email: profileData.email || '',
            phonenumber: profileData.phonenumber || '',
            organization: profileData.organization || '',
            field: profileData.field || '',
          });
        } else {
          // rturn jsx 
          return (
            <div className="container mx-auto px-4 py-8">
              <button onClick={() => window.history.back()} className="flex items-center text-[#f97316] mb-4 hover:underline">
                <span className="mr-2">←</span>
                go back to the previous page
              </button>
        
              <div className="font-medium">Profile xxxxxnot found</div>
            </div>
          )
          
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
    } catch (error) {
      setError("Failed to save profile changes");
    }
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
  if (!userData) return (
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Researcher Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {userData.profile_picture ? (
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-md">
                      <img
                        src={userData.profile_picture}
                        alt={`${userData.firstname} ${userData.lastname}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-[#FF6B1A] border-4 border-white shadow-md flex items-center justify-center text-white text-4xl font-bold">
                      {userData.firstname?.[0]?.toUpperCase() || ""}
                    </div>
                  )}
                </div>

                {isOwner && !isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
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
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
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
                    <p className="text-gray-500">@{userData.username}</p>
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
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
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
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
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
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
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
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
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
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
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
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
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
                userData.researches.map((research) => (
                  <div key={research.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{research.title}</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Status: <span className="text-[#F47521]">{research.status}</span> | Submitted on {formatDate(research.submitted_at)}
                          </p>
                        </div>
                      </div>
                      <p className="mb-4">{truncateDescription(research.description)}</p>
                      <div className="flex justify-end">
                        <button className="px-4 py-2 text-sm bg-[#F47521] text-white rounded-md hover:bg-[#E06010] transition-colors">
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
                              <>By <span className="font-medium">{bookmark.publisher}</span></>
                            )}
                            {bookmark.date && (
                              <> in <span className="text-[#F47521]">{formatDate(bookmark.date)}</span></>
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
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </div>
                      </div>
                      <p className="mb-4">{truncateDescription(bookmark.description)}</p>
                      <div className="flex justify-end">
                        <button className="px-4 py-2 text-sm border border-[#F47521] text-[#F47521] rounded-md hover:bg-[#F4752110] transition-colors">
                          View Paper
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  You don’t have any bookmarks yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default withAccessControl(ResearcherProfilePage, ["researcher", "organization_admin", "contributor"]);