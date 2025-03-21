"use client";

import DatasetDetailPage from "@/components/all_datasets/dataset_detail";

export default function DatasetDetail({ params }: { params: { dataset_id: string } }) {
  return <DatasetDetailPage params={params} />;
}
