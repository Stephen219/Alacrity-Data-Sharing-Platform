"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"
import { Star } from "lucide-react"
import Link from "next/link"

interface Dataset {
  dataset_id: string
  title: string
  description: string
}

export default function DatasetDetailPage({ params }: { params: { dataset_id: string } }) {
  const router = useRouter()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<string[]>([])

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

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      setComments([...comments, comment.trim()])
      setComment("")
    }
  }

  if (!dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading dataset details...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 py-12 px-6 md:px-24 relative">

      {/* Title and Analyze button side by side */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-black">{dataset.title}</h1>
        <Link href={`/analyze/${dataset.dataset_id}`}>
          <button className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors">
            Analyze Dataset
          </button>
        </Link>
      </div>

      {/* Description */}
      <p className="mb-6 text-gray-700">{dataset.description}</p>

      {/* Comment Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">leave a review</h2>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your comment here..."
          className="w-full p-4 border border-gray-300 rounded-md mb-4"
          rows={4}
        />
        <button
          onClick={handleCommentSubmit}
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Submit Comment
        </button>

        {/* Displaying comments */}
        <div className="mt-6">
          {comments.map((c, index) => (
            <p key={index} className="bg-gray-100 p-3 rounded mb-2">{c}</p>
          ))}
        </div>
      </div>

      {/* Rating Section */}
      <div className="mb-24">
        <h2 className="text-2xl font-semibold mb-2">Rate this dataset:</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={32}
              className={`cursor-pointer ${
                star <= rating ? "fill-black text-black stroke-black" : "text-gray-300"
              }`}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>

      {/* Back Button - Bottom Left */}
      <button
        className="absolute bottom-8 left-8 px-6 py-3 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        onClick={() => router.push("/researcher/datasetWithAccess")}
      >
        Back
      </button>

      {/* Raise an Issue Button - Bottom Right */}
      <button
  className="absolute bottom-8 right-8 px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
  onClick={() => router.push(`/chat/${dataset.dataset_id}`)}
>
  Raise an Issue
</button>
    </div>
  )
}
