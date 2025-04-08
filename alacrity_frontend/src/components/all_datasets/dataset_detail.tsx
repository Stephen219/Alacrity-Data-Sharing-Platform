"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { Star, Send, X, Loader2 } from "lucide-react";

interface Dataset {
  dataset_id: string;
  title: string;
  description: string;
}

interface Comment {
  text: string;
  timestamp: string;
}

interface DatasetDetailModalProps {
  dataset_id: string;
  onClose: () => void;
}

export default function DatasetDetailModal({ dataset_id, onClose }: DatasetDetailModalProps) {
  const router = useRouter();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>("");
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
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/${dataset_id}/`);
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
  }, [dataset_id]);

  const handleFeedbackSubmit = async () => {
    if (!rating || !reviewTitle.trim() || !comment.trim()) {
      setSubmissionStatus("Please provide a rating, title and a comment.");
      return;
    }

    setSubmitting(true);
    setSubmissionStatus(null);

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/feedback/${dataset_id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating,
          title: reviewTitle.trim(),
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
      // Mark that a review has been left and close the modal.
      localStorage.setItem(`hasReviewed_${dataset_id}`, "true");
      // wait so the user sees the success message.
      setTimeout(() => {
        onClose();
      }, 1500);
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
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" role="status" />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <p>{error || "Dataset not found."}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal overlay */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      {/* Modal content */}
      <div className="relative bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg z-10 max-w-3xl mx-auto transform scale-75">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-700 dark:text-gray-300 hover:text-gray-900">
          <X className="w-6 h-6" />
          <span className="sr-only">Close modal</span>
        </button>

        <div className="space-y-8">
          {/* Dataset Header */}
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight text-center">
              Add a Review for:
            </h1>
            <h2 className="text-md font-bold text-gray-800 dark:text-gray-100 tracking-tight">{dataset.title}</h2>
            <div className="max-h-20 overflow-x-auto">
                <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-300 tracking-tight break-words">
                    {dataset.description}
                  </p>
  </div>
          </div>


          {/* Review Form */}
          <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={32}
                    data-testid="lucide-star"
                    className={`cursor-pointer transition-colors ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Review Title
              </label>
              <input type="text" name="title" id="title" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} placeholder="Write your title here..." className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-600 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Your Review
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your review here..."
                className="w-full p-2.5 border border-gray-300 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 resize-none"
                rows={4}
              />
              <p className="ms-auto text-sm text-gray-500 dark:text-gray-300">Problems with the dataset? <button onClick={() => router.push(`/chat/${dataset.dataset_id}`)} className="text-alacrityred hover:underline dark:text-alacrityred">Send a report</button>.</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleFeedbackSubmit}
                disabled={submitting || !rating || !reviewTitle.trim() || !comment.trim()}
                className={`inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                  submitting || !rating || !reviewTitle.trim() || !comment.trim()
                    ? "bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-orange-400 focus:outline-none focus:ring-4 focus:ring-primary dark:bg-primary dark:hover:bg-orange-400 dark:focus:ring-primary"
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span className="ml-2">Submit</span>
              </button>
            </div>

            {submissionStatus && (
              <p
                className={`mt-3 text-sm ${
                  submissionStatus.toLowerCase().includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {submissionStatus}
              </p>
            )}
          </section>

          {/* Reviews List */}
          {comments.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Reviews</h3>
              <div className="space-y-4">
                {comments.map((c, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <p className="text-gray-800 dark:text-gray-100">{c.text}</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{c.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}