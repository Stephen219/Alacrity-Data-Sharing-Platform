"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import parse from "html-react-parser"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


// submission type
interface Submission {
  id: number;
  title: string;
  description: string;
  raw_results: string;
  summary: string;
  researcher_email: string;
  submitted_at: string;
  status: string;
}

const ReviewSubmissionPage: React.FC = () => {
  const router = useRouter();
  const { id } = useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success"); 
  const [showAlert, setShowAlert] = useState(false);


  // Fetch submission details
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/research/submissions/review/${id}/`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch submission: ${errorData.error || response.statusText}`);
        }

        const data: Submission = await response.json();
        setSubmission(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSubmission();
  }, [id]);

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
        router.push("/dashboard"); // Redirect after timeout
      }, 5000);
  
      return () => clearTimeout(timer);
    }
  }, [showAlert, router]);
  

  const handleApprove = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/research/submissions/review/${id}/`, {
        method: "POST",
        body: JSON.stringify({ action: "approve", message }),
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) throw new Error("Failed to approve submission");
  
      setAlertMessage("Submission approved successfully. Email sent.");
      setAlertType("success");
      setShowAlert(true); // Show alert
  
    } catch (error) {
      setAlertMessage("Error: " + (error as Error).message);
      setAlertType("error");
      setShowAlert(true);
    }
  };
  
  const handleReject = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/research/submissions/review/${id}/`, {
        method: "POST",
        body: JSON.stringify({ action: "reject", message }),
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) throw new Error("Failed to reject submission");
  
      setAlertMessage("Submission rejected successfully. Email sent.");
      setAlertType("success");
      setShowAlert(true);
  
    } catch (error) {
      setAlertMessage("Error: " + (error as Error).message);
      setAlertType("error");
      setShowAlert(true);
    }
  };
  
  

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="w-96 h-40" />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">
        {error}
      </div>
    );

  if (!submission)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg">
        No submission found.
      </div>
    );

    return (
      <div className="max-w-4xl mx-auto mt-32">
        {showAlert && (
  <Alert
    className={`${
      alertType === "error"
        ? "bg-red-100 border-red-500 text-red-700"
        : "bg-green-100 border-green-500 text-green-700"
    } flex items-center justify-between `}
  >
    <div>
      <AlertTitle>{alertType === "error" ? "Error!" : "Success!"}</AlertTitle>
      <AlertDescription>{alertMessage}</AlertDescription>
    </div>

    {/* Close Button */}
    <button
      onClick={() => {
        setShowAlert(false);
        router.push("/dashboard"); // Redirect after dismissing
      }}
      className="ml-4 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 "
    >
      Close
    </button>
  </Alert>
)}

    
        <Card className="shadow-lg border border-gray-200 rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{parse(submission.title)}</CardTitle>
            <div className="text-sm text-gray-500">
              Submitted by: <span className="font-medium">{submission.researcher_email}</span> •{" "}
              {new Date(submission.submitted_at).toLocaleString()}
            </div>
          </CardHeader>
    
          <CardContent>
            <Separator className="my-4" />
    
            <div className="mb-6">
              <div className="text-lg font-semibold">Description</div>
              <div className="text-gray-700">{parse(submission.description)}</div>
            </div>
    
            <Separator />
    
            <div className="mb-6 mt-4">
              <div className="text-lg font-semibold">Raw Results</div>
              <pre className="p-3 bg-gray-100 rounded-md text-sm overflow-auto border border-gray-300">
                {parse(submission.raw_results)}
              </pre>
            </div>
    
            <Separator />
    
            <div className="mb-6 mt-4">
              <div className="text-lg font-semibold">Summary</div>
              <div className="text-gray-700">{parse(submission.summary)}</div>
            </div>
    
            <Separator className="my-4" />
    
            <div className="text-lg font-semibold mb-3">Message to Researcher</div>
            <Label htmlFor="message">Optional message to researcher</Label>
            <Textarea
              id="message"
              placeholder="Write a message to the researcher (optional)..."
              className="w-full mt-2 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
    
            <div className="flex flex-col md:flex-row items-center gap-4 mt-6">
              <Button variant="ghost" onClick={handleApprove} className="w-full md:w-auto px-6 py-2">
                Approve
              </Button>
    
              <Button onClick={handleReject} className="bg-primary w-full md:w-auto px-6 py-2">
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
    
};

export default ReviewSubmissionPage;
