"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "../ui/button";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="w-full">
      <div className="flex flex-col gap-36 sm:flex-row items-center justify-between pt-12 pb-6 px-12">
        
        {/* Left Content */}
        <div className="w-full sm:w-1/2">
          <h1 className="text-2xl font-bold sm:text-5xl">
            Your favourite platform for secure{' '}
            <span className="text-primary">data collaboration</span>.
          </h1>
          <p className="mt-4 text-md">
            Welcome to Alacrity. The fastest way for organisations to upload, 
            manage, and share datasets while giving researchers secure, 
            on-platform analysis.
          </p>
          <div className="flex gap-4 mt-6">
            <Link href="#" className={buttonVariants()}>About Us</Link>
            <Button variant="ghost" onClick={() => router.push("/researcher/allSubmissions")}>
      Explore Research &rarr;
    </Button>
          </div>
        </div>

        {/* Right content */}
        <div className="w-full sm:w-1/2 flex justify-center shadow-sm rounded-lg outline">
          <Image 
            src="/landing/landing1.png"
            width={600}
            height={600}
            alt="Landing page image"
          />
        </div>

      </div>
    </div>
  );
}
