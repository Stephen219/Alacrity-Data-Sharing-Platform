/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, MouseEvent, SetStateAction } from "react"
import { DatasetCard } from "@/components/all_datasets/datasetCard"
import Link from "next/link"
import { Search, SortAsc, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BACKEND_URL } from "@/config"
import { User } from "@/types/types"
import { fetchWithAuth } from "@/libs/auth"

const fetchUSER = async () => {
  const response = await fetchWithAuth(`${BACKEND_URL}/users/profile/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch user data")
  }

  return response.json()
}

const fetchDatasets = async (orgId: string) => {
  const response = await fetchWithAuth(`${BACKEND_URL}/datasets/all/?org=${orgId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch datasets")
  }

  return response.json()
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<{ 
    dataset_id: string; 
    title: string; 
    description: string; 
    category: string; 
    tags: string[]; 
    created_at: string; 
    organization_name: string; 
    schema?: Record<string, unknown>; 
    view_count: number; 
    price: string; 
    hasPaid: boolean; 
  }[]>([])
  const [filteredDatasets, setFilteredDatasets] = useState<typeof datasets>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState("newest")
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        
        const userData = await fetchUSER()
        setUser(userData)

    
        if (userData?.organization_id) {
          const datasetsData = await fetchDatasets(userData.organization_id)
            
          setDatasets(datasetsData.datasets || [])
          setFilteredDatasets(datasetsData.datasets || [])
        }
      } catch (error) {
      
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])


  useEffect(() => {
    let result = [...datasets]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (dataset) =>
          dataset.title.toLowerCase().includes(term) ||
          dataset.description.toLowerCase().includes(term) ||
          dataset.category.toLowerCase().includes(term) ||
          dataset.tags.some((tag) => tag.toLowerCase().includes(term)),
      )
    }

    // Apply sorting
    switch (sortOption) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "category_asc":
        result.sort((a, b) => a.category.localeCompare(b.category))
        break
      case "category_desc":
        result.sort((a, b) => b.category.localeCompare(a.category))
        break
      default:
        break
    }

    setFilteredDatasets(result)
  }, [searchTerm, sortOption, datasets])

  const handleToggleBookmark = (e: React.MouseEvent<HTMLButtonElement>, datasetId: string) => {
      e.preventDefault()
      e.stopPropagation()
    }

  const handleSearch = (e: { target: { value: SetStateAction<string> } }) => {
    setSearchTerm(e.target.value)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading datasets...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Organization Datasets</h1>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search datasets by title, description, category or tags..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 w-full"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SortAsc size={18} />
              Sort by
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortOption("newest")}>Newest First</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("oldest")}>Oldest First</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("category_asc")}>Category (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("category_desc")}>Category (Z-A)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={18} />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSearchTerm("category1")}>Category 1</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("category2")}>Category 2</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("category3")}>Category 3</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("")}>Clear Filters</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        Showing {filteredDatasets.length} of {datasets.length} datasets
      </div>

      {/* Dataset Grid */}
      {filteredDatasets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((dataset) => (
            <Link href={`/organisation/admin/datasets/${dataset.dataset_id}`} key={dataset.dataset_id} className="cursor-pointer">
              <DatasetCard
                dataset_id={dataset.dataset_id}
                title={dataset.title}
                description={dataset.description}
                organization={dataset.organization_name}
                dateUploaded={new Date(dataset.created_at).toLocaleDateString()}
                imageUrl={`https://picsum.photos/seed/${dataset.dataset_id}/300/200`}
                tags={dataset.tags}
                category={dataset.category}
                entries={Object.keys(dataset.schema || {}).length}
                view_count={dataset.view_count}
                size="Unknown"
                viewMode="grid"
                darkMode={false}
                isBookmarked={false}
                price={Number.parseFloat(dataset.price)}
                hasPaid={dataset.hasPaid}
                onToggleBookmark={(e) => handleToggleBookmark(e, dataset.dataset_id)}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">No datasets found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}