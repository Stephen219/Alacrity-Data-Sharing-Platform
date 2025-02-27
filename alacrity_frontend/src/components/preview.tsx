"use client";

import DisplayFormattedText from "@/components/DisplayFormattedtext";
import { title } from "process";

interface PreviewProps {
title: string;
  description: string;
  rawResults: string;
  summary: string;
}

const Preview = ({ description, rawResults, summary }: PreviewProps) => {
  return (
    <div className="prose mt-4">
      <h3 className="text-lg font-semibold">Preview</h3>
      <DisplayFormattedText content={title} />
      <DisplayFormattedText content={description} />
      <DisplayFormattedText content={rawResults} />
      <DisplayFormattedText content={summary} />
    </div>
  );
};

export default Preview;
