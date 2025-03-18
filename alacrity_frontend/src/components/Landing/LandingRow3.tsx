"use client"

import Link from "next/link";
import { buttonVariants } from "../ui/button";
import LineChart from "../ui/LineChart";
import React, { useEffect, useState } from "react";

export default function LandingPage3() {

  const [, setChartData] = useState<{ name: string; data: number[]; color: string }[]>([
    { name: "Organisations", data: [1500, 1418, 1456, 1526, 1356, 1256], color: "#d76047" },
    { name: "Researchers", data: [643, 413, 765, 412, 1423, 1731], color: "#f5bd1f" },
  ]);

  const [, setCategories] = useState<string[]>(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);

  useEffect(() => {
    fetch("/users/monthly-users")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.months);
        setChartData([
          { name: "Organisations", data: data.organizations, color: "#d76047" },
          { name: "Researchers", data: data.researchers, color: "#f5bd1f" },
        ]);
      })
      .catch((err) => console.error("Failed to fetch data", err));
  }, []);


  return (
    <div className="w-full">
      <div className="flex flex-col gap-36 sm:flex-row items-center justify-between pt-12 pb-6 px-12">
        
        {/* Left Content */}
        <div className="w-full sm:w-1/2">
        <h1 className="text-2xl font-bold sm:text-5xl">
  Sign up <span className="text-orange-600">today</span>.
</h1>
<p className="mt-4 text-md">
  Ready to make an impact? Join us as an organisation or researcher today and be part of a growing network of innovators. 
  Smply sign up below to get started.
</p>

          <div className="flex gap-4 mt-6">
          <Link href="/auth/sign-up" className={buttonVariants()}>Sign Up &rarr;</Link>
          </div>
        </div>

        {/* Right */}
        <div className="w-full sm:w-1/2 flex justify-center outline rounded-lg">
        <LineChart/>
        </div>

      </div>
    </div>
  );
}
