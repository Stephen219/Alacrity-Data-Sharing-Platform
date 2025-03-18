import { Award } from "lucide-react";
import BarChart from "../ui/BarChart";

export default function LandingPage2() {
  return (
    <div className="relative w-full bg-gray-50">

      {/* Main Content */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between pt-32 pb-12 px-12 gap-8">
        
{/* Left Section */}
<div className="w-full sm:w-1/2 flex justify-center relative outline rounded-lg">
          <BarChart/>
</div>

        {/* Right Content */}
        <div className="w-full sm:w-1/2 relative z-10">
          <h1 className="text-2xl font-bold sm:text-5xl">
            Our industry-leading <span className="text-orange-600">features</span>.
          </h1>
          <p className="mt-4 text-md">
            We make data-driven innovation faster, safer, and smarter. Take a look
            at what we do best.
          </p>
          <ul className="mt-4 space-y-4 text-md tracking-tight">
            <li className="flex items-start gap-3">
              <Award className="w-10 h-10 text-orange-600" />
              <span className="leading-relaxed">
                Seamless Dataset Upload & Management – Organisations can upload datasets from local or cloud storage with tagging for easy discovery.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Award className="w-10 h-10 text-orange-600" />
              <span className="leading-relaxed">
                Advanced Security & Access Control – Keep data secure with custom approval workflows and researcher-specific access levels.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Award className="w-10 h-10 text-orange-600" />
              <span className="leading-relaxed">
                Built-in Data Analysis – Researchers can perform statistical analysis and visualize data directly on the platform without needing to export.
              </span>
            </li>
          </ul>

        </div>
      </div>
    </div>
  );
}
