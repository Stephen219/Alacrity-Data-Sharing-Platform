"use client";
import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const PieChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  const getChartOptions = () => {
    return {
      series: [90, 85, 70],
      colors: ["#d63741", "#e5803b", "#f5bd1f"],
      chart: {
        height: "350px",
        width: "100%",
        type: "radialBar",
        sparkline: {
          enabled: true,
        },
      },
      plotOptions: {
        radialBar: {
          track: {
            background: '#E5E7EB',
          },
          dataLabels: {
            show: false,
          },
          hollow: {
            margin: 0,
            size: "32%",
          }
        },
      },
      grid: {
        show: false,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: -23,
          bottom: -20,
        },
      },
      labels: ["Approved", "Pending", "Denied"],
      legend: {
        show: true,
        position: "bottom",
      },
      tooltip: {
        enabled: true,
      },
      yaxis: {
        show: false,
        labels: {
          formatter: function (value: number) {
            return value + "%";
          }
        }
      }
    };
  };

  useEffect(() => {
    if (chartRef.current && typeof ApexCharts !== "undefined") {
      const chart = new ApexCharts(chartRef.current, getChartOptions());
      chart.render();

      return () => {
        chart.destroy();
      };
    }
  }, []);

  return (
    <div className="max-w-sm w-full bg-secondary rounded-lg shadow-sm dark:bg-gray-800 p-4 md:p-6">
        <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white mb-3">Approval Statistics</h5>
        <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Per 100 requests</p>
        <div id="radial-chart" ref={chartRef}></div>
      <div className="grid grid-cols-3 gap-3 mb-2">
        <dl className=" dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]">
          <dt className="w-8 h-8 rounded-full bg-alacrityyellow dark:bg-gray-500 dark:text-orange-300 text-xs font-medium flex items-center justify-center mb-1">10</dt>
          <dd className="dark:text-orange-300 text-xs font-medium">Denied</dd>
        </dl>
        <dl className="dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]">
          <dt className="w-8 h-8 rounded-full bg-primary dark:bg-gray-500 dark:text-teal-300 text-xs font-medium flex items-center justify-center mb-1">12</dt>
          <dd className=" dark:text-teal-300 text-xs font-medium">Pending</dd>
        </dl>
        <dl className="dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]">
          <dt className="w-8 h-8 rounded-full bg-alacrityred dark:bg-gray-500 dark:text-blue-300 text-xs font-medium flex items-center justify-center mb-1">78</dt>
          <dd className="dark:text-blue-300 text-xs font-medium">Approved</dd>
        </dl>
      </div>

    </div>
  );
};

export default PieChart;
