"use client";

import type React from "react";
import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/config";
import { fetchUserData } from "@/libs/auth";
import { User } from "@/types/types";

interface DashboardData {
  total_datasets: number;
  total_users: number;
  pending_requests: number;
  approved_requests: number;
  pending_datasets: Array<{
    request_id: string;
    dataset_id_id: string;
    dataset_id__title: string;
    researcher_id_id: number;
    researcher_id__first_name: string;
    researcher_id__sur_name: string
    researcher_id__profile_picture: string;
    request_status: string;
    created_at: string; 
  }>;
}

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // const [userData, setUserData] = useState(null);
  const [user, setUser] = useState<User | null>(null);
 


  const getUserdata = async () => {
    const userData = await fetchUserData();
    setUser(userData);
  console.log(userData);
  }


    

  const getData = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${BACKEND_URL}/users/dashboard`);
      const result = await response.json();
      setData(result);
      console.log(result);
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserdata();
    getData();

  }, []);

  if (loading) {
    return <div className="p-6 bg-gray-50">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 bg-gray-50 text-red-500">Error: {error.message}</div>;
  }

  if (!data) {
    return <div className="p-6 bg-gray-50">No data available</div>;
  }

  
  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString || Date.now());
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  
  const limitedPendingDatasets = data.pending_datasets.slice(0, 5);
  // 

  return (
    <div className="p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Organization Dashboard</h1>
        <p className="text-gray-500">Overview of your organization datasets and activities</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Datasets"
          value={data.total_datasets.toString()}
          icon="📊"
          change="+12% from last month"
          changeColor="text-green-500"
        />
        <MetricCard
          title="Pending Access Requests"
          value={data.pending_requests.toString()}
          icon="📋"
          change="8 require urgent review"
          changeColor="text-[#FF6B1A]"
        />
      
      { user?.role === "organization_admin" && (
        <MetricCard
          title="Active Employees"
          value={data.total_users.toString()}
          icon="👥"
          change=""
          changeColor="text-[#FF6B1A]"
        />)}
      </div>
      

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Pending Access Requests</h2>
          <button className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B1A] rounded-md hover:bg-[#e65c0f] transition-colors">
            View All
          </button>
        </div>
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="max-h-[400px] overflow-y-auto"> 
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dataset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {limitedPendingDatasets.map((request) => (
                  <tr key={request.request_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            src={request.researcher_id__profile_picture || `https://picsum.photos/300/200?random=${request.researcher_id_id}`}
                            alt={`${request.researcher_id__first_name}'s profile`}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/50";
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.researcher_id__first_name  + " " + request.researcher_id__sur_name
                            || "Unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {truncateTitle(request.dataset_id__title)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.request_status === "pending"
                            ? "bg-[#FF6B1A] bg-opacity-10 text-[#FF6B1A]"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {request.request_status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-[#FF6B1A] hover:text-[#e65c0f] mr-4 transition-colors">Approve</button>
                      <button className="text-red-600 hover:text-red-900 transition-colors">Deny</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Dataset Analytics</h2>
          <div className="relative">
            <select className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-[#FF6B1A] transition-colors">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <span className="text-4xl">📊</span>
              <span className="ml-4 text-lg text-gray-500">Dataset Usage Analytics Chart</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  change: string;
  changeColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, change, changeColor }) => (
  <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg hover:shadow-md transition-shadow">
    <div className="p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-[#FF6B1A] bg-opacity-10 rounded-md p-3">
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd>
              <div className="text-lg font-medium text-gray-900">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
      <div className="mt-4">
        <div className={`text-sm ${changeColor}`}>{change}</div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;