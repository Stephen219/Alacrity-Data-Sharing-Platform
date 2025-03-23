"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DatasetRequestTable, { DatasetRequest } from "@/components/DatasetRequestTable";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";

interface RawDatasetRequest {
  request_id: string;
  dataset_id_id: string;
  dataset_id__title: string;
  dataset_id__price: string | number;
  request_status: string;
  created_at: string;
  has_paid?: boolean | string;
}

const App: React.FC = () => {
  const [datasetRequests, setDatasetRequests] = useState<DatasetRequest[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchDatasetRequests = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}requests/userrequests/`);
        if (response.ok) {
          const data: RawDatasetRequest[] = await response.json();
          const mappedData = data.map((req: RawDatasetRequest) => {
            const price =
              typeof req.dataset_id__price === "number"
                ? req.dataset_id__price
                : parseFloat(req.dataset_id__price as string) || 0;
            const hasPaid = req.has_paid === true || req.has_paid === "true";
            return {
              id: req.request_id,
              dataset_id: req.dataset_id_id,
              title: req.dataset_id__title,
              status: req.request_status,
              submitted_at: req.created_at,
              hasPaid,
              price,
            } as DatasetRequest;
          });
          setDatasetRequests(mappedData);
        } else {
          console.error("Failed to fetch dataset requests");
        }
      } catch (error) {
        console.error("Error fetching dataset requests", error);
      }
    };

    fetchDatasetRequests();
  }, []);

  // For free datasets or paid and have been paid, allows row click to navigate to analysis page
  const handleRowClick = (request: DatasetRequest) => {
    if (request.status.toLowerCase() === "approved" && (request.price === 0 || request.hasPaid)) {
      router.push(`/analyze/${request.dataset_id}`);
    }
  };

  // For paid datasets that have not been paid, shows the Pay button.
  const handlePayClick = async (request: DatasetRequest) => {
    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/payments/paypal/payment/${request.dataset_id}/`,
        { method: "POST" }
      );
      if (!response.ok) {
        throw new Error(`Payment request failed. Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.approval_url) {
        window.location.href = data.approval_url;
      } else if (data.message) {
        alert(data.message);
      } else {
        alert("No PayPal approval URL returned from server.");
      }
    } catch (error) {
      console.error("Error creating PayPal payment:", error);
      alert("Error creating PayPal payment. Check console for details.");
    }
  };

  // Uses same condition for row styling
  const getRowClass = (request: DatasetRequest) => {
    const clickable = request.status.toLowerCase() === "approved" && (request.price === 0 || request.hasPaid);
    return clickable
      ? "hover:bg-gray-50 cursor-pointer"
      : "bg-secondary cursor-not-allowed";
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dataset Requests</h1>
      <DatasetRequestTable
        requests={datasetRequests}
        onRowClick={handleRowClick}
        onPayClick={handlePayClick}
        getRowClass={getRowClass}
        paginated={true}
        searchable={true}
      />
    </div>
  );
};

export default App;
