"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BACKEND_URL } from "../../config";
import { fetchWithAuth } from "@/libs/auth";
import { Star, Loader2, Send, ChevronUp, ChevronDown } from "lucide-react";
import MaxWidthWrapper from "../MaxWidthWrapper";
import { Button } from "../ui/button";

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
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showTags, setShowTags] = useState<boolean>(false);

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
    <section className="py-8 bg-white dark:bg-gray-900 antialiased">
      <MaxWidthWrapper>
        {/* Header with Title & Reviews */}
        <div className="border-b border-gray-200 pb-4 mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {dataset.title}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            {renderStars(averageRating)}
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              ({averageRating.toFixed(1)} / 5, {feedbacks.length} review
              {feedbacks.length !== 1 ? "s" : ""})
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column: Request Form */}
          <div className="flex flex-col text-sm tracking-tight">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Request Access to Dataset:
            </h2>
            <textarea
              id="objective"
              ref={textareaRef}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Provide details on why you would like to access this dataset."
              rows={10}
              className="mt-6 w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-700 
                         text-gray-900 dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-orange-500 
                         resize-none border"
            />
            <div className="mt-6">
              <Button onClick={handleRequest} disabled={!objective.trim()}>
                <Send className="mx-2 w-5 h-5" />
                Submit Request
              </Button>
            </div>
            {message && (
              <p
                className={`mt-4 text-sm ${
                  message.includes("success") ? "text-green-600" : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}
          </div>

          {/* Right column: Dataset Info */}
          <div className="text-sm tracking-tight">
            {/* Description with custom scrollbar */}
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Description
            </h2>
            <div className="mt-2 max-h-[150px] overflow-y-auto p-2 rounded scrollbar-custom">
              <p className="text-gray-600 dark:text-gray-100 break-words">
                {dataset.description}
              </p>
            </div>

            {/* Collapsible Details */}
            <div className="mt-6">
              <button
              aria-label="Toggle Details"
              data-testid="details-toggle"
                className="flex items-center w-full justify-between text-base font-semibold text-gray-900 dark:text-white focus:outline-none"
                onClick={() => setShowDetails((prev) => !prev)}
              >
                <span>Details</span>
                {showDetails ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
              {showDetails && (
                <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                <li>
                  <span className="font-medium">Organization: </span>
                  <span data-testid="organization-name">{dataset.organization_name}</span>
                </li>
                <li>
                  <span className="font-medium">Category: </span>
                  <span>{dataset.category}</span>
                </li>
                <li>
                  <span className="font-medium">Date Added: </span>
                  <span>{new Date(dataset.created_at).toLocaleDateString()}</span>
                </li>
                <li>
                  <span className="font-medium">Last Updated: </span>
                  <span>{new Date(dataset.updated_at).toLocaleDateString()}</span>
                </li>
              </ul>
              
              )}
            </div>

            {/* Collapsible Tags */}
            {dataset.tags.length > 0 && (
              <div className="mt-6">
                <button
                  className="flex items-center w-full justify-between text-base font-semibold text-gray-900 dark:text-white focus:outline-none"
                  onClick={() => setShowTags((prev) => !prev)}
                  data-testid="tags-toggle"
                >
                  <span>Tags</span>
                  {showTags ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
                {showTags && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dataset.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-orange-100 text-orange-800 px-3 py-1 
                                   rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-t border-gray-200 mt-12 pt-6">
          {/* Reviews Header */}
          <div className="text-sm tracking-tight">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              User Reviews
            </h2>
          </div>
          {/* Reviews Content */}
          {feedbacks.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-100">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb, index) => (
                <div
                  key={index}
                  className="mt-4 bg-gray-50 dark:bg-card p-4 rounded-md shadow-sm border border-gray-200 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {fb.user__username}
                    </span>
                    <div className="flex gap-1">{renderStars(fb.rating)}</div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-100">{fb.comment}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-100">
                    {new Date(fb.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
