"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { Star, Send, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Dataset {
  dataset_id: string;
  title: string;
  description: string;
}

interface Comment {
  text: string;
  timestamp: string;
}

export default function DatasetDetailPage({ params }: { params: { dataset_id: string } }) {
  const router = useRouter();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasetDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/${params.dataset_id}/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch dataset details: ${response.status}`);
        }
        const data: Dataset = await response.json();
        setDataset(data);
      } catch (error) {
        console.error("Error fetching dataset details:", error);
        setError("Unable to load dataset details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDatasetDetails();
  }, [params.dataset_id]);

  const handleFeedbackSubmit = async () => {
    if (!rating || !comment.trim()) {
      setSubmissionStatus("Please provide both a rating and a comment.");
      return;
    }

    setSubmitting(true);
    setSubmissionStatus(null);

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/feedback/${params.dataset_id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating,
          comments: comment.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to submit feedback: ${response.status}`);
      }

      setSubmissionStatus(data.message || "Feedback submitted successfully!");
      setComments((prev) => [
        ...prev,
        { text: comment.trim(), timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      setComment("");
      setRating(0);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setSubmissionStatus("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFeedbackSubmit();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-card">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" role="status" />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-card">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <p>{error || "Dataset not found."}</p>
          <button
            onClick={() => router.push("/researcher/datasetWithAccess")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Datasets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-card py-12 px-6 md:px-12 lg:px-24 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0 dark:text-gray-200">
            {dataset.title}
          </h1>
          <Link href={`/analyze/${dataset.dataset_id}`}>
            <button className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium">
              Analyze Dataset
            </button>
          </Link>
        </div>

        <p className="text-gray-700 mb-8 leading-relaxed dark:text-gray-300">{dataset.description}</p>
        {/* Divider Line */}
<div className="border-t border-gray-200 mt-12 pt-6"></div>
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3 dark:text-gray-100">Leave a Review</h2>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2 dark:text-gray-100">Rating</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  data-testid="lucide-star" // Added for testability
                  className={`cursor-pointer transition-colors ${
                    star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your review here..."
              className="w-full p-4 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              rows={4}
            />
            <button
              onClick={handleFeedbackSubmit}
              disabled={submitting || !rating || !comment.trim()}
              className={`self-start px-6 py-2 flex items-center gap-2 rounded-md transition-colors ${
                submitting || !rating || !comment.trim()
                  ? "bg-gray-300 text-gray-500 300 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Submit
            </button>
          </div>

          {submissionStatus && (
            <p
              className={`mt-2 text-sm ${
                submissionStatus.includes("success") ? "text-green-600" : "text-red-600"
              }`}
            >
              {submissionStatus}
            </p>
          )}

          {comments.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Your Reviews</h3>
              {comments.map((c, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-card dark:border-gray-700 p-4 rounded-md shadow-sm border border-gray-200 flex justify-between items-start"
                >
                  <p className="text-gray-800">{c.text}</p>
                  <span className="text-xs text-gray-500 ml-4 dark:text-gray-300">{c.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between gap-4 mt-12">
        <button
          onClick={() => router.push("/researcher/datasetWithAccess")}
          className="px-6 py-3 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Datasets
        </button>
        <button
          onClick={() => router.push(`/chat/${dataset.dataset_id}`)}
          className="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Raise an Issue
        </button>
      </div>
    </div>
  );
}