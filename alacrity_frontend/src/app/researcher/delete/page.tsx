"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import Published from "@/components/Published";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";


interface Analysis {
  id: number;
  title: string;
  summary: string;
  status?: string;
}

const RecentlyDeleted = () => {
  const [deletedSubmissions, setDeletedSubmissions] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    const fetchDeletedSubmissions = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(
          `${BACKEND_URL}/research/submissions/recently-deleted/?sort=${sortOrder}`
        );
        if (!response.ok) throw new Error("Failed to fetch deleted submissions.");
        const data = await response.json();
        setDeletedSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };
  
    fetchDeletedSubmissions();
  }, [sortOrder]); 
  

  const handleRestore = async (id: number) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/research/submissions/restore/${id}/`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to restore submission.");
      setDeletedSubmissions((prev) => prev.filter((submission) => submission.id !== id));
    } catch (error) {
      console.error("Error restoring submission:", error);
    }
  };

  const handleHardDelete = async (id: number) => {
    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/research/submissions/permanent-delete/${id}/`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to permanently delete submission.");

      setDeletedSubmissions((prev) => prev.filter((submission) => submission.id !== id));
    } catch (error) {
      console.error("Error permanently deleting submission:", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Published
    header = "Recently Deleted"
      submissions={deletedSubmissions}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      renderButtons={(id) => (
        <div className="flex flex-col gap-2">
          {/* Delete AlertDialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-alacrityred">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this submission.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleHardDelete(id)}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Restore AlertDialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Restore</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to restore?</AlertDialogTitle>
                <AlertDialogDescription>
                  Restoring this submission will bring it back to the active list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleRestore(id)}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    />
  );
};

export default RecentlyDeleted;
