"use client";

import React, { useState, ChangeEvent, useEffect, useCallback, useMemo } from "react";
import { Search, TrendingUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchUserData } from "@/libs/auth";
import debounce from "lodash/debounce";

// Type definitions remain unchanged
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
  // State declarations
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResults | null>(null);
  
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [trendingDatasets, setTrendingDatasets] = useState<Dataset[]>([]);
  const [randomDatasets, setRandomDatasets] = useState<Dataset[]>([]);
  const [reports, setReports] = useState<PublishedResearch[]>([]);
  
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  const [trendingDataset, setTrendingDataset] = useState<Dataset | null>(null);
  const [trendingResearcher, setTrendingResearcher] = useState<Researcher | null>(null);
  const [trendingOrganization, setTrendingOrganization] = useState<Organization | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [isTrending, setIsTrending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Utility functions
  const capitalize = (str: string): string => 
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const getCategories = (datasetList: Dataset[]) => 
    Array.from(new Set(datasetList.map((d) => d.category))).sort();

  // Memoized categories
  const homeCategories = useMemo(() => 
    getCategories(isAuthenticated ? datasets : randomDatasets), 
    [isAuthenticated, datasets, randomDatasets]
  );

  const trendingCategories = useMemo(() => 
    getCategories(trendingDatasets), 
    [trendingDatasets]
  );

  const filteredDatasets = useMemo(() =>
    selectedCategory
      ? (isTrending ? trendingDatasets : datasets).filter((d) => d.category === selectedCategory)
      : (isTrending ? trendingDatasets : datasets),
    [selectedCategory, isTrending, trendingDatasets, datasets]
  );

  // Event handlers
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

  const handleNavigation = (path: string) => {
    if (!isAuthenticated) {
      // Use a more specific message for dataset navigation
      const isDatasetPath = path.includes('/datasets/description');
      alert(isDatasetPath ? "Please sign in to view the dataset." : "Please sign in to continue.");
      router.push("/auth/sign-in");
      return false;
    }
    router.push(path);
    return true;
  };

  const handleSuggestionClick = (item: Dataset | Researcher | Organization | PublishedResearch) => {
    const title = "title" in item ? item.title :
      "username" in item ? `${item.first_name} ${item.sur_name}` :
      "research_submission" in item ? item.research_submission.title : item.name;
    
    setSearchQuery(title);
    setIsDropdownOpen(false);

    if ("dataset_id" in item) handleNavigation(`/datasets/description?id=${item.dataset_id}`);
    else if ("username" in item) handleNavigation(`/researcher/profile/${item.id}`);
    else if ("email" in item) handleNavigation(`/organisation/profile/${item.Organization_id}`);
    else if ("research_submission" in item) handleNavigation(`/researcher/allsubmissions/view/${item.research_submission.id}`);
  };

  // API calls
  const fetchSuggestions = useCallback(
    debounce((query: string) => {
      if (!isAuthenticated || !query.trim()) {
        setSuggestions(null);
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please sign in again.");
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
          if (!response.ok) throw new Error(`Search failed: ${response.status}`);
          return response.json();
        })
        .then((data: SearchResults) => setSuggestions(data))
        .catch((err) => {
          setError(err.message || "Failed to fetch suggestions");
          setSuggestions({ datasets: [], users: [], organizations: [], reports: [] });
        });
    }, 300),
    [isAuthenticated, router]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("access_token");
    const headers = {
      "Content-Type": "application/json",
      ...(isAuthenticated && token && { Authorization: `Bearer ${token}` }),
    };

    try {
      const [trendingRes, usersRes, orgsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/datasets/trending/datasets/`, { headers }),
        fetch(`${BACKEND_URL}/users/trending/`, { headers }),
        fetch(`${BACKEND_URL}/organisation/trending/organizations/`, { headers }),
      ]);

      if (!trendingRes.ok) throw new Error("Failed to fetch trending datasets");
      if (!usersRes.ok) throw new Error("Failed to fetch trending users");
      if (!orgsRes.ok) throw new Error("Failed to fetch trending organizations");

      const [trendingData, usersData, orgsData] = await Promise.all([
        trendingRes.json() as Promise<Dataset[]>,
        usersRes.json() as Promise<Researcher[]>,
        orgsRes.json() as Promise<Organization[]>,
      ]);

      setTrendingDatasets(trendingData);
      setTrendingDataset(trendingData[0] || null);
      setResearchers(usersData);
      setTrendingResearcher(usersData[0] || null);
      setOrganizations(orgsData);
      setTrendingOrganization(orgsData[0] || null);

      if (isAuthenticated) {
        if (userRole === "researcher") {
          const [datasetsRes, reportsRes] = await Promise.all([
            fetch(`${BACKEND_URL}/datasets/get_datasets/all`, { headers }),
            fetch(`${BACKEND_URL}/research/followed-reports/`, { headers }),
          ]);

          if (!datasetsRes.ok) throw new Error("Failed to fetch datasets");
          if (!reportsRes.ok) throw new Error("Failed to fetch reports");

          const [datasetsData, reportsData] = await Promise.all([
            datasetsRes.json() as Promise<Dataset[]>,
            reportsRes.json() as Promise<PublishedResearch[]>,
          ]);

          setDatasets(datasetsData);
          setReports(reportsData);
        } else {
          const [randomDatasetsRes, randomReportsRes] = await Promise.all([
            fetch(`${BACKEND_URL}/datasets/random/datasets/`, { headers }),
            fetch(`${BACKEND_URL}/research/random-reports/`, { headers }),
          ]);

          if (!randomDatasetsRes.ok) throw new Error("Failed to fetch random datasets");
          if (!randomReportsRes.ok) throw new Error("Failed to fetch random reports");

          const [randomDatasetsData, randomReportsData] = await Promise.all([
            randomDatasetsRes.json() as Promise<Dataset[]>,
            randomReportsRes.json() as Promise<PublishedResearch[]>,
          ]);

          setRandomDatasets(randomDatasetsData);
          setDatasets(randomDatasetsData);
          setReports(randomReportsData);
        }
      } else {
        const randomRes = await fetch(`${BACKEND_URL}/datasets/random/datasets/`, { headers });
        if (!randomRes.ok) throw new Error("Failed to fetch random datasets");
        const randomData = await randomRes.json() as Dataset[];
        setRandomDatasets(randomData);
        setDatasets(randomData);
        setReports([]);
      }
    } catch (err) {
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
  }, [isAuthenticated, userRole]);

  // Component logic
  useEffect(() => {
    const initialize = async () => {
      const userData = await fetchUserData();
      setIsAuthenticated(!!userData);
      setUserRole(userData?.role || "");
      fetchData();
    };
    initialize();
  }, [fetchData]);

  const handleViewAll = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Component definitions
  const Card = <T,>({
    item,
    renderContent,
    onClick,
    isExpanded = false,
  }: {
    item: T;
    renderContent: (item: T) => JSX.Element;
    onClick?: () => void;
    isExpanded?: boolean;
  }) => (
    <div
      className={`border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isExpanded ? "w-full" : "flex-shrink-0 w-full sm:w-72 md:w-64"
      }`}
      onClick={onClick}
    >
      {renderContent(item)}
    </div>
  );

  const DatasetCard = ({ dataset, isExpanded = false }: { dataset: Dataset; isExpanded?: boolean }) => (
    <Card
      item={dataset}
      onClick={() => handleNavigation(`/datasets/description?id=${dataset.dataset_id}`)}
      renderContent={(d) => (
        <>
          <img
            src={`https://picsum.photos/300/200?random=${d.dataset_id}`}
            alt={d.title}
            className="w-full h-32 object-cover rounded-md mb-2"
          />
          <h3 className="text-sm sm:text-md font-semibold text-gray-900 truncate">{d.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{d.description}</p>
          <p className="text-xs text-gray-500 mt-1">By {d.organization_name}</p>
        </>
      )}
      isExpanded={isExpanded}
    />
  );

  const ReportCard = ({ report, isExpanded = false }: { report: PublishedResearch; isExpanded?: boolean }) => (
    <Card
      item={report}
      onClick={() => handleNavigation(`/researcher/allsubmissions/view/${report.research_submission.id}`)}
      renderContent={(r) => (
        <>
          <img
            src={`https://picsum.photos/300/200?random=${r.research_submission.id}`}
            alt={r.research_submission.title}
            className="w-full h-32 object-cover rounded-md mb-2"
          />
          <h3 className="text-sm sm:text-md font-semibold text-gray-900 truncate">{r.research_submission.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{r.research_submission.description}</p>
          <p className="text-xs text-gray-500 mt-1">By {r.research_submission.researcher_email}</p>
        </>
      )}
      isExpanded={isExpanded}
    />
  );

  const UserCard = ({ user, isExpanded = false }: { user: Researcher; isExpanded?: boolean }) => (
    <Card
      item={user}
      renderContent={(u) => (
        <Link href={`/researcher/profile/${u.id}`}>
          <div className="flex items-center gap-3">
            {u.profile_picture ? (
              <img src={u.profile_picture} alt={u.username} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg sm:text-xl">
                {capitalize(u.first_name)[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-md font-semibold text-gray-900 truncate">{`${capitalize(u.first_name)} ${capitalize(u.sur_name)}`}</h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">@{u.username}</p>
            </div>
          </div>
        </Link>
      )}
      isExpanded={isExpanded}
    />
  );

  const OrgCard = ({ org, isExpanded = false }: { org: Organization; isExpanded?: boolean }) => (
    <Card
      item={org}
      renderContent={(o) => (
        <Link href={`/organisation/profile/${o.Organization_id}`}>
          <div className="flex items-center gap-3">
            {o.profile_picture ? (
              <img src={o.profile_picture} alt={o.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg sm:text-xl">
                {capitalize(o.name)[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-md font-semibold text-gray-900 truncate">{capitalize(o.name)}</h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{o.email}</p>
            </div>
          </div>
        </Link>
      )}
      isExpanded={isExpanded}
    />
  );

  // Section component with consistent behavior
  const Section = <T,>({
    title,
    items,
    renderItem,
    sectionKey,
  }: {
    title: string;
    items: T[];
    renderItem: (item: T, isExpanded?: boolean) => JSX.Element;
    sectionKey: string;
  }) => {
    if (expandedSection === sectionKey) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={() => setExpandedSection(null)}
              className="text-orange-600 hover:underline text-base"
            >
              Back
            </button>
          </div>
          <div className="space-y-4">
            {items.map((item, index) => (
              <React.Fragment key={index}>{renderItem(item, true)}</React.Fragment>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
        {items.length ? (
          <>
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {items.slice(0, 5).map((item, index) => (
                <React.Fragment key={index}>{renderItem(item)}</React.Fragment>
              ))}
            </div>
            {items.length > 5 && (
              <button
                onClick={() => handleViewAll(sectionKey)}
                className="mt-4 w-full text-orange-600 hover:underline text-base text-center"
              >
                View All
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-600">No {title.toLowerCase()} available.</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {expandedSection ? (
        // Render only the expanded section
        <>
          {expandedSection === "trendingDatasets" && (
            <Section
              title="Trending Datasets"
              items={filteredDatasets}
              renderItem={(dataset, isExpanded) => <DatasetCard dataset={dataset} isExpanded={isExpanded} />}
              sectionKey="trendingDatasets"
            />
          )}
          {expandedSection === "trendingResearchers" && (
            <Section
              title="Trending Researchers"
              items={researchers}
              renderItem={(user, isExpanded) => <UserCard user={user} isExpanded={isExpanded} />}
              sectionKey="trendingResearchers"
            />
          )}
          {expandedSection === "trendingOrganizations" && (
            <Section
              title="Trending Organizations"
              items={organizations}
              renderItem={(org, isExpanded) => <OrgCard org={org} isExpanded={isExpanded} />}
              sectionKey="trendingOrganizations"
            />
          )}
          {expandedSection === "homeDatasets" && (
            <Section
              title={isAuthenticated && userRole !== "researcher" ? "Random Datasets" : "Related Datasets"}
              items={filteredDatasets}
              renderItem={(dataset, isExpanded) => <DatasetCard dataset={dataset} isExpanded={isExpanded} />}
              sectionKey="homeDatasets"
            />
          )}
          {expandedSection === "homeReports" && isAuthenticated && (
            <Section
              title={userRole !== "researcher" ? "Random Reports" : "Reports from Followed Researchers"}
              items={reports}
              renderItem={(report, isExpanded) => <ReportCard report={report} isExpanded={isExpanded} />}
              sectionKey="homeReports"
            />
          )}
        </>
      ) : (
        // Normal layout with header, nav, main, and aside
        <div className="flex flex-col lg:flex-row flex-1 px-4 sm:px-6 lg:px-8 py-6 gap-6">
          <main className="flex-1 w-full max-w-full lg:max-w-3xl bg-white shadow-md rounded-lg">
            <header className="w-full bg-white shadow-md flex justify-center p-4 sticky top-0 z-10">
              <div className="relative w-full max-w-2xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder="Search datasets, reports, users, or more..."
                  className="w-full p-3 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-600 text-gray-900"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                {isDropdownOpen && suggestions && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {[...suggestions.datasets, ...(suggestions.reports || []), ...suggestions.users, ...suggestions.organizations].map((item, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSuggestionClick(item)}
                      >
                        <span className="font-semibold">
                          {"title" in item ? item.title :
                           "username" in item ? `${capitalize(item.first_name)} ${capitalize(item.sur_name)}` :
                           "research_submission" in item ? item.research_submission.title : capitalize(item.name)}
                        </span>
                        {"dataset_id" in item && " (Dataset)"}
                        {"research_submission" in item && " (Report)"}
                        {"username" in item && ` (@${item.username})`}
                        {"email" in item && " (Org)"}
                      </div>
                    ))}
                    {suggestions.datasets.length === 0 &&
                      (!suggestions.reports || suggestions.reports.length === 0) &&
                      suggestions.users.length === 0 &&
                      suggestions.organizations.length === 0 && (
                        <div className="p-2 text-gray-500 text-sm">No suggestions found</div>
                      )}
                  </div>
                )}
              </div>
            </header>

            <nav className="flex px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between w-full flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { setIsTrending(false); setSelectedCategory(null); setExpandedSection(null); }}
                    className={`px-4 py-2 rounded-full font-medium ${!isTrending ? "bg-orange-100 text-orange-600" : "text-gray-700 hover:text-orange-600"}`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => { setIsTrending(true); setSelectedCategory(null); setExpandedSection(null); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${isTrending ? "bg-orange-100 text-orange-600" : "text-gray-700 hover:text-orange-600"}`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Trending
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center text-sm">
                  {trendingDataset && (
                    <Link href={`/datasets/description?id=${trendingDataset.dataset_id}`} className="text-orange-600 hover:underline truncate">
                      <span className="hidden sm:inline text-gray-500 mr-1">Trending Dataset:</span> {trendingDataset.title}
                    </Link>
                  )}
                  {trendingResearcher && (
                    <Link href={`/researcher/profile/${trendingResearcher.id}`} className="text-orange-600 hover:underline truncate">
                      <span className="hidden sm:inline text-gray-500 mr-1">Trending Researcher:</span> {`${capitalize(trendingResearcher.first_name)} ${capitalize(trendingResearcher.sur_name)}`}
                    </Link>
                  )}
                  {trendingOrganization && (
                    <Link href={`/organisation/profile/${trendingOrganization.Organization_id}`} className="text-orange-600 hover:underline truncate">
                      <span className="hidden sm:inline text-gray-500 mr-1">Trending Org:</span> {capitalize(trendingOrganization.name)}
                    </Link>
                  )}
                </div>
              </div>
            </nav>

            <div className="px-6 py-6">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
                <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-thin">
                  {(isTrending ? trendingCategories : homeCategories).map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full font-medium ${
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
                <div className="text-center py-12">
                  <svg className="animate-spin h-8 w-8 text-orange-600 mx-auto" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  <p className="mt-2 text-gray-600">Loading content...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">{error}</div>
              ) : (
                <>
                  {isTrending ? (
                    <>
                      <Section
                        title="Trending Datasets"
                        items={filteredDatasets}
                        renderItem={(dataset, isExpanded) => <DatasetCard dataset={dataset} isExpanded={isExpanded} />}
                        sectionKey="trendingDatasets"
                      />
                      <Section
                        title="Trending Researchers"
                        items={researchers}
                        renderItem={(user, isExpanded) => <UserCard user={user} isExpanded={isExpanded} />}
                        sectionKey="trendingResearchers"
                      />
                      <Section
                        title="Trending Organizations"
                        items={organizations}
                        renderItem={(org, isExpanded) => <OrgCard org={org} isExpanded={isExpanded} />}
                        sectionKey="trendingOrganizations"
                      />
                    </>
                  ) : (
                    <>
                      <Section
                        title={isAuthenticated && userRole !== "researcher" ? "Random Datasets" : "Related Datasets"}
                        items={filteredDatasets}
                        renderItem={(dataset, isExpanded) => <DatasetCard dataset={dataset} isExpanded={isExpanded} />}
                        sectionKey="homeDatasets"
                      />
                      {isAuthenticated && (
                        <Section
                          title={userRole !== "researcher" ? "Random Reports" : "Reports from Followed Researchers"}
                          items={reports}
                          renderItem={(report, isExpanded) => <ReportCard report={report} isExpanded={isExpanded} />}
                          sectionKey="homeReports"
                        />
                      )}
                      {!isAuthenticated && (
                        <p className="text-gray-600">Sign in to see reports from researchers you follow.</p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </main>

          <aside className="w-full lg:w-80 bg-white shadow-md rounded-lg p-6">
            {!isAuthenticated ? (
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Us</h2>
                <p className="text-gray-600 mb-6">Sign in to follow researchers and see their reports!</p>
                <Link href="/auth/sign-in" className={buttonVariants({ size: "lg", className: "bg-orange-600 text-white hover:bg-orange-700 w-full" })}>
                  Sign In
                </Link>
                <div className="mt-8 space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Researchers</h2>
                    {researchers.length ? (
                      <ul className="space-y-4">
                        {researchers.slice(0, 5).map((researcher) => (
                          <li key={researcher.username} className="flex items-center gap-3">
                            {researcher.profile_picture ? (
                              <img src={researcher.profile_picture} alt={researcher.username} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                                {capitalize(researcher.first_name)[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">{`${capitalize(researcher.first_name)} ${capitalize(researcher.sur_name)}`}</p>
                              <p className="text-sm text-gray-500 truncate">@{researcher.username}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">No researchers available.</p>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Organizations</h2>
                    {organizations.length ? (
                      <ul className="space-y-4">
                        {organizations.slice(0, 5).map((org) => (
                          <li key={org.email} className="flex items-center gap-3">
                            {org.profile_picture ? (
                              <img src={org.profile_picture} alt={org.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                                {capitalize(org.name)[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">{capitalize(org.name)}</p>
                              <p className="text-sm text-gray-500 truncate">{org.email}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">No organizations available.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Who to Follow (Researchers)</h2>
                  {researchers.length ? (
                    <ul className="space-y-4">
                      {researchers.slice(0, 5).map((researcher) => (
                        <Link key={researcher.username} href={`/researcher/profile/${researcher.id}`}>
                          <li className="flex items-center gap-3 hover:text-orange-600">
                            {researcher.profile_picture ? (
                              <img src={researcher.profile_picture} alt={researcher.username} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                                {capitalize(researcher.first_name)[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">{`${capitalize(researcher.first_name)} ${capitalize(researcher.sur_name)}`}</p>
                              <p className="text-sm text-gray-500 truncate">@{researcher.username}</p>
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Who to Follow (Organizations)</h2>
                  {organizations.length ? (
                    <ul className="space-y-4">
                      {organizations.slice(0, 5).map((org) => (
                        <Link key={org.email} href={`/organisation/profile/${org.Organization_id}`}>
                          <li className="flex items-center gap-3 hover:text-orange-600">
                            {org.profile_picture ? (
                              <img src={org.profile_picture} alt={org.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                                {capitalize(org.name)[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">{capitalize(org.name)}</p>
                              <p className="text-sm text-gray-500 truncate">{org.email}</p>
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
      )}
    </div>
  );
}