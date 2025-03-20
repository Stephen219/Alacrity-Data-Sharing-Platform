"use client";
import React, { useEffect, useState, useRef } from "react";
import ApexCharts from "apexcharts";
import { BACKEND_URL } from "@/config";

const BarChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  // Dummy data
  const [realDataLoaded, setRealDataLoaded] = useState(false);
  const [chartData, setChartData] = useState<{
    days: string[];
    reports: number[];
    datasets: number[];
  }>({
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    reports: [231, 122, 63, 421, 122, 323, 111],
    datasets: [232, 113, 341, 224, 522, 411, 243],
  });

  // Fetches dynamic data on hover
  const loadRealData = () => {
    if (!realDataLoaded) {
      fetch(`${BACKEND_URL}users/weekly-activity/`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setChartData({
            days: data.days,
            reports: data.reports,
            datasets: data.datasets,
          });
          setRealDataLoaded(true);
        })
        .catch((err) => {
          console.error("Error fetching weekly activity:", err);
        });
    }
  };

  // Initialise chart
  useEffect(() => {
    if (chartRef.current && typeof ApexCharts !== "undefined") {
      const options = {
        colors: ["#d76047", "black"],
        series: [
          {
            name: "Reports",
            color: "#d76047",
            data: chartData.days.map((day, index) => ({
              x: day,
              y: chartData.reports[index] || 0,
            })),
          },
          {
            name: "Datasets",
            color: "black",
            data: chartData.days.map((day, index) => ({
              x: day,
              y: chartData.datasets[index] || 0,
            })),
          },
        ],
        chart: {
          type: "bar",
          height: "320px",
          fontFamily: "Inter, sans-serif",
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "70%",
            borderRadiusApplication: "end",
            borderRadius: 8,
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          style: { fontFamily: "Inter, sans-serif" },
        },
        states: { hover: { filter: { type: "darken", value: 1 } } },
        stroke: { show: true, width: 0, colors: ["transparent"] },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: { left: 2, right: 2, top: -14 },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: {
          floating: false,
          labels: {
            show: true,
            style: {
              fontFamily: "Inter, sans-serif",
              cssClass: "text-xs font-normal fill-gray-500 dark:fill-gray-400",
            },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: { show: false },
        fill: { opacity: 1 },
      };

      const chart = new ApexCharts(chartRef.current, options);
      chart.render();

      return () => {
        chart.destroy();
      };
    }
  }, [chartData]);

  return (
    <div
      className="max-w-sm w-full bg-secondary rounded-lg shadow-sm dark:bg-gray-800 p-4"
      onMouseEnter={loadRealData}
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          <div>
            <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1 mt-2">
              Reports & Datasets Generated Per Week
            </h5>
            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Hover over me...
            </p>
          </div>
        </div>
      </div>
      <div id="column-chart" ref={chartRef}></div>
    </div>
  );
};

export default BarChart;
