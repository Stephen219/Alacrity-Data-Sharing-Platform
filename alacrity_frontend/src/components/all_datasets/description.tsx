"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BACKEND_URL } from "../../config";
import { fetchWithAuth } from "@/libs/auth";
import { Star, Loader2, ArrowLeft, Send } from "lucide-react";

interface Dataset {
  dataset_id: string;
  title: string;
  contributor_name: string;
  organization_name: string;
  category: string;
  schema: string;
  analysis_link: string;
  description: string;
  tags: string[]; // ✅ Refactored to always be an array of strings
  created_at: string;
  updated_at: string;
}

interface Feedback {
  user__username: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function DatasetDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const datasetId = searchParams.get("id");
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [objective, setObjective] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!datasetId) {
      setError("No dataset ID provided.");
      setLoading(false);
      return;
    }

    const fetchDatasetAndFeedback = async () => {
      try {
        const datasetResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/${datasetId}`);
        if (!datasetResponse.ok) {
          throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`);
        }
        const datasetData: Dataset = await datasetResponse.json();

        // ✅ Normalize tags to always be a string array
        const rawTags = datasetData.tags as string | string[] | undefined;

        datasetData.tags = typeof rawTags === "string"
          ? rawTags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
          : Array.isArray(rawTags)
            ? rawTags
            : [];


        setDataset(datasetData);

        const feedbackResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/feedback/${datasetId}/`);
        if (!feedbackResponse.ok) {
          if (feedbackResponse.status === 404) {
            setFeedbacks([]);
            setAverageRating(0);
          } else {
            throw new Error(`Failed to fetch feedback: ${feedbackResponse.status}`);
          }
        } else {
          const feedbackData: Feedback[] = await feedbackResponse.json();
          setFeedbacks(feedbackData);
          const avg = feedbackData.length > 0
            ? feedbackData.reduce((sum, fb) => sum + fb.rating, 0) / feedbackData.length
            : 0;
          setAverageRating(avg);
        }
      } catch (err) {
        console.error("Error:", err);
        setError(`Error loading data: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasetAndFeedback();
  }, [datasetId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleRequest = async () => {
    if (!dataset || !objective.trim()) {
      setMessage("Please provide an objective.");
      return;
    }
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/requests/makerequest/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: dataset.dataset_id, objective }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create request");
      }
      setMessage("Request created successfully!");
      setObjective("");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message || "Failed to create request.");
      } else {
        setMessage("Failed to create request.");
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRequest();
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">
          <p>{error || "No dataset found."}</p>
          <button
            onClick={() => router.push("/datasets")}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Back to Datasets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 md:px-12 lg:px-24 text-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{dataset.title}</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* Quick Request Form */}
        <div className="mb-8 bg-white p-6 rounded-md shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Request Access</h2>
          <div className="flex flex-col gap-4">
            <textarea
              ref={textareaRef}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Why do you need this dataset? (e.g., research, analysis)"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400 resize-none"
              rows={3}
            />
            <button
              onClick={handleRequest}
              disabled={!objective.trim()}
              className={`self-start px-6 py-2 flex items-center gap-2 rounded-md transition-colors ${
                objective.trim()
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
              Submit Request
            </button>
          </div>
          {message && (
            <p
              className={`mt-2 text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}
            >
              {message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Description</h2>
          <p className="text-gray-700 leading-relaxed">{dataset.description}</p>
        </div>

        {/* Metadata */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <p>
              <span className="font-semibold">Organization:</span> {dataset.organization_name}
            </p>
            <p>
              <span className="font-semibold">Category:</span> {dataset.category}
            </p>
            <p>
              <span className="font-semibold">Date Added:</span>{" "}
              {new Date(dataset.created_at).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Last Updated:</span>{" "}
              {new Date(dataset.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Tags */}
        {dataset.tags.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {dataset.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rating */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Average Rating</h2>
          <div className="flex items-center gap-1">
            {renderStars(averageRating)}
            <span className="text-gray-500 text-sm ml-2">
              ({averageRating.toFixed(1)} / 5 from {feedbacks.length} review{feedbacks.length !== 1 ? "s" : ""})
            </span>
          </div>
        </div>

        {/* Scrollable Feedback/Comments */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">User Reviews</h2>
          {feedbacks.length === 0 ? (
            <p className="text-gray-600">No reviews yet.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
              {feedbacks.map((fb, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{fb.user__username}</span>
                    <div className="flex gap-1">{renderStars(fb.rating)}</div>
                  </div>
                  <p className="text-gray-700">{fb.comment}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(fb.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
