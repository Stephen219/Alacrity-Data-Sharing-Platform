

"use client"

/**
 * @fileoverview Researcher dashboard
 * @package @alacrity/frontend
 */
import type React from "react"
import { fetchWithAuth } from "@/libs/auth"
import { useEffect, useState } from "react"
import { BACKEND_URL } from "@/config"
import { useRouter } from "next/navigation"
import PublicationTable, { Publication } from "@/components/tables/PublicationTable"
import Link from "next/link"


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
  price: number;
  hasPaid?: boolean; 
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
  const [activeTab, ] = useState("publications")
  const [publications, setPublications] = useState<Publication[]>([])
  const router = useRouter()

  // fetch the datas if published tab is active
  useEffect(() => {
    if (activeTab === "publications") {
      getPublications()
    }
  }, [activeTab])

  const handleNewPublicationClick = () => {
    router.push("/researcher/datasetWithAccess")
  }

    // Fetch publications that are submitted (pending, published, rejected)
    const getPublications = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/research/submissions/submitted`)
        const data = await response.json()
        setPublications(data)
      } catch (error) {
        console.error("Error fetching publications:", error)
      }
    }

    // Conditionally route based on submission status
    const handleRowClick = (pub: Publication) => {
      const status = pub.status.toLowerCase()
      if (status === "pending") return
      if (status === "rejected") {
        router.push(`/researcher/drafts/edit/${pub.id}/`)
      } else {
        router.push(`/researcher/Submissions/view/${pub.id}/`)
      }
    }

    const getRowClass = (pub: Publication) => {
      const status = pub.status.toLowerCase()
      if (status === "pending") {
        return "cursor-default"
      }
      return "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
    }

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
          price: parseFloat(dataset.price) || 0,
          hasPaid: dataset.hasPaid || false,
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("payment") === "success") {
        console.log("Detected PayPal success, re-fetching data...");
        getData();
      }
    }
  }, []);

  
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
    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 dark:text-gray-100">Researcher Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
        <MetricCard title="Datasets Accessed" value={(data?.datasets_accessed || 0).toString()} icon="📂" />
        <MetricCard title="Requests Approved" value={(data?.requests_approved || 0).toString()} icon="✅" />
        <MetricCard title="Pending Reviews" value={(data?.pending_reviews || 0).toString()} icon="⏳" />
        <MetricCard title="Research Submitted" value={(data?.research_submitted || 0).toString()} icon="📊" />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 dark:text-gray-100">Dataset Feed</h2>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B1A] focus:border-transparent"
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
            {filteredDatasets.length > 0 ? (
              filteredDatasets.map((dataset, index) => (
                <DatasetCard
                  key={dataset.dataset_id || `fallback-${index}`}
                  dataset_id={dataset.dataset_id}
                  title={dataset.title}
                  description={dataset.description}
                  tags={dataset.tags}
                  organization={dataset.contributor_id__organization__name}
                  createdAt={dataset.requests__updated_at}
                  price={dataset.price}
                  hasPaid={dataset.hasPaid}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No datasets found </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Research Table */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4 dark:text-gray-100">Research Submissions Feed</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
        </div>


        {/* Publication Tracker Tab */}
        {activeTab === "publications" && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-100">Track and manage your research publications</p>
              <button className="px-4 py-1 text-sm text-white dark:text-gray-100 bg-[#FF6B1A] rounded-md hover:bg-[#e65c0f]"
              onClick={handleNewPublicationClick}>
                New Publication
              </button>
            </div>
            <PublicationTable
              paginated={false}
              publications={publications}
              onRowClick={handleRowClick}
              scrollable={true}
              getRowClass={getRowClass}
            />
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
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-100 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
)

interface DatasetCardProps {
  dataset_id: string
  title: string
  description: string
  tags: string[]
  organization: string 
  createdAt: string 
  price: number
  hasPaid?: boolean
}

const DatasetCard: React.FC<DatasetCardProps> = ({ dataset_id, title, description, tags, organization, createdAt, price, hasPaid = false, }) => {
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

  const handlePayment = async () => {
    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/payments/paypal/payment/${dataset_id}/`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`Payment request failed. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("PayPal Payment creation response:", data);

      if (data.approval_url) {
        // Redirect the user to PayPal for payment approval
        window.location.href = data.approval_url;
      } else if (data.message) {
        // e.g., "Dataset is free, no payment needed."
        alert(data.message);
      } else {
        alert("No PayPal approval URL returned from server.");
      }
    } catch (error) {
      console.error("Error creating PayPal payment:", error);
      alert("Error creating PayPal payment. Check console for details.");
    }
  };


  const renderActionButton = () => {
    if (price > 0 && !hasPaid) {
      // show pay if not purchased
      return (
        <button
          className="mt-2 px-4 py-2 text-sm font-medium text-white dark:text-gray-100 bg-[#FF6B1A] rounded-md"
          onClick={handlePayment}
        >
          Pay £{price.toFixed(2)}
        </button>
      );
    } else {
      // if free or paid show analyse 
      return (
        <Link
  href={`/analyze/${dataset_id}`}
  className="mt-2 px-4 py-2 text-sm font-medium text-white dark:text-gray-100 bg-[#FF6B1A] rounded-md"
  
>
  Analyze
</Link>
      );
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="text-right">
          <div className="text-sm font-medium text-[#FF6B1A] dark:text-gray-100">{organization}</div>
          <div className="text-xs text-gray-500 dark:text-gray-100">{formattedDate}</div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-2 dark:text-gray-100">{description}</p>
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs font-medium bg-[#FF6B1A] bg-opacity-10 text-[#FF6B1A] dark:text-gray-100 rounded-full"
          >
            {tag}
          </span>
        ))}
        {hasMoreTags && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:text-gray-100 rounded-full">
            +{safeTags.length - 3} more
          </span>
        )}
      </div>
      {renderActionButton()}
    </div>
  )
}

export default ResearcherDashboard