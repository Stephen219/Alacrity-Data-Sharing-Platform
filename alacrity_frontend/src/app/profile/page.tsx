"use client";

import React, { useState, useEffect } from "react";
import { fetchUserData} from "@/libs/auth"; // Import User interface from auth
import { User } from "@/types/types";

const ProfileDisplay: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const userData = await fetchUserData();

      if (userData) {
        setUser(userData);
      } else {
        setError("Failed to load user profile. Please try again later.");
      }
      setLoading(false);
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <p className="text-gray-600 text-xl font-medium">No user data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 flex justify-center items-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all hover:shadow-3xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">
              {user.firstname.charAt(0) + (user.lastname.charAt(0) || "")}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.firstname} {user.lastname || ""}
            </h1>
            <p className="text-sm text-gray-600">{user.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium text-gray-800 break-all">
                {user.email}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="text-lg font-medium text-gray-800">
                {user.phonenumber || "Not provided"}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Organization</p>
              <p className="text-lg font-medium text-gray-800">
                {user.organization|| "Not provided"}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Field</p>
              <p className="text-lg font-medium text-gray-800 break-all">
                {user.field || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          {/* Uncomment if needed */}
          {/* <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Refresh Profile
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default ProfileDisplay;