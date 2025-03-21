"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
// Import the previously created dataset table component
import DatasetRequestTable, { DatasetRequest } from "@/components/DatasetRequestTable";

interface Dataset {
  dataset_id: string;
  title: string;
  // If your datasets have a status, otherwise set a default
  status?: string;
  updated_at: string;
  // Include other dataset fields if needed
}

const FullDatasetPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetRequest[]>([]);
  const router = useRouter();

  // Fetch datasets from the API and map them to the fields expected by DatasetRequestTable
  const getDatasets = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}datasets/`);
      const data = await response.json();
      console.log("API response:", data);
  
      // If data is already an array, use it; otherwise, use data.datasets if available.
      const datasetsArray = Array.isArray(data) ? data : data.datasets;
      if (!datasetsArray || !Array.isArray(datasetsArray)) {
        throw new Error("Expected an array of datasets from API");
      }
  
      const mappedDatasets: DatasetRequest[] = datasetsArray.map((ds: any) => ({
        id: ds.dataset_id,
        name: ds.title,
        status: ds.status ? ds.status : "active",
        requested_at: ds.updated_at,
      }));
  
      setDatasets(mappedDatasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };
  

  useEffect(() => {
    getDatasets();
  }, []);

  const handleRowClick = (dataset: DatasetRequest) => {
    // Navigate to a detailed view for the selected dataset.
    router.push(`/researcher/datasets/view/${dataset.id}/`);
  };

  // Optional: Customize row styling (if desired)
  const getRowClass = (dataset: DatasetRequest) => {
    return "cursor-pointer hover:bg-gray-50";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Datasets</h1>
      <DatasetRequestTable
        datasetRequests={datasets}
        onRowClick={handleRowClick}
        scrollable={false}
        searchable={true} 
        paginated={true}    
        getRowClass={getRowClass}
      />
    </div>
  );
};

export default FullDatasetPage;
