"use client";

import React, { useState, ChangeEvent, useEffect, useCallback } from "react";
import { Search, TrendingUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchUserData } from "@/libs/auth";
import debounce from "lodash/debounce";

interface Researcher {
  id: string;
  first_name: string;
  sur_name: string;
  username: string;
  profile_picture: string;
  field: string;
  followers_count: number;
}

interface Organization {
  Organization_id: string;
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
  const [trendingResearcher, setTrendingResearcher] = useState<Researcher | null>(null);
  const [trendingOrganization, setTrendingOrganization] = useState<Organization | null>(null);
  const [trendingDataset, setTrendingDataset] = useState<Dataset | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResults | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userField, setUserField] = useState<string>("");

  const capitalize = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim() && isAuthenticated) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
      setSuggestions(null);
    }
  };

  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!isAuthenticated || !query.trim()) {
        setSuggestions(null);
        return;
      }

      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          alert("No access token found. Please sign in again.");
          router.push("/auth/sign-in");
          return;
        }

        const response = await fetch(`${BACKEND_URL}/users/search/?q=${encodeURIComponent(query)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Search failed with status: ${response.status}`, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SearchResults = await response.json();
        console.log("Suggestions:", data);
        setSuggestions(data);
        setSearchResults(data);
      } 
      catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions({ datasets: [], users: [], organizations: [] });
        setSearchResults({ datasets: [], users: [], organizations: [] });
      }
    }, 300),
    [isAuthenticated, router]
  );

  useEffect(() => {
    fetchSuggestions(searchQuery);
  }, [searchQuery, fetchSuggestions]);

  const handleSuggestionClick = (item: Dataset | Researcher | Organization) => {
    setSearchQuery(
      "title" in item ? item.title :
      "username" in item ? `${item.first_name} ${item.sur_name}` :
      item.name
    );
    if ("dataset_id" in item) {
      router.push(`/datasets/description?id=${item.dataset_id}`);
    } else if ("username" in item) {
      router.push(`/researcher/profile/${item.id}`);
    } else if ("email" in item) {
      router.push(`/organisation/profile/${item.Organization_id}`);
    }
  };

  const handleDatasetClick = (datasetId: string) => {
    if (!isAuthenticated) {
      alert("Please sign in to view the dataset.");
      router.push("/auth/sign-in");
    } else {
      router.push(`/datasets/description?id=${datasetId}`);
    }
  };

  useEffect(() => {
    const getAuthData = async () => {
      const userData = await fetchUserData();
      console.log("User data:", userData);
      if (userData) {
        setIsAuthenticated(true);
        setUserField(userData.field || "Diseases");
      } else {
        setIsAuthenticated(false);
        setUserField("");
      }
    };

    const fetchTrendingData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = {
          "Content-Type": "application/json",
          ...(isAuthenticated && token && { Authorization: `Bearer ${token}` }),
        };

        // Fetch trending researchers
        const usersRes = await fetch(`${BACKEND_URL}/users/trending/`, { headers });
        if (!usersRes.ok) throw new Error("Failed to fetch trending users");
        const usersData: Researcher[] = await usersRes.json();
        setResearchers(usersData);
        setTrendingResearcher(usersData[0] || null);

        // Fetch trending organizations
        const orgsRes = await fetch(`${BACKEND_URL}/organisation/trending/organizations/`, { headers });
        if (!orgsRes.ok) throw new Error("Failed to fetch trending organizations");
        const orgsData: Organization[] = await orgsRes.json();
        setOrganizations(orgsData);
        setTrendingOrganization(orgsData[0] || null);

        // Fetch trending datasets
        const datasetsRes = await fetch(`${BACKEND_URL}/datasets/trending/datasets/`, { headers });
        if (!datasetsRes.ok) throw new Error("Failed to fetch trending datasets");
        const datasetsData: Dataset[] = await datasetsRes.json(); // Fixed: Use datasetsRes instead of datasetsData
        setDatasets(datasetsData);
        setTrendingDataset(datasetsData[0] || null);
      } catch (error) {
        console.error("Error fetching trending data:", error);
        setResearchers([]);
        setOrganizations([]);
        setDatasets([]);
        setTrendingResearcher(null);
        setTrendingOrganization(null);
        setTrendingDataset(null);
      }
    };

    getAuthData();
    fetchTrendingData();
  }, [isAuthenticated]);

  const isTrending = pathname === "/search/trending";

  const DatasetCard = ({ dataset }: { dataset: Dataset }) => (
    <div
      className="border border-gray-200 rounded-lg p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleDatasetClick(dataset.dataset_id)}
    >
      <img
        src={`https://picsum.photos/300/200?random=${dataset.dataset_id}`}
        alt={dataset.title}
        className="w-full h-32 object-cover rounded-md mb-2"
      />
      <h3 className="text-md font-semibold text-gray-900">{dataset.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-2">{dataset.description}</p>
      <p className="text-xs text-gray-500 mt-1">By {dataset.organization_name}</p>
    </div>
  );

  const UserCard = ({ user }: { user: Researcher }) => (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow">
      <Link href={`/researcher/profile/${user.id}`}>
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
      <Link href={`/organisation/profile/${org.Organization_id}`}>
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
            <div className="relative flex-1 max-w-2xl w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search datasets, users, or more..."
                className="w-full p-3 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-600 text-gray-900"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              {isDropdownOpen && suggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.datasets.map((dataset) => (
                    <div
                      key={dataset.dataset_id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSuggestionClick(dataset)}
                    >
                      <span className="font-semibold">{dataset.title}</span> (Dataset)
                    </div>
                  ))}
                  {suggestions.users.map((user) => (
                    <div
                      key={user.username}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSuggestionClick(user)}
                    >
                      <span className="font-semibold">{`${capitalize(user.first_name)} ${capitalize(user.sur_name)}`}</span> (@{user.username})
                    </div>
                  ))}
                  {suggestions.organizations.map((org) => (
                    <div
                      key={org.email}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSuggestionClick(org)}
                    >
                      <span className="font-semibold">{capitalize(org.name)}</span> (Org)
                    </div>
                  ))}
                  {suggestions.datasets.length === 0 &&
                    suggestions.users.length === 0 &&
                    suggestions.organizations.length === 0 && (
                      <div className="p-2 text-gray-500">No suggestions found</div>
                    )}
                </div>
              )}
            </div>
          </header>
          <nav className="flex px-4 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <Link 
                  href="/search" 
                  className={`text-gray-700 hover:text-orange-600 font-medium px-3 py-1 rounded-full ${!isTrending ? "bg-orange-100 text-orange-600" : ""}`}
                >
                  Home
                </Link>
                <Link 
                  href="/search/trending" 
                  className={`flex items-center gap-1 text-gray-700 hover:text-orange-600 font-medium px-3 py-1 rounded-full ${isTrending ? "bg-orange-100 text-orange-600" : ""}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending</span>
                </Link>
              </div>
              
              <div className="flex gap-6 items-center">
                {trendingDataset && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Trending Dataset:</span>
                    <Link 
                      href={`/datasets/description?id=${trendingDataset.dataset_id}`} 
                      className="text-sm font-semibold text-orange-600 hover:underline"
                    >
                      {trendingDataset.title}
                    </Link>
                  </div>
                )}
                
                {trendingResearcher && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Trending Researcher:</span>
                    <Link 
                      href={`/researcher/profile/${trendingResearcher.id}`} 
                      className="text-sm font-semibold text-orange-600 hover:underline"
                    >
                      {`${capitalize(trendingResearcher.first_name)} ${capitalize(trendingResearcher.sur_name)}`}
                    </Link>
                  </div>
                )}
                
                {trendingOrganization && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Trending Org:</span>
                    <Link 
                      href={`/organisation/profile/${trendingOrganization.Organization_id}`} 
                      className="text-sm font-semibold text-orange-600 hover:underline"
                    >
                      {capitalize(trendingOrganization.name)}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
          <div className="px-4 py-4">
            {isTrending ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Trending Datasets</h2>
                {datasets.length ? (
                  <div className="grid grid-cols-1 gap-4">
                    {datasets.map((dataset) => <DatasetCard key={dataset.dataset_id} dataset={dataset} />)}
                  </div>
                ) : (
                  <p className="text-gray-600">No trending datasets available.</p>
                )}
                <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Trending Researchers</h2>
                {researchers.length ? (
                  <div className="grid grid-cols-1 gap-4">
                    {researchers.map((user) => <UserCard key={user.username} user={user} />)}
                  </div>
                ) : (
                  <p className="text-gray-600">No trending researchers available.</p>
                )}
                <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Trending Organizations</h2>
                {organizations.length ? (
                  <div className="grid grid-cols-1 gap-4">
                    {organizations.map((org) => <OrgCard key={org.email} org={org} />)}
                  </div>
                ) : (
                  <p className="text-gray-600">No trending organizations available.</p>
                )}
              </>
            ) : searchResults && isAuthenticated ? (
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
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Related Datasets</h2>
                {datasets.length ? (
                  datasets.map((dataset) => <DatasetCard key={dataset.dataset_id} dataset={dataset} />)
                ) : (
                  <p className="text-gray-600">No datasets available.</p>
                )}
                <h2 className="text-lg font-semibold text-gray-900 mt-4">Related Research</h2>
                <p className="text-gray-600">Research content coming soon...</p>
              </>
            )}
          </div>
        </main>
        <aside className="w-80 bg-white shadow-md rounded-lg p-6">
          {!isAuthenticated ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Join Us</h2>
              <p className="text-gray-600 mb-4">Sign in to follow researchers and organizations!</p>
              <Link href="/auth/sign-in" className={buttonVariants({ size: "lg", className: "bg-orange-600 text-white hover:bg-orange-700 w-full" })}>
                Sign In
              </Link>
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Researchers</h2>
                {researchers.length ? (
                  <ul className="space-y-4">
                    {researchers.map((researcher) => (
                      <li key={researcher.username} className="flex items-center gap-3 text-gray-700">
                        {researcher.profile_picture ? (
                          <img src={researcher.profile_picture} alt={`${researcher.first_name} ${researcher.sur_name}`} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                            {capitalize(researcher.first_name)[0]}
                          </div>
                        )}
                        <div className="flex-1 flex flex-col">
                          <span className="font-bold text-base">{`${capitalize(researcher.first_name)} ${capitalize(researcher.sur_name)}`}</span>
                          <span className="text-sm text-gray-500">@{researcher.username}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No researchers available.</p>
                )}
                <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Top Organizations</h2>
                {organizations.length ? (
                  <ul className="space-y-4">
                    {organizations.map((organization) => (
                      <li key={organization.email} className="flex items-center gap-3 text-gray-700">
                        {organization.profile_picture ? (
                          <img src={organization.profile_picture} alt={organization.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                            {capitalize(organization.name)[0]}
                          </div>
                        )}
                        <div className="flex-1 flex flex-col">
                          <span className="font-bold text-base">{capitalize(organization.name)}</span>
                          <span className="text-sm text-gray-500">{organization.email}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No organizations available.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Who to Follow (Researchers)</h2>
                {researchers.length ? (
                  <ul className="space-y-4">
                    {researchers.map((researcher) => (
                      <Link href={`/researcher/profile/${researcher.id}`} key={researcher.username}>
                        <li className="flex items-center gap-3 text-gray-700 hover:text-orange-600 cursor-pointer">
                          {researcher.profile_picture ? (
                            <img src={researcher.profile_picture} alt={`${researcher.first_name} ${researcher.sur_name}`} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                              {capitalize(researcher.first_name)[0]}
                            </div>
                          )}
                          <div className="flex-1 flex flex-col">
                            <span className="font-bold text-base">{`${capitalize(researcher.first_name)} ${capitalize(researcher.sur_name)}`}</span>
                            <span className="text-sm text-gray-500">@{researcher.username}</span>
                          </div>
                        </li>
                      </Link>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No researchers available.</p>
                )}
              </div>
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Who to Follow (Organizations)</h2>
                {organizations.length ? (
                  <ul className="space-y-4">
                    {organizations.map((organization) => (
                      <Link href={`/organisation/profile/${organization.Organization_id}`} key={organization.email}>
                        <li className="flex items-center gap-3 text-gray-700 hover:text-orange-600 cursor-pointer">
                          {organization.profile_picture ? (
                            <img src={organization.profile_picture} alt={organization.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                              {capitalize(organization.name)[0]}
                            </div>
                          )}
                          <div className="flex-1 flex flex-col">
                            <span className="font-bold text-base">{capitalize(organization.name)}</span>
                            <span className="text-sm text-gray-500">{organization.email}</span>
                          </div>
                        </li>
                      </Link>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No organizations available.</p>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}