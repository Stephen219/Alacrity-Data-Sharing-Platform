/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @module OrganizationProfilePage
 * @description A React component that displays and manages an organization's profile page.
 * It fetches organization data, datasets, and user profile information to determine if the current
 * user is an admin. Allows admins to edit organization details, including profile and cover images,
 * social links, and other metadata. Supports following/unfollowing the organization and viewing its datasets.
 *
 * @requires next/navigation - For routing and URL parameter access
 * @requires react - For state management and effects
 * @requires @/libs/auth - For authenticated API requests
 * @requires @/config - For BACKEND_URL configuration
 * @requires @/types/types - For User type definition
 *
 * @example
 * // Rendered via Next.js routing at /organisation/[id]
 * <OrganizationProfilePage />
 *
 * @returns {JSX.Element} The organization profile page UI with loading, error, or content states
 */

/**
 * @typedef {Object} Organization
 * @property {string} Organization_id - Unique identifier for the organization
 * @property {string} name - Name of the organization
 * @property {string|null} profile_picture - URL to the organization's profile picture
 * @property {string|null} cover_image - URL to the organization's cover image
 * @property {string|null} bio - Description of the organization
 * @property {string} date_joined - Date the organization joined (ISO format)
 * @property {string|null} website - Organization's website URL
 * @property {string|null} location - Physical location of the organization
 * @property {number} followers_count - Number of followers
 * @property {number} following_count - Number of entities followed
 * @property {number} datasets_count - Number of datasets published
 * @property {boolean} [is_followed] - Whether the current user follows the organization
 * @property {SocialLink[]} [social_links] - List of social media links
 */

/**
 * @typedef {Object} SocialLink
 * @property {string} [id] - Optional unique identifier for the link
 * @property {"facebook"|"twitter"|"linkedin"} platform - Social media platform
 * @property {string} url - URL to the social media profile
 */

/**
 * @typedef {Object} Dataset
 * @property {string} dataset_id - Unique identifier for the dataset
 * @property {string} title - Dataset title
 * @property {string} description - Dataset description
 * @property {string} created_at - Creation date (ISO format)
 * @property {string} updated_at - Last updated date (ISO format)
 * @property {number} view_count - Number of views
 * @property {string[]} tags - Tags associated with the dataset
 * @property {string|null} [thumbnail] - URL to the dataset thumbnail
 */

/**
 * @typedef {Object} EditFormData
 * @property {string} name - Organization name
 * @property {string|null} bio - Organization bio
 * @property {string|null} website - Organization website
 * @property {string|null} location - Organization location
 * @property {SocialLink[]} social_links - List of social links
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} username - User username
 * @property {string} firstname - User's first name
 * @property {string} lastname - User's last name
 * @property {string|null} profile_picture - URL to user's profile picture
 * @property {string} date_joined - Date user joined (ISO format)
 * @property {string|null} date_of_birth - User's date of birth (ISO format)
 * @property {string|null} bio - User bio
 * @property {string|null} phonenumber - User phone number
 * @property {"user"|"organization_admin"|"superuser"} role - User role
 * @property {string|null} organization - Name of the organization the user manages (if admin)
 * @property {string|null} field - User's field of expertise
 * @property {any[]} researches - User's researches
 * @property {any[]} bookmarked_researches - User's bookmarked researches
 */
"use client";

import type React from "react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { User } from "@/types/types";

type Organization = {
  Organization_id: string;
  name: string;
  profile_picture: string | null;
  cover_image: string | null; 
  bio: string | null;
  date_joined: string;
  website: string | null;
  location: string | null;
  followers_count: number;
  following_count: number;
  datasets_count: number;
  is_followed?: boolean;
  social_links?: SocialLink[];
};

type SocialLink = {
  id?: string;
  platform: "facebook" | "twitter" | "linkedin";
  url: string;
};

type Dataset = {
  dataset_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  tags: string[];
  thumbnail?: string | null;
};

type EditFormData = {
  name: string;
  bio: string | null;
  website: string | null;
  location: string | null;
  social_links: SocialLink[];
};

/**
 * Fetches organization data from the backend API
 * @param {string} orgId - The unique identifier of the organization
 * @returns {Promise<Organization | null>} The organization data or null if an error occurred
 * @throws {Error} If the API request fails
 **/

const fetchOrganizationData = async (orgId: string): Promise<Organization | null> => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/organisation/${orgId}/`);
    if (!response.ok) throw new Error(`Failed to fetch organization data: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching organization data:", error);
    return null;
  }
};

/**
 * Fetches datasets published by the organization from the backend API
 * @param {string} orgId - The unique identifier of the organization
 * @param {number} [limit=6] - The maximum number of datasets to fetch
 * @returns {Promise<Dataset[]>} The list of datasets published by the organization
 * @throws {Error} If the API request fails
 * */

const fetchOrganizationDatasets = async (orgId: string, limit = 6): Promise<Dataset[]> => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/organisation/${orgId}/datasets/?limit=${limit}`);
    if (!response.ok) throw new Error(`Failed to fetch datasets: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching datasets:", error);
    return [];
  }
};

const toggleFollowOrganization = async (orgId: string, isFollowing: boolean): Promise<boolean> => {
  try {
    const endpoint = isFollowing ? "unfollow" : "follow";
    const response = await fetchWithAuth(`${BACKEND_URL}/organisation/${endpoint}/${orgId}/`, {
      method: "POST",
    });
    if (!response.ok) throw new Error(`Failed to ${endpoint} organization: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`Error ${isFollowing ? "unfollowing" : "following"} organization:`, error);
    return false;
  }
};

const updateOrganization = async (orgId: string, data: FormData): Promise<Organization | null> => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/organisation/${orgId}/`, {
      method: "PUT",
      body: data, 
    });

   

    if (!response.ok) throw new Error(`Failed to update organization: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating organization:", error);
    return null;
  }
};

export default function OrganizationProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [orgData, setOrgData] = useState<Organization | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    name: "",
    bio: "",
    website: "",
    location: "",
    social_links: [],
  });
  const [newSocialLink, setNewSocialLink] = useState<{ platform: "facebook" | "twitter" | "linkedin"; url: string }>({ platform: "linkedin", url: "" });
  const [socialLinkError, setSocialLinkError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false); 
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      setLoading(true);
      try {
        // Step 1: Fetch current user data
        const userResponse = await fetchWithAuth(`${BACKEND_URL}/users/profile/`);
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            setIsCurrentUserAdmin(false);
          } else {
            throw new Error(`Failed to fetch user data: ${userResponse.status}`);
          }
        } else {
          const user: User = await userResponse.json();
          const isAdmin = 
          user.role === "organization_admin" && 
          String(user.organization_id).trim() === String(params.id).trim();
          setIsCurrentUserAdmin(isAdmin);
        }
        const orgId = params.id as string;
        const organization = await fetchOrganizationData(orgId);
        if (organization) {
          setOrgData(organization);
          setFormData({
            name: organization.name || "",
            bio: organization.bio || "",
            website: organization.website || "",
            location: organization.location || "",
            social_links: organization.social_links || [],
          });
          setCoverPreview(organization.cover_image);
          setProfilePreview(organization.profile_picture);
          const orgDatasets = await fetchOrganizationDatasets(orgId);
          setDatasets(orgDatasets);
        } else {
          setError("Organization not found");
        }
      } catch (err) {
        console.error("Error in checkAdminAndLoadData:", err);
        setError("An error occurred while loading data");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadData();
  }, [params.id]);

  const handleFollowToggle = async () => {
    if (!orgData) return;

    setFollowLoading(true);
    try {
      const isCurrentlyFollowing = orgData.is_followed || false;
      const success = await toggleFollowOrganization(orgData.Organization_id, isCurrentlyFollowing);

      if (success) {
        setOrgData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            is_followed: !isCurrentlyFollowing,
            followers_count: isCurrentlyFollowing ? prev.followers_count - 1 : prev.followers_count + 1,
          };
        });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError(`Failed to ${orgData.is_followed ? "unfollow" : "follow"} organization`);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateSocialLink = (platform: string, url: string): boolean => {
    setSocialLinkError(null);

    if (!url) {
      setSocialLinkError("Please enter a URL");
      return false;
    }

    try {
      new URL(url);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setSocialLinkError("Please enter a valid URL");
      return false;
    }

    if (platform === "facebook" && !url.includes("facebook.com")) {
      setSocialLinkError("URL must be from facebook.com");
      return false;
    } else if (platform === "twitter" && !url.includes("twitter.com") && !url.includes("x.com")) {
      setSocialLinkError("URL must be from twitter.com or x.com");
      return false;
    } else if (platform === "linkedin" && !url.includes("linkedin.com")) {
      setSocialLinkError("URL must be from linkedin.com");
      return false;
    }

    return true;
  };

  const addSocialLink = () => {
    if (validateSocialLink(newSocialLink.platform, newSocialLink.url)) {
      setFormData((prev) => ({
        ...prev,
        social_links: [...prev.social_links, { ...newSocialLink }],
      }));
      setNewSocialLink({ platform: "linkedin", url: "" });
    }
  };

  const removeSocialLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!orgData) return;

    setUpdateLoading(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.bio || ""); 
    data.append("website", formData.website || "");
    data.append("location", formData.location || "");
    data.append("social_links", JSON.stringify(formData.social_links));
    if (profileImage) data.append("profile_picture", profileImage);
    if (coverImage) data.append("cover_image", coverImage);

    try {
      const updatedOrg = await updateOrganization(orgData.Organization_id, data);
      if (updatedOrg) {
        setOrgData(updatedOrg);
        setIsEditing(false);
        setCoverImage(null);
        setProfileImage(null);
        setCoverPreview(updatedOrg.cover_image);
        setProfilePreview(updatedOrg.profile_picture);
        window.location.reload() 
        window.scrollTo(0, 0) 

      } else {
        setError("Failed to update organization");
      }
    } catch (err) {
      setError("An error occurred while updating the organization");
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const truncateDescription = (text: string, maxLength = 100) => {
    return text.length <= maxLength ? text : text.substring(0, maxLength) + "...";
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#1877F2]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.469h3.047v-2.643c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.49 0-1.955.925-1.955 1.874v2.25h3.328l-.532 3.469h-2.796v8.385c5.737-.9 10.125-5.864 10.125-11.854z" />
          </svg>
        );
      case "twitter":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#1DA1F2]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
        );
      case "linkedin":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#0A66C2]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getWebsiteIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-[#F47521]"
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
  );

  if (loading) return <div className="container mx-auto px-4 py-8">Loading organization profile...</div>;

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
    );

  if (!orgData)
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
            The organization you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Organization Profile</h1>
        {isCurrentUserAdmin && !isEditing && (
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
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="relative h-48">
          {coverPreview || orgData.cover_image ? (
            <img
              src={coverPreview || orgData.cover_image || ""}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#F47521] to-[#FF9F5A]"></div>
          )}
          {isEditing && (
            <button
              className="absolute bottom-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
              onClick={() => document.getElementById("cover-upload")?.click()}
              aria-label="Change cover image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-700"
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
            </button>
          )}
          <input
            type="file"
            id="cover-upload"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setCoverImage(file);
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target?.result) setCoverPreview(event.target.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>

        <div className="px-6 py-4 flex flex-col md:flex-row md:items-end relative">
          <div className="absolute -top-16 left-6 md:left-6 group">
            {profilePreview || orgData.profile_picture ? (
              <div className="h-32 w-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-md relative">
                <img
                  src={profilePreview || orgData.profile_picture || ""}
                  alt={orgData.name}
                  className="h-full w-full object-cover"
                />
                {isEditing && (
                  <button
                    className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    onClick={() => document.getElementById("profile-upload")?.click()}
                    aria-label="Change profile picture"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-700"
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
                  </button>
                )}
              </div>
            ) : (
              <div className="h-32 w-32 rounded-full bg-[#FF6B1A] border-4 border-white shadow-md flex items-center justify-center text-white text-4xl font-bold relative">
                {orgData.name?.[0]?.toUpperCase() || "O"}
                {isEditing && (
                  <button
                    className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    onClick={() => document.getElementById("profile-upload")?.click()}
                    aria-label="Add profile picture"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-700"
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
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              id="profile-upload"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setProfileImage(file);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) setProfilePreview(event.target.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>

          <div className="mt-16 md:mt-0 md:ml-36 flex-grow">
            {!isEditing ? (
              <>
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
              </>
            ) : (
              <div className="space-y-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F47521] focus:border-[#F47521]"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F47521] focus:border-[#F47521]"
                    placeholder="e.g., New York, NY"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 md:mt-0">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setCoverImage(null);
                    setProfileImage(null);
                    setCoverPreview(orgData.cover_image);
                    setProfilePreview(orgData.profile_picture);
                    setFormData({
                      name: orgData.name,
                      bio: orgData.bio || "",
                      website: orgData.website || "",
                      location: orgData.location || "",
                      social_links: orgData.social_links || [],
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateLoading}
                  className="px-4 py-2 bg-[#F47521] text-white rounded-md hover:bg-[#E06010] transition-colors flex items-center gap-2"
                >
                  {updateLoading ? (
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
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading || isCurrentUserAdmin}

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
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex flex-wrap justify-between">
            <div className="flex space-x-8">
              <div className="text-center">
                <span className="block font-bold text-xl">{orgData.followers_count}</span>
                <span className="text-gray-600">Followers</span>
              </div>
              {/* <div className="text-center">
                <span className="block font-bold text-xl">{orgData.following_count}</span>
                <span className="text-gray-600">Following</span>
              </div> */}
              <div className="text-center">
                <span className="block font-bold text-xl">{orgData.datasets_count}</span>
                <span className="text-gray-600">Datasets</span>
              </div>
            </div>

            {!isEditing ? (
              <div className="mt-2 sm:mt-0 flex gap-4">
                {orgData.website && (
                  <a
                    href={orgData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#F47521] hover:underline flex items-center"
                  >
                    {getWebsiteIcon()}
                    <span className="ml-1">Website</span>
                  </a>
                )}
                {orgData.social_links &&
                  orgData.social_links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F47521] hover:underline flex items-center"
                    >
                      {getSocialIcon(link.platform)}
                    </a>
                  ))}
              </div>
            ) : (
              <div className="mt-2 sm:mt-0">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    {getWebsiteIcon()}
                  </span>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website || ""}
                    onChange={handleInputChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-[#F47521] focus:border-[#F47521]"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {!isEditing ? (
          orgData.bio && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-gray-700">{orgData.bio}</p>
            </div>
          )
        ) : (
          <div className="px-6 py-4 border-t border-gray-200">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              About
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={formData.bio || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F47521] focus:border-[#F47521]"
              placeholder="Tell us about your organization"
            />
          </div>
        )}

        {isEditing && (
          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="font-semibold mb-2">Social Links</h3>
            {formData.social_links.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.social_links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-grow flex items-center gap-2 p-2 border border-gray-300 rounded-md">
                      {getSocialIcon(link.platform)}
                      <span className="flex-grow truncate">{link.url}</span>
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
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <select
                  value={newSocialLink.platform}
                  onChange={(e) =>
                    setNewSocialLink({ ...newSocialLink, platform: e.target.value as "facebook" | "twitter" | "linkedin" })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F47521] focus:border-[#F47521]"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter</option>
                  <option value="facebook">Facebook</option>
                </select>
                <input
                  type="text"
                  value={newSocialLink.url}
                  onChange={(e) => {
                    setNewSocialLink({ ...newSocialLink, url: e.target.value });
                    if (socialLinkError) setSocialLinkError(null);
                  }}
                  placeholder="https://linkedin.com/company/example"
                  className={`flex-grow px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#F47521] focus:border-[#F47521] ${
                    socialLinkError ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  onClick={addSocialLink}
                  className="px-4 py-2 bg-[#F47521] text-white rounded-md hover:bg-[#E06010] transition-colors"
                >
                  Add
                </button>
              </div>
              {socialLinkError && <p className="text-red-500 text-sm">{socialLinkError}</p>}
              <p className="text-sm text-gray-500">
                Add links to your organization&apos;s social media profiles. Only LinkedIn, Twitter, and Facebook are supported.
              </p>
            </div>
          </div>
        )}

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

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Datasets</h2>
        </div>

        {datasets.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {datasets.map((dataset) => (
                <div
                  key={dataset.dataset_id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-40 bg-gray-200 relative overflow-hidden">
                  <img
                      
                      src = {`https://picsum.photos/seed/${dataset.dataset_id}/400/200`}
                      alt={dataset.title}
                      className="w-full h-full object-cover"
                    />
                   
                    {Array.isArray(dataset.tags) && dataset.tags.length > 0 && (
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
                      <a href={`/datasets/${dataset.dataset_id}`}>{dataset.title}</a>
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
                        {dataset.view_count.toLocaleString()}
                      </div>
                      <div>{formatDate(dataset.updated_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <button
              onClick={() => router.push(`/datasets/all/?org=${orgData.Organization_id}`)}
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
            <p className="text-gray-600">This organization hasn&apos;t published any datasets yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}