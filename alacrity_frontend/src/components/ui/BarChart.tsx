"use client";
import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const BarChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current && typeof ApexCharts !== "undefined") {
      const options = {
        colors: ["#d76047", "black"],
        series: [
          {
            name: "Reports",
            color: "#d76047",
            data: [
              { x: "Mon", y: 231 },
              { x: "Tue", y: 122 },
              { x: "Wed", y: 63 },
              { x: "Thu", y: 421 },
              { x: "Fri", y: 122 },
              { x: "Sat", y: 323 },
              { x: "Sun", y: 111 },
            ],
          },
          {
            name: "Datasets",
            color: "black",
            data: [
              { x: "Mon", y: 232 },
              { x: "Tue", y: 113 },
              { x: "Wed", y: 341 },
              { x: "Thu", y: 224 },
              { x: "Fri", y: 522 },
              { x: "Sat", y: 411 },
              { x: "Sun", y: 243 },
            ],
          },
        ],
        chart: {
          type: "bar",
          height: "320px",
          fontFamily: "Inter, sans-serif",
          toolbar: {
            show: false,
          },
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
          style: {
            fontFamily: "Inter, sans-serif",
          },
        },
        states: {
          hover: {
            filter: {
              type: "darken",
              value: 1,
            },
          },
        },
        stroke: {
          show: true,
          width: 0,
          colors: ["transparent"],
        },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: {
            left: 2,
            right: 2,
            top: -14,
          },
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: false,
        },
        xaxis: {
          floating: false,
          labels: {
            show: true,
            style: {
              fontFamily: "Inter, sans-serif",
              cssClass: "text-xs font-normal fill-gray-500 dark:fill-gray-400",
            },
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          show: false,
        },
        fill: {
          opacity: 1,
        },
      };

      const chart = new ApexCharts(chartRef.current, options);
      chart.render();

      return () => {
        chart.destroy();
      };
    }
  }, []);

  return (
    <div className="max-w-sm w-full bg-secondary rounded-lg shadow-sm dark:bg-gray-800 p-4">
      <div className="flex justify-between">
        <div className="flex items-center">
          <div>
            <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1 mt-2">378</h5>
            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Reports and datasets generated per week</p>
          </div>
        </div>
      </div>
      <div id="column-chart" ref={chartRef}></div>
    </div>
  );
};

export default BarChart;
