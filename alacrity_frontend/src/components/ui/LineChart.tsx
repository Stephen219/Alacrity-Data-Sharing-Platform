"use client";
import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const LineChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current && typeof ApexCharts !== "undefined") {
      const options = {
        series: [
          {
            name: "Organisations",
            data: [1500, 1418, 1456, 1526, 1356, 1256],
            color: "#d76047",
          },
          {
            name: "Researchers",
            data: [643, 413, 765, 412, 1423, 1731],
            color: "#f5bd1f",
          },
        ],
        chart: {
          type: "area",
          height: 320,
          fontFamily: "Inter, sans-serif",
          toolbar: { show: false },
        },
        tooltip: { enabled: true, x: { show: false } },
        legend: { show: true },
        fill: {
          type: "gradient",
          gradient: { opacityFrom: 0.55, opacityTo: 0, shade: "#1C64F2", gradientToColors: ["#1C64F2"] },
        },
        dataLabels: { enabled: false },
        stroke: { width: 6 },
        grid: { show: false, strokeDashArray: 4, padding: { left: 2, right: 2, top: -26 } },
        xaxis: {
          categories: ['01 February', '02 February', '03 February', '04 February', '05 February', '06 February', '07 February'],
          labels: { show: false },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: { show: false, labels: { formatter: (value: number) => `${value}` } },
      };

      const chart = new ApexCharts(chartRef.current, options);
      chart.render();

      return () => {
        chart.destroy();
      };
    }
  }, []);

  return (
    <div className="max-w-sm w-full bg-secondary rounded-lg shadow-sm dark:bg-gray-800 p-4 md:p-6">
      <div className="flex justify-between">
        <div>
          <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-2">31,735</h5>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Monthly users</p>
        </div>
      </div>
      <div id="column-chart" ref={chartRef}></div>
    </div>
  );
};

export default LineChart;
