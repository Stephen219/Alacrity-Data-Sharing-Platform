
/**
 * DatasetDetailPage Component
 * 
 * @description This component is responsible for fetching and displaying the details of a specific dataset.
 * It provides functionality for authorized users to edit the dataset's information, including title, description,
 * price, category, and tags. Users can also toggle the dataset's public visibility, delete the dataset, or view
 * users with access to the dataset. The component ensures that only users with valid roles or matching organizations
 * can make modifications.
 * 
 * @param {Promise<{ id: string }>} paramsPromise - A promise resolving to the route parameters, including the dataset ID.
 * 
 * @returns {JSX.Element} The rendered JSX element for the dataset detail page.
 */
/**
 * DatasetDetailPage component
 * @description This component fetches and displays the details of a specific dataset.
 * It allows users to edit the dataset's information, including title, description, price, category, and tags.
 * 
 */




"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"
import { use } from "react"

export default function DatasetDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const id = params.id
  const [loading, setLoading] = useState(true)
  const [is_active, setis_active] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [user, setUser] = useState(null)
  const [dataset, setDataset] = useState(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<{
    title: string
    description: string
    price: string
    category: string
    tags: string[]
  }>({
    title: "",
    description: "",
    price: "0.00",
    category: "",
    tags: [],
  })

  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        const userResponse = await fetchWithAuth(`${BACKEND_URL}/users/profile/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        if (!userResponse.ok) throw new Error("Failed to fetch user data")
        const userData = await userResponse.json()
        setUser(userData)

        const datasetResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        if (!datasetResponse.ok) throw new Error("Failed to fetch dataset")
        const datasetData = await datasetResponse.json()

        if (!datasetData) throw new Error("Dataset not found")

        setDataset(datasetData)

        const validRoles = ["contributor", "organization_admin"]
        const isValidRole = validRoles.includes(userData.role)
        const orgMatch = String(userData.organisation) === String(datasetData.organization)
       

        if (!isValidRole && !orgMatch) {
        
          setError("You are not authorized to edit this dataset")
          return
        }

        setFormData({
          title: datasetData.title || "",
          description: datasetData.description || "",
          price: datasetData.price || "0.00",
          category: datasetData.category || "",
          tags: datasetData.tags || [],
        })
        setis_active(datasetData.is_active || false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleInputChange = (e: { target: { name: string; value: unknown } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddTag = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (newTag.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleDelete = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error("Failed to delete dataset")
      router.push("/datasets")
    } catch (err) {
      setError("Failed to delete dataset: " + (err instanceof Error ? err.message : "An unknown error occurred"))
    }
  }

  const handleTogglePublic = () => {
    setis_active(!is_active)
  }

  const handleSave = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/create_dataset/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: id,
          title: formData.title,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          tags: formData.tags,
          is_active: is_active,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update dataset")
      }
      alert("Dataset updated successfully!")
    } catch (err) {
      setError("Failed to save changes: " + (err instanceof Error ? err.message : "An unknown error occurred"))
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading dataset details...</div>
  }

  if (error || !dataset) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/organisation/admin/datasets")} className="mr-4 bg-orange-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-[#f97316] dark:hover:bg-gray-700">
            
            <ArrowLeft className="mr-2" size={16} />
            Back to Datasets
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="mt-2">{error || "Dataset not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.push("/organisation/admin/datasets")} className="mr-4 bg-orange-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-[#f97316] dark:hover:bg-gray-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Datasets
          </Button>
          <h1 className="text-2xl font-bold">Edit Dataset</h1>
        </div>
        <Button
  variant="outline"
  onClick={() => router.push(`/organisation/admin/datasets/${id}/users_accessing`)}
  className="ml-auto bg-orange-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-[#f97316] dark:hover:bg-gray-700"
>
  View users with access to this dataset
</Button>
      </div>

      <div className="bg-white dark:bg-gray-200 rounded-lg shadow-md p-6">
        <div className="grid gap-6">
          <div>
            <Label htmlFor="title" className="text-lg font-semibold mb-2">
              Title
            </Label>
            <Input id="title" name="title" value={formData.title} onChange={handleInputChange} className="w-full" />
          </div>

          <div>
            <Label htmlFor="description" className="text-lg font-semibold mb-2">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="price" className="text-lg font-semibold mb-2">
              Price
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">Enter 0 for free datasets</p>
          </div>

          <div>
            <Label htmlFor="category" className="text-lg font-semibold mb-2">
              Category
            </Label>
            <Input
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-lg font-semibold mb-2">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag, index) => (
                <div
                  key={`${tag}-${index}`}
                  className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium flex items-center"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-orange-800 hover:text-orange-900">
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a new tag"
                className="flex-1 mr-2"
              />
              <Button onClick={handleAddTag}>Add</Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Switch id="public-view" checked={is_active} onCheckedChange={handleTogglePublic} />
              <Label htmlFor="public-view">Set view in public</Label>
            </div>

            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDelete} className="flex items-center">
                <Trash2 className="mr-2" size={16} />
                Delete Dataset
              </Button>

              <Button onClick={handleSave} className="flex items-center">
                <Save className="mr-2" size={16} />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

