"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchUserData } from "@/libs/auth";

interface Researcher {
  first_name: string;
  sur_name: string;
  username: string;
  profile_picture: string;
  field: string;
  followers_count: number;
}

interface Organization {
  name: string;
  email: string;
  profile_picture: string;
  field: string;
  followers_count: number;
}

interface Dataset {
  dataset_id: string;
  title: string;
  description: string;
  link: string;
  organization_name: string;
  image?: string;
}

interface User {
  first_name: string;
  sur_name: string;
  username: string;
  field: string;
  role: string;
}

interface SearchResults {
  datasets: Dataset[];
  users: Researcher[];
  organizations: Organization[];
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null); // New state for search results
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userField, setUserField] = useState<string>("");

  const capitalize = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please sign in to search.");
      router.push("/auth/sign-in");
      return;
    }

    console.log("Search query:", searchQuery);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${BACKEND_URL}/users/search/?q=${encodeURIComponent(searchQuery)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error(`Search failed with status: ${response.status}`);
        const errorText = await response.text();
        console.error("Response body:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SearchResults = await response.json();
      console.log("Search results:", data);
      setSearchResults(data);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults({ datasets: [], users: [], organizations: [] });
    }
  };

  const handleDatasetClick = (datasetId: string) => {
    if (!isAuthenticated) {
      alert("Please sign in to view the dataset.");
      router.push("/auth/sign-in");
    } else {
      router.push(`/dataset/${datasetId}`);
    }
  };

  useEffect(() => {
    const getAuthData = async () => {
      const userData = await fetchUserData();
      if (userData) {
        setIsAuthenticated(true);
        setUserField(userData.field || "Diseases");
      } else {
        setIsAuthenticated(false);
        setUserField("");
      }
    };

    getAuthData();

    const fetchResearchers = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const url = isAuthenticated
          ? `${BACKEND_URL}/users/top-fielders/`
          : `${BACKEND_URL}/users/top-researchers/`;
        const response = await fetch(url, { /* unchanged */ });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: Researcher[] = await response.json();
        setResearchers(data.length ? data : [/* fallback */]);
      } catch (error) {
        setResearchers([/* fallback */]);
      }
    };

    const fetchOrganizations = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const url = isAuthenticated
          ? `${BACKEND_URL}/organisation/top-organization/`
          : `${BACKEND_URL}/organisation/top-organizations/`;
        const response = await fetch(url, { /* unchanged */ });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: Organization[] = await response.json();
        setOrganizations(data.length ? data : [/* fallback */]);
      } catch (error) {
        setOrganizations([/* fallback */]);
      }
    };

    const fetchDatasets = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const url = isAuthenticated
          ? `${BACKEND_URL}/datasets/suggested/`
          : `${BACKEND_URL}/datasets/random/`;
        console.log("Fetching from:", url);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(isAuthenticated && token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!response.ok) {
          console.error(`Fetch datasets failed with status: ${response.status}`);
          const errorText = await response.text();
          console.error("Response body:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Dataset[] = await response.json();
        console.log("Datasets data:", data);
        setDatasets(data);
      } catch (error) {
        console.error("Error fetching datasets:", error);
        setDatasets([]);
      }
    };

    fetchResearchers();
    fetchOrganizations();
    fetchDatasets();
  }, [isAuthenticated, userField]);

  const isTrending = pathname === "/search/trending";

  const DatasetCard = ({ dataset }: { dataset: Dataset }) => (
    <div
      className="border border-gray-200 rounded-lg p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleDatasetClick(dataset.dataset_id)}
    >
      {dataset.image ? (
        <img src={dataset.image} alt={dataset.title} className="w-full h-32 object-cover rounded-md mb-2" />
      ) : (
        <div className="w-full h-32 bg-gray-200 rounded-md mb-2 flex items-center justify-center text-gray-500">
          No Image
        </div>
      )}
      <h3 className="text-md font-semibold text-gray-900">{dataset.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-2">{dataset.description}</p>
      <p className="text-xs text-gray-500 mt-1">By {dataset.organization_name}</p>
    </div>
  );

  const UserCard = ({ user }: { user: Researcher }) => (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow">
      <Link href={`/profile/${user.username}`}>
        <div className="flex items-center gap-3">
          {user.profile_picture ? (
            <img src={user.profile_picture} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
              {capitalize(user.first_name)[0]}
            </div>
          )}
          <div>
            <h3 className="text-md font-semibold text-gray-900">{`${capitalize(user.first_name)} ${capitalize(user.sur_name)}`}</h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>
        </div>
      </Link>
    </div>
  );

  const OrgCard = ({ org }: { org: Organization }) => (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow">
      <Link href={`/organization/${org.name}`}>
        <div className="flex items-center gap-3">
          {org.profile_picture ? (
            <img src={org.profile_picture} alt={org.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
              {capitalize(org.name)[0]}
            </div>
          )}
          <div>
            <h3 className="text-md font-semibold text-gray-900">{capitalize(org.name)}</h3>
            <p className="text-sm text-gray-500">{org.email}</p>
          </div>
        </div>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex flex-1">
        <main className="flex-1 max-w-2xl bg-white shadow-md rounded-lg">
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
          <nav className="flex gap-6 px-4 py-2 bg-white">
            <Link href="/search" className={`text-gray-700 hover:text-orange-600 font-medium ${!isTrending ? "text-orange-600" : ""}`}>
              Home
            </Link>
            <Link href="/search/trending" className={`text-gray-700 hover:text-orange-600 font-medium ${isTrending ? "text-orange-600" : ""}`}>
              Trending
            </Link>
          </nav>
          <div className="px-4 py-4">
            {searchResults && isAuthenticated ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Datasets</h2>
                {searchResults.datasets.length ? (
                  searchResults.datasets.map((dataset) => <DatasetCard key={dataset.dataset_id} dataset={dataset} />)
                ) : (
                  <p className="text-gray-600">No datasets found.</p>
                )}
                <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Users</h2>
                {searchResults.users.length ? (
                  searchResults.users.map((user) => <UserCard key={user.username} user={user} />)
                ) : (
                  <p className="text-gray-600">No users found.</p>
                )}
                <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Organizations</h2>
                {searchResults.organizations.length ? (
                  searchResults.organizations.map((org) => <OrgCard key={org.email} org={org} />)
                ) : (
                  <p className="text-gray-600">No organizations found.</p>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {isTrending ? "Trending Datasets" : "Related Datasets"}
                </h2>
                {datasets.length ? (
                  datasets.map((dataset) => <DatasetCard key={dataset.dataset_id} dataset={dataset} />)
                ) : (
                  <p className="text-gray-600">No datasets available.</p>
                )}
                <h2 className="text-lg font-semibold text-gray-900 mt-4">
                  {isTrending ? "Trending Research" : "Related Research"}
                </h2>
                <p className="text-gray-600">Research content coming soon...</p>
              </>
            )}
          </div>
        </main>
      </div>
      {/* Aside unchanged */}
    </div>
  );
}