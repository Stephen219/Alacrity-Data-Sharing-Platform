/* eslint-disable react-hooks/rules-of-hooks */


"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"
import { CSVLink } from "react-csv"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import  { BACKEND_URL } from "@/config"
import { fetchWithAuth } from "@/libs/auth"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)


interface DailyTrend {
  day: string
  views: number
  downloads: number
  bookmarks: number
}

interface RequestStats {
  pending?: number
  approved?: number
  denied?: number
  [key: string]: number | undefined
}

interface DatasetStat {
  dataset_id: string
  title: string
  category: string
  views: number
  downloads: number
  bookmarks: number
  request_count: number
  avg_rating?: number
  feedback_count: number
  chat_count: number
  message_count: number
  purchase_count: number
  size_mb: number
  created_at: string
  contributor_id__first_name: string
  contributor_id__sur_name: string
  contributor_id__organization__name: string
  tags: string[]
}

interface FeedbackDetail {
  dataset__title: string
  user__first_name: string
  user__sur_name: string
  rating: number
  comment: string
  created_at: string
}

interface TopUser {
  user__first_name: string
  user__sur_name: string
  access_count: number
}

interface SubmissionStats {
  draft?: number
  pending?: number
  approved?: number
  rejected?: number
  published?: number
  [key: string]: number | undefined
}

interface PublishedStats {
  total_published: number
  avg_likes?: number
  avg_bookmarks?: number
}

interface PurchaseTrend {
  day: string
  count: number
}

interface PopularDataset {
  title: string
  total_views: number
}

interface PaymentTrend {
  month: string
  dataset__category: string
  total_purchases: number
  total_revenue: number
}

interface TagAnalysis {
  tag: string
  count: number
}

interface Pagination {
  count: number
  next: string | null
  previous: string | null
}

interface MetricsData {
  daily_trends: DailyTrend[]
  request_stats: RequestStats
  avg_approval_days: number
  dataset_stats: DatasetStat[]
  pagination: Pagination
  feedback_details: FeedbackDetail[]
  top_users: TopUser[]
  submission_stats: SubmissionStats
  published_stats: PublishedStats
  purchase_trends: PurchaseTrend[]
  most_popular_datasets: PopularDataset[]
  available_categories: string[]
  payment_trends: PaymentTrend[]
  tag_analysis: TagAnalysis[]
  total_datasets: number
  time_range: string
  category: string | null
  dataset_id: string | null
  error?: string
}

const DatasetMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    datasetId: string
    timeRange: string
    category: string
    paymentMonth: string
    paymentCategory: string
    page: number
  }>({
    datasetId: "",
    timeRange: "Last 30 Days",
    category: "",
    paymentMonth: "",
    paymentCategory: "",
    page: 1,
  })

  const primaryColor = "#0ea5e9" 

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      const query = new URLSearchParams({
        ...(filters.datasetId && { dataset_id: filters.datasetId }),
        time_range: filters.timeRange,
        ...(filters.category && { category: filters.category }),
        ...(filters.paymentMonth && { payment_month: filters.paymentMonth }),
        ...(filters.paymentCategory && { payment_category: filters.paymentCategory }),
        page: filters.page.toString(),
      }).toString()
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/dataset-metrics/page/?${query}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }

      const responseData = await response.json()
      const data: MetricsData = responseData.results || responseData
      setMetrics(data)
    } catch (err) {
      console.error("Fetch error:", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [filters])

  const handleFilterChange = (name: string, value: string) => {
    setFilters({ ...filters, [name]: value, page: 1 })
  }

  const handlePageChange = (direction: "next" | "previous") => {
    if (direction === "next" && metrics?.pagination.next) {
      setFilters({ ...filters, page: filters.page + 1 })
    } else if (direction === "previous" && metrics?.pagination.previous) {
      setFilters({ ...filters, page: filters.page - 1 })
    }
  }

  const resetFilters = () => {
    setFilters({
      datasetId: "",
      timeRange: "Last 30 Days",
      category: "",
      paymentMonth: "",
      paymentCategory: "",
      page: 1,
    })
  }
  const monthOptions = []
  const today = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const label = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`
    monthOptions.push({ value, label })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toISOString().split("T")[0]
  }

  const formatMonth = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}` // e.g., "Apr 2025"
  }


  const csvData = (metrics?.dataset_stats || []).map((ds) => ({
    ID: ds.dataset_id,
    Title: ds.title,
    Category: ds.category,
    Views: ds.views,
    Downloads: ds.downloads,
    Bookmarks: ds.bookmarks,
    Requests: ds.request_count,
    "Avg Rating": ds.avg_rating?.toFixed(1) ?? "N/A",
    Feedback: ds.feedback_count,
    Chats: ds.chat_count,
    Messages: ds.message_count,
    Purchases: ds.purchase_count,
    "Size (MB)": ds.size_mb.toFixed(2),
    Created: new Date(ds.created_at).toLocaleDateString(),
    Contributor: `${ds.contributor_id__first_name} ${ds.contributor_id__sur_name}`,
    Organization: ds.contributor_id__organization__name,
    Tags: (ds.tags || []),
  }))

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <div className="animate-spin h-8 w-8 border-2 border-t-2 border-primary rounded-full"></div>
        <p className="mt-4 text-muted-foreground">Loading metrics...</p>
      </div>
    )
  }

  if (error || metrics?.error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>Error: {error || metrics?.error}</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
          <p>No data available.</p>
        </div>
      </div>
    )
  }

  // Charts Data
  const accessChartData = {
    labels: (metrics.daily_trends || []).map((t) => formatDate(t.day)),
    datasets: [
      {
        label: "Views",
        data: (metrics.daily_trends || []).map((t) => t.views),
        borderColor: primaryColor,
        backgroundColor: "rgba(14, 165, 233, 0.2)",
        fill: true,
      },
      {
        label: "Downloads",
        data: (metrics.daily_trends || []).map((t) => t.downloads),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        fill: true,
      },
    ],
  }

  // Convert request_stats object to array for chart
  const requestStatuses = ["pending", "approved", "denied"]
  const requestChartData = {
    labels: requestStatuses.map((status) => status.charAt(0).toUpperCase() + status.slice(1)),
    datasets: [
      {
        label: "Requests",
        data: requestStatuses.map((status) => metrics.request_stats[status] || 0),
        backgroundColor: [primaryColor, "#10b981", "#ef4444"],
      },
    ],
  }

  const purchaseChartData = {
    labels: (metrics.purchase_trends || []).map((t) => formatDate(t.day)),
    datasets: [
      {
        label: "Purchases",
        data: (metrics.purchase_trends || []).map((t) => t.count),
        borderColor: primaryColor,
        backgroundColor: "rgba(14, 165, 233, 0.2)",
        fill: true,
      },
    ],
  }

  const popularDatasetsChartData = {
    labels: (metrics.most_popular_datasets || []).map((d) => d.title),
    datasets: [
      {
        label: "Views",
        data: (metrics.most_popular_datasets || []).map((d) => d.total_views),
        backgroundColor: primaryColor,
      },
    ],
  }

  const paymentTrendsChartData = {
    labels: Array.from(new Set((metrics.payment_trends || []).map((t) => formatMonth(t.month)))),
    datasets: [
      {
        label: "Total Purchases",
        data: (metrics.payment_trends || []).map((t) => t.total_purchases),
        borderColor: primaryColor,
        backgroundColor: "rgba(14, 165, 233, 0.2)",
        fill: true,
      },
      {
        label: "Total Revenue",
        data: (metrics.payment_trends || []).map((t) => t.total_revenue),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        fill: true,
      },
    ],
  }

  const tagChartData = {
    labels: (metrics.tag_analysis || []).map((t) => t.tag),
    datasets: [
      {
        label: "Tag Count",
        data: (metrics.tag_analysis || []).map((t) => t.count),
        backgroundColor: primaryColor,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: `Trends (${metrics.time_range})` },
    },
    scales: {
      x: { title: { display: true, text: "Date" } },
      y: { title: { display: true, text: "Count" }, beginAtZero: true },
    },
  }

  const barOptions = {
    responsive: true,
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Most Popular Datasets" },
    },
    scales: {
      x: { title: { display: true, text: "Views" } },
      y: { title: { display: true, text: "Dataset" } },
    },
  }

  const requestBarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Request Status" },
    },
  }

  const tagBarOptions = {
    responsive: true,
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Top Tags" },
    },
    scales: {
      x: { title: { display: true, text: "Count" } },
      y: { title: { display: true, text: "Tag" } },
    },
  }

  // Get submission stats keys
  const submissionStatuses = Object.keys(metrics.submission_stats || {})

  return (
    <div className="container mx-auto p-4 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary mb-2">Dataset Metrics Dashboard</h1>
        <p className="text-muted-foreground">Analyze dataset usage, payments, and research activities.</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine the metrics by applying filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Dataset ID</label>
              <Input
                type="text"
                value={filters.datasetId}
                onChange={(e) => handleFilterChange("datasetId", e.target.value)}
                placeholder="Enter dataset ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Range</label>
              <Select value={filters.timeRange} onValueChange={(value) => handleFilterChange("timeRange", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                  <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                  <SelectItem value="Last 90 Days">Last 90 Days</SelectItem>
                  <SelectItem value="This Year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(metrics.available_categories || []).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Month</label>
              <Select value={filters.paymentMonth} onValueChange={(value) => handleFilterChange("paymentMonth", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Category</label>
              <Select
                value={filters.paymentCategory}
                onValueChange={(value) => handleFilterChange("paymentCategory", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(metrics.available_categories || []).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Datasets</p>
              <p className="text-2xl font-bold">{metrics.total_datasets}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Approval Time</p>
              <p className="text-2xl font-bold">{metrics.avg_approval_days.toFixed(1)} days</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Published Research</p>
              <p className="text-2xl font-bold">{metrics.published_stats.total_published}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Dataset Usage Over Time</CardTitle>
            <CardDescription>Number of dataset accesses per day</CardDescription>
          </CardHeader>
          <CardContent>
            {accessChartData.labels.length > 0 ? (
              <Line data={accessChartData} options={chartOptions} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available for this time range.</p>
            )}
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Most Popular Datasets</CardTitle>
            <CardDescription>Top 5 most accessed datasets</CardDescription>
          </CardHeader>
          <CardContent>
            {popularDatasetsChartData.labels.length > 0 ? (
              <Bar data={popularDatasetsChartData} options={barOptions} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No popular datasets available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Analytics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Analytics</CardTitle>
          <CardDescription>Trends in purchases and revenue by month and category</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentTrendsChartData.labels.length > 0 ? (
            <Line data={paymentTrendsChartData} options={chartOptions} />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No payment data available for the selected filters.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
            <CardDescription>Breakdown of dataset request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {requestChartData.datasets[0].data.some((count) => count > 0) ? (
              <Bar data={requestChartData} options={requestBarOptions} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No request data available.</p>
            )}
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Purchase Trends</CardTitle>
            <CardDescription>Daily purchase trends</CardDescription>
          </CardHeader>
          <CardContent>
            {purchaseChartData.labels.length > 0 ? (
              <Line data={purchaseChartData} options={chartOptions} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No purchase data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tag Analysis */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tag Analysis</CardTitle>
          <CardDescription>Top 10 most common tags across datasets</CardDescription>
        </CardHeader>
        <CardContent>
          {tagChartData.labels.length > 0 ? (
            <Bar data={tagChartData} options={tagBarOptions} />
          ) : (
            <p className="text-center text-muted-foreground py-8">No tag data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Dataset Stats with Pagination */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dataset Statistics</CardTitle>
            <CardDescription>Detailed metrics for each dataset</CardDescription>
          </div>
          {csvData.length > 0 && (
            <CSVLink
              data={csvData}
              filename={`dataset-stats-${new Date().toISOString()}.csv`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Export to CSV
            </CSVLink>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-left">Contributor</th>
                  <th className="p-2 text-left">Organization</th>
                  <th className="p-2 text-left">Views</th>
                  <th className="p-2 text-left">Downloads</th>
                  <th className="p-2 text-left">Bookmarks</th>
                  <th className="p-2 text-left">Requests</th>
                  <th className="p-2 text-left">Avg Rating</th>
                  <th className="p-2 text-left">Feedback</th>
                  <th className="p-2 text-left">Purchases</th>
                  <th className="p-2 text-left">Size (MB)</th>
                  <th className="p-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.dataset_stats || []).length > 0 ? (
                  metrics.dataset_stats.map((ds, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <td className="p-2 font-medium">{ds.dataset_id}</td>
                      <td className="p-2">{ds.title}</td>
                      <td className="p-2">{ds.category}</td>
                      <td className="p-2">{`${ds.contributor_id__first_name} ${ds.contributor_id__sur_name}`}</td>
                      <td className="p-2">{ds.contributor_id__organization__name}</td>
                      <td className="p-2">{ds.views}</td>
                      <td className="p-2">{ds.downloads}</td>
                      <td className="p-2">{ds.bookmarks}</td>
                      <td className="p-2">{ds.request_count}</td>
                      <td className="p-2">{ds.avg_rating?.toFixed(1) ?? "N/A"}</td>
                      <td className="p-2">{ds.feedback_count}</td>
                      <td className="p-2">{ds.purchase_count}</td>
                      <td className="p-2">{ds.size_mb.toFixed(2)}</td>
                      <td className="p-2">{new Date(ds.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={14} className="p-4 text-center">
                      No dataset statistics available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              disabled={!metrics.pagination.previous}
              onClick={() => handlePageChange("previous")}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {filters.page} of {Math.ceil((metrics.pagination.count || 0) / 10)}
            </span>
            <Button variant="outline" disabled={!metrics.pagination.next} onClick={() => handlePageChange("next")}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Feedback Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-2 text-left">Dataset</th>
                  <th className="p-2 text-left">User</th>
                  <th className="p-2 text-left">Rating</th>
                  <th className="p-2 text-left">Comment</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.feedback_details || []).length > 0 ? (
                  metrics.feedback_details.map((fb, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <td className="p-2">{fb.dataset__title}</td>
                      <td className="p-2">{`${fb.user__first_name} ${fb.user__sur_name}`}</td>
                      <td className="p-2">{fb.rating}</td>
                      <td className="p-2">{fb.comment}</td>
                      <td className="p-2">{new Date(fb.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">
                      No feedback available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top 10 Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-2 text-left">User</th>
                  <th className="p-2 text-left">Access Count</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.top_users || []).length > 0 ? (
                  metrics.top_users.map((user, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <td className="p-2">{`${user.user__first_name} ${user.user__sur_name}`}</td>
                      <td className="p-2">{user.access_count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-4 text-center">
                      No user data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Submissions & Published Research */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Analysis Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submissionStatuses.map((status) => (
                <div key={status} className="flex justify-between">
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  <span className="font-medium">{metrics.submission_stats[status] ?? 0}</span>
                </div>
              ))}
              {submissionStatuses.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No submission data available.</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Published Research</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Published</span>
                <span className="font-medium">{metrics.published_stats.total_published}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Likes</span>
                <span className="font-medium">{metrics.published_stats.avg_likes?.toFixed(1) ?? "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Bookmarks</span>
                <span className="font-medium">{metrics.published_stats.avg_bookmarks?.toFixed(1) ?? "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legal Disclaimer */}
      <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
        <p>
          <strong>Legal Notice:</strong> Data displayed here is aggregated and anonymized to comply with privacy
          regulations. For detailed user data, please ensure compliance with applicable laws (e.g., GDPR, CCPA).
        </p>
      </div>
    </div>
  )
}

export default DatasetMetrics

