

"use client"

/**
 * @fileoverview Researcher dashboard
 * @package @alacrity/frontend
 */
import type React from "react"
import { fetchWithAuth } from "@/libs/auth"
import { useEffect, useState } from "react"
import { BACKEND_URL } from "@/config"

interface DatasetRequest {
  request_id: string
  dataset_id_id: string
  dataset_id__title: string
  researcher_id__profile_picture: string | null
  request_status: string
  created_at: string
  updated_at: string
}

interface Dataset {
  dataset_id: string
  title: string
  description: string
  tags: string[]
  contributor_id__organization__name: string 
  requests__updated_at: string 
  category: string
}

interface DashboardData {
  datasets_accessed: number
  pending_reviews: number
  research_submitted: number
  requests_approved: number
  all_datasets_requests: DatasetRequest[]
  datasets_having_access: Dataset[]
}

const ResearcherDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("publications")

  const getData = async () => {
    try {
      setLoading(true)
      const response = await fetchWithAuth(`${BACKEND_URL}/users/dashboard`)
      const data = await response.json()
     
      const mappedData = {
        ...data,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        datasets_having_access: data.datasets_having_access.map((dataset: any) => ({
          dataset_id: dataset.dataset_id,
          title: dataset.title,
          description: dataset.description,
          tags: dataset.tags,
          contributor_id__organization__name: dataset.contributor_id__organization__name,
          requests__updated_at: dataset.requests__updated_at,
          category: dataset.category,
        })),
      }
      setData(mappedData)
      console.log("API Data:", data)
      console.log("Mapped Datasets Having Access:", mappedData.datasets_having_access)
    } catch (error) {
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getData()
  }, [])

  
  const sampleDatasets: Dataset[] = [
    
  ]


  const datasetsToDisplay = data?.datasets_having_access?.length ? data.datasets_having_access : sampleDatasets


  const filteredDatasets =
    searchQuery.trim() === ""
      ? datasetsToDisplay
      : datasetsToDisplay.filter((dataset) => {
          const title = dataset.title || ""
          const description = dataset.description || ""
          const organization = dataset.contributor_id__organization__name || ""
          const query = searchQuery.toLowerCase()
          return (
            title.toLowerCase().includes(query) ||
            description.toLowerCase().includes(query) ||
            organization.toLowerCase().includes(query)
          )
        })

  if (loading) return <div className="p-6">Loading dashboard data...</div>
  if (error) return <div className="p-6">Error loading dashboard data. Please try again.</div>

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Researcher Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Datasets Accessed" value={(data?.datasets_accessed || 0).toString()} icon="📂" />
        <MetricCard title="Requests Approved" value={(data?.requests_approved || 0).toString()} icon="✅" />
        <MetricCard title="Pending Reviews" value={(data?.pending_reviews || 0).toString()} icon="⏳" />
        <MetricCard title="Research Submitted" value={(data?.research_submitted || 0).toString()} icon="📊" />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Dataset Feed</h2>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B1A] focus:border-transparent"
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
            {filteredDatasets.length > 0 ? (
              filteredDatasets.map((dataset, index) => (
                <DatasetCard
                  key={dataset.dataset_id || `fallback-${index}`}
                  title={dataset.title}
                  description={dataset.description}
                  tags={dataset.tags}
                  organization={dataset.contributor_id__organization__name}
                  createdAt={dataset.requests__updated_at}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No datasets found </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Research Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab("publications")}
              className={`py-4 px-6 text-sm font-medium whitespace-nowrap ${
                activeTab === "publications"
                  ? "border-b-2 border-[#FF6B1A] text-[#FF6B1A]"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Publication Tracker
            </button>
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`py-4 px-6 text-sm font-medium whitespace-nowrap ${
                activeTab === "recommendations"
                  ? "border-b-2 border-[#FF6B1A] text-[#FF6B1A]"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dataset Recommendations
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-4 px-6 text-sm font-medium whitespace-nowrap ${
                activeTab === "timeline"
                  ? "border-b-2 border-[#FF6B1A] text-[#FF6B1A]"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Research Timeline
            </button>
          </nav>
        </div>

        {/* Dataset Recommendations Tab */}
        {activeTab === "recommendations" && (
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">
              Based on your research interests and recent activity, we recommend these datasets:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: "rec1",
                  name: "Global Climate Data 2023",
                  category: "Environmental Science",
                  relevance: "98% match",
                  users: 342,
                },
                {
                  id: "rec2",
                  name: "Consumer Behavior Survey",
                  category: "Market Research",
                  relevance: "95% match",
                  users: 189,
                },
                {
                  id: "rec3",
                  name: "Healthcare Outcomes Database",
                  category: "Medical Research",
                  relevance: "92% match",
                  users: 276,
                },
                {
                  id: "rec4",
                  name: "Urban Development Metrics",
                  category: "Social Sciences",
                  relevance: "90% match",
                  users: 124,
                },
                {
                  id: "rec5",
                  name: "Technology Adoption Patterns",
                  category: "Technology",
                  relevance: "88% match",
                  users: 231,
                },
                {
                  id: "rec6",
                  name: "Financial Markets Analysis",
                  category: "Economics",
                  relevance: "85% match",
                  users: 198,
                },
              ].map((dataset) => (
                <div key={dataset.id} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{dataset.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-[#FF6B1A]">{dataset.relevance}</span>
                    <span className="text-xs text-gray-500">{dataset.users} researchers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">Upcoming research milestones and deadlines:</p>
            <div className="space-y-4">
              {[
                {
                  id: "tl1",
                  event: "Research Proposal Deadline",
                  project: "Urban Data Analysis",
                  date: "May 15, 2023",
                  daysLeft: 12,
                },
                {
                  id: "tl2",
                  event: "Interim Results Presentation",
                  project: "Consumer Behavior Study",
                  date: "June 3, 2023",
                  daysLeft: 31,
                },
                {
                  id: "tl3",
                  event: "Data Collection Phase End",
                  project: "Healthcare Metrics",
                  date: "June 20, 2023",
                  daysLeft: 48,
                },
                {
                  id: "tl4",
                  event: "Final Report Submission",
                  project: "Market Analysis",
                  date: "July 10, 2023",
                  daysLeft: 68,
                },
              ].map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 h-12 w-12 bg-[#FF6B1A] bg-opacity-10 rounded-full flex items-center justify-center text-[#FF6B1A] font-bold">
                    {milestone.daysLeft}d
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">{milestone.event}</h3>
                    <p className="text-sm text-gray-500">{milestone.project}</p>
                    <p className="text-xs text-[#FF6B1A]">Due: {milestone.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publication Tracker Tab */}
        {activeTab === "publications" && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-500">Track and manage your research publications</p>
              <button className="px-4 py-1 text-sm text-white bg-[#FF6B1A] rounded-md hover:bg-[#e65c0f]">
                New Publication
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Journal/Conference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metrics
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    {
                      id: "pub1",
                      title: "Analysis of Consumer Behavior Patterns in E-commerce",
                      venue: "Journal of Consumer Research",
                      status: "Published",
                      metrics: { citations: 12, downloads: 345 },
                    },
                    {
                      id: "pub2",
                      title: "Predictive Modeling for Healthcare Outcomes",
                      venue: "International Conference on Health Informatics",
                      status: "Under Review",
                      metrics: { citations: 0, downloads: 0 },
                    },
                    {
                      id: "pub3",
                      title: "Impact of Social Media on Market Trends",
                      venue: "Digital Marketing Quarterly",
                      status: "Revision Needed",
                      metrics: { citations: 0, downloads: 0 },
                    },
                    {
                      id: "pub4",
                      title: "Machine Learning Approaches to Data Analysis",
                      venue: "Data Science Journal",
                      status: "Draft",
                      metrics: { citations: 0, downloads: 0 },
                    },
                  ].map((publication) => (
                    <tr key={publication.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {publication.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{publication.venue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            publication.status === "Published"
                              ? "bg-green-100 text-green-800"
                              : publication.status === "Under Review"
                              ? "bg-blue-100 text-blue-800"
                              : publication.status === "Revision Needed"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {publication.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {publication.status === "Published" ? (
                          <div>
                            <span className="mr-3">📊 {publication.metrics.citations} citations</span>
                            <span>📥 {publication.metrics.downloads} downloads</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No metrics available</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-[#FF6B1A] hover:text-[#e65c0f] mr-3">View</button>
                        <button className="text-[#FF6B1A] hover:text-[#e65c0f]">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  icon: string
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon }) => (
  <div className="bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-[#FF6B1A] bg-opacity-10 rounded-md p-3">
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
)

interface DatasetCardProps {
  title: string
  description: string
  tags: string[]
  organization: string 
  createdAt: string 
}

const DatasetCard: React.FC<DatasetCardProps> = ({ title, description, tags, organization, createdAt }) => {
  let formattedDate = "Unknown Date"
  if (createdAt) {
    const date = new Date(createdAt)
    if (!isNaN(date.getTime())) {
      formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
  }

  
  const safeTags = Array.isArray(tags) ? tags : []
  const displayTags = safeTags.slice(0, 3)
  const hasMoreTags = safeTags.length > 3

  return (
    <div className="p-4 border-b border-gray-200 hover:bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className="text-right">
          <div className="text-sm font-medium text-[#FF6B1A]">{organization}</div>
          <div className="text-xs text-gray-500">{formattedDate}</div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-2">{description}</p>
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs font-medium bg-[#FF6B1A] bg-opacity-10 text-[#FF6B1A] rounded-full"
          >
            {tag}
          </span>
        ))}
        {hasMoreTags && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            +{safeTags.length - 3} more
          </span>
        )}
      </div>
      <button className="mt-2 px-4 py-2 text-sm font-medium text-white bg-[#FF6B1A] rounded-md hover:bg-opacity-90 transition-colors">
        Analyze
      </button>
    </div>
  )
}

export default ResearcherDashboard