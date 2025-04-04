/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { fetchUserData, fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";

interface Follower {
  id: number;
  username: string;
  first_name: string;
  sur_name: string;
  role: string;
  field: string;
  date_joined: string;
  profile_picture: string | null;
  bio: string | null;
  social_links: any[];
  researches: any[];
  bookmarked_researches: any[];
  followers_count: number;
  following_count: number;
  is_followed: boolean;
  follows_you: boolean;
  organization: any | null;
}

export default function FollowersList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams(); 
  const id = params.id; 

  
  const currentUser = fetchUserData();
  console.log("Current User:", currentUser);

 
  const fetchFollowers = async (userId: string) => {
    try {
      setLoading(true);
    
      const response = await fetchWithAuth(`${BACKEND_URL}/users/organisation_followers/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch followers");
      }
      const data = await response.json();
      setFollowers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (id) {
      fetchFollowers(id as string);
    }
  }, [id]);

  
  const filteredFollowers = followers.filter((follower) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      follower.username.toLowerCase().includes(searchLower) ||
      follower.first_name.toLowerCase().includes(searchLower) ||
      follower.sur_name.toLowerCase().includes(searchLower) ||
      follower.field.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search followers..."
          className="pl-10 border-gray-300 focus:border-[#f97316] focus:ring-[#f97316]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading followers...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : filteredFollowers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No followers found matching your search.</div>
      ) : (
        <div className="space-y-4">
          {filteredFollowers.length > 0 && (
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              showing {filteredFollowers.length} {filteredFollowers.length === 1 ? "follower" : "followers"} of{" "}
              {followers.length} 
              
            </h2>
          )}
          {filteredFollowers.map((follower) => (
            <Link href={`/researcher/profile/${follower.id}`} key={follower.id}>
              <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#f97316] transition-colors m-6">
                {follower.profile_picture ? (
                  <Image
                    src={follower.profile_picture || "/placeholder.svg"}
                    alt={`${follower.first_name} ${follower.sur_name}`}
                    className="w-12 h-12 rounded-full object-cover"
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#f97316] text-white flex items-center justify-center font-medium text-lg">
                    {follower.first_name.charAt(0)}
                    {follower.sur_name.charAt(0)}
                  </div>
                )}

                <div className="ml-4 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {follower.first_name} {follower.sur_name}
                      </h3>
                      <p className="text-sm text-gray-500">@{follower.username}</p>
                    </div>
                    <div className="mt-1 sm:mt-0">
                      <span className="text-sm text-gray-500">
                        {follower.followers_count}{" "}
                        {follower.followers_count === 1 ? "follower" : "followers"}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fff1e7] text-[#f97316]">
                      {follower.field}
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}