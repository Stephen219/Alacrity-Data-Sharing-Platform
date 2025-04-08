import { Award } from "lucide-react";
import BarChart from "../ui/BarChart";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import Chatbot from "@/components/chatbot";

export default function LandingPage2() {
  return (
    <div className="relative w-full">
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-between px-6 py-16 sm:flex-row sm:px-12 sm:py-32 gap-12">
        {/* Left Section */}
        <div className="w-full sm:w-1/2 flex justify-center">
          <div className="w-full max-w-md outline rounded-lg shadow-lg p-4 bg-white">
            <BarChart />
          </div>
        </div>

        {/* Right Content */}
        <div className="w-full sm:w-1/2 flex flex-col justify-center">
          <h1 className="text-3xl font-bold sm:text-5xl tracking-tight">
            Our industry-leading <span className="text-orange-600">features</span>.
          </h1>
          <p className="mt-4 text-lg text-gray-600 sm:text-xl leading-relaxed">
            We make data-driven innovation faster, safer, and smarter. Explore what sets us apart.
          </p>
          <ul className="mt-8 space-y-6 text-lg tracking-tight">
            <li className="flex items-start gap-4">
              <Award className="w-8 h-8 text-orange-600 flex-shrink-0" />
              <span className="leading-relaxed">
                <strong>Seamless Dataset Upload & Management</strong> – Organisations can upload datasets from local or cloud storage with intuitive tagging for easy discovery.
              </span>
            </li>
            <li className="flex items-start gap-4">
              <Award className="w-8 h-8 text-orange-600 flex-shrink-0" />
              <span className="leading-relaxed">
                <strong>Advanced Security & Access Control</strong> – Keep data secure with custom approval workflows and researcher-specific access levels.
              </span>
            </li>
            <li className="flex items-start gap-4">
              <Award className="w-8 h-8 text-orange-600 flex-shrink-0" />
              <span className="leading-relaxed">
                <strong>Built-in Data Analysis</strong> – Researchers can perform statistical analysis and visualize data directly on the platform without exporting.
              </span>
            </li>
          </ul>

          {/* Sign-Up CTA */}
          <div className="mt-10 flex justify-start">
            <Link
              href="/auth/sign-up/org-sign-up"
              className={buttonVariants({
                size: "lg",
                className: "bg-orange-600 text-white hover:bg-orange-700 transition-colors",
              })}
            >
              Sign Up as an Organisation →
            </Link>
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}