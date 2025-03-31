"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";

interface Researcher {
  first_name: string;
  sur_name: string;
  username: string;
  profile_picture: string;
}

interface Organization {
  name: string;
  email: string;
  profile_picture: string;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [researchers, setResearchers] = useState<Researcher[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Capitalize first letter of a string
  const capitalize = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle form submission (placeholder for future functionality)
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Search query:", searchQuery);
    // Add search logic here later
  };

  // Fetch researchers from the backend
  useEffect(() => {
    const fetchResearchers = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/users/top-researchers/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: Researcher[] = await response.json();
        setResearchers(data.length ? data : [
          { first_name: "john", sur_name: "doe", username: "johndoe", profile_picture: "" },
          { first_name: "jane", sur_name: "smith", username: "janesmith", profile_picture: "" },
          { first_name: "alex", sur_name: "johnson", username: "alexjohnson", profile_picture: "" },
        ]);
      } catch (error) {
        console.error("Error fetching researchers:", error);
        setResearchers([
          { first_name: "john", sur_name: "doe", username: "johndoe", profile_picture: "" },
          { first_name: "jane", sur_name: "smith", username: "janesmith", profile_picture: "" },
          { first_name: "alex", sur_name: "johnson", username: "alexjohnson", profile_picture: "" },
        ]);
      }
    };
    // fetch organizations from the backend
    const fetchOrganizations = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/organisation/top-organizations/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data: Organization[] = await response.json();
            setOrganizations(data.length ? data : [
                { name: "healthcorp", email: "contact@healthcorp.com", profile_picture: "" },
          { name: "datalabs", email: "info@datalabs.org", profile_picture: "" },
          { name: "meditech", email: "support@meditech.net", profile_picture: "" },
        ]);
    } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizations([
            { name: "healthcorp", email: "contact@healthcorp.com", profile_picture: "" },
          { name: "datalabs", email: "info@datalabs.org", profile_picture: "" },
          { name: "meditech", email: "support@meditech.net", profile_picture: "" },
        ]);
    }
    };
    fetchResearchers();
    fetchOrganizations();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content and Sidebar Wrapper */}
      <div className="flex flex-1">
        {/* Main Content Area */}
        <main className="flex-1 max-w-2xl bg-white shadow-md rounded-lg">
          {/* Search Bar */}
          <header className="w-full bg-white shadow-md flex justify-center p-4">
            <form onSubmit={handleSearch} className="flex items-center gap-4 max-w-2xl w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder="Search datasets, users, or more..."
                  className="w-full p-3 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-600 text-gray-900"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <button
                type="submit"
                className={buttonVariants({
                  size: "lg",
                  className: "bg-orange-600 text-white hover:bg-orange-700 rounded-full",
                })}
              >
                Search
              </button>
            </form>
          </header>

          {/* Placeholder for search results */}
          <p className="text-gray-600 text-center mt-4">
            Search results will appear here once data is added.
          </p>
        </main>
      </div>

      {/* Right Sidebar */}
      <aside className="w-80 bg-white shadow-md rounded-lg p-6">
        {/* Who to Follow Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Who to Follow</h2>
          <ul className="space-y-4">
            {researchers.map((researcher, index) => (
              <li
                key={index}
                className="flex items-center gap-3 text-gray-700 hover:text-orange-600 cursor-pointer"
              >
                {/* Profile Picture */}
                {researcher.profile_picture ? (
                  <img
                    src={researcher.profile_picture}
                    alt={`${researcher.first_name} ${researcher.sur_name}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                    {capitalize(researcher.first_name)[0]}
                  </div>
                )}
                {/* Name and Username */}
                <div className="flex-1 flex flex-col">
                  <span className="font-bold text-base">
                    {`${capitalize(researcher.first_name)} ${capitalize(researcher.sur_name)}`}
                  </span>
                  <span className="text-sm text-gray-500">@{researcher.username}</span>
                </div>
                {/* Follow Button */}
                <button
                  className={buttonVariants({
                    size: "sm",
                    className: "bg-blue-500 text-white hover:bg-blue-600",
                  })}
                >
                  Follow
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Organizations to Follow Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizations to Follow</h2>
          <ul className="space-y-4">
            {organizations.map((organization, index) => (
              <li
                key={index}
                className="flex items-center gap-3 text-gray-700 hover:text-orange-600 cursor-pointer"
              >
                {organization.profile_picture ? (
                  <img
                    src={organization.profile_picture}
                    alt={organization.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                    {capitalize(organization.name)[0]}
                  </div>
                )}
                <div className="flex-1 flex flex-col">
                  <span className="font-bold text-base">
                    {capitalize(organization.name)}
                  </span>
                  <span className="text-sm text-gray-500">{organization.email}</span>
                </div>
                <button
                  className={buttonVariants({
                    size: "sm",
                    className: "bg-blue-500 text-white hover:bg-blue-600",
                  })}
                >
                  Follow
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Trending Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trending</h2>
          <ul className="space-y-3">
            <li className="text-gray-700 hover:text-orange-600 cursor-pointer">Dr. Emily Brown</li>
            <li className="text-gray-700 hover:text-orange-600 cursor-pointer">BioResearch Inc.</li>
            <li className="text-gray-700 hover:text-orange-600 cursor-pointer">Prof. Mark Lee</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}