"use client"

import React, { useEffect, useState } from "react"
import PublicationTable, { Publication } from "@/components/PublicationTable"
import { fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"
import { useRouter } from "next/navigation"

const FullPublicationPage: React.FC = () => {
  const [publications, setPublications] = useState<Publication[]>([])
  const router = useRouter()

  const getPublications = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}research/submissions/submitted`)
      const data = await response.json()
      setPublications(data)
    } catch (error) {
      console.error("Error fetching publications:", error)
    }
  }

  useEffect(() => {
    getPublications()
  }, [])

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
      return "cursor-default opacity-50"
    }
    return "cursor-pointer hover:bg-gray-50"
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Research Request: Status</h1>
      {/* For the full page view, we disable scrolling and pagination if desired */}
      <PublicationTable
        publications={publications}
        onRowClick={handleRowClick}
        scrollable={false}
        searchable={true}
        paginated={true}
        getRowClass={getRowClass}
      />
    </div>
  )
}

export default FullPublicationPage
