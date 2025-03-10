/**
 * @fileoverview Researcher dashboard component
 * @package @alacrity/frontend
 * 
 * This component represents the dashboard for researchers, providing an overview of datasets, requests, and active research projects.
 * 
 * @component
 * @example
 * <ResearcherDashboard />
 * 
 * @remarks
 * This component fetches data from the backend and displays various metrics and lists related to the researcher's activities.
 * 
 * @requires React
 * @requires fetchWithAuth from "@/libs/auth"
 * @requires useEffect, useState from "react"
 * @requires BACKEND_URL from "@/config"
 * 
 * @interface DashboardData
 * @property {number} total_datasets - The total number of datasets available.
 * @property {number} total_users - The total number of users.
 * @property {number} pending_requests - The number of pending requests.
 * @property {number} approved_requests - The number of approved requests.
 * 
 * @interface MetricCardProps
 * @property {string} title - The title of the metric.
 * @property {string} value - The value of the metric.
 * @property {string} icon - The icon representing the metric.
 * 
 * @interface DatasetCardProps
 * @property {string} title - The title of the dataset.
 * @property {string} description - A brief description of the dataset.
 * @property {string[]} tags - An array of tags associated with the dataset.
 */
/**
 * @fileoverview Researcher dashboard
 * @package @alacrity/frontend  
 * 
 */
import type React from "react"
import { fetchWithAuth } from "@/libs/auth"
import { useEffect, useState } from "react"
import { BACKEND_URL } from "@/config"

interface DashboardData {
    total_datasets: number;
    total_users: number;
    prnding_requests: number;
    approved_requests: number;
}

const ResearcherDashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null)
    const [, setLoading] = useState(true)
    const [, setError] = useState<unknown>(null)

    const getData = async () => {
        try {
            setLoading(true)
            const response = await fetchWithAuth(`${BACKEND_URL}/users/dashboard`)
            const data = await response.json()
            setData(data)
            console.log(data)
        } catch (error) {
            setError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getData()
    }, [])
    

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Researcher Dashboard</h1>

     
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Datasets Available" 
        value={data?.total_datasets?.toString() || "0"}
        icon="📂" />
        <MetricCard title="Approved Requests" value="24"
         icon="✅" />
        <MetricCard title="Pending Requests" value="16" 
        icon="⏳" />
        <MetricCard title="Ongoing Projects" value="42" 
        icon="📊" />
      </div>

      
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Dataset Feed</h2>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search datasets..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B1A] focus:border-transparent"
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
            {[1, 2, 3, 4, 5].map((item) => (
              <DatasetCard
                key={item}
                title={`Dataset ${item}`}
                description={`Description for Dataset ${item}. This dataset contains...`}
                tags={["Health", "Demographics", "Survey"]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Active Research Table */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Research</h2>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dataset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Research Project {item}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">Dataset {item}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item % 3 === 0
                          ? "bg-green-100 text-green-800"
                          : item % 3 === 1
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-[#FF6B1A] bg-opacity-10 text-[#FF6B1A]"
                      }`}
                    >
                      {item % 3 === 0 ? "Completed" : item % 3 === 1 ? "In Progress" : "Planning"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(Date.now() - item * 86400000).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
}

const DatasetCard: React.FC<DatasetCardProps> = ({ title, description, tags }) => (
  <div className="p-4 border-b border-gray-200 hover:bg-gray-50">
    <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 mb-2">{description}</p>
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="px-2 py-1 text-xs font-medium bg-[#FF6B1A] bg-opacity-10 text-[#FF6B1A] rounded-full"
        >
          {tag}
        </span>
      ))}
    </div>
    <button className="mt-2 px-4 py-2 text-sm font-medium text-white bg-[#FF6B1A] rounded-md hover:bg-opacity-90 transition-colors">
      Request Access
    </button>
  </div>
)

export default ResearcherDashboard

