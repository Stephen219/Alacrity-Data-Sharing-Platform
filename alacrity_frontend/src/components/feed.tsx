"use client";

import React, { useState, ChangeEvent, useEffect, useCallback } from "react";
import { Search, TrendingUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  contributor_id: string;
  title: string;
  category: string;
  link: string;
  description: string;
  organization_name: string;
}

interface AnalysisSubmission {
  id: string;
  title: string;
  description: string;
  raw_results: string;
  summary: string;
  status: string;
  researcher_email: string;
  submitted_at: string;
}

interface PublishedResearch {
  research_submission: AnalysisSubmission;
  visibility: string;
  tags: string[];
  likes_count: number;
  bookmarks_count: number;
  is_private: boolean;
}

interface SearchResults {
  datasets: Dataset[];
  users: Researcher[];
  organizations: Organization[];
  reports?: PublishedResearch[];
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [reports, setReports] = useState<PublishedResearch[]>([]);
  const [trendingDatasets, setTrendingDatasets] = useState<Dataset[]>([]);
  const [randomDatasets, setRandomDatasets] = useState<Dataset[]>([]);
  const [trendingResearcher, setTrendingResearcher] = useState<Researcher | null>(null);
  const [trendingOrganization, setTrendingOrganization] = useState<Organization | null>(null);
  const [trendingDataset, setTrendingDataset] = useState<Dataset | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResults | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTrending, setIsTrending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  const capitalize = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim() && isAuthenticated) {
      setIsDropdownOpen(true);
      fetchSuggestions(value);
    } else {
      setIsDropdownOpen(false);
      setSuggestions(null);
    }
  };

  const fetchSuggestions = useCallback(
    debounce((query: string) => {
      if (!isAuthenticated || !query.trim()) {
        setSuggestions(null);
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("No access token found. Please sign in again.");
        router.push("/auth/sign-in");
        return;
      }

      fetch(`${BACKEND_URL}/users/search/?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Search failed with status: ${response.status}`);
          }
          return response.json();
        })
        .then((data: SearchResults) => {
          setSuggestions(data);
        })
        .catch(() => {
          setError("Failed to fetch suggestions. Please try again.");
          setSuggestions({ datasets: [], users: [], organizations: [], reports: [] });
        });
    }, 300),
    [isAuthenticated, router]
  );

  const handleSuggestionClick = (item: Dataset | Researcher | Organization | PublishedResearch) => {
    setSearchQuery(
      "title" in item ? item.title :
      "username" in item ? `${item.first_name} ${item.sur_name}` :
      "research_submission" in item ? item.research_submission.title :
      item.name
    );
    if ("dataset_id" in item) {
      router.push(`/datasets/description?id=${item.dataset_id}`);
    } else if ("username" in item) {
      router.push(`/researcher/profile/${item.id}`);
    } else if ("email" in item) {
      router.push(`/organisation/profile/${item.Organization_id}`);
    } else if ("research_submission" in item) {
      router.push(`/researcher/allsubmissions/view/${item.research_submission.id}`);
    }
    setIsDropdownOpen(false);
  };

  const handleDatasetClick = (datasetId: string) => {
    if (!isAuthenticated) {
      alert("Please sign in to view the dataset.");
      router.push("/auth/sign-in");
    } else {
      router.push(`/datasets/description?id=${datasetId}`);
    }
  };

  const handleReportClick = (reportId: string) => {
    if (!isAuthenticated) {
      alert("Please sign in to view the report.");
      router.push("/auth/sign-in");
    } else {
      router.push(`/researcher/allsubmissions/view/${reportId}`);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(isAuthenticated && token && { Authorization: `Bearer ${token}` }),
      };

      const trendingRes = await fetch(`${BACKEND_URL}/datasets/trending/datasets/`, { headers });
      if (!trendingRes.ok) throw new Error("Failed to fetch trending datasets");
      const trendingData: Dataset[] = await trendingRes.json();
      setTrendingDatasets(trendingData);
      setTrendingDataset(trendingData[0] || null);

      const usersRes = await fetch(`${BACKEND_URL}/users/trending/`, { headers });
      if (!usersRes.ok) throw new Error("Failed to fetch trending users");
      const usersData: Researcher[] = await usersRes.json();
      setResearchers(usersData);
      setTrendingResearcher(usersData[0] || null);

      const orgsRes = await fetch(`${BACKEND_URL}/organisation/trending/organizations/`, { headers });
      if (!orgsRes.ok) throw new Error("Failed to fetch trending organizations");
      const orgsData: Organization[] = await orgsRes.json();
      setOrganizations(orgsData);
      setTrendingOrganization(orgsData[0] || null);

      if (isAuthenticated) {
        if (userRole === "researcher") {
          const datasetsRes = await fetch(`${BACKEND_URL}/datasets/get_datasets/all`, { headers });
          if (!datasetsRes.ok) throw new Error("Failed to fetch followed datasets");
          const datasetsData: Dataset[] = await datasetsRes.json();
          setDatasets(datasetsData);

          const reportsRes = await fetch(`${BACKEND_URL}/research/followed-reports/`, { headers });
          if (!reportsRes.ok) throw new Error("Failed to fetch followed reports");
          const reportsData: PublishedResearch[] = await reportsRes.json();
          setReports(reportsData);
        } else {
          const randomDatasetsRes = await fetch(`${BACKEND_URL}/datasets/random/datasets/`, { headers });
          if (!randomDatasetsRes.ok) throw new Error("Failed to fetch random datasets");
          const randomDatasetsData: Dataset[] = await randomDatasetsRes.json();
          setRandomDatasets(randomDatasetsData);
          setDatasets(randomDatasetsData);

          const randomReportsRes = await fetch(`${BACKEND_URL}/research/random-reports/`, { headers });
          if (!randomReportsRes.ok) throw new Error("Failed to fetch random reports");
          const randomReportsData: PublishedResearch[] = await randomReportsRes.json();
          setReports(randomReportsData);
        }
      } else {
        const randomRes = await fetch(`${BACKEND_URL}/datasets/random/datasets/`, { headers });
        if (!randomRes.ok) throw new Error("Failed to fetch random datasets");
        const randomData: Dataset[] = await randomRes.json();
        setRandomDatasets(randomData);
        setDatasets(randomData);
        setReports([]);
      }
    } catch {
      setError("Failed to load data. Please try again later.");
      setDatasets([]);
      setReports([]);
      setTrendingDatasets([]);
      setRandomDatasets([]);
      setResearchers([]);
      setOrganizations([]);
      setTrendingResearcher(null);
      setTrendingOrganization(null);
      setTrendingDataset(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getAuthData = async () => {
      const userData = await fetchUserData();
      if (userData) {
        setIsAuthenticated(true);
        setUserRole(userData.role || "");
      } else {
        setIsAuthenticated(false);
        setUserRole("");
      }
      fetchData();
    };
    getAuthData();
  }, []);

  const getCategories = (datasetList: Dataset[]) => {
    const categories = Array.from(new Set(datasetList.map((d) => d.category)));
    return categories.sort();
  };

  const homeCategories = isAuthenticated ? getCategories(datasets) : getCategories(randomDatasets);
  const trendingCategories = getCategories(trendingDatasets);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const filteredDatasets = selectedCategory
    ? (isTrending ? trendingDatasets : datasets).filter((d) => d.category === selectedCategory)
    : (isTrending ? trendingDatasets : datasets);

  const DatasetCard = ({ dataset }: { dataset: Dataset }) => (
    <div
      className="border border-gray-200 rounded-lg p-4 flex-shrink-0 w-full sm:w-72 md:w-64 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleDatasetClick(dataset.dataset_id)}
    >
      <img
        src={`https://picsum.photos/300/200?random=${dataset.dataset_id}`}
        alt={dataset.title}
        className="w-full h-32 object-cover rounded-md mb-2"
      />
      <h3 className="text-sm sm:text-md font-semibold text-gray-900 truncate">{dataset.title}</h3>
      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{dataset.description}</p>
      <p className="text-xs text-gray-500 mt-1">By {dataset.organization_name}</p>
    </div>
  );

  const ReportCard = ({ report }: { report: PublishedResearch }) => (
    <div
      className="border border-gray-200 rounded-lg p-4 flex-shrink-0 w-full sm:w-72 md:w-64 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleReportClick(report.research_submission.id)}
    >
      <img
        src={`https://picsum.photos/300/200?random=${report.research_submission.id}`}
        alt={report.research_submission.title}
        className="w-full h-32 object-cover rounded-md mb-2"
      />
      <h3 className="text-sm sm:text-md font-semibold text-gray-900 truncate">{report.research_submission.title}</h3>
      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{report.research_submission.description}</p>
      <p className="text-xs text-gray-500 mt-1">By {report.research_submission.researcher_email}</p>
    </div>
  );

  const UserCard = ({ user }: { user: Researcher }) => (
    <div className="border border-gray-200 rounded-lg p-4 flex-shrink-0 w-full sm:w-72 md:w-64 cursor-pointer hover:shadow-md transition-shadow">
      <Link href={`/researcher/profile/${user.id}`}>
        <div className="flex items-center gap-3">
          {user.profile_picture ? (
            <img src={user.profile_picture} alt={user.username} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg sm:text-xl">
              {capitalize(user.first_name)[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-md font-semibold text-gray-900 truncate">{`${capitalize(user.first_name)} ${capitalize(user.sur_name)}`}</h3>
            <p className="text-xs sm:text-sm text-gray-500 truncate">@{user.username}</p>
          </div>
        </div>
      </Link>
    </div>
  );

  const OrgCard = ({ org }: { org: Organization }) => (
    <div className="border border-gray-200 rounded-lg p-4 flex-shrink-0 w-full sm:w-72 md:w-64 cursor-pointer hover:shadow-md transition-shadow">
      <Link href={`/organisation/profile/${org.Organization_id}`}>
        <div className="flex items-center gap-3">
          {org.profile_picture ? (
            <img src={org.profile_picture} alt={org.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg sm:text-xl">
              {capitalize(org.name)[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-md font-semibold text-gray-900 truncate">{capitalize(org.name)}</h3>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{org.email}</p>
          </div>
        </div>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50  flex flex-col dark:bg-gray-900">
      <div className="flex flex-col lg:flex-row flex-1 px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <main className="flex-1 w-full max-w-full lg:max-w-2xl bg-white dark:bg-gray-900 shadow-md rounded-lg">
          <header className="w-full bg-white shadow-md dark:bg-gray-900 flex justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search datasets, reports, users, or more..."
                className="w-full p-2 sm:p-3 pl-8 sm:pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-600 text-gray-900 text-sm sm:text-base"
              />
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              {isDropdownOpen && suggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.datasets.map((dataset) => (
                    <div
                      key={dataset.dataset_id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm sm:text-base"
                      onClick={() => handleSuggestionClick(dataset)}
                    >
                      <span className="font-semibold">{dataset.title}</span> (Dataset)
                    </div>
                  ))}
                  {suggestions.reports?.map((report) => (
                    <div
                      key={report.research_submission.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm sm:text-base"
                      onClick={() => handleSuggestionClick(report)}
                    >
                      <span className="font-semibold">{report.research_submission.title}</span> (Report)
                    </div>
                  ))}
                  {suggestions.users.map((user) => (
                    <div
                      key={user.username}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm sm:text-base"
                      onClick={() => handleSuggestionClick(user)}
                    >
                      <span className="font-semibold">{`${capitalize(user.first_name)} ${capitalize(user.sur_name)}`}</span> (@{user.username})
                    </div>
                  ))}
                  {suggestions.organizations.map((org) => (
                    <div
                      key={org.email}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm sm:text-base"
                      onClick={() => handleSuggestionClick(org)}
                    >
                      <span className="font-semibold">{capitalize(org.name)}</span> (Org)
                    </div>
                  ))}
                  {suggestions.datasets.length === 0 &&
                    (!suggestions.reports || suggestions.reports.length === 0) &&
                    suggestions.users.length === 0 &&
                    suggestions.organizations.length === 0 && (
                      <div className="p-2 text-gray-500 text-sm sm:text-base">No suggestions found</div>
                    )}
                </div>
              )}
            </div>
          </header>
          <nav className="flex px-4 sm:px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200">
            <div className="flex items-center justify-between w-full flex-col sm:flex-row gap-4 sm:gap-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setIsTrending(false); setSelectedCategory(null); }}
                  className={`text-gray-700 hover:text-orange-600 font-medium px-3 py-1 rounded-full text-sm sm:text-base ${!isTrending ? "bg-orange-100 text-orange-600" : ""}`}
                >
                  Home
                </button>
                <button
                  onClick={() => { setIsTrending(true); setSelectedCategory(null); }}
                  className={`flex items-center gap-1 text-gray-700 hover:text-orange-600 font-medium px-3 py-1 rounded-full text-sm sm:text-base ${isTrending ? "bg-orange-100 text-orange-600" : ""}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending</span>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center text-sm">
                {trendingDataset && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 hidden sm:inline">Trending Dataset:</span>
                    <Link
                      href={`/datasets/description?id=${trendingDataset.dataset_id}`}
                      className="font-semibold text-orange-600 hover:underline truncate max-w-[150px] sm:max-w-none"
                    >
                      {trendingDataset.title}
                    </Link>
                  </div>
                )}
                {trendingResearcher && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 hidden sm:inline">Trending Researcher:</span>
                    <Link
                      href={`/researcher/profile/${trendingResearcher.id}`}
                      className="font-semibold text-orange-600 hover:underline truncate max-w-[150px] sm:max-w-none"
                    >
                      {`${capitalize(trendingResearcher.first_name)} ${capitalize(trendingResearcher.sur_name)}`}
                    </Link>
                  </div>
                )}
                {trendingOrganization && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 hidden sm:inline">Trending Org:</span>
                    <Link
                      href={`/organisation/profile/${trendingOrganization.Organization_id}`}
                      className="font-semibold text-orange-600 hover:underline truncate max-w-[150px] sm:max-w-none"
                    >
                      {capitalize(trendingOrganization.name)}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
          <div className="px-4 sm:px-6 py-4">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Categories</h2>
              <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(isTrending ? trendingCategories : homeCategories).map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-sm sm:text-base font-medium ${
                      selectedCategory === category
                        ? "bg-orange-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                    }`}
                  >
                    {capitalize(category)}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-orange-600 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                </svg>
                <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading content...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600 text-sm sm:text-base">{error}</div>
            ) : (
              <>
                {isTrending ? (
                  <>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Trending Datasets</h2>
                    {filteredDatasets.length ? (
                      <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {filteredDatasets.map((dataset) => <DatasetCard key={dataset.dataset_id} dataset={dataset} />)}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm sm:text-base">No trending datasets available.</p>
                    )}
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mt-6 mb-2">Trending Researchers</h2>
                    {researchers.length ? (
                      <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {researchers.map((user) => <UserCard key={user.username} user={user} />)}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm sm:text-base">No trending researchers available.</p>
                    )}
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mt-6 mb-2">Trending Organizations</h2>
                    {organizations.length ? (
                      <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {organizations.map((org) => <OrgCard key={org.email} org={org} />)}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm sm:text-base">No trending organizations available.</p>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      {isAuthenticated && userRole !== "researcher" ? "Random Datasets" : "Related Datasets"}
                    </h2>
                    {filteredDatasets.length ? (
                      <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {filteredDatasets.map((dataset) => <DatasetCard key={dataset.dataset_id} dataset={dataset} />)}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm sm:text-base">No datasets available.</p>
                    )}
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mt-6 mb-2">
                      {isAuthenticated && userRole !== "researcher" ? "Random Reports" : "Reports from Followed Researchers"}
                    </h2>
                    {isAuthenticated && reports.length ? (
                      <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {reports.map((report) => <ReportCard key={report.research_submission.id} report={report} />)}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm sm:text-base">
                        {isAuthenticated && userRole === "researcher"
                          ? "No reports from followed researchers yet."
                          : isAuthenticated
                          ? "No random reports available."
                          : "Sign in to see reports from researchers you follow or random reports."}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
        <aside className="w-full lg:w-80 bg-white shadow-md rounded-lg p-4 sm:p-6 dark:bg-gray-900 dark:text-gray-100">
          {!isAuthenticated ? (
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Join Us</h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Sign in to follow researchers and see their reports!</p>
              <Link href="/auth/sign-in" className={buttonVariants({ size: "lg", className: "bg-orange-600 text-white hover:bg-orange-700 w-full text-sm sm:text-base" })}>
                Sign In
              </Link>
              <div className="mt-6 sm:mt-8 dark:bg-gray-900">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Top Researchers</h2>
                {researchers.length ? (
                  <ul className="space-y-4">
                    {researchers.map((researcher) => (
                      <li key={researcher.username} className="flex items-center gap-3 text-gray-700">
                        {researcher.profile_picture ? (
                          <img src={researcher.profile_picture} alt={`${researcher.first_name} ${researcher.sur_name}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg sm:text-xl">
                            {capitalize(researcher.first_name)[0]}
                          </div>
                        )}
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="font-bold text-sm sm:text-base truncate">{`${capitalize(researcher.first_name)} ${capitalize(researcher.sur_name)}`}</span>
                          <span className="text-xs sm:text-sm text-gray-500 truncate">@{researcher.username}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-sm sm:text-base">No researchers available.</p>
                )}
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mt-6 mb-4">Top Organizations</h2>
                {organizations.length ? (
                  <ul className="space-y-4">
                    {organizations.map((organization) => (
                      <li key={organization.email} className="flex items-center gap-3 text-gray-700">
                        {organization.profile_picture ? (
                          <img src={organization.profile_picture} alt={organization.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg sm:text-xl">
                            {capitalize(organization.name)[0]}
                          </div>
                        )}
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="font-bold text-sm sm:text-base truncate">{capitalize(organization.name)}</span>
                          <span className="text-xs sm:text-sm text-gray-500 truncate">{organization.email}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-sm sm:text-base">No organizations available.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 sm:mb-8 ">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Researchers to Follow</h2>
                {researchers.length ? (
                  <ul className="space-y-4">
                    {researchers.map((researcher) => (
                      <Link href={`/researcher/profile/${researcher.id}`} key={researcher.username}>
                        <li className="flex items-center gap-3 text-gray-700 hover:text-orange-600 cursor-pointer space-y-3">
                          {researcher.profile_picture ? (
                            <img src={researcher.profile_picture} alt={`${researcher.first_name} ${researcher.sur_name}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg sm:text-xl">
                              {capitalize(researcher.first_name)[0]}
                            </div>
                          )}
                          <div className="flex-1 flex flex-col min-w-0">
                            <span className="font-bold text-sm sm:text-base truncate">{`${capitalize(researcher.first_name)} ${capitalize(researcher.sur_name)}`}</span>
                            <span className="text-xs sm:text-sm text-gray-500 truncate">@{researcher.username}</span>
                          </div>
                        </li>
                      </Link>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-sm sm:text-base">No researchers available.</p>
                )}
              </div>
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Researchers to Follow</h2>
                {organizations.length ? (
                  <ul className="space-y-4">
                    {organizations.map((organization) => (
                      <Link href={`/organisation/profile/${organization.Organization_id}`} key={organization.email}>
                        <li className="flex items-center gap-3 text-gray-700 hover:text-orange-600 cursor-pointer p-1">
                          {organization.profile_picture ? (
                            <img src={organization.profile_picture} alt={organization.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center  text-white text-lg sm:text-xl">
                              {capitalize(organization.name)[0]}
                            </div>
                          )}
                          <div className="flex-1 flex flex-col min-w-0">
                            <span className="font-bold text-sm sm:text-base truncate">{capitalize(organization.name)}</span>
                            <span className="text-xs sm:text-sm text-gray-500 truncate">{organization.email}</span>
                          </div>
                        </li>
                      </Link>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-sm sm:text-base">No organizations available.</p>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}