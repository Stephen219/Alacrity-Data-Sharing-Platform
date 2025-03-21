"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import Image from "next/image";
import parse from "html-react-parser"
import { BACKEND_URL } from "@/config";

interface ResearchSubmission {
  id: number;
  title: string;
  summary: string;
  submitted_at: string;
  image?: string;
  bookmark_count: number;
  full_name: string;
}

export default function TrendingResearchCarousel() {
  const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const res = await fetch(`${BACKEND_URL}research/submissions/view/`);
        const data = await res.json();
  
        // Check if popular submissions exist; otherwise, use recent submissions
        const popularSubmissions = data.popular_submissions?.slice(0, 5);
        const latestSubmissions = data.recent_submissions?.slice(0, 5);
  
        if (popularSubmissions.length > 0) {
          setSubmissions(popularSubmissions);
        } else {
          setSubmissions(latestSubmissions);
        }
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
      } finally {
        setLoading(false);
      }
    }
  
    fetchSubmissions();
  }, []);
  

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <h2 className="text-2xl font-bold text-center mb-4">Featured Research</h2>

      {loading ? (
        <div className="flex justify-center">
          <Skeleton className="w-full h-40" />
        </div>
      ) : (
        <Swiper
          modules={[Pagination, Autoplay]}
          slidesPerView={1}
          spaceBetween={20}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="rounded-lg outline bg-secondary"
        >
          {submissions.map((submission) => (
            <SwiperSlide key={submission.id}>
              <Card
                className="relative cursor-pointer hover:shadow-lg transition-all"
                onClick={() => router.push(`/researcher/allSubmissions/view/${submission.id}`)}
              >
                {/* {submission.image && (
                  <Image
                    src={submission.image}
                    alt={submission.title}
                    width={600}
                    height={300}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                )} */}
                <CardContent className="p-4">
  <div className="text-lg font-semibold truncate">{parse(submission.title)}</div>
  <div className="text-sm text-gray-600 truncate">{parse(submission.summary)}</div>
  <div className="text-xs text-gray-500 mt-2">
  Author: {submission.full_name || "Unknown Author"} <br/> {submission.bookmark_count} bookmarks | {new Date(submission.submitted_at).toLocaleDateString()}
  </div>
</CardContent>

              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
