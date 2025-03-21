"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"
import { Star } from "lucide-react"
import Link from "next/link"

interface Dataset {
  dataset_id: string
  title: string
  description: string
  view_count: number
  contributor_id__organization__name: string
  category: string
  tags: string
}

export default function DatasetDetailPage({ params }: { params: { dataset_id: string } }) {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [rating, setRating] = useState(0)

  useEffect(() => {
    const fetchDatasetDetails = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/${params.dataset_id}/`)
        if (!response.ok) throw new Error("Failed to fetch dataset details")
        const data = await response.json()
        setDataset(data)
      } catch (error) {
        console.error("Error fetching dataset details:", error)
      }
    }

    fetchDatasetDetails()
  }, [params.dataset_id])

  if (!dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">Loading dataset details...</div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 py-12 px-6 md:px-24">
      <h1 className="text-4xl font-bold mb-4" style={{ color: "#f97316" }}>{dataset.title}</h1>
      <p className="mb-6 text-gray-700">{dataset.description}</p>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Rate this dataset:</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={32}
              className={star <= rating ? "text-yellow-400 cursor-pointer" : "text-gray-300 cursor-pointer"}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-600"><span className="font-semibold">Organization:</span> {dataset.contributor_id__organization__name}</p>
        <p className="text-gray-600"><span className="font-semibold">Category:</span> {dataset.category}</p>
        <p className="text-gray-600"><span className="font-semibold">Tags:</span> {dataset.tags}</p>
        <p className="text-gray-600"><span className="font-semibold">Views:</span> {dataset.view_count}</p>
      </div>

      <Link href={`/analyze/${dataset.dataset_id}`}> 
        <button className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors">
          Analyze Dataset
        </button>
      </Link>
    </div>
  )
}
