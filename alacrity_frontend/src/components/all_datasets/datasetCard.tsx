"use client";

import React from "react";
import { Bookmark, Building2, Database, HardDrive } from "lucide-react";
import { fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"

interface DatasetCardProps {
  dataset_id: string;
  title: string;
  description: string;
  organization: string;
  dateUploaded: string;
  imageUrl: string;
  tags: string[];
  category: string;
  entries: number;
  size: string;
  viewMode: "grid" | "list";
  darkMode: boolean;
  extraActions?: () => void;
  isBookmarked: boolean;
  price : number;
  onToggleBookmark: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const DatasetCard: React.FC<DatasetCardProps> = ({
  dataset_id,
  title,
  description,
  organization,
  dateUploaded,
  imageUrl,
  tags,
  category,
  entries,
  size,
 
  viewMode,
  darkMode,
  isBookmarked,
  onToggleBookmark,
  
}) => {
  const isListView = viewMode === "list";
  const truncatedDescription = description.length > 200 ? description.substring(0, 200) + "..." : description;

  //this may need to be modified but for now it returns paypal checkout 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePurchase = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/payments/paypal/payment/${dataset_id}/`, { 
        method: "POST",
      });
  
      if (!response.ok) {
        throw new Error("Failed to initiate PayPal payment");
      }
  
      const data = await response.json();
  
      if (data.approval_url) {
        console.log("Redirecting to PayPal:", data.approval_url);
        window.location.href = data.approval_url;
      } else {
        console.error("ERROR: No approval URL received");
        alert("Error: Unable to process payment.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment. Please try again.");
    }
  };
  

  return (
    <div
      className={`
        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
        rounded-lg shadow-md overflow-hidden transition-all duration-300
        hover:shadow-lg hover:-translate-y-1
        ${isListView ? "flex" : "flex flex-col"}
      `}
    >
      <div className={`relative ${isListView ? "w-1/3" : "w-full h-48"}`}>
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200.png?text=No+Image";
          }}
        />
        <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {category}
        </div>
      </div>
      <div className={`p-6 flex flex-col justify-between ${isListView ? "w-2/3" : "w-full"}`}>
        <div>
          <h3 className="text-xl font-semibold mb-2 line-clamp-2">{title}</h3>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mb-4 line-clamp-3`}>
            {truncatedDescription}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#ff6b2c]" />
            <span className={darkMode ? "text-gray-300" : "text-gray-500"}>{organization}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-orange-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span className={darkMode ? "text-gray-300" : "text-gray-500"}>{dateUploaded}</span>
          </div>
          <div className="flex items-center gap-2">
            <Database size={16} className="text-[#ff6b2c]" />
            <span className={darkMode ? "text-gray-300" : "text-gray-500"}>{entries.toLocaleString()} entries</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-[#ff6b2c]" />
            <span className={darkMode ? "text-gray-300" : "text-gray-500"}>{size}</span>
          </div>

          <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded-full flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span className="ml-1">20 views</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags
            .filter((tag) => tag.trim() !== "")
            .map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className={`
                  ${darkMode ? "bg-gray-700 text-orange-400" : "bg-orange-100 text-orange-800"}
                  px-2 py-1 rounded-full text-sm font-medium
                `}
              >
                {tag}
              </span>
            ))}
        </div>
{/* Bookmark Button */}
<button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleBookmark(e);
  }}
  aria-label="Bookmark Dataset"
>
  <Bookmark
    size={24}
    className={`mt-4 transition-colors duration-300 ${
      isBookmarked ? "fill-alacrityred text-alacrityred" : "text-gray-400"
    }`}
    fill={isBookmarked ? "#FF6B2C" : "none"} 
  />
</button>



    </div>
    </div>
  );
};