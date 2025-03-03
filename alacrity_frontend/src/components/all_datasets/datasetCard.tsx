"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Building2, Database, HardDrive } from "lucide-react";

interface DatasetCardProps {
 // dataset_id: string; // link that will be used to navigate to the dataset detail page
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
}

export const DatasetCard: React.FC<DatasetCardProps> = ({
  //dataset_id,
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
}) => {
  const isListView = viewMode === "list";
  const truncatedDescription =
    description.length > 100 ? description.substring(0, 200) + "..." : description;

  return (
    //<Link href={`/datasets/description?id=${ dataset_id}`}>
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 ${
          isListView ? "flex" : "block"
        } cursor-pointer`}
      >
        <div className={`relative ${isListView ? "w-64" : "h-48"} overflow-hidden`}>
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"; // Fallback image
            }}
          />
          <div className="absolute top-4 right-4 bg-[#ff6b2c] text-white px-3 py-1 rounded-full text-sm">
            {category}
          </div>
        </div>
        <div className={`${isListView ? "flex-1" : ""} p-6`}>
          <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}>
            {title}
          </h3>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mb-4 line-clamp-2`}>
            {truncatedDescription}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1">
              <Building2 size={16} className="text-[#ff6b2c]" />
              <span className={darkMode ? "text-gray-300" : "text-gray-500"}>{organization}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={16} className="text-[#ff6b2c]" />
              <span className={darkMode ? "text-gray-300" : "text-gray-500"}>{dateUploaded}</span>
            </div>
            <div className="flex items-center gap-1">
              <Database size={16} className="text-[#ff6b2c]" />
              <span className={darkMode ? "text-gray-300" : "text-gray-500"}>
                {entries.toLocaleString()} entries
              </span>
            </div>
            <div className="flex items-center gap-1">
              <HardDrive size={16} className="text-[#ff6b2c]" />
              <span className={darkMode ? "text-gray-300" : "text-gray-500"}>{size}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* {tags.map((tag) => (
              <span
                key={tag}
                className={`${
                  darkMode ? "bg-gray-700 text-orange-400" : "bg-orange-50 text-[#ff6b2c]"
                } px-2 py-1 rounded-full text-sm`}
              >
                {tag}
              </span>
            ))} */}
          </div>
        </div>
      </div>
    //</Link>
  );
};
