import React from "react";
import PieChart from "@/components/ui/PieChart";
import TrafficDonutChart from "@/components/ui/BarChart";
import BarChart from "@/components/ui/LineChart";

const DashboardLayout: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <PieChart />
      <TrafficDonutChart />
      <BarChart />
      <br/>
    </div>
  );
};

export default DashboardLayout;
