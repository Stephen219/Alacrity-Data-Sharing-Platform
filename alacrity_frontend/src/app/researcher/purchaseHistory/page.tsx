"use client"

import { BACKEND_URL } from "@/config";
import { fetchWithAuth } from "@/libs/auth";
import React from "react";

interface Purchase {
  purchase_id: number;
  dataset_id: string;
  dataset_title: string;
  cost: number;
  purchased_at: string;
  purchase_year?: number | null;
  purchase_month?: number | null;
}

function PurchaseHistoryTable() {
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [order, setOrder] = React.useState<'asc' | 'desc' | 'month'>('asc');
  const [filterMonth, setFilterMonth] = React.useState<string>("");
  const [filterYear, setFilterYear] = React.useState<string>("");

  React.useEffect(() => {
    let url = `${BACKEND_URL}payments/purchase-history/?order=${order}`;
    if (filterMonth) url += `&filter_month=${filterMonth}`;
    if (filterYear && Number(filterYear) > 0) url += `&filter_year=${filterYear}`;

    fetchWithAuth(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: { purchases: Purchase[] }) => setPurchases(data.purchases))
      .catch((err) => console.error(err));
  }, [order, filterMonth, filterYear]);

  // Array mapping month numbers to names
  const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="p-4 pt-8">
      {/* Filter and ordering */}
      <div className="mb-4 flex flex-wrap items-center gap-16">
        <div className="flex items-center gap-2">
          <label htmlFor="orderSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Order by:
          </label>
          <select
            id="orderSelect"
            value={order}
            onChange={(e) => setOrder(e.target.value as 'asc' | 'desc' | 'month')}
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="asc">Oldest to Newest</option>
            <option value="desc">Newest to Oldest</option>
            <option value="month">Group by Month</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filterMonth" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter Month:
          </label>
          <select
            id="filterMonth"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="">All</option>
            {monthNames.slice(1).map((name, index) => (
              <option key={index + 1} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filterYear" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter Year:
          </label>
          <input
            id="filterYear"
            type="number"
            placeholder="e.g., 2025"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm w-24 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          />
        </div>
        <button
          onClick={() => { setFilterMonth(""); setFilterYear(""); }}
          className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Purchase ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Dataset Title
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Purchased On
              </th>
              {order === "month" && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Purchase Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Purchase Month
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {purchases.length > 0 ? (
              purchases.map((purchase) => (
                <tr key={purchase.purchase_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {purchase.purchase_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {purchase.dataset_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                    {purchase.cost}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {new Date(purchase.purchased_at).toLocaleString()}
                  </td>
                  {order === "month" && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {purchase.purchase_year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {purchase.purchase_month ? monthNames[purchase.purchase_month] : ""}
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={order === "month" ? 6 : 4}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center"
                >
                  No purchases found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PurchaseHistoryTable;
